// Deterministic fake barcode number generator — turns a seal/device ID into a
// stable 13-digit numeric string so every seal has consistent "barcode data"
// across reloads, without needing a real barcode symbology library.
export function barcodeFor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  // Spread the hash across 12 digits, then append a simple checksum digit.
  let digits = ''
  let h = hash
  for (let i = 0; i < 12; i++) {
    digits += (h % 10).toString()
    h = Math.floor(h / 7) + hash * (i + 1)
    h = h >>> 0
  }
  const sum = digits.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  const checkDigit = (10 - (sum % 10)) % 10
  return `${digits}${checkDigit}`
}

/** Relative bar widths (1–4) derived from the barcode digits, purely for a plausible-looking barcode graphic. */
export function barcodePattern(code: string): number[] {
  return code.split('').map((d) => 1 + (Number(d) % 4))
}
