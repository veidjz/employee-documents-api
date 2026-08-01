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

## Concorrência

**O que acontece com dois reenvios simultâneos do mesmo documento.** Os dois abrem transação e os dois tentam `$inc` no mesmo documento do vínculo. O primeiro pega o lock, o segundo espera até `maxTransactionLockRequestTimeoutMillis` e recebe `WriteConflict`, que carrega o label `TransientTransactionError`. O `withTransaction` do driver retenta a transação inteira com um snapshot novo, e a retentativa lê a versão já incrementada. O resultado é determinístico: versões consecutivas, exatamente uma ativa, e nenhuma linha de retry escrita à mão. O teste com três reenvios simultâneos produz as versões 1, 2 e 3 sem buraco.

São três mecanismos com três papéis, e nenhum substitui o outro:

| Mecanismo | Garante | Não garante |
|---|---|---|
| `connection.transaction()` | As escritas de uma operação acontecem juntas ou nenhuma acontece | Unicidade: duas transações que inserem documentos diferentes não conflitam e ambas commitam |
| `$inc` no documento do vínculo | Serialização: dois reenvios do mesmo vínculo colidem no lock e o segundo retenta com estado novo | Nada contra escrita que não passe pelo caso de uso |
| Índice único parcial `{requirementId}` onde `isActive: true` | A invariante de uma versão ativa por vínculo, válida até para um script rodado no `mongosh` | Que as escritas relacionadas aconteçam juntas |

**Por que `$inc` e não `count() + 1`.** `count() + 1` lê fora de qualquer garantia de exclusão: dois reenvios leem o mesmo número e escrevem a mesma versão. O `$inc` é a reserva e o lock ao mesmo tempo, num documento que já existe e que já é o dono da numeração. Por acontecer dentro da transação, uma falha nas escritas seguintes devolve o contador ao valor anterior, o que é o que impede buraco na numeração.

**Por que a versão anterior é desativada antes de a nova ser inserida.** O índice único parcial não admite duas ativas nem por um instante dentro da mesma transação. Inserir primeiro e desativar depois dispara `E11000` na inserção.

**Como a sessão chega aos repositórios.** Por `mongoose.set('transactionAsyncLocalStorage', true)`, ligado na raiz de composição. Nenhum repositório menciona sessão: eles fazem `create` e `updateOne` normais e mesmo assim participam da fronteira. Os casos de uso recebem uma porta `TransactionRunner`, e a regra de lint que proíbe `mongoose` em `application/` garante que nenhum deles consiga injetar `Connection` ou receber `ClientSession` por fora.

**Uma fronteira transacional por operação.** Com o AsyncLocalStorage ligado, cada `connection.transaction()` cria a própria sessão, e uma transação aninhada não é revertida quando a externa falha. A consequência virou regra de projeto: nenhum caso de uso transacional chama outro caso de uso transacional. A cascata de remoção orquestra repositórios dentro de uma fronteira só.

**`readConcern: snapshot` e `writeConcern: majority`.** Snapshot é o que dá à transação uma visão consistente do banco no instante em que ela começou, que é o pressuposto de ler `currentVersion` e incrementar sem enxergar escrita de concorrente no meio. Maioria é o que garante que o commit sobreviveu à confirmação de quórum antes de a API responder 201. Num replica set de um nó a maioria é barata, mas o código não fica dependendo de o cluster ter um nó só.

Cada um desses mecanismos tem um teste que reprova quando ele é desligado, e não apenas um teste de caminho feliz que passaria sem eles.

## Logs e rastreio

Todo log sai em JSON, uma linha por evento, para `stdout`. A aplicação não escreve arquivo nem rotaciona nada: quem coleta é a plataforma.

Toda resposta carrega `x-request-id`. Se a requisição já vier com esse cabeçalho, o valor é reaproveitado, o que permite correlacionar com um gateway ou balanceador na frente; se não vier, um `randomUUID` é gerado. O mesmo identificador aparece em toda linha emitida durante aquela requisição, inclusive na do tratador global de exceções, que não conhece o identificador e não precisa recebê-lo por parâmetro. Um cliente reporta um erro, entrega o `x-request-id` que recebeu, e o stack trace é achável por ele:

```
{"level":50,"req":{"id":"07cbf0b6-...","url":"/health"},"context":"AllExceptionsFilter","err":{...}}
{"level":30,"req":{"id":"07cbf0b6-...","url":"/health"},"res":{"statusCode":500}}
```

Isso é o que a dependência compra. JSON sozinho não exigiria dependência nenhuma, porque o Nest tem `ConsoleLogger({ json: true })` nativo; o que ele não faz é propagar contexto, e cada logger emitiria sua linha sem saber a qual requisição pertence.

**A requisição é logada por lista de permissão, não de proibição.** O serializer reduz a requisição a `id`, `method` e `url` e a resposta a `statusCode`. Ficam de fora o corpo, a query, os parâmetros de rota, os cabeçalhos de entrada, o endereço remoto e o dump inteiro dos cabeçalhos de resposta. A garantia é estrutural: um campo acrescentado depois não vaza por esquecimento, porque o que não está no serializer não é logado. Efeito colateral medido na linha de acesso: 618 para 236 bytes.

Em desenvolvimento, `pnpm start:dev | npx pino-pretty` deixa a saída legível sem que o formatador entre como dependência do projeto.

## Ambiguidades do enunciado

O enunciado deixa pontos em aberto. Cada um foi resolvido por decisão declarada, e não por omissão.

