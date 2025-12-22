interface TestCaseState {
  drawerTestCase: TestCase | null
  editingTestCase: TestCase | null
  dataView: EntityView
  test: Test | null
  settings: {
    table: TestCaseTableParams
    tree: BaseTreeParams
  }
}

type TestCaseStateSettings = TestCaseState["settings"][keyof TestState["settings"]]

interface SetCaseSettings {
  key: keyof TestCaseState["settings"]
  settings: TestCaseStateSettings
}

interface UpdateTestCaseSettings extends SetCaseSettings {
  settings: Partial<TestCaseStateSettings>
}

type ChangeLabelBulkOperationType = "add" | "update" | "delete"

interface TestCaseBulkUpdate {
  included_suites: number[]
  included_cases: number[]
  excluded_cases: number[]
  current_suite: number | null
  project: number
  filter_conditions?: Partial<TestCaseGetFilters>
  labels?: LabelInForm[]
  labels_action?: ChangeLabelBulkOperationType
  suite?: number
}

type TestCaseTableParams = BaseTableParams<{
  testSuiteId: number | null
}>

interface TestCase {
  id: Id
  name: string
  project: number
  suite_path: string
  suite: { id: number; name: string }
  setup: string
  scenario?: string
  expected: string | null
  steps: Step[]
  is_steps: boolean
  is_leaf: boolean
  has_children: boolean
  teardown: string
  estimate?: string | null
  description: string
  current_version: number
  versions: number[]
  attachments: IAttachment[]
  url: string
  labels: LabelInForm[]
  is_archive: boolean
  source_archived: boolean
  test_suite_description?: string | null
  attributes: AttributesObject
  parent: Parent | null
  created_at: string
}

interface TestCaseCreate {
  name: string
  project: number
  suite: number
  scenario?: string
  expected?: string
  steps?: StepUpload[]
  is_steps?: boolean
  setup?: string
  teardown?: string
  estimate?: string
  description?: string
  attachments?: number[]
  labels?: { id?: number; name: string }[]
  attributes?: AttributesObject
}

interface TestCaseUpdate extends TestCase {
  suite: number
  attachments?: number[]
  steps: NewStepAttachNumber[]
  skip_history?: boolean
  labels?: { id?: number; name: string }[]
}

interface Step {
  id: number
  name: string
  scenario: string
  sort_order: number
  attachments: IAttachment[]
  expected?: string
  isNew?: boolean
}

type NewStep = Omit<Step, "id">

type StepAttachNumber = Omit<Step, "attachments"> & {
  attachments: number[]
}

type NewStepAttachNumber = Omit<NewStep, "attachments"> & {
  attachments: number[]
}

interface GetTestCasesQuery {
  testSuiteId: Id
  project: string
  suite?: number[]
  search?: string
  ordering?: string
  page?: number
  page_size?: number
  is_archive?: boolean
  treeview?: boolean
  labels?: number[]
  not_labels?: number[]
  labels_condition?: LabelCondition
  show_descendants?: boolean
  _n?: number
}

type SearchTestCasesQuery = Omit<GetTestCasesQuery, "testSuiteId">

interface TestCaseFormData {
  name: string
  scenario: string
  suite: number
  expected?: string
  setup?: string
  teardown?: string
  estimate?: string | null
  description?: string
  attachments?: number[]
  steps?: Step[]
  expanded_steps?: number[]
  is_steps?: boolean
  labels?: SelectedLabel[]
  attributes?: Attribute[]
}

interface TestCaseCopyBody {
  cases: TestCaseCopyItem[]
  dst_suite_id: string
}

interface TestCaseCopyItem {
  id: string
  new_name: string
}

interface TestCaseHistoryChange {
  action: "Created" | "Updated" | "Deleted"
  history_date: string
  version: number
  user: User | null
}

interface TestCaseTestsList {
  testCaseId: number
  ordering?: string
  last_status?: string
  is_archive?: boolean
}

interface GetTestCaseByIdParams {
  testCaseId: string
  ver?: string
  nonce?: number
}

interface TestCaseGetFilters {
  search?: string
  suites?: number[]
  labels?: number[]
  labels_condition?: string
  test_suite_created_before?: string
  test_suite_created_after?: string
  test_case_created_before?: string
  test_case_created_after?: string
  is_archive?: boolean
  _n?: string | number
}
