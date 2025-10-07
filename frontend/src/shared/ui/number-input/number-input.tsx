import classNames from "classnames"
import { ChangeEvent, useEffect, useState } from "react"

import styles from "./styles.module.css"

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: number
  onChange: (value: number) => void
  onAccept: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export const NumberInput = ({
  min = 0,
  max = 100,
  value,
  className,
  onChange,
  onAccept,
  ...props
}: Props) => {
  const [inputValue, setInputValue] = useState(String(value))

  const sanitizeValue = (val: string | number) => {
    if (val === "" || isNaN(Number(val))) return min
    return Math.min(max, Math.max(min, Number(val)))
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleBlur = () => {
    const finalValue = sanitizeValue(inputValue)
    onChange(finalValue)
    onAccept(finalValue)
    setInputValue(String(finalValue))
  }

  const currentValue = sanitizeValue(value)

  const width = Math.max(1, currentValue.toString().length)

  useEffect(() => {
    setInputValue(String(value))
  }, [value])

  return (
    <input
      className={classNames(styles.input, className)}
      type="number"
      max={max}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur()
        }
      }}
      style={{
        width: `${width}ch`,
        textAlign: "center",
      }}
      {...props}
    />
  )
}
