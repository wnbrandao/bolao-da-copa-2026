"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Flag from "@/components/Flag";
import CopyMessage from "@/components/CopyMessage";
import { GROUPS, TEAMS_BY_GROUP, TEAM_BY_CODE, type Team } from "@/data/teams";
import { savePalpite } from "@/lib/api";
import type { Palpite } from "@/lib/scoring";

type Props = {
  userId: string;
  nome: string;
  submitted: boolean;
  initialPalpite: Palpite;
};

// Ordem inicial de cada grupo: usa o palpite salvo se cobrir as 4 seleções,
// senão a ordem base. `complete` marca grupos já totalmente palpitados.
function buildInitialState(palpite: Palpite): {
  order: Record<string, string[]>;
  complete: Set<string>;
} {
  const order: Record<string, string[]> = {};
  const complete = new Set<string>();
  for (const g of GROUPS) {
    const codes = TEAMS_BY_GROUP[g].map((t) => t.code);
    const allPicked = codes.every((c) => typeof palpite[c] === "number");
    if (allPicked) complete.add(g);
    order[g] = allPicked
      ? [...codes].sort((a, b) => palpite[a] - palpite[b])
      : codes;
  }
  return { order, complete };
}

export default function PalpiteBoard({ userId, nome, submitted, initialPalpite }: Props) {
  const initial = useMemo(() => buildInitialState(initialPalpite), [initialPalpite]);
  const [order, setOrder] = useState<Record<string, string[]>>(() => initial.order);
  const [touched, setTouched] = useState<Set<string>>(() => new Set(initial.complete));
  const [saving, setSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  // DnD só após o mount (evita mismatch de hidratação do @dnd-kit).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleReorder(group: string, codes: string[]) {
    setOrder((prev) => ({ ...prev, [group]: codes }));
    setTouched((prev) => new Set(prev).add(group));
    setStatus(null);
  }

  async function salvar(submit: boolean) {
    if (saving) return;
    setSaving(true);
    setStatus(null);
    const palpite: Palpite = {};
    for (const g of GROUPS) {
      (order[g] ?? TEAMS_BY_GROUP[g].map((t) => t.code)).forEach((code, i) => {
        palpite[code] = i + 1;
      });
    }
    try {
      const res = await savePalpite({ userId, nome, palpite, submit });
      if (res?.error) {
        setStatus({ kind: "err", msg: res.error });
        return;
      }
      if (submit) setIsSubmitted(true);
      setStatus({ kind: "ok", msg: submit ? "Palpite enviado! 🎉" : "Rascunho salvo." });
    } catch (e) {
      setStatus({ kind: "err", msg: e instanceof Error ? e.message : "Falha de rede." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col px-4 pb-40 pt-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Seu palpite</h1>
          <p className="truncate text-sm text-neutral-400">{nome}</p>
        </div>
        <Link href="/" className="shrink-0 text-sm text-neutral-400 underline">
          Início
        </Link>
      </header>

      <p className="mb-4 text-xs text-neutral-500">
        Arraste pela alça <span className="text-neutral-300">⠿</span> para ordenar do 1º ao 4º.
        Os 2 primeiros de cada grupo avançam. ({touched.size}/12 grupos ajustados)
      </p>

      <div className="flex flex-col gap-5">
        {GROUPS.map((g) => (
          <GroupCard
            key={g}
            group={g}
            order={order[g]}
            enabled={mounted}
            onReorder={handleReorder}
          />
        ))}
      </div>

      {isSubmitted && (
        <div className="mt-6">
          <CopyMessage userId={userId} card />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto w-full max-w-md border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
          {status && (
            <p
              className={`mb-2 text-center text-sm ${
                status.kind === "ok" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {status.msg}
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
              {isSubmitted ? "Atualizar envio" : "Enviar palpite"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function GroupCard({
  group,
  order,
  enabled,
  onReorder,
}: {
  group: string;
  order: string[];
  enabled: boolean;
  onReorder: (group: string, codes: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(group, arrayMove(order, oldIndex, newIndex));
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-200">Grupo {group}</h2>
      </div>
      {enabled ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-1.5">
              {order.map((code, i) => (
                <SortableTeam key={code} code={code} position={i + 1} team={TEAM_BY_CODE[code]} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {order.map((code, i) => (
            <StaticTeam key={code} position={i + 1} team={TEAM_BY_CODE[code]} />
          ))}
        </ul>
      )}
    </section>
  );
}

function RowContent({ position, team }: { position: number; team: Team }) {
  const advances = position <= 2;
  return (
    <>
      <span
        className={`w-5 text-center text-sm font-bold tabular-nums ${
          advances ? "text-emerald-400" : "text-neutral-500"
        }`}
      >
        {position}º
      </span>
      <Flag code={team.flag} />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.nome}</span>
    </>
  );
}

function StaticTeam({ position, team }: { position: number; team: Team }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5">
      <RowContent position={position} team={team} />
      <span aria-hidden="true" className="select-none px-2 text-lg text-neutral-500">
        ⠿
      </span>
    </li>
  );
}

function SortableTeam({ code, position, team }: { code: string; position: number; team: Team }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: code,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
        isDragging
          ? "dnd-dragging z-10 border-emerald-500 bg-neutral-800 shadow-lg"
          : "border-neutral-800 bg-neutral-900"
      }`}
    >
      <RowContent position={position} team={team} />
      <button
        type="button"
        aria-label={`Arrastar ${team.nome}`}
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab select-none px-2 text-lg text-neutral-500 active:cursor-grabbing"
      >
        ⠿
      </button>
    </li>
  );
}
