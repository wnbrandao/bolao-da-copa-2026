import { describe, it, expect } from "vitest";
import {
  computeRanking,
  computeCombined,
  consolidatePalpites,
  type PalpiteRow,
} from "@/lib/ranking";
import type { Gabarito } from "@/lib/scoring";
import type { Chaveamento } from "@/lib/mata";

const CHAVE_VAZIO: Chaveamento = { seeding: {}, resultados: {} };

// 2 participantes: ana acerta o grupo A inteiro; bob inverte o A.
const palpites: PalpiteRow[] = [
  {
    userId: "ana",
    nome: "Ana",
    enviadoEm: "2026-06-08",
    palpite: { MEX: 1, RSA: 2, KOR: 3, CZE: 4, CAN: 1, BIH: 2, QAT: 3, SUI: 4 },
  },
  {
    userId: "bob",
    nome: "Bob",
    enviadoEm: "2026-06-08",
    palpite: { MEX: 4, RSA: 3, KOR: 2, CZE: 1, CAN: 1, BIH: 2, QAT: 3, SUI: 4 },
  },
];

describe("computeRanking (parcial, grupo a grupo)", () => {
  it("null enquanto nenhum grupo foi apurado", () => {
    expect(computeRanking(palpites, {})).toBeNull();
    expect(computeRanking(palpites, { A: ["MEX", "RSA"] })).toBeNull(); // grupo incompleto
  });

  it("pontua só o grupo já apurado", () => {
    const gabarito: Gabarito = { A: ["MEX", "RSA", "KOR", "CZE"] };
    const rk = computeRanking(palpites, gabarito)!;
    expect(rk).not.toBeNull();
    expect(rk[0]).toMatchObject({ userId: "ana", pontos: 12 }); // A inteiro
    expect(rk[1]).toMatchObject({ userId: "bob", pontos: 0 }); // A invertido
  });

  it("soma conforme mais grupos fecham", () => {
    const gabarito: Gabarito = {
      A: ["MEX", "RSA", "KOR", "CZE"],
      B: ["CAN", "BIH", "QAT", "SUI"],
    };
    const rk = computeRanking(palpites, gabarito)!;
    // ambos acertaram o B inteiro (+12)
    expect(rk.find((r) => r.userId === "ana")!.pontos).toBe(24);
    expect(rk.find((r) => r.userId === "bob")!.pontos).toBe(12);
  });
});

describe("computeCombined com gabarito parcial", () => {
  it("a coluna de grupos reflete só os grupos apurados", () => {
    const gabarito: Gabarito = { A: ["MEX", "RSA", "KOR", "CZE"] };
    const comb = computeCombined(palpites, gabarito, CHAVE_VAZIO);
    expect(comb.find((c) => c.userId === "ana")!.grupos).toBe(12);
    expect(comb.find((c) => c.userId === "bob")!.grupos).toBe(0);
  });

  it("sem nenhum grupo apurado, grupos = 0 (não trava)", () => {
    const comb = computeCombined(palpites, {}, CHAVE_VAZIO);
    expect(comb.every((c) => c.grupos === 0)).toBe(true);
    expect(comb.length).toBe(2);
  });
});

describe("consolidatePalpites", () => {
  it("une grupos e mata enviados por UUIDs diferentes do mesmo participante", () => {
    const records: PalpiteRow[] = [
      {
        userId: "uuid-grupos",
        nome: "André Luyde",
        enviadoEm: "2026-06-08",
        palpite: { MEX: 1, RSA: 2, KOR: 3, CZE: 4 },
      },
      {
        userId: "uuid-mata-novo",
        nome: "andre luyde",
        enviadoEm: "",
        palpite: {},
        mata: { M32_1: "1A" },
        enviadoMataEm: "2026-06-20",
      },
    ];
    const chaveamento: Chaveamento = {
      seeding: {},
      resultados: { M32_1: "1A" },
    };

    expect(consolidatePalpites(records)).toEqual([
      expect.objectContaining({
        userId: "uuid-grupos",
        nome: "André Luyde",
        enviadoEm: "2026-06-08",
        enviadoMataEm: "2026-06-20",
      }),
    ]);

    expect(computeCombined(records, { A: ["MEX", "RSA", "KOR", "CZE"] }, chaveamento)).toEqual([
      { userId: "uuid-grupos", nome: "André Luyde", grupos: 12, mata: 1, total: 13 },
    ]);
  });

  it("não une homônimos que enviaram palpites de grupos", () => {
    const records: PalpiteRow[] = [
      { userId: "ana-1", nome: "Ana", enviadoEm: "2026-06-08", palpite: {} },
      { userId: "ana-2", nome: "Ana", enviadoEm: "2026-06-09", palpite: {} },
      {
        userId: "ana-mata",
        nome: "ana",
        enviadoEm: "",
        palpite: {},
        mata: { M32_1: "1A" },
        enviadoMataEm: "2026-06-20",
      },
    ];

    expect(consolidatePalpites(records)).toHaveLength(3);
  });
});
