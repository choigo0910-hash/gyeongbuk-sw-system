"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean
  setHasUnsavedChanges: (value: boolean) => void
  message: string
  setMessage: (value: string) => void
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType | undefined>(
  undefined
)

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [message, setMessage] = useState(
    "변경사항이 저장되지 않았습니다. 정말 떠나시겠습니까?"
  )

  return (
    <UnsavedChangesContext.Provider
      value={{ hasUnsavedChanges, setHasUnsavedChanges, message, setMessage }}
    >
      {children}
    </UnsavedChangesContext.Provider>
  )
}

export function useUnsavedChangesContext() {
  const context = useContext(UnsavedChangesContext)
  if (!context) {
    throw new Error("useUnsavedChangesContext must be used within UnsavedChangesProvider")
  }
  return context
}
