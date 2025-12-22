import { CopyOutlined, EditOutlined, HistoryOutlined, PlusOutlined } from "@ant-design/icons"
import { Row, Table } from "@tanstack/react-table"
import { Flex } from "antd"
import { MenuProps } from "antd/lib"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { ChangeTestSuite, CopySuite, DeleteSuite } from "features/suite"
import { CreateTestCase } from "features/test-case"
import { ArchiveTestPlan, ChangeTestPlan, CopyTestPlan, DeleteTestPlan } from "features/test-plan"

import ArchiveIcon from "shared/assets/yi-icons/archive.svg?react"
import DeleteIcon from "shared/assets/yi-icons/delete.svg?react"
import { CopyLinkContextMenu } from "shared/ui"
import { TreeNode } from "shared/ui/tree"

export interface TestPlanProps {
  row: Row<TreeNode<TestPlan>>
  type: "plans"
  projectId: number
  tree: Table<TreeNode<TestPlan>>
}

export interface TestSuiteProps {
  row: Row<TreeNode<Suite>>
  type: "suites"
  projectId: number
  tree: Table<TreeNode<Suite>>
}

export function useTreebarNodeContextMenu(
  props: TestPlanProps | TestSuiteProps
): MenuProps["items"] {
  const { t } = useTranslation()

  const refetchParentAfterCopy = (updatedEntity: BaseEntity) => {
    props.row.copy({
      parent: updatedEntity.parent?.id.toString(),
      // @ts-ignore
      data: {
        ...props.row.original.data,
        ...updatedEntity,
      },
    })
  }

  const refetchParentAfterArchive = () => {
    props.tree.rowRefetch(props.row.original.data.parent?.id.toString())
  }

  if (props.type === "plans") {
    return [
      {
        label: (
          <ChangeTestPlan
            type="create"
            as={
              <Flex gap={6} align="center">
                <PlusOutlined style={{ fontSize: 14 }} /> {t("Create child plan")}
              </Flex>
            }
            testPlan={props.row.original.data}
          />
        ),
        key: "create_child_plan",
      },
      {
        label: (
          <CopyTestPlan
            as={
              <Flex gap={6} align="center">
                <CopyOutlined style={{ fontSize: 14 }} />
                {t("Copy")}
              </Flex>
            }
            testPlan={props.row.original.data}
            onSubmit={refetchParentAfterCopy}
          />
        ),
        key: "copy_plan",
      },
      {
        label: (
          <CopyLinkContextMenu
            link={`${window.location.origin}/projects/${props.row.original.data.project}/plans/${props.row.original.data.id}`}
          />
        ),
        key: "copy_link_plan",
      },
      !props.row.original.data.is_archive && {
        label: (
          <ChangeTestPlan
            type="edit"
            as={
              <Flex gap={6} align="center">
                <EditOutlined style={{ fontSize: 14 }} />
                {t("Edit")}
              </Flex>
            }
            testPlan={props.row.original.data}
          />
        ),
        key: "edit_plan",
      },
      !props.row.original.data.is_archive && {
        label: (
          <ArchiveTestPlan
            as={
              <Flex gap={6} align="center">
                <ArchiveIcon width={14} height={14} /> {t("Archive")}
              </Flex>
            }
            testPlan={props.row.original.data}
            onSubmit={refetchParentAfterArchive}
          />
        ),
        key: "archive_plan",
      },
      {
        label: (
          <DeleteTestPlan
            as={
              <Flex gap={6} align="center">
                <DeleteIcon width={14} height={14} />
                {t("Delete")}
              </Flex>
            }
            testPlan={props.row.original.data}
            onSubmit={props.row.delete}
          />
        ),
        key: "delete_plan",
      },
      {
        type: "divider",
      },
      {
        label: (
          <Link
            to={`/projects/${props.projectId}/plans/${props.row.original.data.id}/activity`}
            style={{ gap: 6, display: "flex", flexDirection: "row", alignItems: "center" }}
          >
            <HistoryOutlined style={{ fontSize: 14 }} /> {t("View activity")}
          </Link>
        ),
        key: "view_activity",
      },
    ].filter(Boolean) as MenuProps["items"]
  }

  return [
    {
      label: (
        <ChangeTestSuite
          type="create"
          as={
            <Flex gap={6} align="center">
              <PlusOutlined style={{ fontSize: 14 }} />
              {t("Create child suite")}
            </Flex>
          }
          suite={props.row.original.data}
        />
      ),
      key: "create_child_suite",
    },
    {
      label: (
        <CopySuite
          as={
            <Flex gap={6} align="center">
              <CopyOutlined style={{ fontSize: 14 }} />
              {t("Copy")}
            </Flex>
          }
          suite={props.row.original.data}
          onSubmit={refetchParentAfterCopy}
        />
      ),
      key: "copy_suite",
    },
    {
      label: (
        <CopyLinkContextMenu
          link={`${window.location.origin}/projects/${props.row.original.data.project}/suites/${props.row.original.data.id}`}
        />
      ),
      key: "copy_link_suite",
    },
    {
      label: (
        <ChangeTestSuite
          type="edit"
          as={
            <Flex gap={6} align="center">
              <EditOutlined style={{ fontSize: 14 }} />
              {t("Edit")}
            </Flex>
          }
          suite={props.row.original.data}
        />
      ),
      key: "edit_suite",
    },
    {
      label: (
        <DeleteSuite
          as={
            <Flex gap={6} align="center">
              <DeleteIcon width={14} height={14} />
              {t("Delete")}
            </Flex>
          }
          suite={props.row.original.data}
          onSubmit={props.row.delete}
        />
      ),
      key: "delete_suite",
    },
    {
      type: "divider",
    },
    {
      label: (
        <CreateTestCase
          as={
            <Flex gap={6} align="center">
              <PlusOutlined style={{ fontSize: 14 }} />
              {t("Create Test Case")}
            </Flex>
          }
          parentSuite={props.row.original.data}
        />
      ),
      key: "create_test_case",
    },
  ]
}
