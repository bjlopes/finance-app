# Finanças com Tags

App de controle financeiro pessoal usando **tags** para organizar transações.

> See [CHANGELOG.md](./CHANGELOG.md) for the full list of features and changes.

## Funcionalidades

- **Dashboard** – visão geral: gastos, receitas, saldo do mês, top tags
- **Transações** – cadastro com descrição, valor, conta, data e múltiplas tags
- **Tags** – criar e gerenciar tags (contexto, frequência, regra, etc.)
- **Relatórios** – distribuição de gastos por tag

## Como rodar

1. Instale as dependências:

```bash
cd finance-app
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse [http://localhost:3000](http://localhost:3000)

4. (Opcional) Para carregar dados de exemplo, faça uma requisição POST para `/api/seed`:

```bash
curl -X POST http://localhost:3000/api/seed
```

## Instalar no iPhone (PWA)

O app é um **PWA** (Progressive Web App). Para instalar no iPhone:

1. **Deploy** o app (ex: Vercel, Netlify) ou use na **mesma rede** que seu Mac
2. No iPhone, abra o Safari e acesse a URL do app
3. Toque no botão **Compartilhar** (ícone de quadrado com seta)
4. Role e toque em **"Adicionar à Tela de Início"**
5. Toque em **Adicionar**

O app aparecerá na tela inicial como um app nativo e abrirá em tela cheia.

> **Para testar localmente:** Rode `npm run dev` no Mac e acesse `http://SEU_IP:3000` no iPhone (ex: `http://192.168.1.10:3000`). Descubra seu IP com `ifconfig | grep "inet "` no terminal.

## Armazenamento e login

### Modo local (sem Supabase)

Sem configurar o Supabase, os dados ficam no **localStorage** do navegador. O app funciona normalmente, mas os dados não são sincronizados entre dispositivos.

### Modo com conta (Supabase) – para compartilhar com amigos

Para que cada pessoa tenha seus próprios dados isolados:

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a URL e a chave anônima (Settings → API)
3. Crie o arquivo `.env.local` com:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   ```
4. No Supabase, vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/001_create_user_data.sql`
5. (Opcional, para testes rápidos) Em **Authentication → Providers → Email**, desative "Confirm email" para que novos usuários possam entrar sem confirmar o e-mail

Com isso, o app exige login. Cada usuário vê apenas seus próprios dados, protegidos por Row Level Security (RLS).

## Deploy on Vercel

1. Push the project to GitHub (or connect your repo in [Vercel](https://vercel.com))
2. Import the project in Vercel
3. Add environment variables in **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase **Auth → URL Configuration**, add your Vercel URL to Redirect URLs:
   - `https://seu-projeto.vercel.app/auth/callback`
   - `https://*.vercel.app/auth/callback` (for preview deployments)

Or deploy via CLI:

```bash
npm i -g vercel
vercel
```

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Armazenamento em JSON (pasta `data/`)

## Estrutura

```
src/
├── app/
│   ├── api/          # Rotas da API
│   ├── page.tsx      # Dashboard
│   ├── transacoes/   # Lista e formulário de transações
│   ├── tags/         # Gerenciamento de tags
│   └── relatorios/   # Relatórios por tag
├── components/
│   ├── Nav.tsx       # Navegação
│   └── TagInput.tsx  # Input de tags com autocomplete
├── lib/
│   └── db.ts         # Persistência em JSON
└── types/
    └── index.ts      # Tipos TypeScript
```
