import { FilterSettings } from "entities/test/model"

import { TestCaseDataFilters } from "./schemas"

export interface TestCaseStateFilters {
  filter: TestCaseDataFilters
  settings: FilterSettings
  ordering: string
  shouldResetForm: boolean
}
