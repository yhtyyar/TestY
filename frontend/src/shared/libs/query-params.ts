export const deleteEmptyParams = (params: Record<string, unknown>) => {
  const cleanedParams = { ...params }

  Object.keys(cleanedParams).forEach((key) => {
    const param = cleanedParams[key]

    if (Array.isArray(param)) {
      const cleanedArr = param.filter((item) => item !== "")

      if (param.length) {
        cleanedParams[key] = cleanedArr
      }

      if (cleanedArr.length === 0) {
        delete cleanedParams[key]
      }
    }

    if (param === undefined) {
      delete cleanedParams[key]
    }
  })

  return cleanedParams
}
