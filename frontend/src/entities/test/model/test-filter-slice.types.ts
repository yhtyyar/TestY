import { TestDataFilters } from "./schemas"

export interface TestStateFilters {
  filter: TestDataFilters
  settings: FilterSettings
  ordering: string
  shouldResetForm: boolean
}

export interface FilterSettings {
  filterProjectId: number | null
  selected: string | null
  editing: boolean
  editingValue: string
  creatingNew: boolean
  hasUnsavedChanges: boolean
}
