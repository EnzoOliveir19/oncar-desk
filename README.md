# Oncar Desk

Sistema de reserva de mesa do escritório da Oncar. 11 lugares, hot-desking, dark mode, integração com Google Workspace da empresa.

**Stack:** Next.js 15 (App Router) + Supabase (Postgres + Auth + Realtime) + Vercel + Tailwind + Motion.

---

## Estado atual

**Fase 1 — Fundação funcional (esse setup).** Auth via Google, banco com RLS, middleware, telas base (login + dashboard placeholder). O app roda ponta a ponta, mas ainda sem o mapa isométrico.

**Fase 2 — Camada visual (próxima).** SVG isométrico do escritório, animações Motion/GSAP, camada de temperatura ambiente, indicador de ocupação animado.

**Fase 3 — Slack e polish.** Edge Function pro webhook do Slack quando escritório fica lotado, deploy em domínio final.

---

## Setup — passo a passo

### 1. Criar o projeto no Supabase

1. Entre em [supabase.com](https://supabase.com) e clique em **New project**.
2. Nome: `oncar-desk`. Região: `South America (São Paulo)`. Senha do banco: gere uma forte e guarde.
3. Espere ~1 minuto até o projeto provisionar.

Assim que estiver pronto:

4. Vá em **SQL Editor** (menu esquerdo) → **New query**.
5. Cole o conteúdo inteiro de `supabase/schema.sql` e clique em **Run**.
6. Se rodou sem erro, você deve ver 11 linhas em **Table Editor → seats**.

**⚠️ Ajuste o email do Gustavo.** No `schema.sql` deixei `gustavo@oncar.com.br` como placeholder. Se o email real dele for outro, rode isso no SQL Editor:

```sql
update public.seats
   set fixed_user_email = 'email-real-do-gustavo@oncar.com.br'
 where id = 1;
```

### 2. Configurar OAuth Google no Google Cloud Console

1. Entre em [console.cloud.google.com](https://console.cloud.google.com).
2. Crie um projeto (ou use um existente): topo esquerdo → dropdown → **New Project** → nome `oncar-desk`.
3. Menu → **APIs & Services** → **OAuth consent screen**.
   - User type: **Internal** (só emails do domínio Oncar podem entrar).
   - App name: `Oncar Desk`. Support email: o seu.
   - Salvar. Adicionar scopes básicos: `openid`, `email`, `profile`.
4. Menu → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `oncar-desk`.
   - **Authorized redirect URIs**: adicione a URL do Supabase (você pega no próximo passo). Formato: `https://<seu-projeto>.supabase.co/auth/v1/callback`.
5. Clique em **Create**. Guarde o **Client ID** e **Client Secret** — vai usar no próximo passo.

### 3. Ligar Google provider no Supabase

1. Volte pro dashboard do Supabase → **Authentication** → **Providers**.
2. Clique em **Google** → ative.
3. Cole o **Client ID** e o **Client Secret** do passo anterior.
4. Copie a **Callback URL** que aparece e cole ela nos Authorized redirect URIs do Google Cloud (passo 2.4).
5. Em **Authorized Client IDs** cole o mesmo Client ID.
6. Salvar.

Ainda em **Authentication**:

7. **URL Configuration** → **Site URL**: `http://localhost:3000` (por enquanto — depois do deploy vira a URL do Vercel).
8. **Redirect URLs**: adicione `http://localhost:3000/auth/callback` e depois do deploy `https://oncar-desk.vercel.app/auth/callback`.

### 4. Rodar o projeto local

```bash
git clone git@github.com:<seu-usuario>/oncar-desk.git
cd oncar-desk
cp .env.local.example .env.local
```

Edite `.env.local` com os valores do seu projeto Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`: em **Project Settings → API → Project URL**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: em **Project Settings → API → Project API keys → anon public**

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Deve redirecionar pra `/login`. Login com uma conta `@oncara.com.br` e você cai no dashboard placeholder. Se rolou, Fase 1 tá redonda. 🎉

### 5. Deploy no Vercel

1. Suba o repo pro GitHub: `git init && git add . && git commit -m "fase 1" && git push`.
2. Em [vercel.com](https://vercel.com) → **Add New** → **Project** → importe o repo `oncar-desk`.
3. Framework: Next.js (auto-detectado). Não precisa mexer em build settings.
4. Em **Environment Variables**, cole:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy**.
6. Depois do primeiro deploy: no Google Cloud Console, adicione a URL do Vercel (ex: `https://oncar-desk.vercel.app/auth/callback`) nos Authorized redirect URIs. E no Supabase, adicione ela nos Redirect URLs também.

---

## Estrutura de pastas

```
oncar-desk/
├── app/
│   ├── layout.tsx              # Root layout com Geist Sans/Mono
│   ├── globals.css             # Base dark + scrollbar + selection
│   ├── page.tsx                # / → redirect pra /desk
│   ├── login/page.tsx          # Tela de login com botão Google
│   ├── auth/
│   │   ├── callback/route.ts   # Handler do OAuth (troca code por sessão)
│   │   └── signout/route.ts    # POST logout
│   └── desk/page.tsx           # Dashboard (placeholder na Fase 1)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Cliente para Client Components
│   │   ├── server.ts           # Cliente para Server Components
│   │   └── middleware.ts       # Helper de sessão + proteção de rotas
│   ├── types.ts                # Tipos TS espelhando o schema
│   └── utils.ts                # cn(), getWeekdaysAhead(), formatDayLabel()
├── supabase/
│   └── schema.sql              # Todo o banco: tabelas, RLS, triggers, seed
├── middleware.ts               # Hook do Next para updateSession()
├── tailwind.config.ts          # Paleta dark grafite + royal blue
└── package.json
```

## Paleta de cores

Aliases Tailwind (definidos em `tailwind.config.ts`):

| Alias                | Hex        | Uso                                    |
| -------------------- | ---------- | -------------------------------------- |
| `canvas`             | `#1F1F29`  | Fundo fora do escritório               |
| `floor`              | `#2B2B37`  | Chão do escritório                     |
| `wall`               | `#333340`  | Paredes (copa)                         |
| `surface`            | `#3A3A48`  | Mesas, cards                           |
| `border`             | `#48485A`  | Borda padrão                           |
| `border-strong`      | `#5C5C70`  | Borda em hover / cadeira livre         |
| `text-primary`       | `#D8D8E0`  | Texto principal                        |
| `text-secondary`     | `#8A8A98`  | Texto secundário                       |
| `text-muted`         | `#6A6A78`  | Legendas, hints                        |
| `accent` (DEFAULT)   | `#3E5EE8`  | Royal blue — cadeira ocupada, focus    |
| `accent-light`       | `#7A93F5`  | Stroke/highlight sobre accent          |
| `warm`               | `#F5A623`  | Porta / aviso                          |

## Scripts

- `npm run dev` — dev server em `localhost:3000`
- `npm run build` — build produção
- `npm run type-check` — verifica types sem emitir

## Próximos passos (Fase 2)

Quando a Fase 1 estiver deployada e funcionando, o próximo bloco é o mapa isométrico com Motion. Isso envolve:

- Componente `<OfficeMap />` em SVG isométrico
- Server Component `<DayTabs />` com os 5 dias úteis à frente
- Client Component com subscription realtime nas reservas
- Ação `reserveSeat(seatId, date)` como Server Action
- Ação `cancelReservation(id)` como Server Action
- Animações de entrada (stagger) e transição entre dias

Bora quando você estiver pronto.
