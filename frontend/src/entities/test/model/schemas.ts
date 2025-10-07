import { z } from "zod"

import { DATA_VIEW_KEY } from "shared/constants"
import { getDataFromUrlOrLocalStorage } from "shared/libs"
import i18n from "shared/libs/init-i18"
import { parseArrayOfNumbers, parseArrayOfStrings, parseBoolForUrl } from "shared/libs/zod.utils"

import { DATA_VIEW_TESTS_LS_KEY } from "./constansts"

export const dataViewTestsSchema = z.object({
  dataView: z
    .enum(["list", "tree"])
    .default(
      getDataFromUrlOrLocalStorage<EntityView>(DATA_VIEW_KEY, DATA_VIEW_TESTS_LS_KEY, "tree")
    ),
})

export const filterTestsSchema = z.object({
  name_or_id: z.string().default(""),
  plans: z.preprocess(parseArrayOfNumbers, z.array(z.number())).default([]),
  suites: z
    .preprocess(
      parseArrayOfNumbers,
      z.array(z.number({ message: i18n.t("errors:zodErrors.arrayOfNumbers") }))
    )
    .default([]),
  statuses: z.preprocess(parseArrayOfStrings, z.array(z.string())).default([]),
  assignee: z.preprocess(parseArrayOfStrings, z.array(z.string())).default([]),
  labels: z
    .preprocess(
      parseArrayOfNumbers,
      z.array(z.number({ message: i18n.t("errors:zodErrors.arrayOfNumbers") }))
    )
    .default([]),
  not_labels: z
    .preprocess(
      parseArrayOfNumbers,
      z.array(z.number({ message: i18n.t("errors:zodErrors.arrayOfNumbers") }))
    )
    .default([]),
  labels_condition: z
    .enum(["and", "or"], { message: i18n.t("errors:zodErrors.andOrOr") })
    .optional(),
  is_archive: z
    .preprocess(parseBoolForUrl, z.boolean({ message: i18n.t("errors:zodErrors.trueOrFalse") }))
    .optional(),
  test_plan_started_before: z.string().optional(),
  test_plan_started_after: z.string().optional(),
  test_plan_created_before: z.string().optional(),
  test_plan_created_after: z.string().optional(),
  test_created_before: z.string().optional(),
  test_created_after: z.string().optional(),
  _n: z.number().optional(),
})

export type TestDataFilters = z.infer<typeof filterTestsSchema>
