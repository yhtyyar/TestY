import { z } from "zod"

import { DATA_VIEW_KEY } from "shared/constants"
import { getDataFromUrlOrLocalStorage } from "shared/libs"
import i18n from "shared/libs/init-i18"
import { parseArrayOfNumbers, parseBoolForUrl } from "shared/libs/zod.utils"

import { DATA_VIEW_TEST_CASE_LS_KEY } from "./constansts"

export const dataViewTestsSchema = z.object({
  dataView: z
    .enum(["list", "tree"])
    .default(
      getDataFromUrlOrLocalStorage<EntityView>(DATA_VIEW_KEY, DATA_VIEW_TEST_CASE_LS_KEY, "tree")
    ),
})

export const filterTestCaseSchema = z.object({
  name_or_id: z.string().default(""),
  suites: z
    .preprocess(
      parseArrayOfNumbers,
      z.array(z.number({ message: i18n.t("errors:zodErrors.arrayOfNumbers") }))
    )
    .default([]),
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
  test_suite_created_before: z.string().optional(),
  test_suite_created_after: z.string().optional(),
  test_case_created_before: z.string().optional(),
  test_case_created_after: z.string().optional(),
})

export type TestCaseDataFilters = z.infer<typeof filterTestCaseSchema>
