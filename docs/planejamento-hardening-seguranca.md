# Planejamento — Hardening de Segurança e Qualidade

Data: 2 de junho de 2026

## Objetivo
Identificar e planejar a remediação de falhas comuns de segurança em API REST, melhorias de performance e manutenibilidade. Codebase Fastify/TypeScript com Prisma e Supabase (PostgreSQL).

## Resumo Executivo
A API possui falhas críticas em autenticação/autorização (hooks desabilitados), exposição de dados sensíveis (hash de senha), tokens long-lived, CORS amplo, e ausência de rate limiting. Pedidos carecem de controle de propriedade. Validação e paginação são fracas. O plano reorganiza essas camadas em 7 etapas sequenciais e paralelas.

## Decisões Confirmadas
- **Escopo de auth**: Leitura pública (GET), escrita protegida (POST/PUT/DELETE)
- **Ownership de pedidos**: Usuário vê/edita apenas seus pedidos; admins veem tudo
- **Transporte de token**: Bearer token no header `Authorization`
- **JWT TTL**: 1 hora (`expiresIn: "1h"`)
- **CORS allowlist**: `http://localhost:3000` (dev), `https://syntax-wear-shop-online.vercel.app` (prod)
- **Rate limiting**: Sim, global e específico para login/register
- **Resposta de auth**: Apenas `id`, `name`, `email`, `role` (nunca hash de senha)

## Falhas Encontradas

