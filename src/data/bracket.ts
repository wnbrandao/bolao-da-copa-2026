// Estrutura ESTÁTICA do mata-mata da Copa 2026. TUDO por SLOT (posição no
// bracket), nunca por sigla — as seleções entram via seeding (lib/mata Chaveamento).
//
// 32 slots-fonte: 1A..1L (1º de grupo, 12) + 2A..2L (2º, 12) + T1..T8 (8 melhores
// 3os). Os T1..T8 só se resolvem (qual grupo) no fim da fase de grupos, via seeding
// oficial — NÃO hardcodar grupo aqui.
//
// FONTE: chaveamento oficial FIFA 2026 (Anexo C / Wikipedia "2026 FIFA World Cup
// knockout stage"). Os 16-avos (R32) e as oitavas (R16, cruzamento oficial — NÃO são
// pares consecutivos) estão fiéis ao oficial. Quartas = pares consecutivos das oitavas;
// semis = as duas quartas da MESMA metade do bracket (ver buildBracket). Final/3º saem
// daí. Confere com o bracket oficial (cada metade só cruza com a outra na final).

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

// Rótulo de cada slot dos 8 melhores 3os = grupos de onde aquele 3º pode vir
// (conjunto fixo da tabela oficial). T1..T8 estão nos jogos 74,77,79,80,81,82,85,87.
const THIRD_LABEL: Record<string, string> = {
  T1: "3º [A/B/C/D/F]", // jogo 74, contra 1E
  T2: "3º [C/D/F/G/H]", // jogo 77, contra 1I
  T3: "3º [C/E/F/H/I]", // jogo 79, contra 1A
  T4: "3º [E/H/I/J/K]", // jogo 80, contra 1L
  T5: "3º [B/E/F/I/J]", // jogo 81, contra 1D
  T6: "3º [A/E/H/I/J]", // jogo 82, contra 1G
  T7: "3º [E/F/G/I/J]", // jogo 85, contra 1B
  T8: "3º [D/E/I/J/L]", // jogo 87, contra 1K
};

// Rótulo legível (placeholder enquanto não há seeding).
export const SOURCE_LABEL: Record<SourceId, string> = (() => {
  const m: Record<string, string> = {};
  GRUPOS.forEach((g) => {
    m[`1${g}`] = `1º ${g}`;
    m[`2${g}`] = `2º ${g}`;
  });
  for (let i = 1; i <= 8; i++) m[`T${i}`] = THIRD_LABEL[`T${i}`];
  return m;
})();

// === 16-avos (jogos 73–88) — pares OFICIAIS ===
const R32_PAIRINGS: [SourceId, SourceId][] = [
  ["2A", "2B"], // M32_1  (73)
  ["1E", "T1"], // M32_2  (74) 1E vs 3º[A/B/C/D/F]
  ["1F", "2C"], // M32_3  (75)
  ["1C", "2F"], // M32_4  (76)
  ["1I", "T2"], // M32_5  (77) 1I vs 3º[C/D/F/G/H]
  ["2E", "2I"], // M32_6  (78)
  ["1A", "T3"], // M32_7  (79) 1A vs 3º[C/E/F/H/I]
  ["1L", "T4"], // M32_8  (80) 1L vs 3º[E/H/I/J/K]
  ["1D", "T5"], // M32_9  (81) 1D vs 3º[B/E/F/I/J]
  ["1G", "T6"], // M32_10 (82) 1G vs 3º[A/E/H/I/J]
  ["2K", "2L"], // M32_11 (83)
  ["1H", "2J"], // M32_12 (84)
  ["1B", "T7"], // M32_13 (85) 1B vs 3º[E/F/G/I/J]
  ["1J", "2H"], // M32_14 (86)
  ["1K", "T8"], // M32_15 (87) 1K vs 3º[D/E/I/J/L]
  ["2D", "2G"], // M32_16 (88)
];

// === Oitavas (jogos 89–96) — cruzamento OFICIAL (não são pares consecutivos) ===
const R16_FEEDERS: [string, string][] = [
  ["M32_2", "M32_5"], // M16_1 (89)
  ["M32_1", "M32_3"], // M16_2 (90)
  ["M32_4", "M32_6"], // M16_3 (91)
  ["M32_7", "M32_8"], // M16_4 (92)
  ["M32_11", "M32_12"], // M16_5 (93)
  ["M32_9", "M32_10"], // M16_6 (94)
  ["M32_14", "M32_16"], // M16_7 (95)
  ["M32_13", "M32_15"], // M16_8 (96)
];

function buildBracket(): Record<string, Match> {
  const b: Record<string, Match> = {};
  R32_PAIRINGS.forEach(([a, c], i) => {
    const id = `M32_${i + 1}`;
    b[id] = { id, fase: "M32", a: { kind: "source", source: a }, b: { kind: "source", source: c } };
  });
  R16_FEEDERS.forEach(([x, y], i) => {
    const id = `M16_${i + 1}`;
    b[id] = { id, fase: "M16", a: { kind: "winner", match: x }, b: { kind: "winner", match: y } };
  });
  const consec = (fase: Fase, n: number, prev: string, prefix: string) => {
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
  consec("M8", 4, "M16", "M8");
  // Semis pelo bracket OFICIAL: as duas quartas da MESMA metade se enfrentam.
  // A ordem das oitavas intercala os lados (M16_1,2=esq; 3,4=dir; 5,6=esq; 7,8=dir),
  // então as quartas ficam M8_1=esq, M8_2=dir, M8_3=esq, M8_4=dir. Logo:
  //   semi esquerda = M8_1 × M8_3   |   semi direita = M8_2 × M8_4
  // (consec pareava M8_1×M8_2 = cruzava as metades — errado.)
  b["M4_1"] = {
    id: "M4_1",
    fase: "M4",
    a: { kind: "winner", match: "M8_1" },
    b: { kind: "winner", match: "M8_3" },
  };
  b["M4_2"] = {
    id: "M4_2",
    fase: "M4",
    a: { kind: "winner", match: "M8_2" },
    b: { kind: "winner", match: "M8_4" },
  };
  consec("M2", 1, "M4", "M2");
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
