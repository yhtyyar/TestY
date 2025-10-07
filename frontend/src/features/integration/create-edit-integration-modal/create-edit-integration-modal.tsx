import { Form, Input, Modal, Switch } from "antd"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { ErrorObj } from "shared/hooks"
import { AlertError, Button } from "shared/ui"

import { PLAN_PLACEHOLDER, PROJECT_PLACEHOLDER } from "../constants"
import {
  UseCreateEditIntegrationModalProps,
  useCreateEditIntegrationModal,
} from "./use-create-edit-integration-modal"

const urlRegex = /^(?:http|https|ftp|ftps):\/\/.+/

export const CreateEditIntegrationModal = (props: UseCreateEditIntegrationModalProps) => {
  const { mode, isShow } = props
  const { t } = useTranslation()
  const {
    title,
    isLoading,
    isDisabled,
    control,
    errors,
    handleConfirmClose,
    handleCancel,
    handleSubmitForm,
    handleResetError,
  } = useCreateEditIntegrationModal(props)

  const validateUrl = (value: string) => {
    return urlRegex.test(value) && !value.trim().includes(" ") ? true : t("Enter a valid URL")
  }

  return (
    <Modal
      bodyProps={{ "data-testid": `${mode}-integration-modal-body` }}
      wrapProps={{ "data-testid": `${mode}-integration-modal-wrapper` }}
      title={<span data-testid={`${mode}-integration-modal-title`}>{title}</span>}
      open={isShow}
      onCancel={handleConfirmClose}
      width="900px"
      centered
      footer={[
        <Button
          id={`${mode}-integration-close`}
          key="back"
          onClick={handleCancel}
          color="secondary-linear"
        >
          {t("Close")}
        </Button>,
        <Button
          id={`${mode}-integration-button`}
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          color="accent"
          disabled={isDisabled}
        >
          {mode === "edit" ? t("Update") : t("Create")}
        </Button>,
      ]}
    >
      <>
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name"]} /> : null}

        <Form id={`${mode}-integration-form`} layout="vertical" onFinish={handleSubmitForm}>
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Form.Item
                required
                label={t("Name")}
                validateStatus="error"
                help={errors?.name ?? error?.message ?? ""}
              >
                <Input
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    handleResetError("name")
                  }}
                />
              </Form.Item>
            )}
            rules={{ required: { value: true, message: t("Please enter a name") } }}
          />
          <Form.Item
            label={t("Description")}
            validateStatus={errors?.description ? "error" : ""}
            help={errors?.description ? errors.description : ""}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  rows={3}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    handleResetError("description")
                  }}
                />
              )}
            />
          </Form.Item>
          <Controller
            name="service_url"
            control={control}
            rules={{ required: t("Please enter URL"), validate: validateUrl }}
            render={({ field, fieldState }) => (
              <Form.Item
                label={t("Service URL")}
                required
                validateStatus={fieldState.invalid || errors?.service_url ? "error" : ""}
                help={fieldState.error?.message ?? errors?.service_url ?? ""}
                extra={t(
                  "Use placeholders for variables: {{TESTY_PROJECT_ID}} and {{TESTY_PLAN_ID}}"
                )}
              >
                <Input.TextArea
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    handleResetError("service_url")
                  }}
                  placeholder={`https://my-jenkins.com/my_job/?test_plan=${PLAN_PLACEHOLDER}&project=${PROJECT_PLACEHOLDER}`}
                  rows={2}
                  allowClear
                />
              </Form.Item>
            )}
          />
          <Form.Item
            label={t("Open in new tab")}
            validateStatus={errors?.is_new_tab ? "error" : ""}
            help={errors?.is_new_tab ? errors.is_new_tab : ""}
          >
            <Controller
              name="is_new_tab"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch checked={value} onChange={onChange} />
              )}
            />
          </Form.Item>
        </Form>
      </>
    </Modal>
  )
}
