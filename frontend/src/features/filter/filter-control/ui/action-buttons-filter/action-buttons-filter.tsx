import {
  CheckOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons"
import { Flex, Popover, Tooltip } from "antd"
import { useMeContext } from "processes"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { FilterSettings } from "entities/test/model/test-filter-slice.types"

import { useProjectContext } from "pages/project"

import ContextMenuIcon from "shared/assets/yi-icons/context-menu.svg?react"
import ResetIcon from "shared/assets/yi-icons/reset.svg?react"
import SaveIcon from "shared/assets/yi-icons/save.svg?react"
import { useAntdModals } from "shared/hooks"
import { clearObject } from "shared/libs"
import { Button } from "shared/ui"

import styles from "./styles.module.css"

interface Props {
  type: "plans" | "suites"
  filterData: Record<string, unknown>
  filterSettings: FilterSettings
  onDelete: (name: string) => void
  updateSettings: (settings: Partial<FilterSettings>) => void
  resetFilterToSelected: () => void
  clearFilter: () => void
}

export const ActionButtonsFilter = ({
  type,
  filterData,
  filterSettings,
  onDelete,
  updateSettings,
  resetFilterToSelected,
  clearFilter,
}: Props) => {
  const { t } = useTranslation(["translation", "errors"])
  const { antdNotification } = useAntdModals()

  const { userConfig, updateConfig } = useMeContext()
  const project = useProjectContext()
  const filtersKey = type === "plans" ? "test_plans" : "test_suites"
  const [isOpen, setIsOpen] = useState(false)

  const handleSaveChanges = async () => {
    if (!filterSettings.selected) {
      return
    }

    const clearedData = clearObject(filterData)
    const filterAsUrl = new URLSearchParams(clearedData as Record<string, string>)
    await updateConfig({
      ...userConfig,
      [filtersKey]: {
        ...userConfig?.[filtersKey],
        filters: {
          ...userConfig?.[filtersKey]?.filters,
          [project.id]: {
            ...userConfig?.[filtersKey]?.filters?.[project.id],
            [filterSettings.selected]: filterAsUrl.toString(),
          },
        },
      },
    })
    setIsOpen(false)
    antdNotification.success("update-filter", {
      description: t("Filter updated successfully"),
    })
  }

  const handleSaveAsNew = () => {
    updateSettings({
      editing: true,
      creatingNew: true,
      editingValue: filterSettings.selected ?? "",
    })
  }

  const handleNewNameAccept = () => {
    if (!filterSettings.editingValue.length) {
      antdNotification.error("action-buttons-filter", {
        description: t("errors:filterNameNotBeEmpty"),
      })
      return
    }

    const isNew = filterSettings.creatingNew || !filterSettings.selected
    if (isNew) {
      saveAsNew()
    } else {
      renameFilter()
    }

    antdNotification.success(isNew ? "create-filter" : "update-filter", {
      description: isNew ? t("Filter created successfully") : t("Filter updated successfully"),
    })

    updateSettings({
      selected: filterSettings.editingValue,
      editing: false,
      creatingNew: false,
      editingValue: "",
    })
    setIsOpen(false)
  }

  const handleNewNameClose = () => {
    updateSettings({ editing: false, editingValue: "" })
    setIsOpen(false)
  }

  const handleShowEdit = () => {
    updateSettings({
      editing: true,
      creatingNew: false,
      editingValue: filterSettings.selected ?? "",
    })
  }

  const saveAsNew = async () => {
    const clearedData = clearObject(filterData)
    const filterAsUrl = new URLSearchParams(clearedData as Record<string, string>)

    await updateConfig({
      ...userConfig,
      [filtersKey]: {
        ...userConfig?.[filtersKey],
        filters: {
          ...userConfig?.[filtersKey]?.filters,
          [project.id]: {
            ...userConfig?.[filtersKey]?.filters?.[project.id],
            [filterSettings.editingValue]: filterAsUrl.toString(),
          },
        },
      },
    })
  }

  const renameFilter = async () => {
    if (!filterSettings.selected) {
      return
    }

    const selectedFilterValue =
      userConfig?.[filtersKey]?.filters?.[project.id]?.[filterSettings.selected]
    const filtersObject = { ...userConfig?.[filtersKey]?.filters?.[project.id] }
    delete filtersObject[filterSettings.selected]

    await updateConfig({
      ...userConfig,
      [filtersKey]: {
        ...userConfig?.[filtersKey],
        filters: {
          ...userConfig?.[filtersKey]?.filters,
          [project.id]: {
            ...filtersObject,
            [filterSettings.editingValue]: selectedFilterValue,
          },
        },
      },
    })
  }

  if (filterSettings.editing) {
    return (
      <Flex style={{ marginLeft: "auto" }} gap={8}>
        <Button
          size="m"
          color="secondary-linear"
          shape="circle"
          type="button"
          icon={<CheckOutlined style={{ color: "var(--y-success-block)" }} />}
          onClick={handleNewNameAccept}
          data-testid="action-buttons-filter-rename-accept"
        />
        <Button
          size="m"
          color="secondary-linear"
          shape="circle"
          type="button"
          icon={<CloseOutlined />}
          onClick={handleNewNameClose}
          data-testid="action-buttons-filter-rename-close"
        />
      </Flex>
    )
  }

  if (filterSettings.selected) {
    return (
      <Flex gap={8}>
        {filterSettings.hasUnsavedChanges && (
          <Tooltip title={t("Reset filter")}>
            <Button
              size="m"
              color="ghost"
              shape="square"
              type="button"
              icon={<ResetIcon />}
              onClick={resetFilterToSelected}
              data-testid="action-buttons-filter-reset"
            />
          </Tooltip>
        )}
        <Popover
          id="menu-filter"
          styles={{
            body: { padding: "8px 0" },
          }}
          content={
            <ul className={styles.filterMenuList}>
              {filterSettings.hasUnsavedChanges && (
                <li className={styles.filterMenuListItem}>
                  <Button
                    className={styles.filterMenuListItemBtn}
                    size="m"
                    color="ghost"
                    type="button"
                    icon={<CheckOutlined style={{ fontSize: 14 }} />}
                    onClick={handleSaveChanges}
                    data-testid="action-buttons-filter-save-changes"
                  >
                    {t("Save Changes")}
                  </Button>
                </li>
              )}
              <li className={styles.filterMenuListItem}>
                <Button
                  className={styles.filterMenuListItemBtn}
                  size="m"
                  color="ghost"
                  type="button"
                  icon={<CopyOutlined style={{ fontSize: 14 }} />}
                  onClick={handleSaveAsNew}
                  data-testid="action-buttons-filter-save-as-new"
                >
                  {t("Save as New Filter")}
                </Button>
              </li>
              <li className={styles.filterMenuListItem}>
                <Button
                  className={styles.filterMenuListItemBtn}
                  size="m"
                  color="ghost"
                  type="button"
                  icon={<EditOutlined style={{ fontSize: 14 }} />}
                  onClick={handleShowEdit}
                  data-testid="action-buttons-filter-rename"
                >
                  {t("Rename")}
                </Button>
              </li>
              <li className={styles.filterMenuListItem}>
                <Button
                  className={styles.filterMenuListItemBtn}
                  size="m"
                  color="ghost"
                  type="button"
                  style={{ color: "var(--y-error-block)" }}
                  icon={<DeleteOutlined style={{ fontSize: 14, color: "var(--y-error-block)" }} />}
                  onClick={() => onDelete(filterSettings.selected ?? "")}
                  data-testid="action-buttons-filter-delete"
                >
                  {t("Delete")}
                </Button>
              </li>
            </ul>
          }
          placement="bottomRight"
          trigger="click"
          open={isOpen}
          onOpenChange={setIsOpen}
          arrow={false}
        >
          <Button
            size="m"
            color="ghost"
            type="button"
            shape="square"
            icon={<ContextMenuIcon />}
            data-testid="action-buttons-filter-context-menu"
          />
        </Popover>
      </Flex>
    )
  }

  return (
    <Flex gap={8}>
      {filterSettings.hasUnsavedChanges && (
        <Tooltip title="Reset filter">
          <Button
            size="m"
            color="ghost"
            type="button"
            shape="square"
            icon={<ResetIcon />}
            onClick={clearFilter}
            data-testid="action-buttons-filter-reset"
          />
        </Tooltip>
      )}
      <Tooltip title="Save filter" placement="bottomRight">
        <Button
          size="m"
          color="ghost"
          type="button"
          shape="square"
          icon={<SaveIcon />}
          onClick={handleShowEdit}
          data-testid="action-buttons-filter-save"
        />
      </Tooltip>
    </Flex>
  )
}
