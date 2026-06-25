# Design — Fase de Mata-mata (Bolão da Copa 2026)

**Data:** 2026-06-25
**Status:** aprovado para planejamento (writing-plans)
**Revisão:** `@plan-reviewer` → APROVADO COM RESSALVAS (ressalvas incorporadas abaixo)

## 1. Objetivo

Adicionar a fase de **mata-mata** (knockout) da Copa 2026 ao app, mantendo o DNA
atual: **dados estáticos + lib pura testada + UI mobile-first + backend Apps
Script/Google Sheet**.

O participante **preenche o chaveamento** (escolhe o vencedor de cada confronto,
avançando rodada a rodada) de **16-avos → oitavas → quartas → semis → final**,
mais a **disputa de 3º lugar**. Pontua por seleção que ele acertou que **chega a
cada fase** (modelo "sobreviventes por fase", independente do caminho exato).

### Restrição-chave: "sem as seleções ainda"

Hoje (fase de grupos da Copa em andamento) **não se sabe quais 32 seleções
avançam**. O chaveamento é construído **agora com placeholders** ("1º A", "2º B",
"3º melhor"); as seleções reais entram nos slots quando a fase de grupos real
terminar. Toda a feature (modelo, pontuação, UI, save/load) é construída agora; a
abertura das apostas é controlada por uma flag de fase.

## 2. Decisões de produto (travadas com o usuário)

| Tema | Decisão |
|---|---|
| Mecânica | Preencher o chaveamento (bracket clicável, avança vencedores) |
| Pontuação | Escalando por fase, "sobreviventes por fase" (interseção de conjuntos) |
| Seeding | **Resultado oficial dos grupos** — bracket único, igual pra todos |
| Escopo | Entrega completa, **incluindo backend** (salvar/carregar + trava) |
| 3º lugar | **Incluído** na pontuação |
| Ranking | **Total combinado** grupos + mata, com breakdown, por bolão |
| Layout | **Passo a passo por fase** (mobile-first), não bracket largo |

### Valores de pontos (ajustáveis — constantes na lib)

```
oitavas: +1   (por seleção que chega às oitavas = venceu nos 16-avos)
quartas: +2
semis:   +3
finalista: +5 (chega à final)
campeão: +8
3º lugar: +4  (acerta exatamente o 3º colocado)
```

Máximo com esses valores: `16·1 + 8·2 + 4·3 + 2·5 + 1·8 + 4 = 66 pts`.

## 3. Modelo de dados (o ponto crítico — ressalva [alta] do reviewer)

**O palpite é sempre por SLOT do bracket, nunca por sigla FIFA.** Isso elimina a
ambiguidade placeholder×sigla e torna a pontuação 100% agnóstica de seleção.

### 3.1 Slots-fonte (as 32 "entradas" do chaveamento)

São identidades estáveis das 32 vagas dos 16-avos:

- `1A`..`1L` (12) — 1º colocado de cada grupo
- `2A`..`2L` (12) — 2º colocado de cada grupo
- `T1`..`T8` (8) — vagas dos **8 melhores terceiros**

> **Ressalva [baixa]:** os slots `T1`..`T8` (e a qual grupo cada terceiro
> pertence) **só se resolvem no fim da fase de grupos**, via tabela oficial de
> alocação da FIFA. Em `bracket.ts` eles ficam **explicitamente vagos**,
> resolvidos via `chaveamento` (seeding) — **nunca hardcoded** antecipadamente.

### 3.2 Confrontos (árvore fixa, em `data/bracket.ts`)

Ids de confronto nomeados pela quantidade de times na fase:

| Fase | Ids | Qtd jogos | Alimentado por |
|---|---|---|---|
| 16-avos | `M32_1`..`M32_16` | 16 | 2 slots-fonte cada |
| Oitavas | `M16_1`..`M16_8` | 8 | 2 vencedores de 16-avos |
| Quartas | `M8_1`..`M8_4` | 4 | 2 vencedores de oitavas |
| Semis | `M4_1`..`M4_2` | 2 | 2 vencedores de quartas |
| Final | `M2_1` | 1 | 2 vencedores de semis |
| 3º lugar | `M3P_1` | 1 | os 2 **perdedores** de semis |

Cada confronto referencia seus dois filhos (slots-fonte ou confrontos
anteriores), pra UI renderizar e a pontuação derivar os conjuntos.

> **Ressalva [baixa]:** os pares exatos dos 16-avos (qual 1º enfrenta qual 2º/3º)
> serão **transcritos do bracket oficial da FIFA 2026** na implementação, com a
> fonte verificada. É item aberto (ver §9).

### 3.3 Tipos (em `src/lib/mata.ts`, espelhando `scoring.ts`)

```ts
// Palpite do mata: pra cada confronto, qual SLOT-FONTE o usuário avança.
// Ex.: { "M32_1": "1A", "M16_1": "1A", ..., "M2_1": "1A" /*campeão*/,
//        "M3P_1": "2F" /*3º lugar*/ }
export type MataPalpite = Record<string, string>;

// Resultado oficial: mesmos vencedores-por-confronto (preenchido conforme os
// jogos acontecem → pontuação parcial) + seeding (slot-fonte → sigla, só p/ exibir).
export type Chaveamento = {
  seeding: Record<string, string>;   // { "1A": "MEX", "T1": "BRA", ... }
  resultados: MataPalpite;           // { "M32_1": "1A", ... } (parcial, ok)
};
```

### 3.4 Pontuação (função PURA, testada)

```ts
export const PONTOS_MATA = {
  oitavas: 1, quartas: 2, semis: 3, finalista: 5, campeao: 8, terceiro: 4,
} as const;

// Σ por fase |previstos ∩ oficiais| × pts + bônus 3º se exato.
// Opera só sobre slots-fonte → não precisa do seeding pra pontuar.
export function scoreMata(palpite: MataPalpite, oficial: Chaveamento): number;
```

Algoritmo, por fase (16-avos→oitavas, oitavas→quartas, …, semis→final, final→campeão):
`previstos` = conjunto dos slots que o usuário fez vencer os jogos daquela fase;
`oficiais` = idem nos `resultados`. Soma `|previstos ∩ oficiais| × pts`. 3º lugar:
`+terceiro` se `palpite["M3P_1"] === oficial.resultados["M3P_1"]`. Confrontos sem
resultado oficial ainda **não contam** (pontuação parcial natural).

## 4. UI — `src/app/mata-mata/`

Mobile-first (`max-w-md`), **passo a passo por fase** (não bracket largo):

```
16-avos  ●○○○○  (passo 1 de 6)
[ 1º A ]  vs  [ 3º C/D/F ]     ← toque no que avança
[ 1º B ]  vs  [ 2º F ]
  …                            [ Próxima fase → ]
```

Cada passo lista os confrontos derivados do passo anterior; toque escolhe o
vencedor. Passos: 16-avos → oitavas → quartas → semis → final → 3º lugar.
Reusa `Flag`; slot não-seedado mostra o rótulo de posição num chip neutro.

### Estados (flag nova `MATA_FASE` em `config.ts`)

```ts
export const MATA_FASE: "em-breve" | "aberta" | "encerrada" = "em-breve";
```

- **`em-breve`** (agora): bracket **read-only** com placeholders (preview). Sem enviar.
- **`aberta`**: 32 seleções nos slots (via `chaveamento.seeding`) → **clicável** + enviar.
- **`encerrada`**: trava a UI (igual `APOSTAS_ENCERRADAS` dos grupos), mostra seu bracket read-only.

Componentes: `page.tsx` (client; `getState`, identidade, decide fase) e
`BracketBoard.tsx` (stepper, escolha de vencedor, salvar rascunho/enviar).

## 5. Backend — Apps Script + Sheet (`google-apps-script/Codigo.gs`)

- Aba **`palpites`**: cabeçalho passa a `userId | nome | enviadoEm | palpite | mata | enviadoMataEm`.
  `setup()` **idempotente**: se a aba já existe com 4 colunas, acrescenta as 2 novas.
  Leitura **tolerante** (colunas ausentes na planilha já implantada → `''`).
- Aba nova **`chaveamento`**: colunas `tipo | id | valor` —
  `tipo="seed"` → `id`=slot-fonte, `valor`=sigla; `tipo="result"` → `id`=confronto, `valor`=slot vencedor.
  `doGet` monta `{ seeding, resultados }`. O admin preenche os `result` conforme os jogos acontecem.
