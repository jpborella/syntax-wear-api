# Checkup do Projeto Syntax Wear

Documento de revisão para organizar melhorias no frontend e no backend antes da apresentação a recrutadores.

A ordem abaixo considera impacto, risco, clareza para um desenvolvedor júnior e esforço de implementação.

## Como Ler os Status

- **CONCLUÍDO:** tarefa finalizada.
- **PENDENTE:** tarefa ainda não realizada; a fila de pendências está ordenada por importância.

## Situação Atual

A prioridade atual do projeto não inclui a integração do Stripe. A decisão foi adiar esse item para depois do checkup final e da estabilização do negócio principal do e-commerce, mantendo o foco em qualidade, segurança e apresentação para portfólio.

Essa revisão considera que o Stripe é uma etapa futura e opcional, e não uma dependência para a apresentação do projeto neste momento.

## Fila Atual de Execução

### Pendentes — em ordem de importância

1. **[PENDENTE] Padronizar mensagens e idioma.** Corrigir inconsistências de português, acentuação e clareza das respostas da API e do frontend.
2. **[PENDENTE] Avaliar melhorias opcionais de organização.** Centralizar configurações e padronizar nomes e formatação, sem misturar com correções funcionais.

### Concluídas

1. **[CONCLUÍDA] Corrigir o ciclo de estoque dos pedidos.** A criação reserva estoque; pagar mantém a reserva, cancelar devolve as unidades e reabrir pedido cancelado reserva novamente.
2. **[CONCLUÍDA] Revisar lacunas de testes de pedidos e autorização.** Os acessos de usuários e administradores foram validados com testes reais, e a simulação do `validateOwnership` foi removida para evitar falsos positivos e garantir a regra real do sistema.
3. **[CONCLUÍDA] Documentar a estratégia do carrinho.** O carrinho do visitante e o carrinho autenticado agora são mesclados ao entrar na conta, somando quantidades de itens repetidos em vez de sobrescrever o conteúdo local.
4. **[CONCLUÍDA] Configurar e validar o Google Login em produção.** A configuração foi confirmada no ambiente real e não deve continuar como pendência ativa de código.
5. **[CONCLUÍDA] Concluir as correções de CORS, cookies, variáveis de ambiente e Google Login no código.**
6. **[CONCLUÍDA] Tipar o `useSearch` do frontend.**
7. **[CONCLUÍDA] Padronizar validação e Swagger.**
8. **[CONCLUÍDA] Melhorar o tratamento de erros.**
9. **[CONCLUÍDA] Remover `any` dos serviços do backend e logs de debug.**
10. **[CONCLUÍDA] Criar o README profissional e o comando de verificação do backend.**
11. **[CONCLUÍDA] Atualizar a documentação do backend para refletir o código atual.** A revisão do PRD e do hardening foi alinhada com as rotas, autenticação, autorização, estoque e estado real da aplicação.

O Stripe continua fora do escopo desta etapa. O registro detalhado abaixo documenta os itens e suas justificativas; a fila acima define a ordem atual de execução.

## Registro Detalhado dos Itens

### 1. [CONCLUÍDO] Corrigir CORS em produção

**Status:** concluído. O CORS agora aceita apenas `http://localhost:5173` e `https://syntax-wear-shop-online.vercel.app`. A alteração foi validada com o build TypeScript do backend.

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

### 2. [CONCLUÍDO] Corrigir cookies entre frontend e backend

**Status:** concluído. A configuração do cookie JWT foi centralizada em `syntax-wear-api/src/config/auth-cookie.ts`. Em desenvolvimento, o cookie usa `SameSite=Lax`; em produção, usa `SameSite=None` e `Secure=true` para funcionar entre domínios diferentes. O frontend já envia `credentials: "include"` nas requisições autenticadas.

**Arquivo:** `syntax-wear-api/src/controllers/auth.controller.ts`

O cookie usa `sameSite: "lax"`. Como frontend e backend podem estar em domínios diferentes, o navegador pode não enviar o cookie nas requisições feitas pela Vercel.

Em produção, o fluxo normalmente precisa de:

```ts
sameSite: "none",
secure: true,
```

No desenvolvimento local, `lax` continua sendo usado. A configuração agora varia automaticamente conforme `NODE_ENV`, e a mesma configuração é usada para criar e limpar o cookie.

**Por que importa:** sem o cookie, o login pode retornar sucesso, mas `/auth/profile` continuará tratando o usuário como não autenticado.

**Dificuldade:** baixa.

---

### 3. [CONCLUÍDO] Validar variáveis de ambiente

**Status:** concluído. O backend e o frontend agora validam as variáveis obrigatórias na inicialização/build e exibem o nome da variável ausente na mensagem de erro.

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

