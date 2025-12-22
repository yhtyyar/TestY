import { Row } from "@tanstack/react-table"
import { useTranslation } from "react-i18next"

import { UserAvatar, UserUsername } from "entities/user/ui"

import { TreeNode } from "shared/ui/tree"

import styles from "./styles.module.css"

interface Props<T> {
  row: Row<T>
}

export const ColumnAssigneeUsername = <T extends TreeNode<Test>>({ row }: Props<T>) => {
  const { t } = useTranslation()
  if (!row.original.data.assignee_username) {
    return <span style={{ opacity: 0.7 }}>{t("Nobody")}</span>
  }

  return (
    <div className={styles.avatarBlock}>
      <UserAvatar size={32} avatar_link={row.original.data.avatar_link} />
      <UserUsername username={row.original.data.assignee_username ?? ""} />
    </div>
  )
}
