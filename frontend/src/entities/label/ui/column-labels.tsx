import { Label } from "entities/label/ui"

interface Props {
  labels: Pick<Label, "id" | "name" | "color">[]
}

export const ColumnLabels = ({ labels }: Props) => {
  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "row",
        gap: 4,
        padding: 0,
        margin: 0,
      }}
    >
      {labels.map((label) => (
        <li key={label.id} style={{ listStyleType: "none" }}>
          <Label content={label.name} color={label.color} truncate />
        </li>
      ))}
    </ul>
  )
}