**"Percentual de documentação completa" tem mais de uma leitura.** O endpoint expõe duas, porque elas respondem perguntas diferentes: `completionRate` é entregas sobre exigências, a visão da operação; `complianceRate` é colaboradores 100% em dia sobre colaboradores com ao menos um vínculo, a visão de auditoria. A terceira leitura possível, média das médias por colaborador, foi descartada porque pondera igual quem tem 1 documento e quem tem 20.

**O denominador de `complianceRate` são os colaboradores com vínculo, não a folha inteira.** Quem não tem nenhuma exigência não está em dia nem em falta, e colocá-lo no denominador faria a taxa cair a cada admissão antes de qualquer vínculo ser criado. Há teste fixando isso.

**Base vazia devolve 200 com as duas taxas em `null`,** e não em `0`. Zero por cento entregue e nada para entregar são fatos diferentes, e `0` faria um painel acusar problema onde não há dado.

**"Tipos mais frequentemente pendentes" é um retrato do agora,** a contagem de vínculos em `PENDING` por tipo, top 5. A leitura alternativa, quantas vezes cada tipo já ficou pendente ao longo do tempo, exigiria trilha de mudança de status que ninguém pediu.

**"Últimos envios" são os 10 mais recentes e não filtram por versão ativa.** Todo envio é um envio realizado; esconder as versões substituídas apagaria o reenvio, que é justamente o evento interessante da lista.

**"Cadastro" foi lido como criar, listar, consultar e remover logicamente. Sem update.** O enunciado não descreve fluxo de correção cadastral, e um `PATCH` de nome exigiria decidir a semântica de update em campo único sem nenhum requisito para ancorar a decisão.

**A remoção lógica melhora o `completionRate`,** porque os vínculos pendentes do removido saem do denominador. É contraintuitivo e é correto: quem sai do sistema deixa de ser cobrado, que é a mesma semântica de um desligamento.

**Desvincular apaga o envio das estatísticas.** A exigência deixou de existir, então o documento entregue para ela deixa de contar como entrega e sai de "últimos envios". Coberto por teste.

**Filtrar por um colaborador removido devolve 200 com lista vazia,** enquanto `GET /employees/:id` do mesmo identificador devolve 404. Filtro é filtro: uma busca sem resultado é 200 com zero itens, e um recurso que não existe é 404.

**Recriar um tipo de documento com o slug de um tipo removido cria um registro novo,** e os vínculos antigos continuam removidos. Vínculo revive por par de identificadores porque a intenção é inequívoca; tipo de documento não revive por slug, porque reviver por texto igual seria adivinhar a intenção e ressuscitar vínculos que ninguém pediu de volta.

**Revincular um par removido preserva a numeração de versão.** O vínculo é o mesmo documento, então `currentVersion` nunca se perdeu, e o histórico anterior volta a ficar visível. Depois de um relink, o envio seguinte sai como a versão 3, e não como a versão 1. É comportamento escolhido, com teste, não efeito colateral.

**404 e não 410 para o que foi removido logicamente.** O 410 informaria ao cliente que o recurso existiu e foi apagado, o que expõe a remoção lógica como detalhe de implementação para quem consome a API.

## O que ficou de fora e por quê

**Autenticação e autorização.** O enunciado declara que não seriam avaliadas. Entrariam como um guard global com a lista de rotas públicas, e o modelo de dados não mudaria.

**O arquivo em si.** O envio registra metadados (nome, tipo, tamanho, versão), não os bytes. Guardar binário no MongoDB seria a escolha errada mesmo se houvesse tempo: o caminho é o cliente pedir uma URL assinada, subir direto para o object storage e a API guardar a chave. Nada do que este teste avalia muda com isso, porque versionamento, concorrência e estatística são sobre o registro, não sobre o conteúdo.

**Recorrência.** Um ASO vence todo ano, e o modelo atual trata a exigência como única por par colaborador e tipo. Suportar recorrência seria acrescentar `validUntil` ou uma competência ao vínculo e incluir esse campo no índice único do par. É migração de índice, não de arquitetura, e foi deixada fora porque o enunciado não menciona validade.

**Atualização de cadastro.** Não há `PATCH` nem `PUT` em colaborador ou tipo de documento, pela razão descrita na seção de ambiguidades.

**`GET /document-types/:id`.** O contrato não pede consulta unitária de tipo de documento, e por isso o `201` desse cadastro não emite `Location`: o cabeçalho apontaria para uma URI que responde 404. Criar o endpoint só para justificar o cabeçalho seria escopo inventado.

**Restauração explícita.** Não existe rota para desfazer uma remoção lógica. O único caminho de volta é revincular um par removido, que é uma operação do domínio e não uma administração do banco.

**Paginação por cursor.** Medida e descartada com o número na seção de índices. Trocar `skip` por cursor mudaria o contrato do envelope, que hoje informa `totalPages`.

**Observabilidade além do log.** Sem métricas, sem tracing distribuído e sem cache. O `x-request-id` é o gancho que um coletor usaria depois, e ele já existe. `exclude: ['/health']` no log de acesso só entra quando o deploy mostrar a frequência real da sonda da plataforma, porque silenciar uma rota antes de saber o volume dela é apagar sinal sem motivo.

A regra que decidiu todas essas linhas é a mesma: nada entra no código antes de existir quem o consuma. Um método sem chamador, um campo sem leitor e uma configuração sem efeito custam manutenção e ainda dão a impressão de que o sistema faz algo que ele não faz.
