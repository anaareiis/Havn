# Arquitetura da Maré (offline-first sync)

## Decisão

Havn é **local-first**: o SQLite do dispositivo (`src/lib/db/`) é a fonte da verdade. O app lê e escreve direto no banco local — nenhuma operação de CRUD depende de rede para funcionar. Sincronizar com um backend remoto é uma camada adicional por cima disso, não um requisito para o app operar.

Cada mutação nas entidades locais (contas, categorias, transações, âncoras) grava, além da tabela da entidade, um registro numa **fila de sincronização** (`sync_queue`). Essa fila é a ponte entre "o que mudou localmente" e "o que ainda falta subir pro servidor".

Quando houver conectividade (issue #19) e um backend configurado (issue #18), um worker de sync processa a fila em ordem: envia cada mudança pendente, marca como `synced` em caso de sucesso ou `error` em caso de falha (permitindo retry depois). Resolução de conflitos (issue #21) fica fora do escopo desta decisão — a estratégia (last-write-wins vs. merge) será definida naquela issue, usando os timestamps já presentes em cada entidade (`updated_at`) e na própria fila (`created_at`).

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

## O que fica para depois

- **Enfileiramento automático** a cada `create`/`update`/`delete` das entidades existentes — planejado para quando o backend remoto (#18) existir; enfileirar sem nada para consumir a fila só acumularia registros sem propósito.
- **Worker de envio** e reconexão automática — issue #19.
- **Indicador visual de estado de sync** — issue #20.
- **Resolução de conflitos** — issue #21.
