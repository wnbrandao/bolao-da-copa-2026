// Os 48 selecionados da Copa 2026 nos 12 grupos oficiais (A–L).
// Estático no build — grupos não mudam, não vão pro backend (Sheet).
// Identidade canônica de cada seleção = `code` (sigla FIFA, única).
// `flag` = código flagcdn (ISO alpha-2 ou subdivisão gb-eng/gb-sct).

export type Team = { code: string; nome: string; flag: string; group: string };

export const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const TEAMS: Team[] = [
  { group: "A", code: "MEX", nome: "México", flag: "mx" },
  { group: "A", code: "RSA", nome: "África do Sul", flag: "za" },
  { group: "A", code: "KOR", nome: "Coreia do Sul", flag: "kr" },
  { group: "A", code: "CZE", nome: "Tchéquia", flag: "cz" },

  { group: "B", code: "CAN", nome: "Canadá", flag: "ca" },
  { group: "B", code: "BIH", nome: "Bósnia e Herzegovina", flag: "ba" },
  { group: "B", code: "QAT", nome: "Catar", flag: "qa" },
  { group: "B", code: "SUI", nome: "Suíça", flag: "ch" },

  { group: "C", code: "BRA", nome: "Brasil", flag: "br" },
  { group: "C", code: "MAR", nome: "Marrocos", flag: "ma" },
  { group: "C", code: "HAI", nome: "Haiti", flag: "ht" },
  { group: "C", code: "SCO", nome: "Escócia", flag: "gb-sct" },

  { group: "D", code: "USA", nome: "Estados Unidos", flag: "us" },
  { group: "D", code: "PAR", nome: "Paraguai", flag: "py" },
  { group: "D", code: "AUS", nome: "Austrália", flag: "au" },
  { group: "D", code: "TUR", nome: "Turquia", flag: "tr" },

  { group: "E", code: "GER", nome: "Alemanha", flag: "de" },
  { group: "E", code: "CUW", nome: "Curaçao", flag: "cw" },
  { group: "E", code: "CIV", nome: "Costa do Marfim", flag: "ci" },
  { group: "E", code: "ECU", nome: "Equador", flag: "ec" },

  { group: "F", code: "NED", nome: "Holanda", flag: "nl" },
  { group: "F", code: "JPN", nome: "Japão", flag: "jp" },
  { group: "F", code: "SWE", nome: "Suécia", flag: "se" },
  { group: "F", code: "TUN", nome: "Tunísia", flag: "tn" },

  { group: "G", code: "BEL", nome: "Bélgica", flag: "be" },
  { group: "G", code: "EGY", nome: "Egito", flag: "eg" },
  { group: "G", code: "IRN", nome: "Irã", flag: "ir" },
  { group: "G", code: "NZL", nome: "Nova Zelândia", flag: "nz" },

  { group: "H", code: "ESP", nome: "Espanha", flag: "es" },
  { group: "H", code: "CPV", nome: "Cabo Verde", flag: "cv" },
  { group: "H", code: "KSA", nome: "Arábia Saudita", flag: "sa" },
  { group: "H", code: "URU", nome: "Uruguai", flag: "uy" },

  { group: "I", code: "FRA", nome: "França", flag: "fr" },
  { group: "I", code: "SEN", nome: "Senegal", flag: "sn" },
  { group: "I", code: "IRQ", nome: "Iraque", flag: "iq" },
  { group: "I", code: "NOR", nome: "Noruega", flag: "no" },

  { group: "J", code: "ARG", nome: "Argentina", flag: "ar" },
  { group: "J", code: "ALG", nome: "Argélia", flag: "dz" },
  { group: "J", code: "AUT", nome: "Áustria", flag: "at" },
  { group: "J", code: "JOR", nome: "Jordânia", flag: "jo" },

  { group: "K", code: "POR", nome: "Portugal", flag: "pt" },
  { group: "K", code: "COD", nome: "Congo (RD)", flag: "cd" },
  { group: "K", code: "UZB", nome: "Uzbequistão", flag: "uz" },
  { group: "K", code: "COL", nome: "Colômbia", flag: "co" },

  { group: "L", code: "ENG", nome: "Inglaterra", flag: "gb-eng" },
  { group: "L", code: "CRO", nome: "Croácia", flag: "hr" },
  { group: "L", code: "GHA", nome: "Gana", flag: "gh" },
  { group: "L", code: "PAN", nome: "Panamá", flag: "pa" },
];

export const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(
  TEAMS.map((t) => [t.code, t]),
);

// Times de cada grupo, na ordem base (como vieram). O usuário arrasta p/ ordenar.
export const TEAMS_BY_GROUP: Record<string, Team[]> = GROUPS.reduce(
  (acc, g) => {
    acc[g] = TEAMS.filter((t) => t.group === g);
    return acc;
  },
  {} as Record<string, Team[]>,
);
