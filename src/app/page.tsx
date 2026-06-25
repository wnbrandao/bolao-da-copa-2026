"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStored, saveIdentity } from "@/lib/identity";
import { APOSTAS_ENCERRADAS } from "@/lib/config";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [nome, setNome] = useState("");
  const [savedNome, setSavedNome] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // localStorage só no cliente (evita erro/mismatch no build estático).
  useEffect(() => {
    const { nome } = getStored();
    setSavedNome(nome);
    if (nome) setNome(nome);
    setMounted(true);
  }, []);

  function entrar(e: FormEvent) {
    e.preventDefault();
    const trimmed = nome.trim();
    if (trimmed.length < 2) {
      setError("Digite seu nome (mínimo 2 caracteres).");
      return;
    }
    saveIdentity(trimmed);
    router.push("/palpite");
  }

  return (
    <main className="flex-1 flex flex-col px-6 py-10">
      <header className="mb-8">
        <div className="text-5xl">🏆</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Bolão da Copa 2026</h1>
        <p className="mt-2 text-sm text-neutral-400">
          {APOSTAS_ENCERRADAS ? (
            <>
              A copa começou e as apostas estão encerradas.
              <span className="block mt-1 text-neutral-500">
                +3 pontos por seleção na posição exata.
              </span>
            </>
          ) : (
            <>
              Arraste e ordene a classificação (1º a 4º) dos 12 grupos da fase de grupos.
              <span className="block mt-1 text-neutral-500">
                +3 pontos por seleção na posição exata.
              </span>
            </>
          )}
        </p>
      </header>

      {APOSTAS_ENCERRADAS ? (
        <div className="flex flex-col gap-4">
          {mounted && savedNome && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400">Você está como</p>
              <p className="text-lg font-semibold">{savedNome}</p>
            </div>
          )}
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 p-4 text-sm text-amber-300">
            ⛔ Apostas encerradas — agora é torcer e acompanhar a pontuação.
          </div>
          <Link
            href="/mata-mata"
            className="rounded-lg bg-emerald-500 px-4 py-3 text-center text-base font-semibold text-black"
          >
            🏟️ Mata-mata
          </Link>
          <Link
            href="/ranking"
            className="rounded-lg border border-neutral-800 px-4 py-3 text-center text-base font-medium text-neutral-200"
          >
            Ver ranking
          </Link>
        </div>
      ) : /* enquanto não montou, mostra o form (neutro) pra casar com o HTML estático */
      mounted && savedNome ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <p className="text-sm text-neutral-400">Você está como</p>
            <p className="text-lg font-semibold">{savedNome}</p>
          </div>
          <Link
            href="/palpite"
            className="rounded-lg bg-emerald-500 px-4 py-3 text-center text-base font-semibold text-black"
          >
            Fazer / revisar meu palpite
          </Link>
          <Link
            href="/ranking"
            className="rounded-lg border border-neutral-800 px-4 py-3 text-center text-base font-medium text-neutral-200"
          >
            Ver ranking
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <form onSubmit={entrar} className="flex flex-col gap-3">
            <label className="text-sm text-neutral-300" htmlFor="nome">
              Seu nome
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Jacinto Pinto Aquino Rego"
              autoComplete="off"
              autoCapitalize="words"
              maxLength={40}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-base outline-none focus:border-emerald-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-2 rounded-lg bg-emerald-500 px-4 py-3 text-base font-semibold text-black"
            >
              Bora palpitar
            </button>
          </form>
          <Link href="/ranking" className="text-center text-sm text-neutral-400 underline">
            Ver ranking
          </Link>
        </div>
      )}
    </main>
  );
}
