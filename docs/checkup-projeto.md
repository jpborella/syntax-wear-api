# Checkup do Projeto Syntax Wear

Documento de revisão para organizar melhorias no frontend e no backend antes da apresentação a recrutadores.

A ordem abaixo considera impacto, risco, clareza para um desenvolvedor júnior e esforço de implementação.

## Como Ler as Prioridades

- **AVISO — NECESSÁRIO:** deve ser resolvido antes de apresentar a aplicação em produção ou antes de considerar o fluxo concluído.
- **AVISO — RECOMENDADO:** não impede a demonstração, mas melhora segurança, qualidade ou confiança do recrutador.
- **AVISO — OPCIONAL:** melhoria de organização ou acabamento que pode ficar para depois das correções funcionais.

## Ordem Recomendada

### 1. [CONCLUÍDO] Corrigir CORS em produção

**Status:** concluído em 17/09/2026. O CORS agora aceita apenas `http://localhost:5173` e `https://syntax-wear-shop-online.vercel.app`. A alteração foi validada com o build TypeScript do backend.

**Arquivo:** `syntax-wear-api/src/app.ts`

O backend usa `origin: true` junto com `credentials: true`. Isso aceita qualquer origem e pode causar risco de segurança e problemas com cookies entre Vercel e API.

Sugestão:

```ts
const allowedOrigins = [
    "http://localhost:5173",
    "https://syntax-wear-shop-online.vercel.app",
];

fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
});
```

**Por que importa:** protege a API e demonstra domínio básico de segurança.

**Dificuldade:** baixa.

---

### 2. [NECESSÁRIO] Corrigir cookies entre frontend e backend

**Arquivo:** `syntax-wear-api/src/controllers/auth.controller.ts`

O cookie usa `sameSite: "lax"`. Como frontend e backend podem estar em domínios diferentes, o navegador pode não enviar o cookie nas requisições feitas pela Vercel.

Em produção, o fluxo normalmente precisa de:

```ts
sameSite: "none",
secure: true,
```

No desenvolvimento local, `lax` pode continuar sendo usado. A configuração deve variar conforme `NODE_ENV`.

**Por que importa:** sem o cookie, o login pode retornar sucesso, mas `/auth/profile` continuará tratando o usuário como não autenticado.

**Dificuldade:** baixa.

---

### 3. [CONCLUÍDO] Validar variáveis de ambiente

**Status:** concluído em 18/09/2026. O backend e o frontend agora validam as variáveis obrigatórias na inicialização/build e exibem o nome da variável ausente na mensagem de erro.

**Arquivos principais:**

- `syntax-wear-api/src/config/env.ts`
- `syntax-wear-shop-online/src/config/env.ts`
- `syntax-wear-shop-online/src/services/api.ts`
- `syntax-wear-shop-online/src/App.tsx`
- `syntax-wear-api/src/app.ts`
- `syntax-wear-api/src/services/auth.service.ts`

Frontend:

```env
VITE_API_URL=...
VITE_GOOGLE_CLIENT_ID=...
```

Backend:

```env
DATABASE_URL=...
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
NODE_ENV=development
```

As variáveis obrigatórias agora são validadas antes do uso. Se alguma estiver ausente, a aplicação informa exatamente qual configuração precisa ser definida, sem exibir o valor de nenhum segredo.

**Por que importa:** evita deploy aparentemente bem-sucedido, mas aplicação quebrada em produção.

**Dificuldade:** baixa.

---

### 4. [NECESSÁRIO] Corrigir e documentar o Google Login

**Arquivos:**

- `syntax-wear-shop-online/src/App.tsx`
- `syntax-wear-api/src/services/auth.service.ts`

O frontend precisa de `VITE_GOOGLE_CLIENT_ID` e o backend de `GOOGLE_CLIENT_ID`. Os dois devem usar o mesmo Client ID.

Também é necessário cadastrar o domínio de produção no Google Cloud, por exemplo:

```text
https://syntax-wear-shop-online.vercel.app
```

em **Authorized JavaScript origins**.

O erro `Missing required parameter: client_id` indica que o frontend publicado não recebeu `VITE_GOOGLE_CLIENT_ID` durante o build.

**Por que importa:** login funcionando é uma das primeiras coisas que um recrutador pode testar.

**Dificuldade:** baixa, mas depende da configuração externa do Google.

---

### 5. [RECOMENDADO] Remover `any` dos serviços do backend

**Arquivo:** `syntax-wear-api/src/services/product.services.ts`

Existem trechos como:

```ts
const where: any = {};
const orderBy: any = {};
```

O ideal é usar os tipos do Prisma:

```ts
const where: Prisma.ProductWhereInput = {
    active: true,
};
```

**Por que importa:** reduz erros silenciosos e mostra uso real do TypeScript.

**Dificuldade:** média.

---

### 6. [RECOMENDADO] Tipar o `useSearch` do frontend

