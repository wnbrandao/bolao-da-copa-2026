# 🏆 Bolão da Copa 2026 — Fase de Grupos

App **mobile-first** onde cada participante **arrasta as 4 seleções de cada um dos
12 grupos (A–L)** pra prever a classificação final (1º → 4º). Pontuação por
**posição exata** (+3 por seleção no lugar certo, máx. 144).

Arquitetura **100% estática** (hospedável de graça no GitHub Pages), com backend
no **Google Sheets** via Apps Script.

```
GitHub Pages (site estático)  ──fetch──▶  Apps Script (/exec)  ──▶  Google Sheet
```

## Stack

- **Next.js 16** (App Router, `output: 'export'`) + **React 19** + **TypeScript**
- **Tailwind v4** (tema escuro, container `max-w-md`)
- **@dnd-kit** pro drag-and-drop (suporte a toque)
- Bandeiras: imagens do **flagcdn** (`src/components/Flag.tsx`)
- Identidade sem login: UUID + nome no `localStorage`
- Dados: **Google Sheets** via Apps Script (ver [`google-apps-script/`](./google-apps-script/))

## Rodar local

```bash
npm install
cp .env.example .env       # cole a URL /exec do Apps Script em NEXT_PUBLIC_API_URL
npm run dev                # http://localhost:3000/bolao-da-copa-2026
npm test                   # testes da pontuação
```

> O app vive sob o `basePath` `/bolao-da-copa-2026` (nome do repo no GitHub Pages).

## Estrutura

- `src/data/teams.ts` — os 48 selecionados nos 12 grupos (estático, fonte da verdade).
- `src/lib/scoring.ts` — pontuação (função pura, testada).
- `src/lib/api.ts` — `fetch` pro Apps Script (GET estado / POST palpite).
- `src/lib/identity.ts` — UUID + nome no localStorage.
- `src/app/` — `page` (home), `palpite`, `ranking`, `ver?u=<id>` (palpite público).

## Deploy (GitHub Pages, grátis — repo público)

1. `Settings → Pages → Source: GitHub Actions`.
2. `Settings → Secrets and variables → Actions → Variables`: crie
   `NEXT_PUBLIC_API_URL` com a URL `/exec` do Apps Script.
3. Push na `main` → o workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
   builda e publica em `https://<usuario>.github.io/bolao-da-copa-2026/`.

## Gabarito (resultado oficial)

Edite a aba **`gabarito`** da planilha com a ordem final de cada grupo (siglas FIFA).
O ranking é **parcial**: cada grupo passa a pontuar assim que suas 4 posições são
preenchidas, então o placar já aparece a partir do 1º grupo apurado e cresce
conforme os jogos acabam (não precisa esperar os 12 fecharem). Detalhes e a
tabela de siglas em [`google-apps-script/README.md`](./google-apps-script/README.md).
