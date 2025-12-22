import { useTreeProvider } from "../../tree-provider"

interface Props {
  count?: number
}

export const TableRowPlaceholder = ({ count = 1 }: Props) => {
  const { styles: stylesFromCtx } = useTreeProvider()
  return Array(count)
    .fill(0)
    .map((_, i) => (
      <div key={i} style={{ minWidth: 16, width: 16, height: 16, ...stylesFromCtx?.placeholder }} />
    ))
}
