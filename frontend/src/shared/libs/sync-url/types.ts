import { Path } from "react-hook-form"
import { ZodObject } from "zod"

import { AppDispatch, RootState } from "app/store"

export type EffectType<TSchema extends ZodObject> = (
  validated: ReturnType<TSchema["parse"]>,
  dispatch: AppDispatch,
  state: RootState
) => void

export type HistoryType = "push" | "replace"

export type SlicePath = Path<RootState>
