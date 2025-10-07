/* eslint-disable @typescript-eslint/no-explicit-any */
import { ActionCreatorWithPayload, ActionCreatorWithoutPayload } from "@reduxjs/toolkit"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { DefaultValues, FieldValues, Path, SubmitHandler, useForm } from "react-hook-form"

import { useAppDispatch } from "app/hooks"

import { FilterSettings } from "entities/test/model"

import { useProjectContext } from "pages/project"

interface Props<TFilters extends FieldValues> {
  filter: TFilters
  emptyFilter: TFilters
  filterSettings: FilterSettings
  shouldResetForm: boolean
  actions: {
    updateFilter: ActionCreatorWithPayload<Partial<TFilters>, string>
    clearFilter: ActionCreatorWithoutPayload<any>
    resetFormComplete: ActionCreatorWithoutPayload<any>
    updateOrdering: ActionCreatorWithPayload<string, any>
    updateFilterSettings: ActionCreatorWithPayload<Partial<FilterSettings>, any>
    resetFilterSettings: ActionCreatorWithoutPayload<any>
  }
  onSubmitExtra?: () => void
}

export function useFilterDrawer<TFilters extends FieldValues>({
  filter,
  emptyFilter,
  filterSettings,
  shouldResetForm,
  actions,
  onSubmitExtra,
}: Props<TFilters>) {
  const dispatch = useAppDispatch()
  const { id: projectId } = useProjectContext()
  const [isOpenFilter, setIsOpenFilter] = useState(false)

  const form = useForm<TFilters>({
    defaultValues: filter as DefaultValues<TFilters>,
  })

  useEffect(() => {
    if (shouldResetForm) {
      form.reset(emptyFilter)
      dispatch(actions.resetFormComplete())
    }
  }, [shouldResetForm])

  const handleUpdateFilterData = (params: Partial<TFilters>) => {
    dispatch(actions.updateFilter(params))
    form.reset(params as TFilters)
  }

  const handleUpdateFilterSettings = (params: Partial<FilterSettings>) => {
    dispatch(actions.updateFilterSettings(params))
  }

  const handleClearFilter = () => {
    dispatch(actions.clearFilter())
  }

  const handleOpenFilter = () => {
    setIsOpenFilter(true)
  }

  const handleCloseFilter = () => {
    triggerSubmit()
    setIsOpenFilter(false)
  }

  const onSubmit: SubmitHandler<TFilters> = (data) => {
    onSubmitExtra?.()
    if (Object.keys(form.formState.dirtyFields).length) {
      dispatch(actions.updateFilter(data))
      form.reset(data)
    }
  }

  const triggerSubmit = () => {
    form.handleSubmit(onSubmit)()
  }

  const getDateValue = (key: Path<TFilters>) =>
    form.getValues(key) ? dayjs(form.getValues(key)) : undefined

  useEffect(() => {
    if (filterSettings.filterProjectId !== null && filterSettings.filterProjectId !== projectId) {
      dispatch(actions.clearFilter())
      dispatch(actions.resetFilterSettings())
      return
    }
    dispatch(actions.updateFilterSettings({ filterProjectId: projectId }))
  }, [projectId, filterSettings.filterProjectId])

  useEffect(() => {
    form.reset(filter)
  }, [filterSettings.selected])

  useEffect(() => {
    form.reset(filter)
  }, [filter])

  return {
    isOpenFilter,
    form,
    setIsOpenFilter,
    handleUpdateFilterData,
    handleUpdateFilterSettings,
    handleClearFilter,
    handleOpenFilter,
    handleCloseFilter,
    triggerSubmit,
    getDateValue,
  }
}
