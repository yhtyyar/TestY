import styles from "./styles.module.css"

interface Props extends HTMLDataAttribute {
  color: string
  label: string
  id: string
}

export const StatusStatistic = ({ color, label, id, ...props }: Props) => {
  return (
    <div className={styles.label} {...props}>
      <div className={styles.statusIcon} style={{ backgroundColor: color }} />
      <span data-testid={`${id}-status-label-${label}`}>{label}</span>
    </div>
  )
}