**Arquivo:** `syntax-wear-shop-online/src/pages/_app/products/category/$category.tsx`

Atualmente a rota usa:

```ts
const search: any = Route.useSearch();
```

O ideal é definir o schema de busca da rota e permitir que o TanStack Router infira o tipo. Assim, `gender` terá um tipo conhecido e não dependerá de `any`.

**Por que importa:** melhora a legibilidade e evita erros de digitação nos filtros.

**Dificuldade:** média.

---

### 7. [RECOMENDADO] Padronizar validação e Swagger

**Arquivos:**

- `syntax-wear-api/src/routes/products.routes.ts`
- `syntax-wear-api/src/routes/orders.routes.ts`
- `syntax-wear-api/src/utils/validator.ts`

A API usa schemas Swagger extensos, mas eles nem sempre refletem exatamente os dados reais. Exemplos observados:

- `categoryID` aparece na documentação, mas o campo real é `categoryId`.
- A listagem de produtos documenta campos que não aparecem no `select`.
- Alguns campos obrigatórios não estão marcados como `required`.

**Melhoria:** manter Zod, tipos TypeScript, schemas Swagger e respostas reais sincronizados.

**Por que importa:** documentação correta facilita a avaliação da API.

**Dificuldade:** média.

---

### 8. [RECOMENDADO] Melhorar o tratamento de erros

**Arquivo:** `syntax-wear-api/src/middlewares/error.middleware.ts`

O middleware ainda depende de comparar mensagens literais, como:

```ts
message === "Usuário não encontrado."
```

Isso é frágil: uma pequena mudança no texto pode alterar o status HTTP.

O ideal é usar as classes já existentes, como `NotFoundError`, `UnauthorizedError`, `ConflictError` e `ForbiddenError`, e decidir o status por `instanceof` ou `statusCode`.

**Por que importa:** separa a mensagem para o usuário da regra técnica do backend.

**Dificuldade:** média.

---

### 9. [RECOMENDADO] Padronizar mensagens e idioma

Há mensagens com e sem acentuação, por exemplo:

- `Pedido nao encontrado.`
- `Produto não encontrado.`

Também existem descrições e comentários em português e inglês misturados.

**Melhoria:** revisar mensagens de erro, sucesso e documentação para manter português brasileiro consistente.

**Por que importa:** melhora a experiência e transmite cuidado no projeto.

**Dificuldade:** baixa.

---

### 10. [NECESSÁRIO PARA CHECKOUT REAL] Revisar a transação de estoque

**Arquivo:** `syntax-wear-api/src/services/order.services.ts`

O código verifica o estoque antes de iniciar a transação. Duas requisições simultâneas podem passar pela verificação e vender uma quantidade maior do que o estoque disponível.

A melhoria é verificar e atualizar o estoque dentro da mesma transação, de forma atômica.

**Por que importa:** é uma regra de negócio importante em e-commerce.

**Dificuldade:** alta.

---

### 11. [RECOMENDADO] Documentar a estratégia do carrinho

**Arquivo:** `syntax-wear-shop-online/src/contexts/CartContext/CartProvider.tsx`

O visitante usa `localStorage`, enquanto o usuário autenticado usa a API. É preciso definir o que acontece quando alguém faz login com itens locais e já possui um carrinho na conta.

Escolha uma regra explícita:

1. substituir o carrinho local pelo remoto;
2. mesclar os dois carrinhos; ou
3. perguntar ao usuário qual carrinho manter.

**Por que importa:** evita comportamento inesperado e facilita explicar a arquitetura.

**Dificuldade:** média.

---

### 12. [NECESSÁRIO ANTES DA PUBLICAÇÃO] Remover logs de debug

**Arquivo:** `syntax-wear-shop-online/src/contexts/AuthContext/AuthProvider.tsx`

Existem logs como:

```ts
console.log(data.user);
console.log("result:", result);
```

Eles devem ser removidos antes da apresentação ou substituídos por um logger controlado por ambiente.

**Por que importa:** evita expor dados e deixa o console de produção limpo.

**Dificuldade:** baixa.

---

### 13. [RECOMENDADO] Ampliar os testes do backend

Os testes atuais cobrem principalmente autenticação e utilitários. É importante aumentar a cobertura de:

- produtos;
- categorias;
- carrinho;
- pedidos;
- autorização entre usuários;
- permissões de administrador;
- CORS;
- fluxo Google;
- middleware de erros.

Alguns testes também usam muitos casts, como `as FastifyRequest`. Os mocks podem ser tipados de forma mais simples e consistente.

**Por que importa:** testes de autorização, estoque e pedidos demonstram capacidade real de backend.

**Dificuldade:** média/alta.

---

### 14. [RECOMENDADO] Atualizar a documentação antiga

**Arquivos:**

- `syntax-wear-api/docs/PRD-backend.md.md`
- `syntax-wear-api/docs/planejamento-hardening-seguranca.md`

