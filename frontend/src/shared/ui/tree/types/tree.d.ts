/* eslint-disable @typescript-eslint/no-empty-interface */
import "@tanstack/react-table"

import {
  LazyTreeInstance,
  LazyTreeOptions,
  LazyTreeRowModel,
  LazyTreeState,
} from "../features/lazy-tree-feature"

declare module "@tanstack/react-table" {
  interface TableState extends LazyTreeState {}
  interface TableOptionsResolved<TData extends TreeNode<TData>> extends LazyTreeOptions<TData> {}
  interface Table<TData extends TreeNode<TData>> extends LazyTreeInstance<TData> {}
  interface Row<TData extends TreeNode<TData>> extends LazyTreeRowModel<TData> {}
}
