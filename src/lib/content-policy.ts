// Deliberately small, Spanish-first vocabulary for a professional workspace.
// Match whole tokens, not substrings (e.g. "computadora" and "analista").
// This is a basic language filter, not contextual or comprehensive moderation.
const offensiveTokens = new Set([
  "puta",
  "putas",
  "puto",
  "putos",
  "putazo",
  "putazos",
  "pendejo",
  "pendeja",
  "pendejos",
  "pendejas",
  "pendejada",
  "pendejadas",
  "cabron",
  "cabrona",
  "cabrones",
  "cabronas",
  "chingar",
  "chingada",
  "chingado",
  "chingados",
  "chingadas",
  "chingate",
  "chingas",
  "chinguen",
  "chinga",
  "chingadera",
  "chingaderas",
  "verga",
  "vergas",
  "mierda",
  "mierdas",
  "joder",
  "jodete",
  "jodido",
  "jodida",
  "culero",
  "culera",
  "culeros",
  "culeras",
  "mamon",
  "mamona",
  "mamones",
  "fuck",
  "fucking",
  "fucker",
  "fuckers",
  "motherfucker",
  "shit",
  "bullshit",
  "asshole",
  "assholes",
  "bitch",
  "bitches",
  "cunt",
]);

const substitutions: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
};

export const languageMessage =
  "Revisa el lenguaje: evita insultos y expresiones muy ofensivas. Tu texto sigue aquí para que puedas corregirlo.";

export function hasOffensiveLanguage(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => substitutions[char]);
  const tokens = normalized.match(/[\p{L}\p{N}]+/gu) || [];
  return tokens.some((token) => offensiveTokens.has(token));
}
