import { UserOutlined } from "@ant-design/icons"
import { Avatar } from "antd"
import { useEffect, useState } from "react"

import styles from "./styles.module.css"

interface UserAvatarProps {
  avatar_link: string | null
  size?: number
  nonce?: number
}

export const UserAvatar = ({ avatar_link, nonce = 1, size = 32 }: UserAvatarProps) => {
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (!avatar_link) {
      setIsValid(false)
      return
    }

    const img = new Image()
    img.onload = () => setIsValid(true)
    img.onerror = () => setIsValid(false)
    img.src = `${avatar_link}?nonce=${nonce}`
  }, [avatar_link, nonce])

  return (
    <div className={styles.image} style={{ minWidth: size, minHeight: size, width: size }}>
      {!isValid ? (
        <Avatar
          icon={<UserOutlined id="username-icon" data-testid="username-icon" />}
          size={size}
          style={{ minWidth: size, minHeight: size }}
        />
      ) : (
        <img
          id="username-photo"
          src={`${avatar_link}?nonce=${nonce}`}
          alt="avatar"
          style={{ minWidth: size, width: size, height: size }}
          loading="lazy"
        />
      )}
    </div>
  )
}
