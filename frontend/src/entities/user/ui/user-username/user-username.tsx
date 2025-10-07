import styles from "./styles.module.css"

const CLEAR_USERNAMES = ["admin", "ci", "unknown"]

export const UserUsername = ({ username }: { username: string }) => {
  const isClear = CLEAR_USERNAMES.some((name) => name === username)

  if (isClear)
    return (
      <span className={styles.text} style={{ userSelect: "none" }}>
        {username}
      </span>
    )

  return (
    <a
      className={styles.text}
      href="#"
      target="_blank"
      rel="noreferrer"
    >
      {username}
    </a>
  )
}
