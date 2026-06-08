"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState } from "@/lib/api";
import { computeRanking, type RankEntry, type PalpiteRow } from "@/lib/ranking";

export default function RankingPage() {
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [ranking, setRanking] = useState<RankEntry[] | null>(null);
  const [enviados, setEnviados] = useState<PalpiteRow[]>([]);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let alive = true;
    getState()
      .then((s) => {
        if (!alive) return;
        setRanking(computeRanking(s.palpites, s.gabarito));
        setEnviados(
          s.palpites.filter((p) => p.enviadoEm).sort((a, b) => a.nome.localeCompare(b.nome)),
        );
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

  return (
    <main className="flex-1 flex flex-col px-5 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Ranking</h1>
        <Link href="/" className="text-sm text-neutral-400 underline">
          Início
        </Link>
      </header>

      {phase === "loading" && <p className="text-sm text-neutral-400">Carregando…</p>}

      {phase === "error" && (
        <div className="rounded-lg border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Não consegui carregar o ranking ({errMsg}).
        </div>
      )}

      {phase === "ready" && (ranking === null ? <Aguardando enviados={enviados} /> : <Tabela ranking={ranking} />)}
    </main>
  );
}

function Aguardando({ enviados }: { enviados: PalpiteRow[] }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-sm text-amber-300">
        O ranking aparece quando todos os 12 grupos forem encerrados e o gabarito oficial
        estiver completo.
      </div>
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Palpites enviados ({enviados.length})
        </h2>
        {enviados.length === 0 ? (
          <p className="text-sm text-neutral-500">Ninguém enviou palpite ainda.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enviados.map((p) => (
              <li key={p.userId}>
                <Link
                  href={`/ver/?u=${p.userId}`}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm"
                >
                  <span className="font-medium">{p.nome}</span>
                  <span className="text-neutral-500">ver palpite →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tabela({ ranking }: { ranking: RankEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-sm text-neutral-500">Nenhum palpite enviado.</p>;
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
            <span className="text-sm font-semibold text-emerald-400 tabular-nums">
              {r.pontos} pts
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
