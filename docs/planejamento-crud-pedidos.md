# Planejamento — CRUD de Pedidos e Integracao com Produtos

Data: 26 de maio de 2026

## Objetivo
Criar o CRUD de pedidos com integracao a produtos, seguindo o padrao do projeto e o PRD, sem implementar ainda.

## Decisoes
- Status do pedido sera enum com todos os estados: `PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- Estoque so sera decrementado quando o pedido for pago.
- Ao cancelar, repor o estoque.
- Rotas somente em `/orders`.
- `userId` opcional (guest checkout permitido).
- `paymentMethod` sera enum (ex.: `PIX`, `CARD`, `BOLETO`).

## Etapas (5)

### 1) Prisma schema + migration
- Adicionar `Order` e `OrderItem` com relacao a `Product` e `User` (opcional).
- `Order.total` como Decimal, `status` como enum, `paymentMethod` como enum.
- `shippingAddress` como Json; `createdAt`/`updatedAt`.
- Criar migration e rodar `prisma generate`.

### 2) Types + Zod
- Criar interfaces de `CreateOrder`, `OrderItemInput`, `UpdateOrder` e filtros.
- Zod: validar itens nao vazios, `quantity >= 1`, `productId` positivo, endereco valido, `paymentMethod` enum.
- Mensagens em PT-BR, com `.trim()` e `.min()` quando aplicavel.

### 3) Service
- `create`: validar produtos ativos e estoque; calcular total usando preco do produto; criar pedido e itens.
- `update`: alterar status; se mudar para `PAID`, decrementar estoque; se `CANCELLED`, repor estoque.
- `list` e `getById` com filtros basicos (userId opcional).
- Usar `prisma.$transaction` para consistencia.

### 4) Controller
- Validar entrada com Zod; delegar para service; responder com status/estrutura padrao.

### 5) Rotas
- CRUD em `/orders` com `authenticate`.
- Schema Swagger para cada endpoint.

## Arquivos envolvidos
- prisma/schema.prisma
- prisma/migrations/
- src/types/index.ts
- src/utils/validator.ts
- src/services/order.services.ts
- src/controllers/orders.controller.ts
- src/routes/orders.routes.ts
- src/app.ts

## Verificacao rapida
1. Criar pedido com itens (status `PENDING`).
2. Atualizar status para `PAID` e checar decremento de estoque.
3. Atualizar status para `CANCELLED` e checar reposicao.
4. Listar pedidos e buscar por ID.
