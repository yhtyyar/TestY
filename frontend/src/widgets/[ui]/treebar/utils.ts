export interface TreeSettings {
  collapsed: boolean
  show_archived: boolean
  plans: {
    sortBy: "asc" | "desc"
    filterBy: string
  }
  suites: {
    sortBy: "asc" | "desc"
    filterBy: string
  }
}

export const updateTreeSettingsLS = (settings: TreeSettings) => {
  const prevState = getTreeSettingsLS()
  window.localStorage.setItem("treeSettings", JSON.stringify({ ...prevState, ...settings }))
}

export const getTreeSettingsLS = (): TreeSettings => {
  const settings = window.localStorage.getItem("treeSettings")
  return settings
    ? (JSON.parse(settings) as TreeSettings)
    : {
        collapsed: false,
        show_archived: false,
        plans: { sortBy: "asc", filterBy: "name" },
        suites: { sortBy: "asc", filterBy: "name" },
      }
}

export const saveUrlParamByKeys = (
  paramKeys: string[],
  searchParams: URLSearchParams
): URLSearchParams => {
  const params = new URLSearchParams()
  paramKeys.forEach((key) => {
    const value = searchParams.get(key)
    if (value) {
      params.append(key, value)
    }
  })
  return params
}
