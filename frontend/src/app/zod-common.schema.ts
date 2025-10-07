import { z } from "zod"

import { fromUrl } from "shared/libs"
import i18n from "shared/libs/init-i18"

export const paginationSchema = z.object({
  page: z.coerce
    .number({ message: i18n.t("errors:zodErrors.number") })
    .int()
    .min(1)
    .default(() => fromUrl("page", 1, Number)),
  page_size: z.coerce
    .number({ message: i18n.t("errors:zodErrors.number") })
    .int()
    .min(1)
    .max(100)
    .default(() => fromUrl("page_size", 10, Number)),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export const orderingSchema = z.object({
  ordering: z.coerce.string().default("name"),
})

export type Ordering = z.infer<typeof orderingSchema>
