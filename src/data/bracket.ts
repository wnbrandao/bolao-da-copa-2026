// Estrutura ESTÁTICA do mata-mata da Copa 2026. TUDO por SLOT (posição no
// bracket), nunca por sigla — as seleções entram via seeding (lib/mata Chaveamento).
//
// 32 slots-fonte: 1A..1L (1º de grupo, 12) + 2A..2L (2º, 12) + T1..T8 (8 melhores
// 3os). Os T1..T8 só se resolvem (qual grupo) no fim da fase de grupos, via seeding
// oficial — NÃO hardcodar grupo aqui.

export type SourceId = string; // "1A" | "2B" | "T1" ...
export type Fase = "M32" | "M16" | "M8" | "M4" | "M2" | "M3P";

// Um lado de um confronto: um slot-fonte (16-avos), o VENCEDOR ou o PERDEDOR
// (só 3º lugar) de um confronto anterior.
export type Side =
  | { kind: "source"; source: SourceId }
  | { kind: "winner"; match: string }
  | { kind: "loser"; match: string };

export type Match = { id: string; fase: Fase; a: Side; b: Side };

export const FASES = ["M32", "M16", "M8", "M4", "M2", "M3P"] as const;

export const FASE_NOME: Record<Fase, string> = {
  M32: "16-avos",
  M16: "Oitavas",
  M8: "Quartas",
  M4: "Semifinais",
  M2: "Final",
  M3P: "Disputa de 3º",
};

// Os 32 slots-fonte na ordem canônica.
const GRUPOS = "ABCDEFGHIJKL".split("");
export const SOURCES: SourceId[] = [
  ...GRUPOS.map((g) => `1${g}`),
  ...GRUPOS.map((g) => `2${g}`),
  ...Array.from({ length: 8 }, (_, i) => `T${i + 1}`),
];

// Rótulo legível (placeholder enquanto não há seeding).
export const SOURCE_LABEL: Record<SourceId, string> = (() => {
  const m: Record<string, string> = {};
  GRUPOS.forEach((g) => {
    m[`1${g}`] = `1º ${g}`;
    m[`2${g}`] = `2º ${g}`;
  });
  for (let i = 1; i <= 8; i++) m[`T${i}`] = `3º (${i})`;
  return m;
})();

// === Pares dos 16-avos ===
// PROVISÓRIO E ESTRUTURALMENTE COMPLETO: cobre os 32 slots exatamente uma vez.
// Os PARES EXATOS (qual 1º enfrenta qual 2º/3º) e a alocação dos T1..T8 devem ser
// CONFERIDOS contra o bracket oficial da FIFA 2026 antes de abrir as apostas. A
// pontuação e a UI NÃO dependem do pareamento — só a fidelidade do preview.
const R32_PAIRINGS: [SourceId, SourceId][] = [
  ["1A", "2B"], ["1C", "2D"], ["1E", "2F"], ["1G", "2H"],
  ["1I", "2J"], ["1K", "2L"], ["1B", "T1"], ["1D", "T2"],
  ["1F", "T3"], ["1H", "T4"], ["1J", "T5"], ["1L", "T6"],
  ["2A", "T7"], ["2C", "T8"], ["2E", "2G"], ["2I", "2K"],
];

function buildBracket(): Record<string, Match> {
  const b: Record<string, Match> = {};
  R32_PAIRINGS.forEach(([a, c], i) => {
    const id = `M32_${i + 1}`;
    b[id] = { id, fase: "M32", a: { kind: "source", source: a }, b: { kind: "source", source: c } };
  });
  const round = (fase: Fase, n: number, prev: string, prefix: string) => {
    for (let i = 0; i < n; i++) {
      const id = `${prefix}_${i + 1}`;
      b[id] = {
        id,
        fase,
        a: { kind: "winner", match: `${prev}_${2 * i + 1}` },
        b: { kind: "winner", match: `${prev}_${2 * i + 2}` },
      };
    }
  };
  round("M16", 8, "M32", "M16");
  round("M8", 4, "M16", "M8");
  round("M4", 2, "M8", "M4");
  round("M2", 1, "M4", "M2");
  b["M3P_1"] = {
    id: "M3P_1",
    fase: "M3P",
    a: { kind: "loser", match: "M4_1" },
    b: { kind: "loser", match: "M4_2" },
  };
  return b;
}

export const BRACKET: Record<string, Match> = buildBracket();

export const MATCHES_BY_FASE: Record<Fase, string[]> = {
  M32: Array.from({ length: 16 }, (_, i) => `M32_${i + 1}`),
  M16: Array.from({ length: 8 }, (_, i) => `M16_${i + 1}`),
  M8: Array.from({ length: 4 }, (_, i) => `M8_${i + 1}`),
  M4: ["M4_1", "M4_2"],
  M2: ["M2_1"],
  M3P: ["M3P_1"],
};
