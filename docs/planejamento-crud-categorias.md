# Planejamento — CRUD de Categorias e Vinculacao com Produtos

Data: 23 de maio de 2026

## Objetivo
Criar o CRUD de categorias e vincular com produtos seguindo o padrao do CRUD de produtos, o PRD-backend e as instrucoes do projeto, sem implementar ainda.

## Decisoes
- Category tera `description?` e `active` (soft delete).
- Rotas protegidas por JWT, prefixo `/admin/categories`.
- Ao desativar categoria, desativar produtos relacionados; produto nao pode usar categoria inativa.

## Etapas (4)

### 1) Prisma schema + migration
- Atualizar o schema para adicionar `description?` e `active` (default true) em Category.
- Gerar migration e atualizar o banco.
- Rodar `npx prisma generate` apos a migration.

### 2) Service
- Criar service de categorias com list/get/create/update/delete (soft delete).
- Garantir slug unico.
- Filtrar `active: true` por padrao.
- No delete, executar transacao para inativar categoria e `updateMany` para inativar produtos.
- Ajustar service de produtos para:
  - validar categoria ativa em create/update.
  - filtrar produtos inativos.

### 3) Controller
- Criar controller de categorias com `slugify` e validacao Zod.
- Respostas em PT-BR seguindo o padrao atual.

### 4) Rotas
- Criar rotas de categorias com schemas Swagger e hook `authenticate`.
- Registrar rotas no app com prefixo `/admin/categories`.

## Arquivos envolvidos
- prisma/schema.prisma
- prisma/migrations/
- src/services/category.services.ts
- src/services/product.services.ts
- src/controllers/categories.controller.ts
- src/routes/categories.routes.ts
- src/types/index.ts
- src/utils/validator.ts
- src/app.ts

## Verificacao rapida
1. Criar categoria.
2. Listar categorias.
3. Criar produto com `categoryId`.
4. Desativar categoria e confirmar produtos relacionados inativos.
