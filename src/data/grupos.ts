// Bolões (grupos do WhatsApp) que separam o ranking em abas. Quem não está
// mapeado aqui não aparece em nenhuma aba. Brandao participa dos dois.
export const BOLOES = ["14 motivos pra se usar camisinha e caio", "Sambiquira"] as const;
export type Bolao = (typeof BOLOES)[number];

const M14 = BOLOES[0];
const SAMBIQUIRA = BOLOES[1];

// userId (uuid gerado no primeiro acesso de cada participante) → bolões.
export const BOLAO_BY_USER: Record<string, readonly Bolao[]> = {
  "135956c7-fd52-4134-86f7-4eeb6ceebe03": [M14, SAMBIQUIRA], // Brandao
  "303cd29d-1b6f-46cb-9fe1-fef98bdab058": [M14], // El Gordo Tadala
  "2052685d-28c4-449b-a7df-eb80fe80d60d": [M14], // Neimá peida leite
  "c8f72b63-df78-4f3e-b647-54a492554476": [M14], // Leozin
  "f9479cdb-e0bb-4742-b5cd-82b681cf234f": [M14], // Biel LittlePool
  "f85dec08-d9e3-4d99-b6bc-b1b7b3a916c9": [M14], // Nao Tenho
  "6149f35a-f9b0-4f16-8080-7f62a11d283a": [M14], // Amo Morenas
  "e0a5a53b-b84a-4b7f-990c-fa513f1d4eeb": [SAMBIQUIRA], // Ferreira degustador de casadas
  "3640dc18-589b-4cfa-9257-483f31f64dcd": [SAMBIQUIRA], // Alex Alves
  "541aefee-06c8-4606-89a3-1af5ce3e4041": [SAMBIQUIRA], // Jack Sparrow
  "1bd54468-4639-483f-a23d-e91439f6bb53": [SAMBIQUIRA], // ieie
  "197db507-7bee-45a4-8de1-a80f13f2645c": [SAMBIQUIRA], // Gnu
  "7f85d550-3813-4939-869f-56bc1bbf6039": [SAMBIQUIRA], // Talles Martins
  "2449072f-ff31-4b6e-a756-f82f8e807e8d": [SAMBIQUIRA], // André Luyde
  "9378aa84-ba66-4592-9f4e-cd175fc5e8a5": [SAMBIQUIRA], // Bsk já to rico
};
