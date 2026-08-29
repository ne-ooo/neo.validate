export const INVALID_OPTION = Symbol('invalid-option')

export function readOwnDataOption(
  value: unknown,
  key: string,
  fallback: unknown
): unknown | typeof INVALID_OPTION {
  if (!value || typeof value !== 'object') return INVALID_OPTION

  try {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor) return fallback
    return Object.prototype.hasOwnProperty.call(descriptor, 'value')
      ? descriptor.value
      : INVALID_OPTION
  } catch {
    return INVALID_OPTION
  }
}

export function copyOwnStringArray(value: unknown): string[] | null {
  try {
    if (!Array.isArray(value)) return null
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, 'length')
    if (
      !lengthDescriptor ||
      !Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value') ||
      !Number.isSafeInteger(lengthDescriptor.value) ||
      lengthDescriptor.value < 0 ||
      lengthDescriptor.value > 10_000
    ) {
      return null
    }

    const copy: string[] = []
    for (let index = 0; index < lengthDescriptor.value; index++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index))
      if (
        !descriptor ||
        !Object.prototype.hasOwnProperty.call(descriptor, 'value') ||
        typeof descriptor.value !== 'string'
      ) {
        return null
      }
      copy.push(descriptor.value)
    }
    return copy
  } catch {
    return null
  }
}
