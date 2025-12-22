import { WechatOutlined } from "@ant-design/icons"
import { useGetCommentsQuery } from "entities/comments/api"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { AddComment } from "features/comments"

import { Button, ContainerLoader, TablePageChanger, usePagination } from "shared/ui"

import { CommentList } from ".."
import styles from "./styles.module.css"

interface Props {
  model: Models
  object_id: string
  ordering: Ordering
  onUpdateCommentsCount?: (count: number) => void
}

export const Comments = ({ model, object_id, ordering, onUpdateCommentsCount }: Props) => {
  const { t } = useTranslation()
  const [isShowAdd, setIsShowAdd] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const orderingRequest = ordering === "asc" ? "created_at" : "-created_at"
  const { pagination, setPage } = usePagination({ defaultPageSize: 5 })
  const comment_id = window.location.hash.split("#comment-")[1]
  const { data, isFetching } = useGetCommentsQuery({
    comment_id,
    model,
    object_id,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    ordering: orderingRequest,
  })

  useEffect(() => {
    if (data && onUpdateCommentsCount) {
      onUpdateCommentsCount(data.count)
    }
  }, [data])

  const handleAddCommentClick = () => {
    setIsShowAdd(true)
  }

  useEffect(() => {
    if (!isShowAdd) return

    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [isShowAdd])

  if (isFetching || !data) {
    return <ContainerLoader />
  }

  return (
    <>
      <CommentList comments={data.results ?? []} />
      <div className={styles.footer}>
        {!isShowAdd && (
          <Button
            id="add-comment-btn"
            onClick={handleAddCommentClick}
            icon={<WechatOutlined />}
            color="secondary-linear"
          >
            {t("Add comment")}
          </Button>
        )}
        <TablePageChanger
          current={pagination.pageIndex}
          pageSize={pagination.pageSize}
          total={data.count}
          onChangePage={setPage}
        />
      </div>
      {isShowAdd && <AddComment model={model} object_id={object_id} setIsShowAdd={setIsShowAdd} />}
      <div ref={bottomRef} />
    </>
  )
}
