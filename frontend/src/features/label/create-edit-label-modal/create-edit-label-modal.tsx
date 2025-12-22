import { CloseOutlined } from "@ant-design/icons"
import { ColorPicker, Flex, Form, Input, Select } from "antd"
import classNames from "classnames"
import { Controller } from "react-hook-form"
import { useTranslation } from "react-i18next"

import ContextMenuIcon from "shared/assets/yi-icons/context-menu.svg?react"
import { labelTypes } from "shared/config/label-types"
import { ErrorObj } from "shared/hooks"
import { AlertError, Button } from "shared/ui"
import { NyModal } from "shared/ui/ny-modal/ny-modal"

import styles from "./styles.module.css"
import {
  UseCreateEditLabelModalProps,
  useCreateEditLabelModal,
} from "./use-create-edit-label-modal"

export const CreateEditLabelModal = (props: UseCreateEditLabelModalProps) => {
  const { t } = useTranslation()
  const {
    title,
    isLoading,
    isDirty,
    control,
    errors,
    BASE_COLORS,
    handleCancel,
    handleSubmitForm,
  } = useCreateEditLabelModal(props)

  return (
    <NyModal
      bodyProps={{ "data-testid": `${props.mode}-label-modal-body` }}
      wrapProps={{ "data-testid": `${props.mode}-label-modal-wrapper` }}
      title={<span data-testid={`${props.mode}-label-modal-title`}>{title}</span>}
      open={props.isShow}
      onCancel={handleCancel}
      width={404}
      centered
      footer={[
        <Button
          id={`${props.mode}-label-close`}
          key="back"
          onClick={handleCancel}
          color="secondary-linear"
        >
          {t("Close")}
        </Button>,
        <Button
          id={`${props.mode}-label-button`}
          loading={isLoading}
          key="submit"
          onClick={handleSubmitForm}
          color="accent"
          disabled={!isDirty}
        >
          {props.mode === "edit" ? t("Update") : t("Create")}
        </Button>,
      ]}
    >
      <>
        {errors ? <AlertError error={errors as ErrorObj} skipFields={["name"]} /> : null}

        <Form id={`${props.mode}-label-form`} layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            label={t("Name")}
            validateStatus={errors?.name ? "error" : ""}
            help={errors?.name ? errors.name : ""}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>
          <Form.Item
            label={t("Type")}
            validateStatus={errors?.type ? "error" : ""}
            help={errors?.type ? errors.type : ""}
          >
            <Controller
              name="type"
              control={control}
              defaultValue={0}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder={t("Please select")}
                  style={{ width: "100%" }}
                  options={labelTypes}
                />
              )}
            />
          </Form.Item>
          <Form.Item
            label={t("Color")}
            validateStatus={errors?.color ? "error" : ""}
            help={errors?.color ? errors.color : ""}
          >
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Flex align="center" justify="space-between">
                  {BASE_COLORS.map((baseColor, index) => (
                    <div
                      key={index}
                      className={classNames(styles.baseColorBox, {
                        [styles.activeBox]: field.value === baseColor,
                      })}
                      onClick={() => field.onChange(baseColor)}
                      data-testid={`${props.mode}-label-color-${baseColor}-button`}
                    >
                      <div
                        className={styles.boxInner}
                        style={{ backgroundColor: baseColor ? baseColor : "transparent" }}
                      >
                        {!baseColor ? <CloseOutlined style={{ fontSize: 18 }} /> : null}
                      </div>
                    </div>
                  ))}
                  <ColorPicker
                    value={field.value}
                    format="rgb"
                    disabledAlpha
                    onChangeComplete={(color) => {
                      field.onChange(color.toRgbString())
                    }}
                    data-testid={`${props.mode}-label-color-picker-button`}
                    getPopupContainer={(triggerNode) => {
                      triggerNode.setAttribute("id", `${props.mode}-label-color-picker-popup`)
                      return triggerNode
                    }}
                  >
                    <div className={styles.baseColorBox}>
                      <div
                        className={styles.boxInner}
                        style={{
                          backgroundColor: field.value ?? "var(--y-color-background-alternative)",
                        }}
                      >
                        <ContextMenuIcon width={24} />
                      </div>
                    </div>
                  </ColorPicker>
                </Flex>
              )}
            />
          </Form.Item>
        </Form>
      </>
    </NyModal>
  )
}
