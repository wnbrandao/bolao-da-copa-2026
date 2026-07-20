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
  podio,
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

  it("oitavas dependem do vencedor do confronto-filho (null sem palpite)", () => {
    const [a, b] = competitors("M16_1", {});
    expect(a).toBeNull();
    expect(b).toBeNull();
    const childA = BRACKET["M16_1"].a;
    const m = childA.kind === "winner" ? childA.match : "M32_1";
    const [c] = competitors("M16_1", { [m]: "1E" });
    expect(c).toBe("1E");
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
  it("limpa pick a jusante quando o vencedor do confronto-filho muda", () => {
    // M16_1 depende de dois confrontos de 16-avos (cruzamento oficial).
    const childA = BRACKET["M16_1"].a;
    const m32 = childA.kind === "winner" ? childA.match : "M32_1";
    const [a, b] = competitors(m32, {});
    const p: MataPalpite = { [m32]: a as string, M16_1: a as string };
    const limpo = sanitize({ ...p, [m32]: b as string });
    expect(limpo[m32]).toBe(b);
    expect(limpo.M16_1).toBeUndefined();
  });

  it("remove pick de 16-avos que não é mais um slot-fonte do confronto (e cascata)", () => {
    const limpo = sanitize({ M32_1: "ZZ", M16_2: "ZZ" }); // M16_2 depende de M32_1
    expect(limpo.M32_1).toBeUndefined();
    expect(limpo.M16_2).toBeUndefined();
  });
});

describe("estrutura do bracket (oficial)", () => {
  it("os 16-avos cobrem os 32 slots-fonte exatamente uma vez", () => {
    const used: string[] = [];
    for (const id of MATCHES_BY_FASE.M32) {
      for (const side of [BRACKET[id].a, BRACKET[id].b]) {
        if (side.kind === "source") used.push(side.source);
      }
    }
    expect(used.length).toBe(32);
    expect(new Set(used)).toEqual(new Set(SOURCES));
  });

  it("todo lado winner/loser referencia um confronto existente", () => {
    for (const id of Object.keys(BRACKET)) {
      for (const side of [BRACKET[id].a, BRACKET[id].b]) {
        if (side.kind !== "source") expect(BRACKET[side.match]).toBeDefined();
      }
    }
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

describe("podio", () => {
  it("null enquanto a final ou a disputa de 3º não têm resultado", () => {
    expect(podio(vazio)).toBeNull();
    expect(podio({ seeding: {}, resultados: { M2_1: "1H" } })).toBeNull(); // falta 3º
    expect(podio({ seeding: {}, resultados: { M3P_1: "1L" } })).toBeNull(); // falta final
  });

  it("deriva campeão/vice/3º/4º a partir de um bracket completo", () => {
    const full = fullFrom({}); // 1º competidor resolvido vence sempre
    const p = podio({ seeding: {}, resultados: full });
    expect(p).not.toBeNull();
    if (!p) return;
    // campeão = vencedor da final; vice = o outro finalista.
    expect(p.campeao).toBe(full.M2_1);
    const [f1, f2] = competitors("M2_1", full);
    expect(p.vice).toBe(p.campeao === f1 ? f2 : f1);
    expect(p.terceiro).toBe(full.M3P_1);
  });
});
