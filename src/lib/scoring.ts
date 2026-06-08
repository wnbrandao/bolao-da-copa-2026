// Lógica de pontuação — funções PURAS (sem rede), testáveis isoladas.
// Identidade da seleção = `code` (sigla FIFA). Posição = 1..4 no grupo.
// Regra: +3 por seleção cuja posição no palpite bate com a oficial.

// Palpite: { [sigla]: posição }. Ex.: { MEX: 1, RSA: 2, ... }
export type Palpite = Record<string, number>;
// Gabarito: { [grupo]: [sigla1, sigla2, sigla3, sigla4] } na ordem final.
export type Gabarito = Record<string, string[]>;

export const POINTS_EXACT = 3;
export const TOTAL_GROUPS = 12;

// Achata o gabarito (ordem por grupo) em { [sigla]: posição }, posição = índice+1.
export function gabaritoToPositions(gabarito: Gabarito): Record<string, number> {
  const out: Record<string, number> = {};
  for (const grupo of Object.keys(gabarito)) {
    gabarito[grupo].forEach((code, i) => {
      out[code] = i + 1;
    });
  }
  return out;
}

// +POINTS_EXACT para cada sigla cuja posição no palpite == posição oficial.
export function score(palpite: Palpite, official: Record<string, number>): number {
  let pts = 0;
  for (const code of Object.keys(palpite)) {
    if (official[code] === palpite[code]) pts += POINTS_EXACT;
  }
  return pts;
}

// Gabarito completo = 12 grupos, cada um com 4 siglas.
export function isGabaritoCompleto(gabarito: Gabarito): boolean {
  const grupos = Object.keys(gabarito);
  return grupos.length === TOTAL_GROUPS && grupos.every((g) => gabarito[g].length === 4);
}
