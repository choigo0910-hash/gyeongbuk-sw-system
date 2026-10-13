"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
  id?: string
  name?: string
  value?: string
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
  id,
  name,
  value = "true",
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(checked)

  const isControlled = onCheckedChange !== undefined
  const isChecked = isControlled ? checked : internalChecked

  const handleChange = () => {
    const newValue = !isChecked
    if (onCheckedChange) {
      onCheckedChange(newValue)
    } else {
      setInternalChecked(newValue)
    }
  }

  React.useEffect(() => {
    if (isControlled) {
      setInternalChecked(checked)
    }
  }, [isControlled, checked])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleChange}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        isChecked ? "bg-blue-600" : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      id={id}
      name={name}
      value={value}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          isChecked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  )
}
