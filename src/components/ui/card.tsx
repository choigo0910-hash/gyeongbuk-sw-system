import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "card",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-tight tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Stat Card for Dashboard
interface CardStatProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  label: string
  value: string | number
  color?: "primary" | "blue" | "purple" | "emerald" | "orange" | "pink"
}

const CardStat = React.forwardRef<HTMLDivElement, CardStatProps>(
  ({ className, icon, trend, label, value, color = "primary", children, ...props }, ref) => {
    const colors = {
      primary: { bg: "bg-primary-50", icon: "text-primary-600", light: "bg-primary-100" },
      blue: { bg: "bg-blue-50", icon: "text-blue-600", light: "bg-blue-100" },
      purple: { bg: "bg-purple-50", icon: "text-purple-600", light: "bg-purple-100" },
      emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", light: "bg-emerald-100" },
      orange: { bg: "bg-orange-50", icon: "text-orange-600", light: "bg-orange-100" },
      pink: { bg: "bg-secondary-50", icon: "text-secondary-600", light: "bg-secondary-100" },
    }

    const c = colors[color]

    return (
      <div
        ref={ref}
        className={cn(
          "stat-card animate-slide-up",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-600 whitespace-nowrap">{label}</p>
              {trend && (
                <span className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
            </div>
            <p className="value">{value}</p>
            {children}
          </div>
          {icon && (
            <div className={cn("icon-wrapper", c.bg)}>
              <span className={c.icon}>{icon}</span>
            </div>
          )}
        </div>
      </div>
    )
  }
)
CardStat.displayName = "CardStat"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardStat }
