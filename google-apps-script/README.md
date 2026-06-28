# Backend no Google Sheets (Apps Script)

O app estático lê/grava os palpites num Google Sheet, via um Apps Script publicado
como **Web App**.

## Setup (uma vez)

1. Crie uma planilha no Google Sheets.
2. **Extensões → Apps Script**, cole o conteúdo de [`Codigo.gs`](./Codigo.gs), salve.
3. Selecione a função **`setup`** e clique **▶ Executar** (autorize). Cria as abas
   `palpites` e `gabarito`.
4. **Implantar → Nova implantação → App da Web**:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Copie a **URL do app da Web** (`.../exec`) e use como `NEXT_PUBLIC_API_URL`.

> Ao alterar o script, use **Gerenciar implantações → editar → Nova versão** pra
> manter a mesma URL.

## Como os dados ficam

- Aba **`palpites`**: o app preenche (`userId | nome | enviadoEm | palpite`). O
  `palpite` é um JSON `{ "MEX": 1, "CRO": 2, ... }` (sigla → posição 1..4).
- Aba **`gabarito`**: **você** edita quando os jogos acabarem. Em cada linha do
  grupo, ponha as 4 siglas na ordem final (1º → 4º). O ranking calcula sozinho,
  **parcial**: cada grupo começa a pontuar assim que tiver as 4 siglas — não
  precisa preencher os 12 de uma vez.

## Siglas por grupo (pra preencher o gabarito)

| Grupo | Seleções (siglas) |
|---|---|
| A | MEX, RSA, KOR, CZE |
| B | CAN, BIH, QAT, SUI |
| C | BRA, MAR, HAI, SCO |
| D | USA, PAR, AUS, TUR |
| E | GER, CUW, CIV, ECU |
| F | NED, JPN, SWE, TUN |
| G | BEL, EGY, IRN, NZL |
| H | ESP, CPV, KSA, URU |
| I | FRA, SEN, IRQ, NOR |
| J | ARG, ALG, AUT, JOR |
| K | POR, COD, UZB, COL |
| L | ENG, CRO, GHA, PAN |

Exemplo de linha no `gabarito`: `A | MEX | CRO | CIV | UZB` (México 1º, etc.).

## Mata-mata (knockout)

A aba `palpites` ganha as colunas **`mata`** (JSON `{ "M32_1":"1A", ... }`) e
**`enviadoMataEm`**. O `setup()` acrescenta sozinho se a planilha já existia com 4
colunas — nenhuma migração manual.

Nova aba **`chaveamento`** (`tipo | id | valor`):

- `seed | T1 | BRA` → diz qual seleção ocupa o slot `T1` (3º colocado). **Só
  precisa preencher os 8 terceiros (`T1`..`T8`)** — os slots `1A`..`2L` (1º/2º de
  cada grupo) saem automático do `gabarito` que você já preenche.
- `result | M32_1 | 1A` → diz que o slot `1A` venceu o confronto `M32_1`.
  Preencha as linhas `result` conforme os jogos do mata-mata acontecem; o ranking
  do mata pontua sozinho, parcial.

**Fluxo pra abrir o mata-mata:** preencha o `gabarito` (1º→4º de cada grupo) e as 8
linhas `seed` dos terceiros. Quando os 32 slots tiverem seleção, o bracket **abre
sozinho** pra galera preencher (flag `MATA_FASE="auto"` no app). Para travar quando
o mata começar, mude `MATA_FASE` para `"encerrada"` em `src/lib/config.ts`.

### IDs dos confrontos (pra preencher os `result`)

`M32_1..M32_16` (16-avos) → `M16_1..M16_8` (oitavas) → `M8_1..M8_4` (quartas) →
`M4_1..M4_2` (semis) → `M2_1` (final) → `M3P_1` (3º lugar). O `valor` é sempre o
**slot vencedor** (`1A`, `2B`, `T3`…).

> **Redeploy:** ao alterar `Codigo.gs`, use **Gerenciar implantações → Editar →
> Nova versão** (mantém a URL `/exec`). NÃO crie nova implantação.
