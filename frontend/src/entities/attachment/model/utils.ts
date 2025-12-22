import { config } from "shared/config"

export const canViewAttachment = (filename: string) => {
  const lowerFilename = filename.toLowerCase()
  return config.canViewAttachExtensions.some((ext) => lowerFilename.endsWith(ext.toLowerCase()))
}
