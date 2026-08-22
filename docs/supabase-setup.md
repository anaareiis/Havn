# Setup do backend remoto (Supabase)

## 1. Credenciais

Copie `.env.example` para `.env` e preencha com a **Project URL** e a **anon/publishable key** do projeto (Project Settings → Data API no painel do Supabase). Nunca use a `service_role` key nem a senha do banco aqui — essas ficam só com quem administra o projeto.

## 2. Schema remoto

No painel do Supabase, abra **SQL Editor → New query**, cole o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e rode. Isso cria as tabelas `accounts`, `categories`, `anchors` e `transactions` espelhando o schema local (`src/lib/db/schema.ts`), cada uma com `user_id` e Row Level Security habilitada — cada usuário só enxerga as próprias linhas.

## 3. Autenticação anônima

O app não tem tela de login — cada instalação recebe uma identidade estável via **Supabase Anonymous Auth** (`src/lib/auth.ts`, chamado no boot em `App.tsx`). Para isso funcionar, habilite no painel:

**Authentication → Sign In / Providers → Anonymous Sign-Ins** → ativar o toggle.

Sem isso, `ensureSession()` falha ao criar a sessão anônima.

## Arquivos relevantes

- `src/lib/supabase.ts` — client do Supabase, com sessão persistida via `AsyncStorage`.
- `src/lib/auth.ts` — `ensureSession()` garante uma sessão (cria uma anônima se não houver).
- `supabase/schema.sql` — schema remoto + políticas de RLS.
