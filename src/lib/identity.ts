// Identidade do participante sem login: UUID + nome no localStorage.
// (substitui o cookie de sessão do backend antigo)

const UID_KEY = "bolao_uid";
const NOME_KEY = "bolao_nome";

export type Stored = { userId: string | null; nome: string | null };

// Lê o que está guardado. SSR-safe (retorna nulos no servidor).
export function getStored(): Stored {
  if (typeof window === "undefined") return { userId: null, nome: null };
  return {
    userId: localStorage.getItem(UID_KEY),
    nome: localStorage.getItem(NOME_KEY),
  };
}

// Garante um userId (cria UUID na 1ª vez) e grava o nome. Retorna o userId.
export function saveIdentity(nome: string): string {
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(UID_KEY, id);
  }
  localStorage.setItem(NOME_KEY, nome);
  return id;
}
