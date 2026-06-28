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

// Grupo "apurado" = tem os 4 colocados preenchidos (resultado final do grupo).
export function isGrupoApurado(ordem: string[] | undefined): boolean {
  return Array.isArray(ordem) && ordem.length === 4;
}

// Só os grupos já apurados (4 siglas). Base do ranking PARCIAL da fase de grupos:
// pontua os grupos que já fecharam e ignora os que ainda não saíram.
export function gabaritoApurado(gabarito: Gabarito): Gabarito {
  const out: Gabarito = {};
  for (const grupo of Object.keys(gabarito)) {
    if (isGrupoApurado(gabarito[grupo])) out[grupo] = gabarito[grupo];
  }
  return out;
}

// Quantos grupos já têm resultado final (0..12).
export function contaGruposApurados(gabarito: Gabarito): number {
  return Object.keys(gabaritoApurado(gabarito)).length;
}

// Gabarito completo = os 12 grupos apurados (cada um com 4 siglas).
export function isGabaritoCompleto(gabarito: Gabarito): boolean {
  return contaGruposApurados(gabarito) === TOTAL_GROUPS;
}
