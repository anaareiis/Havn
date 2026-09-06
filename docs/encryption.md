# Criptografia dos dados locais

## Decisão

O Havn não usa um banco SQLite totalmente criptografado (SQLCipher) porque isso exigiria um dev client customizado — o app deixaria de rodar no Expo Go, o que quebra uma restrição que o projeto já tinha assumido (ver histórico: "Rebaixar para Expo SDK 54 (compatibilidade com Expo Go)"). Em vez disso, o Havn criptografa **campos sensíveis específicos** antes de gravar no SQLite, mantendo tudo funcionando no Expo Go, sem native modules extras.

Campos criptografados (AES-256-GCM, `src/lib/encryption.ts`):

- `accounts.balance`
- `transactions.amount`
- `transactions.description`

O `id`, `type`, `account_id`, `category_id`, `anchor_id`, `date`, `created_at`, `updated_at` continuam em texto plano — são chaves/metadados usados em `WHERE`, `JOIN`, `ORDER BY` e nos filtros das telas; criptografá-los quebraria toda a camada de consulta sem ganho real de privacidade (não são, sozinhos, dados financeiros sensíveis).

## Por que não todos os campos

Criptografar `amount` e `balance` significa que o SQLite não consegue mais fazer `SUM`/`GROUP BY` sobre eles — o valor armazenado é um blob opaco. As agregações que dependiam disso (`getTotalsByPeriod`, `getExpensesByCategory`, `getAccountBalance` → `getSignedAmountTotalByAccount`) foram reescritas para buscar as linhas via SQL (filtrando por `date`/`account_id`/`type`/`category_id`, que continuam em texto plano) e somar em JavaScript, depois de descriptografar cada valor. Para o volume de dados de um app financeiro pessoal, isso é perfeitamente viável.

O mesmo problema afeta a busca por descrição em `findTransactions`: como `description` é criptografado, não dá pra usar `LIKE` no SQL. Quando há termo de busca, a função busca até `SEARCH_SCAN_LIMIT` (1000) linhas candidatas (já filtradas por conta/categoria/período, que continuam em texto plano), descriptografa a descrição de cada uma e filtra em memória. É uma busca "boa o suficiente" para o histórico de um usuário, não uma solução de full-text search escalável.

## Chave de criptografia

Gerada uma única vez (32 bytes aleatórios via `expo-crypto`) e guardada no `expo-secure-store` (Keychain no iOS, Keystore no Android) — nunca em texto plano em disco, nunca versionada. `src/lib/encryption.ts` cacheia a chave em memória depois do primeiro acesso.

## Interação com a sincronização (Maré)

A criptografia é **estritamente local**. Os repositórios (`accountsRepository`, `transactionsRepository`) descriptografam ao ler do SQLite e criptografam ao escrever — o resto do app (telas, `sync.ts`) só enxerga os valores em texto plano de sempre. Isso é proposital: a chave de criptografia é gerada por dispositivo; se o ciphertext fosse empurrado pro Supabase, outro dispositivo com uma chave diferente não conseguiria descriptografar. Então o que sobe e desce da fila de sync (`sync_queue`, `pushPendingChanges`, `pullRemoteChanges`) sempre trafega em texto plano — a proteção do dado em repouso no servidor é responsabilidade do próprio Supabase (RLS + criptografia de disco), fora do escopo desta decisão.

## Limitação conhecida

Não há migração retroativa: linhas gravadas antes desta mudança (se existirem) permanecem em texto plano até serem editadas de novo pelo app. Para um projeto nesta fase, sem dados de produção em risco, isso foi aceito como custo razoável em vez de escrever um script de migração de dados.
