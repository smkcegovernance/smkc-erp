export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN')
}

export function slugify(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

export function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === ''
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = obj[key]
      return acc
    },
    {} as Pick<T, K>
  )
}
