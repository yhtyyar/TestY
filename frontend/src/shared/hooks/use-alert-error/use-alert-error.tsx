export type ErrorObj = Record<string, string | null>

export const useAlertError = (error: ErrorObj, skipFields: string[] = []) => {
  const errors = Object.keys(error)
    .filter((key) => !skipFields.includes(key) && error[key] !== null)
    .reduce((obj: ErrorObj, key) => {
      obj[key] = error[key]
      return obj
    }, {})

  return JSON.stringify(errors) === "{}" ? null : errors
}
