export type ColorTreeType = "tree-linear" | "table-linear"

export interface LazyTreeNodeParams {
  page: number
  parent?: string | null
  _n?: string | number
}

export interface LoadChildrenParams {
  page: number
  hasMore: boolean
}

export interface BaseTreeNodeProps {
  can_open?: boolean
  [key: string]: unknown
}

export interface BaseNodeEntity {
  id: string | number
  name: string
}

export interface TreeNode<
  TData = BaseNodeEntity & object,
  TProps extends BaseTreeNodeProps = BaseTreeNodeProps,
> {
  id: string
  parent: string | null
  title: string
  data: TData
  children: TreeNode<TData, TProps>[]
  props: TProps
}
