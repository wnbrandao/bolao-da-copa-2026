import { describe, it, expect } from "vitest";
import { GABARITO_OFICIAL, SEED_TERCEIROS, RESULTADOS_OFICIAIS } from "@/data/gabarito";
import { BRACKET } from "@/data/bracket";
import { TEAM_BY_CODE } from "@/data/teams";
import { isGabaritoCompleto } from "@/lib/scoring";
import {
  competitors,
  isMataCompleto,
  effectiveSeeding,
  scoreMata,
  podio,
  type Chaveamento,
} from "@/lib/mata";

// Chaveamento oficial completo = seeding dos terceiros + resultados embutidos.
const OFICIAL: Chaveamento = { seeding: SEED_TERCEIROS, resultados: RESULTADOS_OFICIAIS };

describe("gabarito oficial embutido (grupos)", () => {
  it("os 12 grupos estão completos (4 siglas cada)", () => {
    expect(isGabaritoCompleto(GABARITO_OFICIAL)).toBe(true);
  });

  it("toda sigla do gabarito existe em TEAM_BY_CODE", () => {
    for (const grupo of Object.keys(GABARITO_OFICIAL)) {
      for (const code of GABARITO_OFICIAL[grupo]) {
        expect(TEAM_BY_CODE[code], `sigla ${code}`).toBeTruthy();
      }
    }
  });
});

describe("resultados oficiais embutidos (mata-mata)", () => {
  it("cobre TODOS os confrontos do bracket (isMataCompleto)", () => {
    expect(isMataCompleto(RESULTADOS_OFICIAIS)).toBe(true);
  });

  it("todo slot vencedor é competidor VÁLIDO do seu confronto", () => {
    for (const id of Object.keys(BRACKET)) {
      const vencedor = RESULTADOS_OFICIAIS[id];
      const [a, b] = competitors(id, RESULTADOS_OFICIAIS);
      expect(
        vencedor === a || vencedor === b,
        `${id}: vencedor ${vencedor} não é competidor [${a}, ${b}]`,
      ).toBe(true);
    }
  });

  it("o bracket oficial pontuado contra si mesmo dá o máximo (66)", () => {
    // 16×1 (16-avos) + 8×2 (oitavas) + 4×3 (quartas) + 2×5 (semis) + 1×8 (final) + 4 (3º)
    expect(scoreMata(RESULTADOS_OFICIAIS, OFICIAL)).toBe(66);
  });
});

describe("pódio oficial", () => {
  const p = podio(OFICIAL);
  const seeding = effectiveSeeding(GABARITO_OFICIAL, OFICIAL);

  it("resolve campeão, vice, 3º e 4º", () => {
    expect(p).not.toBeNull();
  });

  it("campeã: Espanha; vice: Argentina; 3º: Inglaterra; 4º: França", () => {
    expect(p).not.toBeNull();
    if (!p) return;
    expect(seeding[p.campeao]).toBe("ESP");
    expect(seeding[p.vice]).toBe("ARG");
    expect(seeding[p.terceiro]).toBe("ENG");
    expect(seeding[p.quarto]).toBe("FRA");
  });
});
