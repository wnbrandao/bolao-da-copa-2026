import { describe, it, expect } from "vitest";
import {
  score,
  gabaritoToPositions,
  gabaritoApurado,
  contaGruposApurados,
  isGrupoApurado,
  isGabaritoCompleto,
  POINTS_EXACT,
  type Gabarito,
} from "@/lib/scoring";

const gabarito: Gabarito = { A: ["MEX", "RSA", "KOR", "CZE"] }; // MEX 1º ... CZE 4º
const official = gabaritoToPositions(gabarito); // { MEX:1, RSA:2, KOR:3, CZE:4 }

describe("gabaritoToPositions", () => {
  it("array vira posição (índice + 1)", () => {
    expect(official).toEqual({ MEX: 1, RSA: 2, KOR: 3, CZE: 4 });
  });
});

describe("score (posição exata = +3)", () => {
  it("sem palpite => 0", () => {
    expect(score({}, official)).toBe(0);
  });

  it("grupo inteiro certo => 4 * 3 = 12", () => {
    expect(score({ MEX: 1, RSA: 2, KOR: 3, CZE: 4 }, official)).toBe(12);
  });

  it("ordem toda errada => 0", () => {
    expect(score({ MEX: 4, RSA: 3, KOR: 2, CZE: 1 }, official)).toBe(0);
  });

  it("2 de 4 na posição certa => 6", () => {
    expect(score({ MEX: 1, RSA: 2, KOR: 4, CZE: 3 }, official)).toBe(6);
  });

  it("sigla fora do gabarito é ignorada", () => {
    expect(score({ XXX: 1 }, official)).toBe(0);
  });

  it("posição certa só conta com a sigla certa", () => {
    expect(score({ RSA: 1 }, official)).toBe(0); // RSA chutado em 1º, oficial é 2º
  });

  it("POINTS_EXACT é 3", () => {
    expect(POINTS_EXACT).toBe(3);
  });
});

describe("isGabaritoCompleto", () => {
  it("12 grupos x 4 siglas => true", () => {
    const full: Gabarito = {};
    "ABCDEFGHIJKL".split("").forEach((g) => {
      full[g] = ["a", "b", "c", "d"];
    });
    expect(isGabaritoCompleto(full)).toBe(true);
  });

  it("incompleto => false", () => {
    expect(isGabaritoCompleto({ A: ["a", "b"] })).toBe(false);
  });

  it("grupo com menos de 4 => false", () => {
    const quase: Gabarito = {};
    "ABCDEFGHIJKL".split("").forEach((g) => {
      quase[g] = ["a", "b", "c", "d"];
    });
    quase.L = ["a", "b", "c"];
    expect(isGabaritoCompleto(quase)).toBe(false);
  });
});

describe("apuração parcial (grupo a grupo)", () => {
  it("isGrupoApurado: só com as 4 siglas", () => {
    expect(isGrupoApurado(["a", "b", "c", "d"])).toBe(true);
    expect(isGrupoApurado(["a", "b", "c"])).toBe(false);
    expect(isGrupoApurado([])).toBe(false);
    expect(isGrupoApurado(undefined)).toBe(false);
  });

  it("gabaritoApurado fica só com os grupos completos", () => {
    const parcial: Gabarito = {
      A: ["MEX", "RSA", "KOR", "CZE"],
      B: ["CAN", "BIH"], // ainda não fechou
      C: ["BRA", "MAR", "HAI", "SCO"],
    };
    expect(gabaritoApurado(parcial)).toEqual({
      A: ["MEX", "RSA", "KOR", "CZE"],
      C: ["BRA", "MAR", "HAI", "SCO"],
    });
  });

  it("contaGruposApurados conta só os fechados", () => {
    expect(contaGruposApurados({})).toBe(0);
    expect(
      contaGruposApurados({ A: ["a", "b", "c", "d"], B: ["a", "b"] }),
    ).toBe(1);
  });

  it("score parcial: pontua só os grupos apurados", () => {
    const gabarito: Gabarito = {
      A: ["MEX", "RSA", "KOR", "CZE"],
      B: ["CAN", "BIH"], // não apurado => ignorado
    };
    const official = gabaritoToPositions(gabaritoApurado(gabarito));
    // palpite acerta A inteiro (12) e chutou B, que não pontua ainda.
    const palpite = { MEX: 1, RSA: 2, KOR: 3, CZE: 4, CAN: 1, BIH: 2 };
    expect(score(palpite, official)).toBe(12);
  });
});