- `doGet`: passa a incluir `mata`/`enviadoMataEm` por linha + `chaveamento`.
- `doPost`: nova `action:"saveMata"` (upsert de `mata` + `enviadoMataEm`, com `LockService`), espelhando `save`. A `save` dos grupos não muda.

> **Ressalva [média] — operacional:** ao alterar o `Codigo.gs`, publicar
> **nova versão na implantação EXISTENTE** (Gerenciar implantações → Editar →
> Nova versão). **Não** criar nova implantação — isso muda a URL `/exec` e quebra
> o secret `NEXT_PUBLIC_API_URL` do GitHub Actions. Documentar no README do backend.

### `src/lib/api.ts`

`State` ganha `chaveamento: Chaveamento`; `PalpiteRow` ganha `mata?`,
`enviadoMataEm?`. Novo `saveMata({ userId, nome, mata, submit })` (POST
`text/plain`, `action:"saveMata"`). `getState` lê tolerante (campos ausentes → default).

## 6. Ranking combinado (ressalva [alta] do reviewer)

**Política (não bloqueante):** o ranking **não** espera o mata acabar.

- `grupos` = `score` atual quando o gabarito está completo; senão `0` (exibido como "—").
- `mata` = `scoreMata(row.mata, chaveamento)` para quem tem `enviadoMataEm`; senão `0`.
  Acumula **parcial** conforme `chaveamento.resultados` enche.
- `total = grupos + mata`. Ordena por `total` desc, desempate por nome.

Nova função pura `computeCombined(palpites, gabarito, chaveamento): CombinedEntry[]`
(`{ userId, nome, grupos, mata, total }`). A página `ranking/page.tsx` mostra o
breakdown (`grupos / mata / total`) por aba de bolão (mantém `BOLAO_BY_USER`).

`computeRanking` atual (grupos puro) permanece para a tela de grupos; o combinado
é aditivo.

## 7. `/ver` e navegação

- `ver/page.tsx`: além dos grupos, render **read-only** do bracket do usuário
  (quando `row.mata` existe), reusando o layout por fase.
- Links pro `/mata-mata` na home e no ranking.

## 8. Testes

- **`src/lib/mata.test.ts`** (novo): interseção por fase; 3º lugar exato;
  resultado parcial (só algumas fases preenchidas); pontuação máxima (66);
  oficial vazio → 0; agnóstico de seeding.
- **`src/lib/flow.integration.test.ts`** (ressalva [média]): atualizar o mock do
  servidor pra devolver `chaveamento: {}` (ou `{seeding:{},resultados:{}}`) e os
  campos `mata`/`enviadoMataEm` nas rows, **antes** de rodar os testes novos —
  senão a mudança de tipo de `State` gera falsos positivos.

## 9. Itens abertos / riscos

1. **Pares oficiais dos 16-avos + alocação dos 8 terceiros** — transcrever do
   bracket oficial FIFA 2026 (fonte a verificar) na implementação. Até lá,
   `bracket.ts` usa rótulos de posição e deixa `T1..T8` vagos.
2. **Compatibilidade da planilha já implantada** — leituras tolerantes a colunas
   ausentes; `setup()` idempotente.
3. **Gate Next 16** (ressalva [baixa]/AGENTS.md) — ler `node_modules/next/dist/docs/`
   antes de qualquer edição. O reviewer já checou as rotas planejadas (todas
   `"use client"`, sem server functions) e não achou incompatibilidade com
   `output: "export"`; cumprir o gate formalmente mesmo assim.

## 10. Ordem de implementação (detalhada no writing-plans)

1. `data/bracket.ts` — estrutura + placeholders (T1..T8 vagos).
2. `lib/mata.ts` + `lib/mata.test.ts` — tipos + `scoreMata` (TDD, pura).
3. `config.ts` — `MATA_FASE`.
4. `api.ts` — tipos `State`/`PalpiteRow` + `saveMata` + `getState` tolerante.
5. `google-apps-script/Codigo.gs` — colunas, aba `chaveamento`, `saveMata`, `setup` idempotente; nota de redeploy no README.
6. `app/mata-mata/` — `page.tsx` + `BracketBoard.tsx` (stepper, 3 estados).
7. `ranking.ts` (`computeCombined`) + `ranking/page.tsx` (breakdown).
8. `ver/page.tsx` (read-only do bracket) + links na home/ranking.
9. Atualizar mock do `flow.integration.test.ts` + rodar toda a suíte.
