import { describe, it, expect } from "vitest";
import { MATCHES_BY_FASE, FASES, BRACKET, SOURCES } from "@/data/bracket";
import {
  scoreMata,
  competitors,
  sanitize,
  isMataCompleto,
  fullBracket,
  seedFromGabarito,
  effectiveSeeding,
  isSeedingComplete,
  resolveMataFase,
  PONTOS_MATA,
  type Chaveamento,
  type MataPalpite,
} from "@/lib/mata";

const vazio: Chaveamento = { seeding: {}, resultados: {} };

// helper local: a partir de vencedores parciais, completa a cascata oficial de
// forma consistente (escolhe o 1º competidor resolvido quando vago).
function fullFrom(seed: MataPalpite): MataPalpite {
  const out: MataPalpite = { ...seed };
  for (const fase of FASES) {
    for (const id of MATCHES_BY_FASE[fase]) {
      if (out[id]) continue;
      const [a] = competitors(id, out);
      if (a) out[id] = a;
    }
  }
  return sanitize(out);
}

describe("competitors", () => {
  it("16-avos: os dois lados são slots-fonte", () => {
    const [a, b] = competitors("M32_1", {});
    expect(typeof a).toBe("string");
    expect(typeof b).toBe("string");
  });

  it("oitavas dependem do palpite dos 16-avos (null sem palpite)", () => {
    const [a, b] = competitors("M16_1", {});
    expect(a).toBeNull();
    expect(b).toBeNull();
    const [c] = competitors("M16_1", { M32_1: "1A" });
    expect(c).toBe("1A");
  });
});

describe("fullBracket / isMataCompleto", () => {
  it("fullBracket preenche os 32 confrontos de forma consistente", () => {
    const p = fullBracket();
    expect(Object.keys(p).length).toBe(Object.keys(BRACKET).length);
    expect(isMataCompleto(p)).toBe(true);
    for (const id of Object.keys(BRACKET)) {
      const [a, b] = competitors(id, p);
      expect([a, b]).toContain(p[id]);
    }
  });

  it("palpite vazio não está completo", () => {
    expect(isMataCompleto({})).toBe(false);
  });
});

describe("scoreMata", () => {
  it("oficial vazio => 0", () => {
    expect(scoreMata(fullBracket(), vazio)).toBe(0);
  });

  it("palpite == oficial completo => máximo 66", () => {
    const p = fullBracket();
    expect(scoreMata(p, { seeding: {}, resultados: p })).toBe(66);
  });

  it("parcial: só 16-avos oficiais pontuam só as oitavas (16)", () => {
    const p = fullBracket();
    const resultados: MataPalpite = {};
    for (const id of MATCHES_BY_FASE.M32) resultados[id] = p[id];
    expect(scoreMata(p, { seeding: {}, resultados })).toBe(16 * PONTOS_MATA.oitavas);
  });

  it("errar 1 confronto de 16-avos reduz a pontuação", () => {
    const p = fullBracket();
    const resultados: MataPalpite = { ...p };
    const [a, b] = competitors("M32_1", p);
    resultados.M32_1 = p.M32_1 === a ? (b as string) : (a as string);
    const oficial: Chaveamento = { seeding: {}, resultados: fullFrom(resultados) };
    expect(scoreMata(p, oficial)).toBeLessThan(66);
    expect(scoreMata(p, oficial)).toBeGreaterThan(0);
  });

  it("3º lugar exato soma terceiro; errado não soma", () => {
    const p = fullBracket();
    const certo: Chaveamento = { seeding: {}, resultados: { M3P_1: p.M3P_1 } };
    expect(scoreMata(p, certo)).toBe(PONTOS_MATA.terceiro);
    const outro = competitors("M3P_1", p).find((s) => s && s !== p.M3P_1) ?? "ZZ";
    const errado: Chaveamento = { seeding: {}, resultados: { M3P_1: outro as string } };
    expect(scoreMata(p, errado)).toBe(0);
  });
});

describe("sanitize", () => {
  it("limpa picks a jusante inválidos ao trocar um vencedor", () => {
    const [a, b] = competitors("M32_1", {});
    const p: MataPalpite = { M32_1: a as string, M16_1: a as string };
    const outro = b as string;
    const limpo = sanitize({ ...p, M32_1: outro });
    expect(limpo.M32_1).toBe(outro);
    expect(limpo.M16_1).toBeUndefined();
  });
});

describe("seeding helpers", () => {
  it("seedFromGabarito mapeia 1º/2º de cada grupo pros slots 1X/2X", () => {
    const s = seedFromGabarito({ A: ["MEX", "RSA", "KOR", "CZE"] });
    expect(s["1A"]).toBe("MEX");
    expect(s["2A"]).toBe("RSA");
    expect(s["3A"]).toBeUndefined();
  });

  it("effectiveSeeding combina gabarito (1X/2X) + chaveamento (T1..T8)", () => {
    const s = effectiveSeeding({ A: ["MEX", "RSA", "KOR", "CZE"] }, { seeding: { T1: "BRA" }, resultados: {} });
    expect(s["1A"]).toBe("MEX");
    expect(s["T1"]).toBe("BRA");
  });

  it("chaveamento.seeding tem prioridade sobre o gabarito", () => {
    const s = effectiveSeeding({ A: ["MEX", "RSA", "KOR", "CZE"] }, { seeding: { "1A": "USA" }, resultados: {} });
    expect(s["1A"]).toBe("USA");
  });

  it("isSeedingComplete só true com os 32 slots", () => {
    expect(isSeedingComplete({})).toBe(false);
    const full: Record<string, string> = {};
    for (const s of SOURCES) full[s] = "XXX";
    expect(isSeedingComplete(full)).toBe(true);
  });
});

describe("resolveMataFase", () => {
  it("auto abre quando o seeding está completo", () => {
    expect(resolveMataFase("auto", false)).toBe("em-breve");
    expect(resolveMataFase("auto", true)).toBe("aberta");
  });
  it("flags manuais sobrepõem o auto", () => {
    expect(resolveMataFase("encerrada", true)).toBe("encerrada");
    expect(resolveMataFase("em-breve", true)).toBe("em-breve");
    expect(resolveMataFase("aberta", false)).toBe("aberta");
  });
});
