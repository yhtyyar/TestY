import { Divider } from "antd"

import { Label } from "../label"
import styles from "./styles.module.css"

interface LabelFieldProps {
  title: string
  labels: SelectedLabel[]
}

export const LabelField = ({ title, labels }: LabelFieldProps) => {
  return (
    <>
      <Divider orientation="left" style={{ margin: 0 }} orientationMargin={0}>
        {title}
      </Divider>
      <ul className={styles.list} data-testid="labels-list">
        {labels.map((label) => (
          <li key={label.value}>
            <Label content={label.label} color={label.color} />
          </li>
        ))}
      </ul>
    </>
  )
}
