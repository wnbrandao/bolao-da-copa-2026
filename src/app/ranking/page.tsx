"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState } from "@/lib/api";
import Flag from "@/components/Flag";
import { TEAM_BY_CODE } from "@/data/teams";
import { computeCombined, type CombinedEntry, type PalpiteRow } from "@/lib/ranking";
import { contaGruposApurados, TOTAL_GROUPS, type Gabarito } from "@/lib/scoring";
import { effectiveSeeding, podio, type Chaveamento, type Podio } from "@/lib/mata";
import { BOLOES, BOLAO_BY_USER, type Bolao } from "@/data/grupos";

const CHAVE_VAZIO: Chaveamento = { seeding: {}, resultados: {} };

export default function RankingPage() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [palpites, setPalpites] = useState<PalpiteRow[]>([]);
  const [gabarito, setGabarito] = useState<Gabarito>({});
  const [chaveamento, setChaveamento] = useState<Chaveamento>(CHAVE_VAZIO);
  const [bolao, setBolao] = useState<Bolao>(BOLOES[0]);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let alive = true;
    getState()
      .then((s) => {
        if (!alive) return;
        setPalpites(s.palpites);
        setGabarito(s.gabarito);
        setChaveamento(s.chaveamento);
        setPhase("ready");
      })
      .catch((e) => {
        if (!alive) return;
        setErrMsg(e instanceof Error ? e.message : "Falha ao carregar.");
        setPhase("error");
      });
    return () => {
      alive = false;
    };
  }, []);

  // Cada aba mostra só os participantes do bolão selecionado.
  const doBolao = palpites.filter((p) => (BOLAO_BY_USER[p.userId] ?? []).includes(bolao));
  const ranking = computeCombined(doBolao, gabarito, chaveamento);
  const gruposApurados = contaGruposApurados(gabarito);
  const temGrupos = gruposApurados > 0;
  const temMata = Object.keys(chaveamento.resultados).length > 0;
  const podioSlots = podio(chaveamento);
  const seeding = effectiveSeeding(gabarito, chaveamento);

  return (
    <main className="flex-1 flex flex-col px-5 py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
        <Link href="/" className="text-sm text-neutral-400 underline">
          Início
        </Link>
      </header>

      <div className="mb-6 flex gap-2">
        {BOLOES.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBolao(b)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold leading-snug ${
              b === bolao
                ? "bg-emerald-500 text-black"
                : "border border-neutral-800 bg-neutral-900 text-neutral-300"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {phase === "loading" && <p className="text-sm text-neutral-400">Carregando…</p>}

      {phase === "error" && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Não consegui carregar o ranking ({errMsg}).
        </div>
      )}

      {phase === "ready" && (
        <>
          {podioSlots && <PodioBanner podio={podioSlots} seeding={seeding} />}
          {!temGrupos && !temMata && (
            <div className="mb-4 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300">
              O ranking começa a pontuar assim que o primeiro grupo for apurado e/ou o
              mata-mata começar.
            </div>
          )}
          {temGrupos && gruposApurados < TOTAL_GROUPS && (
            <div className="mb-4 rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-xs text-emerald-300">
              Ranking parcial — {gruposApurados}/{TOTAL_GROUPS} grupos apurados. A pontuação
              de grupos cresce conforme os jogos acabam.
            </div>
          )}
          <div className="mb-2 flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider text-neutral-600">
            <span className="w-10 text-right">grupos</span>
            <span className="w-8 text-right">mata</span>
            <span className="w-10 text-right">total</span>
          </div>
          <Tabela ranking={ranking} mostraGrupos={temGrupos} />
        </>
      )}
    </main>
  );
}

function PodioBanner({ podio, seeding }: { podio: Podio; seeding: Record<string, string> }) {
  const time = (slot: string) => TEAM_BY_CODE[seeding[slot]];
  const campea = time(podio.campeao);
  const vice = time(podio.vice);
  const terceiro = time(podio.terceiro);
  if (!campea) return null;
  return (
    <div className="mb-5 rounded-xl border border-amber-700/50 bg-gradient-to-b from-amber-950/40 to-neutral-900 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
        🏆 Campeã da Copa 2026
      </p>
      <div className="mt-2 flex items-center gap-3">
        <Flag code={campea.flag} />
        <span className="text-xl font-bold">{campea.nome}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-400">
        {vice && (
          <span className="flex items-center gap-1.5">
            <span className="text-neutral-500">Vice</span>
            <Flag code={vice.flag} /> {vice.nome}
          </span>
        )}
        {terceiro && (
          <span className="flex items-center gap-1.5">
            <span className="text-neutral-500">3º</span>
            <Flag code={terceiro.flag} /> {terceiro.nome}
          </span>
        )}
      </div>
    </div>
  );
}

function Tabela({ ranking, mostraGrupos }: { ranking: CombinedEntry[]; mostraGrupos: boolean }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-neutral-500">Ninguém enviou palpite ainda.</p>;
  }
  return (
    <ol className="flex flex-col gap-2">
      {ranking.map((r, i) => (
        <li key={r.userId}>
          <Link
            href={`/ver/?u=${r.userId}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3"
          >
            <span
              className={`w-6 text-center text-sm font-bold tabular-nums ${
                i === 0 ? "text-amber-400" : "text-neutral-500"
              }`}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.nome}</span>
            <span className="w-10 text-right text-xs tabular-nums text-neutral-400">
              {mostraGrupos ? r.grupos : "—"}
            </span>
            <span className="w-8 text-right text-xs tabular-nums text-neutral-400">{r.mata}</span>
            <span className="w-10 text-right text-sm font-semibold tabular-nums text-emerald-400">
              {r.total}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
