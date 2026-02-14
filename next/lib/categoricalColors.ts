export const TABLEAU_20 = [
  "#4E79A7",
  "#A0CBE8",
  "#F28E2B",
  "#FFBE7D",
  "#59A14F",
  "#8CD17D",
  "#B6992D",
  "#F1CE63",
  "#499894",
  "#86BCB6",
  "#E15759",
  "#FF9D9A",
  "#79706E",
  "#BAB0AC",
  "#D37295",
  "#FABFD2",
  "#B07AA1",
  "#D4A6C8",
  "#9D7660",
  "#D7B5A6",
] as const

export const CATEGORICAL_COLOR_COUNT = TABLEAU_20.length

function normalizeIndex(index: number): number {
  const n = Math.floor(index)
  return ((n % CATEGORICAL_COLOR_COUNT) + CATEGORICAL_COLOR_COUNT) % CATEGORICAL_COLOR_COUNT
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export function getCategoricalColorByIndex(index: number) {
  const normalized = normalizeIndex(index)
  const cssIndex = normalized + 1
  return {
    index: normalized,
    fill: `var(--cat-${cssIndex})`,
    foreground: `var(--cat-fg-${cssIndex})`,
    hex: TABLEAU_20[normalized],
  }
}

export function getCategoricalColorFromSeed(seed: string | number) {
  if (typeof seed === "number") {
    return getCategoricalColorByIndex(seed)
  }
  return getCategoricalColorByIndex(hashString(seed))
}
