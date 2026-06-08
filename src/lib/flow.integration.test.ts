import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";

// NOTA: os casos abaixo são SEQUENCIAIS e compartilham `store` de propósito —
// simulam o fluxo (rascunho → envio → gabarito → ranking). Não rode um caso
// isolado esperando independência.

// ===== Mock fiel ao contrato do Apps Script (in-memory) =====
type Row = { userId: string; nome: string; enviadoEm: string; palpite: Record<string, number> };
const store: { palpites: Row[]; gabarito: Record<string, string[]> } = { palpites: [], gabarito: {} };
let server: http.Server;

function handler(req: http.IncomingMessage, res: http.ServerResponse) {
  res.setHeader("access-control-allow-origin", "*");
  if (req.method === "GET") {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(store));
    return;
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const b = JSON.parse(body || "{}");
    if (b.action === "save") {
      const i = store.palpites.findIndex((p) => p.userId === b.userId);
      const enviadoEm = b.submit
        ? new Date(2026, 5, 8).toISOString()
        : i >= 0
          ? store.palpites[i].enviadoEm
          : "";
      const row: Row = { userId: b.userId, nome: b.nome, enviadoEm, palpite: b.palpite || {} };
      if (i >= 0) store.palpites[i] = row;
      else store.palpites.push(row);
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (b.action === "setGabarito") {
      store.gabarito = b.gabarito;
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    res.end(JSON.stringify({ error: "acao invalida" }));
  });
}

beforeAll(async () => {
  server = http.createServer(handler);
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as AddressInfo).port;
  process.env.NEXT_PUBLIC_API_URL = `http://localhost:${port}`;
  // Garante que config.ts seja (re)avaliado com o env já setado, independente
  // de ordem de execução ou de outro arquivo ter importado o módulo antes.
  vi.resetModules();
});

afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("QA fluxo completo (api + ranking + scoring reais)", () => {
  it("rascunho: savePalpite(submit=false) persiste sem enviadoEm", async () => {
    const { savePalpite, getState } = await import("@/lib/api");
    const r = await savePalpite({
      userId: "u1",
      nome: "QA Tester",
      palpite: { MEX: 1, RSA: 2, KOR: 3, CZE: 4 },
      submit: false,
    });
    expect(r.ok).toBe(true);
    const s = await getState();
    const me = s.palpites.find((p) => p.userId === "u1");
    expect(me?.palpite.MEX).toBe(1);
    expect(me?.enviadoEm).toBe("");
  });

  it("ranking é null enquanto não há gabarito completo", async () => {
    const { getState } = await import("@/lib/api");
    const { computeRanking } = await import("@/lib/ranking");
    const s = await getState();
    expect(computeRanking(s.palpites, s.gabarito)).toBeNull();
  });

  it("envio completo + gabarito batendo => ranking pontua 144", async () => {
    const { savePalpite, getState } = await import("@/lib/api");
    const { computeRanking } = await import("@/lib/ranking");
    const { GROUPS, TEAMS_BY_GROUP } = await import("@/data/teams");

    // Palpite completo (48) na ordem base.
    const palpite: Record<string, number> = {};
    const gabarito: Record<string, string[]> = {};
    for (const g of GROUPS) {
      const codes = TEAMS_BY_GROUP[g].map((t) => t.code);
      codes.forEach((c, i) => (palpite[c] = i + 1));
      gabarito[g] = codes; // gabarito idêntico => tudo certo
    }
    await savePalpite({ userId: "u1", nome: "QA Tester", palpite, submit: true });

    // mock: define o gabarito (admin)
    await fetch(process.env.NEXT_PUBLIC_API_URL as string, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ action: "setGabarito", gabarito }),
    });

    const s = await getState();
    const me = s.palpites.find((p) => p.userId === "u1");
    expect(me?.enviadoEm).toBeTruthy(); // submit marcou enviadoEm

    const rk = computeRanking(s.palpites, s.gabarito);
    expect(rk).not.toBeNull();
    expect(rk!.length).toBe(1);
    expect(rk![0]).toMatchObject({ userId: "u1", nome: "QA Tester", pontos: 144 });
  });

  it("palpite parcialmente errado pontua proporcional", async () => {
    const { savePalpite, getState } = await import("@/lib/api");
    const { computeRanking } = await import("@/lib/ranking");
    const { GROUPS, TEAMS_BY_GROUP } = await import("@/data/teams");

    // user 2: inverte o grupo A (4 erros = -12), resto certo => 132
    const palpite: Record<string, number> = {};
    for (const g of GROUPS) {
      const codes = TEAMS_BY_GROUP[g].map((t) => t.code);
      const ordem = g === "A" ? [...codes].reverse() : codes;
      ordem.forEach((c, i) => (palpite[c] = i + 1));
    }
    await savePalpite({ userId: "u2", nome: "Outro", palpite, submit: true });

    const s = await getState();
    const rk = computeRanking(s.palpites, s.gabarito)!;
    const u2 = rk.find((r) => r.userId === "u2")!;
    expect(u2.pontos).toBe(132); // 44 posições certas * 3
    // ordenação: u1 (144) na frente de u2 (132)
    expect(rk[0].userId).toBe("u1");
  });

  it("rascunho não entra no ranking (sem enviadoEm)", async () => {
    const { savePalpite, getState } = await import("@/lib/api");
    const { computeRanking } = await import("@/lib/ranking");
    await savePalpite({ userId: "u3", nome: "Rascunho", palpite: { MEX: 1 }, submit: false });
    const s = await getState();
    const rk = computeRanking(s.palpites, s.gabarito)!;
    expect(rk.find((r) => r.userId === "u3")).toBeUndefined();
  });
});
