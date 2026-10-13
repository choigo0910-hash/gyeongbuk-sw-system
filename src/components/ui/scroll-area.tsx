"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
  height?: string
}

export function ScrollArea({ children, className, height }: ScrollAreaProps) {
  return (
    <div
      className={cn("overflow-auto", className)}
      style={{ height }}
    >
      {children}
    </div>
  )
}
