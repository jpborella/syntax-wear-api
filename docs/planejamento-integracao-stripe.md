# Planejamento da Integração com Stripe

Documento para registrar a decisão e a ordem de implementação do Stripe como forma de pagamento no projeto Syntax Wear.

## Decisão

A integração do Stripe foi adiada para depois da finalização do checkup do projeto e da estabilização do fluxo principal do e-commerce.

Neste momento, a prioridade do portfólio é concluir a base do app, validar o checkout e o estoque, e manter a documentação e a qualidade do projeto. O Stripe permanece como uma etapa futura e opcional, e não é obrigatório para a apresentação atual.

A ordem recomendada continua sendo:

1. Revisar a transação de estoque para o checkout.
2. Finalizar o checkup do projeto.
3. Revisar Swagger, testes, README e organização.
4. Decidir se será necessário integrar o Stripe em uma segunda fase.

## Por que aguardar essas etapas

O Stripe depende de um checkout confiável, de usuários autenticados, de pedidos funcionando e de uma regra segura para atualização do estoque. A integração de pagamento antes dessas correções pode esconder problemas de sessão, pedidos duplicados ou inconsistências de estoque.

## Variáveis de ambiente

A chave secreta deve ficar somente no backend:

```env
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

A chave pública pode ser usada no frontend:

```env
VITE_STRIPE_PUBLISHABLE_KEY=...
```

As chaves de teste e produção devem ser mantidas separadas e configuradas no ambiente correspondente.

## Regra de confirmação do pagamento

A resposta do frontend não deve ser considerada confirmação definitiva do pagamento. O backend deve receber e validar o webhook do Stripe para confirmar o evento, atualizar o pedido e registrar o status correto.

O fluxo esperado é:

1. O usuário inicia o checkout.
2. O backend cria a sessão ou intenção de pagamento no Stripe.
3. O frontend redireciona ou exibe a interface de pagamento.
4. O Stripe envia o webhook para o backend.
5. O backend valida a assinatura do webhook.
6. O pedido é atualizado somente após a confirmação válida do Stripe.

## Cuidados importantes

- Não expor `STRIPE_SECRET_KEY` no frontend.
- Não marcar o pedido como pago apenas porque o frontend retornou sucesso.
- Validar a assinatura dos webhooks.
- Evitar processar o mesmo webhook mais de uma vez.
- Definir o que acontece quando o pagamento falha, expira ou é cancelado.
- Garantir que a baixa de estoque e a atualização do pedido sejam consistentes.
- Usar o ambiente de testes do Stripe durante o desenvolvimento.

## Status

- CORS: concluído.
- Variáveis de ambiente: concluído.
- Cookies de autenticação: concluído.
- Google Login: concluído no código; configuração do domínio de produção pendente.
- Transação de estoque: pendente.
- Checkup do projeto: etapa ativa.
- Integração Stripe: adiada, opcional e planejada para uma fase posterior.
