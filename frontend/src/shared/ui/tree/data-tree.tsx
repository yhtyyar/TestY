import { Tree, TreeNode, TreeProvider, TreeProviderProps } from "shared/ui/tree"

type Props<T> = Omit<TreeProviderProps<T>, "children">

export const DataTree = <T extends TreeNode>(props: Props<T>) => {
  return (
    <TreeProvider<T> {...props}>
      <Tree />
    </TreeProvider>
  )
}
