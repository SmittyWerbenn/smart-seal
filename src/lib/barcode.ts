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

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) >>> 0
    return s / 4294967296
  }
}

/**
 * Deterministic square (QR-like) module grid for a given code — visual only,
 * not a scannable real QR code. Includes the three corner "finder" squares
 * so it reads instantly as a QR code rather than a random checkerboard.
 */
export function qrPattern(code: string, size = 21): boolean[][] {
  let hash = 0
  for (let i = 0; i < code.length; i++) hash = (hash * 31 + code.charCodeAt(i)) >>> 0
  const rand = seededRandom(hash || 1)

  const grid: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => rand() < 0.5))

  const stampFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const border = r === 0 || r === 6 || c === 0 || c === 6
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
        grid[top + r][left + c] = border || core
      }
    }
  }
  stampFinder(0, 0)
  stampFinder(0, size - 7)
  stampFinder(size - 7, 0)

  return grid
}
