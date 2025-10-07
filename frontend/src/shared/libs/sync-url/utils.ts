import z from "zod"

import { showZodErrorsNotifications } from "../zod.utils"

interface SchemaFillBySearchParamsOptions {
  url?: string
}

export const schemaFillBySearchParams = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  options: SchemaFillBySearchParamsOptions = {}
) => {
  const params = new URLSearchParams(options?.url ?? window.location.search)
  const raw: Record<string, unknown> = {}
  params.forEach((value, key) => {
    raw[key] = value
  })
  const rawParsed = schema.safeParse(raw)
  if (!rawParsed.success) {
    showZodErrorsNotifications(rawParsed.error)
    throw new Error(rawParsed.error.message)
  }

  return schema.parse({
    ...schemaFillUndefined(schema),
    ...rawParsed.data,
  })
}

export const schemaFillUndefined = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => {
  const shape = schema.shape
  const parsed = schema.parse({})

  const result = {}

  for (const key of Object.keys(shape)) {
    if (key in parsed) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result[key] = parsed[key]
    } else {
      // @ts-expect-error
      result[key] = undefined
    }
  }

  return result as z.infer<typeof schema>
}

export const updateUrlParam = (searchParams: URLSearchParams, param: string, value: unknown) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  ) {
    searchParams.delete(param)
  } else {
    searchParams.set(param, String(value))
  }
}

export const makeDebugLogger = (enabled: boolean, slicePath: string, funcName: string) => {
  return (message: string, payload?: unknown) => {
    if (!enabled) return
    // eslint-disable-next-line no-console
    console.log(`[${funcName}:${slicePath}] ${message}`, payload)
  }
}
