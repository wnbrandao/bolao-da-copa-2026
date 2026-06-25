"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Flag from "@/components/Flag";
import { TEAM_BY_CODE } from "@/data/teams";
import {
  BRACKET,
  MATCHES_BY_FASE,
  FASES,
  FASE_NOME,
  SOURCE_LABEL,
  type Fase,
  type SourceId,
} from "@/data/bracket";
import {
  competitors,
  sanitize,
  type MataFaseResolved,
  type MataPalpite,
} from "@/lib/mata";
import { saveMata } from "@/lib/api";

type Props = {
  fase: MataFaseResolved;
  userId: string;
  nome: string;
  initialMata: MataPalpite;
  submitted: boolean;
  seeding: Record<SourceId, string>;
};

const PASSOS = FASES; // ["M32","M16","M8","M4","M2","M3P"]

export default function BracketBoard({ fase, userId, nome, initialMata, submitted, seeding }: Props) {
  const readOnly = fase !== "aberta";
  const [palpite, setPalpite] = useState<MataPalpite>(() => sanitize(initialMata));
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const faseAtual = PASSOS[step] as Fase;
  const pendentes = useMemo(() => Object.keys(BRACKET).filter((id) => !palpite[id]), [palpite]);
  const completo = pendentes.length === 0;
  const faseDone = useMemo(
    () => PASSOS.map((f) => MATCHES_BY_FASE[f].every((id) => Boolean(palpite[id]))),
    [palpite],
  );

  function pick(matchId: string, source: SourceId) {
    if (readOnly) return;
    setStatus(null);
    setPalpite((prev) => sanitize({ ...prev, [matchId]: source }));
  }

  async function salvar(submit: boolean) {
    if (saving || readOnly) return;
    if (submit && !completo) {
      const first = pendentes[0];
      if (first) setStep(PASSOS.indexOf(BRACKET[first].fase));
      setStatus({ kind: "err", msg: `Faltam ${pendentes.length} confronto(s) — te levei pro próximo.` });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const res = await saveMata({ userId, nome, mata: palpite, submit });
      if (res?.error) {
        setStatus({ kind: "err", msg: res.error });
        return;
      }
      if (submit) setIsSubmitted(true);
      setStatus({ kind: "ok", msg: submit ? "Mata-mata enviado! 🎉" : "Rascunho salvo." });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col px-4 pb-40 pt-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Mata-mata</h1>
          {nome && <p className="truncate text-sm text-neutral-400">{nome}</p>}
        </div>
        <Link href="/" className="shrink-0 text-sm text-neutral-400 underline">
          Início
        </Link>
      </header>

      {fase === "em-breve" && (
        <div className="mb-4 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300">
          ⏳ Em breve — o chaveamento abre quando a fase de grupos terminar e as 32
          seleções forem definidas. Por enquanto é só uma prévia da estrutura.
        </div>
      )}
      {fase === "encerrada" && (
        <div className="mb-4 rounded-lg border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-300">
          ⛔ Mata-mata em andamento — palpites encerrados.
        </div>
      )}

      <Stepper step={step} done={faseDone} />

      <h2 className="mb-3 mt-4 text-sm font-semibold text-neutral-200">{FASE_NOME[faseAtual]}</h2>

      <ul className="flex flex-col gap-3">
        {MATCHES_BY_FASE[faseAtual].map((id) => (
          <MatchCard
            key={id}
            matchId={id}
            palpite={palpite}
            seeding={seeding}
            readOnly={readOnly}
            onPick={pick}
          />
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-200 disabled:opacity-40"
        >
          ← Voltar
        </button>
        <span className="text-xs text-neutral-500">
          {step + 1}/{PASSOS.length}
        </span>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(PASSOS.length - 1, s + 1))}
          disabled={step === PASSOS.length - 1}
          className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-200 disabled:opacity-40"
        >
          Próxima fase →
        </button>
      </div>

      {!readOnly && (
        <div className="fixed inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-md border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
            {status && (
              <p className={`mb-2 text-center text-sm ${status.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
                {status.msg}
              </p>
            )}
            {!completo && (
              <p className="mb-2 text-center text-xs text-neutral-500">
                Faltam {pendentes.length} confronto(s) pra enviar
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => salvar(false)}
                disabled={saving}
                className="flex-1 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-200 disabled:opacity-50"
              >
                Salvar rascunho
              </button>
              <button
                type="button"
                onClick={() => salvar(true)}
                disabled={saving}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                {isSubmitted ? "Atualizar envio" : "Enviar mata-mata"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Stepper({ step, done }: { step: number; done: boolean[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {PASSOS.map((p, i) => (
        <span
          key={p}
          className={`h-2 flex-1 rounded-full ${
            done[i] ? "bg-emerald-500" : i === step ? "bg-emerald-500/40" : "bg-neutral-800"
          }`}
        />
      ))}
    </div>
  );
}

function MatchCard({
  matchId,
  palpite,
  seeding,
  readOnly,
  onPick,
}: {
  matchId: string;
  palpite: MataPalpite;
  seeding: Record<SourceId, string>;
  readOnly: boolean;
  onPick: (matchId: string, source: SourceId) => void;
}) {
  const [a, b] = competitors(matchId, palpite);
  const escolhido = palpite[matchId];
  return (
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-2">
      <div className="flex flex-col gap-1.5">
        <Competitor
          source={a}
          seeding={seeding}
          selected={escolhido === a}
          readOnly={readOnly}
          onPick={() => a && onPick(matchId, a)}
        />
        <Competitor
          source={b}
          seeding={seeding}
          selected={escolhido === b}
          readOnly={readOnly}
          onPick={() => b && onPick(matchId, b)}
        />
      </div>
    </li>
  );
}

function Competitor({
  source,
  seeding,
  selected,
  readOnly,
  onPick,
}: {
  source: SourceId | null;
  seeding: Record<SourceId, string>;
  selected: boolean;
  readOnly: boolean;
  onPick: () => void;
}) {
  const sigla = source ? seeding[source] : undefined;
  const team = sigla ? TEAM_BY_CODE[sigla] : undefined;
  const label = team ? team.nome : source ? SOURCE_LABEL[source] : "—";
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={readOnly || !source}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${
        selected ? "border-emerald-500 bg-emerald-950/40" : "border-neutral-800 bg-neutral-900"
      } ${readOnly || !source ? "" : "active:scale-[0.99]"}`}
    >
      {team ? (
        <Flag code={team.flag} />
      ) : (
        <span aria-hidden className="h-5 w-7 shrink-0 rounded-[2px] bg-neutral-800 ring-1 ring-black/30" />
      )}
      <span className={`min-w-0 flex-1 truncate text-sm font-medium ${source ? "" : "text-neutral-600"}`}>
        {label}
      </span>
      {selected && <span className="text-xs text-emerald-400">avança ✓</span>}
    </button>
  );
}