O PRD menciona recursos que podem não estar completos, como newsletter, upload para Supabase Storage e cálculo de frete.

O documento de hardening declara várias etapas como concluídas, mas o código ainda mantém divergências, como CORS amplo e schemas parcialmente desatualizados.

**Melhoria:** documentar apenas o que existe ou marcar claramente o que está planejado.

**Por que importa:** documentação inconsistente prejudica a confiança no projeto.

**Dificuldade:** baixa.

---

### 15. [RECOMENDADO] Criar um README profissional

O README deve explicar:

- objetivo do projeto;
- tecnologias usadas;
- arquitetura frontend/backend;
- uso do Supabase PostgreSQL;
- instalação;
- variáveis de ambiente;
- execução local;
- testes;
- migrations;
- URL de demonstração;
- limitações da versão publicada.

Também vale informar claramente que o frontend e o backend são aplicações separadas.

**Por que importa:** o README é frequentemente a primeira parte do GitHub lida pelo recrutador.

**Dificuldade:** baixa.

---

### 16. [OPCIONAL] Centralizar configurações

URLs, nome do cookie, limites de paginação, expiração do JWT e origens permitidas devem ficar em arquivos de configuração, por exemplo:

```text
src/config/env.ts
src/config/constants.ts
```

**Por que importa:** evita valores duplicados e facilita alternar entre desenvolvimento e produção.

**Dificuldade:** média.

---

### 17. [OPCIONAL] Padronizar nomes de arquivos

Existem nomes como:

- `product.services.ts`;
- `category.services.ts`;
- `orders.controller.ts`;
- `CartProvider.tsx`.

Não é obrigatório renomear tudo, mas é importante escolher um padrão e aplicá-lo em novos arquivos. Renomeações grandes devem ser feitas apenas depois dos testes, pois podem quebrar imports.

**Por que importa:** melhora a navegação no projeto.

**Dificuldade:** baixa, se feita gradualmente.

---

### 18. [RECOMENDADO] Adicionar lint e comando de verificação no backend

O frontend já possui lint, mas o backend não possui uma configuração equivalente.

Sugestão futura:

```json
{
    "scripts": {
        "lint": "eslint .",
        "check": "npm run lint && npm run build && npm run test:run"
    }
}
```

No frontend:

```json
{
    "scripts": {
        "check": "npm run lint && npm run build"
    }
}
```

**Por que importa:** permite validar o projeto antes de cada push com comandos simples.

**Dificuldade:** média.

---

### 19. [OPCIONAL] Melhorar a consistência visual do código

Depois das correções funcionais:

- padronizar aspas;
- padronizar ponto e vírgula;
- corrigir indentação;
- separar imports por grupo;
- remover comentários que repetem o código;
- aplicar Prettier;
- remover código morto.

**Por que importa:** melhora a primeira impressão sem alterar comportamento.

**Dificuldade:** baixa.

## Ordem Prática Para Aplicar

1. CORS em produção (concluído).
2. Variáveis de ambiente (concluído).
3. Cookies de autenticação.
4. Google Login.
5. Remoção de logs de debug.
6. Tratamento de erros.
7. Transação de estoque, se o checkout for demonstrado.
8. Swagger e validações.
9. Remoção de `any` e tipagem do `useSearch`.
10. Testes de pedidos, carrinho e autorização.
11. README e documentação antiga.
12. Lint e comando de verificação.
13. Estratégia do carrinho.
14. Centralização de configurações.
15. Padronização de nomes e formatação visual.

## Resumo Dos Avisos

### Necessários Antes De Mostrar O Site

Itens 2, 4 e 12. Sem eles, a aplicação pode falhar em produção, deixar o usuário desautenticado ou expor dados no console.

O item 10 também é necessário se o recrutador puder criar pedidos ou testar o estoque com requisições simultâneas. Para uma demonstração apenas visual, ele pode ser tratado depois.

### Recomendados Para Um Projeto Apresentável

Itens 5 a 9, 11 e 13 a 15, além do item 18. Eles não necessariamente impedem o site de abrir, mas elevam a qualidade técnica, a segurança e a facilidade de avaliação.

### Opcionais Para Uma Segunda Etapa

Itens 16, 17 e 19. São melhorias de organização e acabamento. Devem ser feitas depois que o comportamento principal estiver funcionando e coberto por testes.

## Pontos Positivos Já Existentes

- TypeScript no frontend e backend.
- Prisma com PostgreSQL hospedado no Supabase.
- Separação entre controllers, services e middlewares.
- Validação com Zod.
- JWT e cookies httpOnly.
- Rate limiting.
- Helmet.
- Tratamento centralizado de erros.
- Paginação.
- Controle de estoque.
- Testes automatizados com Vitest.
- Soft delete de produtos e categorias.
- Separação entre frontend e backend.

## Próximo Passo Sugerido

Continuar pela correção dos cookies entre frontend e backend. Depois, validar login local e em produção antes de avançar para os demais itens.
