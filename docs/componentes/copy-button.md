# Botão de copiar

`CopyButton` recebe `valor` e `rotulo`. É reutilizável para valores públicos visíveis na página; não conhece o Strapi ou a contribuição. Os dados editoriais pertencem à seção que o utiliza.

Usa as classes compartilhadas de `ButtonLink`, mas renderiza um botão nativo. Desabilita durante a escrita, anuncia sucesso em uma região de status e orienta seleção manual quando a Clipboard API não existe ou rejeita a operação. O componente que o usa deve exibir o valor ao lado.

Vitrine: `/componentes/copy-button`.

## Medição (DataLayer)

Coberto por `clique_cta` pelo rastreador geral; não envia o valor copiado ao DataLayer. A prop opcional `conversao="pix"` registra `contribuir` com origem `pix` somente após a confirmação da Clipboard API. Sem a prop não registra conversão. Não requer nome de evento novo.

## Testes

`CopyButton.test.tsx` cobre sucesso, rejeição e API ausente.
