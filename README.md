# employee-documents-api

API REST para o fluxo de documentação obrigatória de colaboradores. Cada colaborador é vinculado aos tipos de documento que precisa entregar, e a API acompanha o que está pendente, o que já foi enviado e em qual versão.

## Escopo

- Cadastro de colaboradores
- Cadastro de tipos de documento
- Vínculo e desvínculo entre colaborador e tipo de documento
- Envio de documento como registro lógico, com histórico de versões e uma única versão ativa
- Listagem de pendências com paginação e filtros
- Estatísticas de cobertura documental

Colaboradores e documentos nunca são removidos fisicamente. A remoção é lógica e se reflete em toda consulta, filtro e estatística.

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Runtime | Node.js na linha em LTS ativo | Suporte previsível, é o que estaria em produção |
| Linguagem | TypeScript em modo `strict` | O erro de tipo aparece no `typecheck`, não em runtime |
| Framework | NestJS sobre Express | Injeção de dependência nativa, que é o que sustenta a inversão entre caso de uso e persistência |
| Banco | MongoDB com Mongoose | Transação multi-documento em replica set e índices parciais, os dois mecanismos que o domínio exige |
| Testes | Jest com supertest | Suíte end to end contra um MongoDB real, sem stub de banco |
| Pacotes | pnpm | `node_modules` estrito: se o código importa, a dependência está declarada |

As versões exatas vivem em `package.json`, `.nvmrc` e `docker-compose.yml`. Este documento registra o critério de escolha, não o número, porque número em documentação envelhece em silêncio.
