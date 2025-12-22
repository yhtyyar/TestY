interface Label {
  id: number
  name: string
  project: number
  type: number
  url: string
  color: string | null
  user: null
}

interface LabelInForm {
  id?: number
  name: string
  color: string | null
}

interface SelectedLabel {
  value?: number
  label: string
  color: string | null
}

interface SelectedLabel {
  value?: number
  label: string
}

interface GetLabelsParams {
  project: string
}

interface LabelUpdate {
  project: number
  name: string
  type: number
  color: string | null
}

type LabelTypes = "System" | "Custom"
type LabelCondition = "and" | "or"
