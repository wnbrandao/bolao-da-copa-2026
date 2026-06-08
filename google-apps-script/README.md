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
  grupo, ponha as 4 siglas na ordem final (1º → 4º). O ranking calcula sozinho.

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
