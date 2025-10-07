export const fromUrl = <T>(key: string, fallback: T, parser: (val: string) => T): T => {
  const value = new URLSearchParams(window.location.search).get(key)
  if (value === null) return fallback
  try {
    return parser(value)
  } catch {
    return fallback
  }
}

export const getDataFromUrlOrLocalStorage = <T>(
  urlKey: string,
  storageKey: string,
  defaultValue: T
): T => {
  const urlParam = new URLSearchParams(window.location.search).get(urlKey)
  return (urlParam ?? localStorage.getItem(storageKey) ?? defaultValue) as T
}
