# Armazenamento em nuvem com login

O app suporta armazenamento local (localStorage) e em nuvem (Supabase) associado a login.

## Como configurar

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Em **Settings** → **API**, copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 3. Criar tabela no Supabase

1. No painel do Supabase, vá em **SQL Editor**
2. Crie uma nova query e cole o conteúdo de `supabase/migrations/001_create_user_data.sql`
3. Execute a query

### 4. Habilitar e-mail (opcional)

Para confirmação de e-mail no cadastro, vá em **Authentication** → **Providers** → **Email** e configure.

## Como funciona

- **Sem login**: os dados ficam em `localStorage` (apenas no dispositivo)
- **Com login**: os dados são sincronizados com a nuvem e ficam disponíveis em qualquer dispositivo
- **Primeiro login**: se você já tem dados locais e faz login pela primeira vez, eles são enviados para a nuvem automaticamente

## Migração de dados existentes

Se você já usa o app com dados locais e faz login pela primeira vez, seus dados serão automaticamente enviados para a nuvem. Não é necessário fazer nada manualmente.