### Críticas
1. **Auth desabilitado em rotas CRUD** ([src/routes/categories.routes.ts:12](src/routes/categories.routes.ts#L12), [src/routes/products.routes.ts:6](src/routes/products.routes.ts#L6), [src/routes/orders.routes.ts:6](src/routes/orders.routes.ts#L6))
   - Hooks `addHook("onRequest", authenticate)` comentados
   - CRUD de produtos, categorias e pedidos é público

2. **Ausência de autorização em pedidos** ([src/services/order.services.ts:5-155](src/services/order.services.ts#L5-L155))
   - `listOrders`, `getOrder`, `updateOrderStatus`, `cancelOrder` não checam ownership
   - `createOrder` confia em `userId` vindo do body (trusting client)
   - Qualquer usuário pode listar/editar qualquer pedido

3. **Exposição de dados sensíveis em auth** ([src/controllers/auth.controller.ts:6-29](src/controllers/auth.controller.ts#L6-L29), [src/services/auth.service.ts:28-59](src/services/auth.service.ts#L28-L59))
   - Login/register retornam objeto `user` completo, incluindo `password` (hash bcrypt)
   - Risco de exposição se hash for quebrado ou se houver vazamento

### Altas
4. **JWT sem expiração** ([src/controllers/auth.controller.ts:11-25](src/controllers/auth.controller.ts#L11-L25), [src/app.ts:25-27](src/app.ts#L25-L27))
   - `jwt.sign()` sem `expiresIn`, `issuer`, `audience`
   - Tokens efetivamente infinitos; revogação impossível

5. **CORS amplo + credenciais** ([src/app.ts:29-33](src/app.ts#L29-L33))
   - `origin: true` + `credentials: true` permite CSRF se cookies forem usados
   - Request logging ativado sem redação, expõe senhas e tokens

6. **Erro de fluxo em authenticate middleware** ([src/middlewares/auth.middleware.ts:3-8](src/middlewares/auth.middleware.ts#L3-L8))
   - `sendUnauthorized()` sem `return` ou `throw`
   - Handler pode continuar executando em certos flows do Fastify

### Médias
7. **Vazamento de detalhes internos em erros** ([src/middlewares/error.middleware.ts:28](src/middlewares/error.middleware.ts#L28), [src/services/auth.service.ts:44-56](src/services/auth.service.ts#L44-L56))
   - Respostas 500 incluem `debug: error.message`
   - Erros de domínio (user not found) viram 500 em vez de 4xx, facilitam enumeração

8. **Sem rate limiting** ([src/app.ts](src/app.ts))
   - Nenhuma proteção contra brute-force em login/register
   - DoS em endpoints públicos (listOrders, listProducts)

9. **Paginação sem teto** ([src/utils/validator.ts:29-36](src/utils/validator.ts#L29-L36), [src/services/product.services.ts:14-84](src/services/product.services.ts#L14-L84))
   - `limit` coagido para positivo mas sem máximo
   - Consultas de tabela inteira possíveis; risco de esgotamento de memória/BD

10. **Busca ineficiente** ([src/services/product.services.ts:38-75](src/services/product.services.ts#L38-L75))
    - `contains` em `name` e `description` sem índices full-text
    - Table scan a cada busca em produção

### Baixas
11. **Validação fraca de ID** ([src/controllers/products.controller.ts:15-18](src/controllers/products.controller.ts#L15-L18))
    - `getProduct` usa `Number(id)` sem validação zod
    - IDs inválidos viram 500 em vez de 400

12. **Payload grande em listagens** ([src/services/order.services.ts:21-34](src/services/order.services.ts#L21-L34))
    - `listOrders` com `include.items.product` eagerly
    - Serializa produtos completos a cada item, multiplicando bytes

13. **TLS não explícito no runtime** ([src/utils/prisma.ts:4-7](src/utils/prisma.ts#L4-L7), [prisma/seed.ts:11-25](prisma/seed.ts#L11-L25))
    - Seed força TLS, runtime não
    - Supabase exigirá TLS; deve ser explícito

## Etapas de Remediação (7)

### 1) Confirmar requisitos
**Status**: ✅ Completo
- [x] Escopo de auth (leitura pública, escrita protegida)
- [x] Ownership de pedidos (usuário/admin)
- [x] Transporte (bearer token)
- [x] JWT TTL (1h)
- [x] CORS allowlist (dev: http://localhost:3000, prod: https://syntax-wear-shop-online.vercel.app)

**Arquivos afetados**: Nenhum (apenas documentação)

**Saída esperada**: Requisitos congelados ✅

**CORS configuração para [src/app.ts](src/app.ts)**:
```typescript
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://syntax-wear-shop-online.vercel.app']
    : ['http://localhost:3000'],
  credentials: true // para cookies/auth headers
})
```

---

### 2) Reativar e garantir auth + implementar RBAC/ownership
**Status**: ✅ Completo
**Depende de**: Etapa 1
**Paralelo com**: Nenhum
**Duração estimada**: 2-3 horas

**Tarefas**:
- [x] Aplicar autenticação em [src/routes/orders.routes.ts](src/routes/orders.routes.ts) com `addHook("onRequest", authenticate)`
- [x] Aplicar autenticação seletiva em [src/routes/categories.routes.ts](src/routes/categories.routes.ts) e [src/routes/products.routes.ts](src/routes/products.routes.ts) apenas para `POST`/`PUT`/`DELETE`, preservando `GET` público conforme etapa 1
- [x] Corrigir `authenticate` middleware em [src/middlewares/auth.middleware.ts](src/middlewares/auth.middleware.ts): retornar após respostas `401` e carregar `request.authUser`
- [x] Criar augment de tipo em [src/types/fastify.d.ts](src/types/fastify.d.ts) e tipos `AuthenticatedUser`/`UserRole` em [src/types/index.ts](src/types/index.ts)
- [x] Em [src/services/order.services.ts](src/services/order.services.ts):
  - [x] `listOrders(filters, user)`: usuário comum fica limitado ao próprio `userId`; admin pode listar todos e filtrar por `userId`
  - [x] `getOrderById(id, user)`: adiciona check de ownership
  - [x] `updateOrderStatus(id, status, user)`: admin only
  - [x] `deleteOrder(id, user)`: adiciona check de ownership antes de cancelar
  - [x] `createOrder(payload, userId)`: deriva `userId` do token e ignora `userId` enviado no body
- [x] Mapear role check em [src/controllers/products.controller.ts](src/controllers/products.controller.ts) e [src/controllers/categories.controller.ts](src/controllers/categories.controller.ts) para `POST`/`PUT`/`DELETE` requererem `role === "ADMIN"`
- [x] Ajustar [src/middlewares/error.middleware.ts](src/middlewares/error.middleware.ts) para propagar `403` dos guards

**Verificação**:
1. [x] GET /orders (anon) → 401 ✅
2. [x] POST /orders com bearer válido → sucesso, order vinculado ao user ✅
3. [x] GET /orders/:id (outro user) → 403 ✅
4. [x] PUT /products/:id (non-admin) → 403 ✅
5. [x] DELETE /categories/:id (admin) → 204 ✅
6. [x] Build TypeScript sem erros: `npm run build` ✅

---

### 3) Sanitizar responses + configurar JWT
**Status**: ✅ Completo
**Depende de**: Etapa 1
**Paralelo com**: Nenhum
**Duração estimada**: 1-2 horas

**Tarefas**:
- [x] Em [src/controllers/auth.controller.ts](src/controllers/auth.controller.ts):
  - [x] `register`: retornar DTO `{ id, name, email, role, token }`
  - [x] `login`: retornar DTO `{ id, name, email, role, token }`
  - [x] Nunca retornar `password` ou `password_hash`
- [x] Em [src/services/auth.service.ts](src/services/auth.service.ts):
  - [x] Criar helper para sanitizar usuário: `sanitizeUser(user)`
  - [x] Usar em `register()` e `login()`
- [x] Em [src/app.ts](src/app.ts):
  - [x] Configurar `@fastify/jwt` com `expiresIn: "1h"`, `iss: "syntax-wear-api"`, `aud: "syntax-wear-client"`
  - [x] Validar token no servidor com `allowedIss: "syntax-wear-api"` e `allowedAud: "syntax-wear-client"`
- [x] Em [src/routes/auth.routes.ts](src/routes/auth.routes.ts):
  - [x] Documentar o schema de resposta sanitizado de `/auth/register` e `/auth/login`

**Verificação**:
1. [x] POST /register → retorna `{ id, name, email, role, token }`, sem `password` ✅
2. [x] POST /login → retorna `{ id, name, email, role, token }`, sem `password` ✅
3. [x] Token decodificado contém `iss`, `aud`, `exp` ✅
4. [x] Token expirado (>1h) gera 401 ✅
5. [x] Build TypeScript sem erros: `npm run build` ✅

---

### 4) Melhorar tratamento de erros + rate limiting
**Status**: ✅ Completo
**Depende de**: Etapa 1
**Paralelo com**: Etapa 5
**Duração estimada**: 2-3 horas

**Tarefas**:
- [x] Em [src/middlewares/error.middleware.ts](src/middlewares/error.middleware.ts):
  - [x] Mapear erros de domínio (ZodError, `user not found`) para 4xx (400, 404, 422)
  - [x] Em produção, omitir `debug` field; apenas `message` amigável
  - [x] Padronizar shape: `{ statusCode, message, error, details, path, timestamp }`
- [x] Em [src/services/auth.service.ts](src/services/auth.service.ts):
  - [x] Garantir mensagens de erro consistentes para o middleware capturar
- [x] Em [package.json](package.json):
  - [x] Adicionar `@fastify/rate-limit`
- [x] Em [src/app.ts](src/app.ts):
  - [x] Registrar rate limiting global: `fastify.register(rateLimit, { max: 100, timeWindow: "15 minutes" })`
- [x] Em [src/routes/auth.routes.ts](src/routes/auth.routes.ts):
  - [x] Registrar rate limiting para `/auth/login` e `/auth/register`: `{ max: 5, timeWindow: "15 minutes" }`

**Verificação**:
1. [x] Invalid input (zod fail) → 400, shape padronizado ✅
2. [x] User not found → 401 (Credenciais inválidas), sem expor existência de user ✅
3. [x] 5 login attempts em 15min → 429 rate limit ✅
4. [x] 100 requests globais em 15min → 429 rate limit ✅

---

### 5) Validação + caps de paginação
**Depende de**: Etapa 1
**Paralelo com**: Etapa 4
**Duração estimada**: 1-2 horas

**Tarefas**:
- Em [src/utils/validator.ts](src/utils/validator.ts):
  - Atualizar `validatePagination()` para impor `limit <= 50` (ou seu máximo)
  - Exemplo: `max: 50, default: 10`
- Em [src/controllers/products.controller.ts](src/controllers/products.controller.ts):
  - `listProducts`: validar `id` com zod antes de passar a service (nao confiar em `Number()`)
- Em [src/controllers/categories.controller.ts](src/controllers/categories.controller.ts):
  - `listCategories`: validar `id` com zod
- Em [src/controllers/orders.controller.ts](src/controllers/orders.controller.ts):
  - `listOrders`: validar `id` com zod
- Em [src/services/product.services.ts](src/services/product.services.ts):
  - `listProducts`: validar `limit` é <= 50, default 10

**Verificação**:
1. GET /products?limit=1000 → devolvido com `limit=50` ou erro 400
2. GET /products/abc → 400 (ID inválido)
3. GET /products/123 → 200 ou 404, nunca 500

---

### 6) Performance: indexes + payload reduction
**Depende de**: Etapa 5
**Paralelo com**: Nenhum
**Duração estimada**: 1-2 horas

**Tarefas**:
- Em [prisma/schema.prisma](prisma/schema.prisma):
  - Adicionar índice em `Product.name`: `@@index([name])`
  - Adicionar índice em `Product.description` se usado em busca
  - (Full-text search em PostgreSQL é avançado; deixar para fase 2)
- Em [src/services/product.services.ts](src/services/product.services.ts):
  - `listProducts`: remover `include`; retornar campos básicos
  - Se detalhe for necessário, usar `select: { id, name, price, color }`
- Em [src/services/order.services.ts](src/services/order.services.ts):
  - `listOrders`: remover `include.items.product`; retornar apenas `OrderItem` refs
  - `getOrder` pode incluir produtos se necessário
- Em [src/utils/prisma.ts](src/utils/prisma.ts):
  - Garantir TLS explícito em URL conexão (ex.: `postgresql://...?sslmode=require`)

**Verificação**:
1. GET /products → response size < 1MB para 1000 registros
2. `EXPLAIN ANALYZE` mostra índice sendo usado em filtros

---

### 7) Manutenibilidade: DTOs, helpers, testes
**Depende de**: Etapas 2-6
**Paralelo com**: Nenhum
**Duração estimada**: 3-5 horas

**Tarefas**:
- Criar [src/types/dto.ts](src/types/dto.ts):
  - `AuthResponse`, `UserResponse`, `ProductResponse`, `OrderResponse`, `PaginatedResponse<T>`
  - Exportar de `types/index.ts`
- Em [src/types/errors.ts](src/types/errors.ts) (novo):
  - `AppError extends Error` com `statusCode`, `isPublic`
  - `ValidationError`, `NotFoundError`, `UnauthorizedError`
- Em [src/services](src/services):
  - Extrair helpers em [src/utils/auth.utils.ts](src/utils/auth.utils.ts):
    - `sanitizeUser(user): UserResponse`
    - `validateOwnership(userId, ownerId): boolean`
- Em [src/routes](src/routes):
  - Criar guard decorator ou middleware factory se houver code duplication
- Criar testes básicos em `tests/`:
  - `auth.test.ts`: login/register, sanitização, expiry
  - `orders.test.ts`: ownership, crud, admin rules
  - `pagination.test.ts`: caps, defaults
  - `error.test.ts`: error shape, status codes

**Verificação**:
1. Build sem erros: `npm run build`
2. Todos os DTOs tipados; controllers retornam correct shapes
3. Testes rodam sem erro
4. Code coverage para auth/orders >= 80%

## Timeline
| Etapa | Duração | Dependência |
|-------|---------|-------------|
| 1 | 0.5h | — |
| 2 | 2.5h | 1 |
| 3 | 1.5h | 1 |
| 4 | 2.5h | 1, (||5) |
| 5 | 1.5h | 1, (||4) |
| 6 | 1.5h | 5 |
| 7 | 4h | 2-6 |
| **Total** | **~16h** | — |

## Arquivos Críticos
- [src/app.ts](src/app.ts) — CORS, JWT, rate limit
- [src/middlewares/auth.middleware.ts](src/middlewares/auth.middleware.ts) — guard
- [src/middlewares/error.middleware.ts](src/middlewares/error.middleware.ts) — erro handling
- [src/routes/](src/routes/) — auth hooks
- [src/controllers/auth.controller.ts](src/controllers/auth.controller.ts) — responses
- [src/services/auth.service.ts](src/services/auth.service.ts) — token gen
- [src/services/order.services.ts](src/services/order.services.ts) — ownership
- [src/utils/validator.ts](src/utils/validator.ts) — paginação
- [prisma/schema.prisma](prisma/schema.prisma) — indexes
- [package.json](package.json) — dependências

## Considerações Futuras
1. **Refresh tokens**: Implementar refresh token flow com rotation para maior segurança (fase 2)
2. **API docs**: Gatar `/api-docs` atrás de auth em produção
3. **Log redaction**: Centralize redação de senhas, tokens, endereços em middleware
4. **TLS pinning**: Se cliente for mobile, implementar certificate pinning
5. **Audit trail**: Registrar quem alterou o quê e quando (orders/products)
