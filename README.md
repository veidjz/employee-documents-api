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

## Modelo de dados

Quatro coleções. O par colaborador e tipo de documento não é um array embutido em nenhum dos dois lados: ele é uma coleção própria, `requirements`, porque é ele que carrega estado (pendente ou entregue), versão corrente e histórico. Embutir a lista de exigências no colaborador faria a listagem global de pendências varrer todos os colaboradores e desmontar cada array, e faria a remoção lógica de um tipo de documento reescrever todo colaborador que o referencia.

| Coleção | O que é | Campos além do identificador |
|---|---|---|
| `employees` | Colaborador | `name`, `email`, `cpf`, `deletedAt`, `createdAt` |
| `document_types` | Tipo de documento exigível | `name`, `slug`, `description`, `deletedAt`, `createdAt` |
| `requirements` | A exigência de um tipo para um colaborador | `employeeId`, `documentTypeId`, `status`, `currentVersion`, `lastSubmittedAt`, `deletedAt`, `createdAt` |
| `submissions` | Uma versão enviada de um documento | `requirementId`, `employeeId`, `documentTypeId`, `version`, `isActive`, `fileName`, `contentType`, `sizeBytes`, `submittedAt`, `deletedAt` |

`submissions` é append-only: reenviar não sobrescreve, insere a versão seguinte e desativa a anterior. `employeeId` e `documentTypeId` são desnormalizados no envio para que as estatísticas não precisem de junção; é o único ponto de desnormalização do modelo, e ele existe porque a coleção só cresce, então acrescentar o campo depois exigiria backfill.

Nada é removido fisicamente. Toda coleção tem `deletedAt`, e a remoção de um colaborador ou de um tipo de documento cascateia para os vínculos e para os envios dentro de uma transação, carimbando o mesmo instante nos três.

### Por que MongoDB

O banco era escolha nossa. O domínio pede duas coisas que decidem: transação multi-documento, porque o envio escreve em duas coleções e a remoção lógica em três, e índice único parcial, porque "uma versão ativa por vínculo" e "CPF único entre os não removidos" são invariantes que só o banco pode garantir contra escrita que não passe pela API. O MongoDB entrega as duas desde que rode em replica set, e é por isso que o `docker-compose.yml` sobe um replica set de um nó em vez de um `mongod` solto.

Um banco relacional resolveria o mesmo com `UNIQUE ... WHERE deleted_at IS NULL` e transação nativa. A escolha pesou também o que o domínio não pede: não há junção profunda nem relatório analítico arbitrário, e o documento de envio é naturalmente um agregado. A ausência de esquema imposto pelo banco é compensada pelo schema do Mongoose, que valida na escrita.

## Índices

Onze índices declarados além dos `_id`. Cada um existe por uma consulta ou por uma invariante, e nenhum foi criado para uma consulta hipotética.

| Coleção | Índice | Por quê |
|---|---|---|
| `employees` | `{cpf: 1}` único, parcial em `deletedAt: null` | CPF único entre os ativos, permitindo recadastrar depois da remoção lógica |
| `employees` | `{email: 1}` único, parcial em `deletedAt: null` | Mesma regra para e-mail |
| `employees` | `{deletedAt: 1, _id: -1}` | Listagem paginada dos ativos, já na ordem de saída |
| `document_types` | `{slug: 1}` único, parcial em `deletedAt: null` | Slug único entre os ativos |
| `document_types` | `{deletedAt: 1, _id: -1}` | Listagem paginada dos ativos |
| `requirements` | `{employeeId: 1, documentTypeId: 1}` único total | Um vínculo por par. É total, e não parcial, porque revincular revive o documento removido em vez de criar outro, e reviver exige que o removido continue único e alcançável |
| `requirements` | `{deletedAt: 1, status: 1, _id: -1}` | `GET /requirements?status=PENDING` e o `$match` das estatísticas, que cai no prefixo |
| `requirements` | `{deletedAt: 1, employeeId: 1, status: 1, _id: -1}` | `GET /requirements?employeeId=X`, com ou sem status |
| `submissions` | `{requirementId: 1, version: 1}` único | Numeração sem buraco e ordenação do histórico |
| `submissions` | `{requirementId: 1}` único, parcial em `isActive: true` | Uma única versão ativa por vínculo |
| `submissions` | `{deletedAt: 1, submittedAt: -1, _id: -1}` | Os últimos envios do sistema, nas estatísticas |

Os índices não são criados na subida da aplicação. `autoIndex` está desligado, e `pnpm db:indexes` roda `syncIndexes()` na conexão inteira. Criação de índice em foreground bloqueia a coleção, e deixar isso acontecer no deploy é entregar o controle do momento ao acaso.

### O que a medição mostrou

5000 vínculos sintéticos, 250 colaboradores por 20 tipos, 80% pendentes, 9% removidos logicamente. `explain('executionStats')` antes e depois dos dois índices de `requirements`:

| Consulta | Antes | Depois |
|---|---|---|
| `?status=PENDING` página 1 | `IXSCAN:_id_`, 27 chaves e 27 documentos | `IXSCAN:{deletedAt,status,_id}`, 20 e 20 |
| `?status=PENDING` página 50 | mesmo plano, 1374 e 1374 | mesmo plano com o composto, 1000 e 1000 |
| `?employeeId=X&status=PENDING` | `SORT <- FETCH <- IXSCAN:{employeeId,documentTypeId}`, 20 e 20 | `LIMIT <- FETCH <- IXSCAN:{deletedAt,employeeId,status,_id}`, 18 e 18, sem `SORT` |
| sem filtro, página 50 | `IXSCAN:_id_`, 1100 e 1100 | inalterado |

O ganho que decide é a terceira linha: a consulta por colaborador fazia ordenação bloqueante em memória, porque o índice único do par não tem `_id` na ponta e não entrega a ordem pedida. A quarta linha é a mais útil de ler: com os dois índices disponíveis, o planner continua preferindo `_id_` na listagem sem filtro, o que é a evidência de que um terceiro índice seria peso de escrita sem leitor.

Em `submissions`, o índice dos últimos envios foi medido com 50 mil documentos:

| | Plano | Chaves | Documentos | Tempo |
|---|---|---|---|---|
| Sem o índice | `SORT <- COLLSCAN` | 0 | 50000 | 28ms |
| Com `{deletedAt: 1, submittedAt: -1, _id: -1}` | `LIMIT <- FETCH <- IXSCAN` | 10 | 10 | 0ms |

A paginação é por `skip` e `limit`, e o custo cresce com a profundidade: a página 50 examina 1000 documentos para devolver 20. Serve porque a interface é de navegação por página e `limit` tem teto de 100. A alternativa é cursor por `_id`, constante em qualquer profundidade, que não permite saltar para uma página arbitrária nem informar `totalPages`.
