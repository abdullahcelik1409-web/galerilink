"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface CustomerModeContextType {
  isCustomerMode: boolean
  toggleCustomerMode: () => void
}

const CustomerModeContext = createContext<CustomerModeContextType | undefined>(undefined)

export function CustomerModeProvider({ children }: { children: React.ReactNode }) {
  const [isCustomerMode, setIsCustomerMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from session storage for persistence on refresh
  useEffect(() => {
    setMounted(true)
    const saved = sessionStorage.getItem("galerilink_customer_mode")
    if (saved === "true") {
      setIsCustomerMode(true)
    }
  }, [])

  const toggleCustomerMode = () => {
    setIsCustomerMode(prev => {
      const newVal = !prev
      sessionStorage.setItem("galerilink_customer_mode", String(newVal))
      return newVal
    })
  }

  return (
    <CustomerModeContext.Provider value={{ isCustomerMode, toggleCustomerMode }}>
      {children}
    </CustomerModeContext.Provider>
  )
}

export function useCustomerMode() {
  const context = useContext(CustomerModeContext)
  if (context === undefined) {
    throw new Error("useCustomerMode must be used within a CustomerModeProvider")
  }
  return context
}
