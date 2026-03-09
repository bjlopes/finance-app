# Configurar sincronização no celular

Siga estes passos para usar o app no celular com dados sincronizados na nuvem.

---

## 1. Criar conta no Supabase

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your project**
2. Faça login com GitHub ou crie uma conta
3. Clique em **New Project**
4. Escolha um nome (ex: `financas-pessoal`), senha do banco (guarde em lugar seguro) e região (ex: South America)
5. Clique em **Create new project** e aguarde ~2 minutos

---

## 2. Copiar as credenciais

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem) → **API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** (em Project API keys)

---

## 3. Configurar o projeto local

1. Na pasta do projeto, crie o arquivo `.env.local` (ou edite se já existir)
2. Cole e substitua pelos seus valores:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Salve o arquivo

---

## 4. Criar a tabela no Supabase

1. No Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase/migrations/001_create_user_data.sql`
4. Cole no editor e clique em **Run** (ou Ctrl+Enter)
5. Deve aparecer "Success. No rows returned"

---

## 5. (Opcional) Desativar confirmação de e-mail

Para entrar mais rápido sem confirmar e-mail:

1. Vá em **Authentication** → **Providers** → **Email**
2. Desative **Confirm email**
3. Salve

---

## 6. Testar localmente

1. No terminal: `npm run dev`
2. Abra [http://localhost:3000](http://localhost:3000)
3. Clique em **Entrar**, digite seu e-mail e envie
4. Abra o link que chegou no e-mail
5. Você deve estar logado e os dados passam a sincronizar

---

## 7. Deploy na Vercel (para usar no celular)

1. Faça push do projeto para o GitHub (se ainda não fez)
2. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
3. Clique em **Add New** → **Project**
4. Importe o repositório do projeto
5. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua chave
6. Clique em **Deploy**
7. Quando terminar, copie a URL (ex: `https://financas-xxx.vercel.app`)

---

## 8. Configurar redirect no Supabase

1. No Supabase, vá em **Authentication** → **URL Configuration**
2. Em **Redirect URLs**, adicione:
   - `https://SUA-URL.vercel.app/auth/callback`
   - `https://SUA-URL.vercel.app/auth/update-password`
   - `http://localhost:3000/auth/callback` (para dev)
   - `http://localhost:3000/auth/update-password` (para dev)
3. Salve

---

## 9. Usar no celular

1. No celular, abra o Safari (iPhone) ou Chrome (Android)
2. Acesse a URL do seu app na Vercel
3. Toque em **Entrar** e digite seu e-mail
4. Abra o link no e-mail
5. Pronto! Os dados sincronizam automaticamente entre celular e computador.

---

## Dúvidas comuns

**Onde fica o .env.local?**  
Na raiz do projeto, ao lado de `package.json`. O arquivo não vai para o Git (está no .gitignore).

**Preciso fazer isso em cada dispositivo?**  
Não. Só configure uma vez. Depois é só entrar com o mesmo e-mail em qualquer dispositivo.

**E se eu já tenho dados no app?**  
Ao fazer login pela primeira vez, os dados locais são enviados para a nuvem automaticamente.
