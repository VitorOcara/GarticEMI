import wordsData from "@/data/words.json";

type WordsFile = {
  facil: string[];
  medio: string[];
  dificil: string[];
};

const words = wordsData as WordsFile;

export function pickRandomWord(): string {
  const pool = [...words.facil, ...words.medio, ...words.dificil];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function normalizeGuess(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function guessesMatch(guess: string, secret: string): boolean {
  return normalizeGuess(guess) === normalizeGuess(secret);
}
