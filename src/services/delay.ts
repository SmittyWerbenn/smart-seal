// Small artificial latency so loading states are visible in the prototype —
// mirrors what a real API call would feel like without a backend.
export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
