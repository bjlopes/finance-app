# Finanças com Tags

App de controle financeiro pessoal usando **tags** para organizar transações.

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
