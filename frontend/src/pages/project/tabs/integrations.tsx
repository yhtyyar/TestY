import { Space } from "antd"

import { CreateIntegrationButton } from "features/integration"

import { IntegrationsTable } from "widgets/integration"

export const ProjectIntegrationsTabPage = () => {
  return (
    <>
      <Space style={{ display: "flex", justifyContent: "right" }}>
        <CreateIntegrationButton />
      </Space>
      <IntegrationsTable />
    </>
  )
}
