import dayjs, { Dayjs } from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { useState } from "react"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export const useDatepicker = () => {
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null)
  const [dateTo, setDateTo] = useState<Dayjs | null>(null)

  const disabledDateFrom = (current: Dayjs) => {
    return dateTo ? current.isSameOrAfter(dateTo, "day") : false
  }

  const disabledDateTo = (current: Dayjs) => {
    return dateFrom ? current.isSameOrBefore(dateFrom, "day") : false
  }

  return {
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    disabledDateFrom,
    disabledDateTo,
  }
}
