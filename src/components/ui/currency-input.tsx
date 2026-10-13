import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCurrencyInput } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'value' | 'onChange' | 'type'> {
  value: number | null
  onChange: (value: number | null) => void
  suffix?: string  // Default: "원"
  placeholder?: string
  allowNegative?: boolean
  min?: number
  max?: number
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({
    value,
    onChange,
    suffix = "원",
    placeholder = "0",
    allowNegative = false,
    min,
    max,
    className,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('')
    const [isFocused, setIsFocused] = React.useState(false)

    // Update display value when prop value changes (only when not focused)
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatCurrencyInput(value))
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d-]/g, '') // Keep only digits and minus

      // Handle negative numbers
      if (rawValue === '-' && allowNegative) {
        setDisplayValue('-')
        onChange(null)
        return
      }

      const numValue = rawValue ? parseInt(rawValue, 10) : 0

      // Apply constraints
      if (min !== undefined && numValue < min) return
      if (max !== undefined && numValue > max) return

      setDisplayValue(formatCurrencyInput(numValue))
      onChange(numValue)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setDisplayValue(formatCurrencyInput(value))
      onBlur?.(e)
    }

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={isFocused ? displayValue.replace(/,/g, '') : displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "input h-10 w-full rounded-md border border-gray-300 bg-white py-2 pr-10 text-sm ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-pink-600 focus-visible:ring-2 focus-visible:ring-pink-500/10 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"

export { CurrencyInput }
