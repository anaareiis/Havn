# Arquitetura da Maré (offline-first sync)

## Decisão

Havn é **local-first**: o SQLite do dispositivo (`src/lib/db/`) é a fonte da verdade. O app lê e escreve direto no banco local — nenhuma operação de CRUD depende de rede para funcionar. Sincronizar com um backend remoto é uma camada adicional por cima disso, não um requisito para o app operar.

Cada mutação nas entidades locais (contas, categorias, transações, âncoras) grava, além da tabela da entidade, um registro numa **fila de sincronização** (`sync_queue`). Essa fila é a ponte entre "o que mudou localmente" e "o que ainda falta subir pro servidor".

Quando há conectividade, `src/lib/sync.ts` processa a fila em ordem: envia cada mudança pendente ao Supabase, marca como `synced` em caso de sucesso ou `error` em caso de falha (permitindo retry depois), e então puxa as tabelas remotas e mescla localmente. Conflitos (a mesma entidade mudou dos dois lados) são resolvidos por **last-write-wins** comparando `updated_at`, tanto no push quanto no pull — ver detalhes na seção de sincronização abaixo.

## Por que fila (não sync direto)

- O app precisa funcionar 100% offline — toda escrita é local primeiro, sempre.
- Se cada mutação tentasse sincronizar na hora, uma escrita offline exigiria lógica de retry espalhada pelo app inteiro. Com fila, a escrita local é sempre imediata e síncrona; o envio pro servidor é assíncrono e centralizado num único worker.
- A fila também dá um log de auditoria natural do que aconteceu localmente antes de ir pro servidor.

## Estrutura de dados

Tabela `sync_queue` (migration v4, `src/lib/db/schema.ts`):

| Coluna          | Tipo | Descrição                                                          |
| --------------- | ---- | ------------------------------------------------------------------ |
| `id`            | TEXT | Identificador do registro de fila                                  |
| `entity_type`   | TEXT | `account` \| `category` \| `transaction` \| `anchor`               |
| `entity_id`     | TEXT | Id da entidade afetada                                             |
| `operation`     | TEXT | `create` \| `update` \| `delete`                                   |
| `payload`       | TEXT | Snapshot JSON da entidade no momento da mudança (null em `delete`) |
| `status`        | TEXT | `pending` \| `synced` \| `error` (default `pending`)               |
| `error_message` | TEXT | Preenchido quando `status = error`                                 |
| `created_at`    | TEXT | Quando a mudança local aconteceu                                   |
| `synced_at`     | TEXT | Quando foi confirmada pelo servidor (null até sincronizar)         |

DAO correspondente: `src/lib/db/repositories/syncQueueRepository.ts` (`enqueueSyncEntry`, `findPendingSyncEntries`, `markSyncEntrySynced`, `markSyncEntryError`).

## Sincronização (issue #19)

- Todo `create`/`update`/`delete` de conta, categoria, âncora e transação chama `enqueueSyncEntry` automaticamente, dentro do próprio repositório.
- `src/lib/sync.ts`:
  - `syncNow()` — checa conectividade (`@react-native-community/netinfo`), garante uma sessão Supabase, envia a fila pendente (`pushPendingChanges`) e puxa+mescla as tabelas remotas (`pullRemoteChanges`).
  - `watchConnectivityAndSync()` — escuta mudanças de rede e dispara `syncNow()` sempre que o dispositivo volta a ficar online.
- Chamado no boot do app e no listener de conectividade (`App.tsx`).
- Merge das entidades puxadas usa as funções `upsert*FromRemote` de cada repositório (não passam pela fila de novo, evitando eco push→pull→push).
- Indicador visual do estado (`offline`/`syncing`/`synced`/`error`) — `src/lib/syncStatus.ts` + `src/components/SyncStatusBar.tsx` (issue #20).

## Resolução de conflitos (issue #21)

Estratégia: **last-write-wins** por `updated_at`, comparado em código (não só via SQL) para poder logar quando um conflito de fato acontece.

- **Pull** (`upsert*FromRemote` em cada repositório de accounts/anchors/transactions): busca a linha local atual, compara `updatedAt`. Se local é mais novo, mantém local (`kept-local`) e ignora a linha remota; se remoto é mais novo, aplica (`applied-remote`); se são iguais, não faz nada. Só conta como conflito quando a linha já existia localmente — a primeira vez que uma entidade chega do servidor é inserção normal, não conflito.
- **Push** (`pushPendingChanges` em `src/lib/sync.ts`): antes de sobrescrever, busca só o `updated_at` remoto atual; se o remoto já é mais novo que o payload local pendente (alguém sincronizou uma versão mais recente enquanto este dispositivo estava offline), a entrada da fila é descartada em favor do remoto (`kept-remote`) — o próximo pull traz a versão correta pra cá.
- **Categorias** não têm `updated_at` (schema local e remoto), então não participam da checagem de conflito — upsert simples, última escrita vence sem comparação.
- **Log de debug**: `src/lib/conflictLog.ts` — toda resolução de conflito (`kept-local` / `applied-remote` / `kept-remote`) é registrada em `console.log` e mantida num buffer em memória (`getConflictLog()`, últimas 100 entradas) para inspeção durante desenvolvimento.