### 4. [CONCLUÍDO] Corrigir e documentar o Google Login

**Status:** concluído. O frontend e o backend usam o mesmo Client ID validado; o fluxo removeu logs de credenciais e ganhou testes para credencial ausente e login bem-sucedido.

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

Para produção, ainda é necessário configurar no Google Cloud o domínio `https://syntax-wear-shop-online.vercel.app` em **Authorized JavaScript origins** e definir o mesmo Client ID nas variáveis `VITE_GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_ID`.

**Por que importa:** login funcionando é uma das primeiras coisas que um recrutador pode testar.

**Dificuldade:** baixa, mas depende da configuração externa do Google.

---

### 5. [CONCLUÍDO] Remover `any` dos serviços do backend

**Arquivo:** `syntax-wear-api/src/services/product.services.ts`

O serviço de produtos foi tipado com os tipos gerados pelo Prisma:

```ts
const where: Prisma.ProductWhereInput = { active: true };
const orderBy: Prisma.ProductOrderByWithRelationInput | undefined = ...;
```

Além disso, o serviço deixou de usar `filter as any` e passou a preservar os tipos dos filtros, preços e ordenação.

**Por que importa:** reduz erros silenciosos e mostra uso real do TypeScript.

**Dificuldade:** média.

---

### 6. [CONCLUÍDO] Tipar o `useSearch` do frontend

**Arquivo:** `syntax-wear-shop-online/src/pages/_app/products/category/$category.tsx`

O schema `validateSearch` agora valida `gender` como um dos valores aceitos pela API (`MASCULINO`, `FEMININO` ou `UNISSEX`). O TanStack Router infere o tipo da busca e o `any` foi removido.

O build do frontend passou após a alteração.

**Por que importa:** melhora a legibilidade e evita erros de digitação nos filtros.

**Dificuldade:** média.

---

### 7. [CONCLUÍDO] Padronizar validação e Swagger

**Arquivos:**

- `syntax-wear-api/src/routes/products.routes.ts`
- `syntax-wear-api/src/routes/orders.routes.ts`
- `syntax-wear-api/src/utils/validator.ts`

A API foi revisada para manter Zod, tipos TypeScript e schemas Swagger alinhados com a resposta real da API.

Os ajustes mais relevantes foram:

- corrigir o nome `categoryId` em vez de `categoryID`;
- remover campos que não existiam no retorno do `select` de listagem;
- refletir corretamente os campos obrigatórios e opcionais do cadastro de produto;
- manter as respostas documentadas próximas ao comportamento real da rota.

**Por que importa:** documentação correta facilita a avaliação da API e reduz confusão na demonstração do projeto.

**Dificuldade:** média.

---

### 8. [CONCLUÍDO] Melhorar o tratamento de erros

**Arquivo:** `syntax-wear-api/src/middlewares/error.middleware.ts`

O middleware agora prioriza a classe do erro e o `statusCode` do próprio objeto, em vez de depender apenas de comparações literais de mensagem.

Isso reduz o risco de que uma pequena mudança no texto do erro altere indevidamente o código HTTP retornado ao cliente.

**Por que importa:** separa a mensagem para o usuário da regra técnica do backend e deixa o comportamento mais previsível.

**Dificuldade:** média.

---

### 9. [PENDENTE] Padronizar mensagens e idioma

Há mensagens com e sem acentuação, por exemplo:

- `Pedido nao encontrado.`
- `Produto não encontrado.`

Também existem descrições e comentários em português e inglês misturados.

**Melhoria:** revisar mensagens de erro, sucesso e documentação para manter português brasileiro consistente.

**Por que importa:** melhora a experiência e transmite cuidado no projeto.

**Dificuldade:** baixa.

---

### 10. [CONCLUÍDO] Revisar o ciclo de estoque dos pedidos

**Arquivo:** `syntax-wear-api/src/services/order.services.ts`

A criação do pedido reserva o estoque dentro de uma transação, com atualização condicional para evitar venda acima do disponível. A transição para `PAID` mantém essa reserva, sem novo decremento. O cancelamento de qualquer pedido não cancelado devolve as unidades; reabrir um pedido cancelado tenta reservar o estoque novamente dentro da transação.

Testes de regressão cobrem a ausência de baixa duplicada ao pagar, a devolução no cancelamento de pedido pendente e a nova reserva ao reabrir um pedido cancelado.

**Por que importa:** evita tanto a baixa duplicada quanto estoque reservado permanentemente após cancelamento, preservando as operações atômicas.

**Por que importa:** é uma regra de negócio crítica em e-commerce e protege o checkout real contra inconsistências.

**Dificuldade:** alta.

---

### 11. [PENDENTE] Documentar a estratégia do carrinho

**Arquivo:** `syntax-wear-shop-online/src/contexts/CartContext/CartProvider.tsx`

