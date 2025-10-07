import { notification } from "antd"
import { ZodError } from "zod"

export const showZodErrorsNotifications = (error: ZodError, title = "Ошибка валидации") => {
  const errorMessages = error.issues.map((issue) => {
    const field = issue.path.join(".")
    return `${field}: ${issue.message}`
  })

  errorMessages.forEach((message) => {
    notification.error({
      message: title,
      description: message,
      placement: "topRight",
      duration: 5,
    })
  })
}

export const parseBoolForUrl = (val: unknown): boolean | undefined => {
  if (typeof val === "boolean") return val
  const normalized = String(val).trim().toLowerCase()
  if (["true", "1"].includes(normalized)) return true
  if (["false", "0"].includes(normalized)) return false
  return undefined
}

export const parseBool = (val: unknown): boolean => {
  return parseBoolForUrl(val) ?? !!val
}

export const parseArrayOfStrings = (val: unknown) => {
  if (Array.isArray(val)) {
    return val.map(String).filter((s) => s.trim() !== "")
  }
  if (typeof val === "string") {
    const parts = val.split(",").map((s) => s.trim())
    return parts.filter((s) => s !== "")
  }
  return val
}

export const parseArrayOfNumbers = (val: unknown) => {
  if (Array.isArray(val)) {
    return val.map((v) => Number(v))
  }
  if (typeof val === "string") {
    const parts = val
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "")
    return parts.map((s) => Number(s))
  }
  return val
}
