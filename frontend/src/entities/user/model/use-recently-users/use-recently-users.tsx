import { useEffect, useState } from "react"

import { addRecentlyUser, getRecentlyUsers, removeRecentlyUser } from "./storage"

export const useRecentlyUsers = () => {
  const [recentlyUsers, setRecentlyUsers] = useState<User[]>([])

  const handleAddRecentlyUser = (selectedData: User) => {
    const newState = addRecentlyUser(selectedData)
    setRecentlyUsers(newState)
  }

  const handleRemoveRecentlyUser = (userId: number) => {
    const newState = removeRecentlyUser(userId)
    setRecentlyUsers(newState)
  }

  useEffect(() => {
    const recentlyUsersFromLocalStorage = getRecentlyUsers()
    if (recentlyUsersFromLocalStorage) {
      setRecentlyUsers(recentlyUsersFromLocalStorage)
    }
  }, [])

  return {
    recentlyUsers,
    handleAddRecentlyUser,
    handleRemoveRecentlyUser,
  }
}