O visitante usa `localStorage`, enquanto o usuário autenticado usa a API. É preciso definir o que acontece quando alguém faz login com itens locais e já possui um carrinho na conta.

Escolha uma regra explícita:

1. substituir o carrinho local pelo remoto;
2. mesclar os dois carrinhos; ou
3. perguntar ao usuário qual carrinho manter.

**Por que importa:** evita comportamento inesperado e facilita explicar a arquitetura.

**Dificuldade:** média.

---

### 12. [CONCLUÍDO] Remover logs de debug

**Arquivo:** `syntax-wear-shop-online/src/contexts/AuthContext/AuthProvider.tsx`

O log de dados do usuário foi removido do fluxo principal de autenticação.

Essa correção deixa o console mais limpo e evita expor informações sensíveis do usuário em produção.

**Por que importa:** reduz exposição de dados e evita ruído em ambiente de demonstração.

**Dificuldade:** baixa.

---

### 13. [PENDENTE] Ampliar os testes do backend

**Cobertura existente:** há suítes para serviços de produtos, categorias, pedidos e autenticação, além de rotas, controllers, middlewares e utilitários. Já existe um teste de regressão para impedir a criação do pedido quando a reserva condicional de estoque falha.

**Progresso:** os efeitos no estoque ao pagar, cancelar um pedido pendente e reabrir pedido cancelado agora têm testes de regressão. A próxima revisão deve focar lacunas concretas de autorização e integração, sem duplicar os casos já cobertos.

O carrinho do visitante usa `localStorage` e não possui serviço backend próprio; a estratégia de transição para o carrinho autenticado está detalhada no item 11.

**Por que importa:** testes de autorização, estoque e pedidos demonstram capacidade real de backend.

**Dificuldade:** média/alta.

---

### 14. [PENDENTE] Atualizar a documentação antiga

**Arquivos:**

- `syntax-wear-api/docs/PRD-backend.md.md`
- `syntax-wear-api/docs/planejamento-hardening-seguranca.md`

O PRD menciona recursos que podem não estar completos, como newsletter, upload para Supabase Storage e cálculo de frete.

O documento de hardening declara várias etapas como concluídas e ainda precisa ser conferido contra o estado atual do código. As divergências de CORS e schemas citadas em versões anteriores deste checkup já foram corrigidas e não devem continuar como pendências.

**Melhoria:** documentar apenas o que existe ou marcar claramente o que está planejado.

**Por que importa:** documentação inconsistente prejudica a confiança no projeto.

**Dificuldade:** baixa.

---

### 15. [CONCLUÍDO] Criar um README profissional

O README foi atualizado para explicar:

- objetivo do projeto;
- tecnologias usadas;
- arquitetura frontend/backend;
- uso do Supabase PostgreSQL;
- instalação;
- variáveis de ambiente;
- execução local;
- testes;
- scripts principais;
- status da aplicação e limitações da versão atual.

Também ficou explícito que o frontend e o backend são aplicações separadas e devem ser executados de forma independente.

**Por que importa:** o README é frequentemente a primeira parte do GitHub lida pelo recrutador.

**Dificuldade:** baixa.

---

### 16. [PENDENTE] Centralizar configurações

URLs, nome do cookie, limites de paginação, expiração do JWT e origens permitidas devem ficar em arquivos de configuração, por exemplo:

```text
src/config/env.ts
src/config/constants.ts
```

**Por que importa:** evita valores duplicados e facilita alternar entre desenvolvimento e produção.

**Dificuldade:** média.

---

### 17. [PENDENTE] Padronizar nomes de arquivos

Existem nomes como:

- `product.services.ts`;
- `category.services.ts`;
- `orders.controller.ts`;
- `CartProvider.tsx`.

Não é obrigatório renomear tudo, mas é importante escolher um padrão e aplicá-lo em novos arquivos. Renomeações grandes devem ser feitas apenas depois dos testes, pois podem quebrar imports.

**Por que importa:** melhora a navegação no projeto.

**Dificuldade:** baixa, se feita gradualmente.

---

### 18. [CONCLUÍDO] Adicionar comando de verificação no backend

O backend passou a ter um comando centralizado para validar a base do projeto antes do push:

```json
{
    "scripts": {
        "typecheck": "tsc --noEmit",
        "check": "npm run typecheck && npm run test:run"
    }
}
```

Essa escolha foi feita para manter o escopo realista: o backend ainda não possui lint configurado, mas já conta com uma verificação simples e útil para validar build e testes em um único passo.

**Por que importa:** permite validar o projeto antes de cada push com poucos comandos e sem depender de configuração extra de lint.

**Dificuldade:** baixa.

---

### 19. [PENDENTE] Melhorar a consistência visual do código

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

