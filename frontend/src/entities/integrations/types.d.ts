type PageType = "testplan"

interface IntegrationEntity {
  id: number
  name: string
  description?: string
  service_url: string
  is_new_tab: boolean
  project: number
  page_type: PageType
}

interface GetIntegrationsParams {
  project: number
  page_type?: PageType
}

interface IntegrationUpdate {
  project: number
  name: string
  description?: string
  service_url: string
  is_new_tab: boolean
  page_type: PageType
}
