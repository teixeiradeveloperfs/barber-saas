/** Minúsculas, sem acento, sem espaços nas pontas. Para buscar e comparar. */
export function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
