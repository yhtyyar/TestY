import { RECENTLY_USERS_KEY } from "."

export const getRecentlyUsers = (): User[] | null => {
  try {
    const recentlyUsers = localStorage.getItem(RECENTLY_USERS_KEY)
    return recentlyUsers ? (JSON.parse(recentlyUsers) as User[]) : null
  } catch {
    return null
  }
}

export const addRecentlyUser = (user: User): User[] => {
  const limit = 5
  try {
    const recentlyUsers = localStorage.getItem(RECENTLY_USERS_KEY)
    let users: User[] = recentlyUsers ? (JSON.parse(recentlyUsers) as User[]) : []
    users = users.filter((u) => u.id !== user.id)
    users.unshift(user)
    if (users.length > limit) {
      users = users.slice(0, limit)
    }
    localStorage.setItem(RECENTLY_USERS_KEY, JSON.stringify(users))
    return users
  } catch {
    console.error("Failed to add recently user")
    return []
  }
}

export const removeRecentlyUser = (userId: number): User[] => {
  try {
    const recentlyUsers = localStorage.getItem(RECENTLY_USERS_KEY)
    let users: User[] = recentlyUsers ? (JSON.parse(recentlyUsers) as User[]) : []
    users = users.filter((u) => u.id !== userId)
    localStorage.setItem(RECENTLY_USERS_KEY, JSON.stringify(users))
    return users
  } catch {
    console.error("Failed to remove recently user")
    return []
  }
}

export const clearRecentlyUsers = () => {
  localStorage.removeItem(RECENTLY_USERS_KEY)
}
