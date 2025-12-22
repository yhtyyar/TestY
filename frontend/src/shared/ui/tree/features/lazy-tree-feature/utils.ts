import { BaseTreeNodeProps, TreeNode } from "../../types/types"

export const getStoreExpandedIds = (cacheKey: string) => {
  const openedIds = localStorage.getItem(`${cacheKey}_openedIds`)
  return new Set(openedIds ? (JSON.parse(openedIds) as string[]) : [])
}

export const setStoreExpandedIds = (cacheKey: string, openedIds: Set<string>) => {
  localStorage.setItem(`${cacheKey}_openedIds`, JSON.stringify([...openedIds]))
}

export const clearStoreExpandedIds = (cacheKey: string) => {
  localStorage.removeItem(`${cacheKey}_openedIds`)
}

export const removeNode = <T extends TreeNode<T>>(data: T[], nodeId: string) =>
  data.filter((item) => {
    if (item.children?.length) {
      item.children = removeNode(item.children, nodeId)
    }
    return item.id.toString() !== nodeId
  })

const updateTree = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  updater: (node: T) => T
): T[] => {
  return data.map((item) => {
    if (item.id.toString() === nodeId) {
      return updater(item)
    }

    if (item.children?.length > 0) {
      return {
        ...item,
        children: updateTree(item.children as T[], nodeId, updater),
      }
    }

    return item
  })
}

export const updateNodeProps = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  newProps: Partial<BaseTreeNodeProps>
): T[] => {
  return updateTree(data, nodeId, (node) => ({
    ...node,
    props: { ...node.props, ...newProps },
  }))
}

export const updateNodeData = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  newData: Partial<TreeNode<T>["data"]>
): T[] => {
  return updateTree(data, nodeId, (node) => ({
    ...node,
    data: { ...node.data, ...newData },
  }))
}

export const updateNodeChildren = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  newChildren: T[]
): T[] => {
  return updateTree(data, nodeId, (node) => ({
    ...node,
    children: newChildren,
  }))
}

export const addNodeChildren = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  newChildren: T[]
): T[] =>
  updateTree(data, nodeId, (node) => ({
    ...node,
    children: [...node.children, ...newChildren],
  }))

export const updateNode = <T extends TreeNode<T>>(
  data: T[],
  nodeId: string,
  updates: Partial<Omit<T, "children">> & { children?: T[] }
): T[] => {
  return updateTree(data, nodeId, (node) => ({
    ...node,
    ...updates,
  }))
}
