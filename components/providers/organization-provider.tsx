"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Organization } from "@/types/organization"

interface OrganizationContextType {
  selectedOrganization: Organization | null
  setSelectedOrganization: (org: Organization | null) => void
  organizations: Organization[]
  setOrganizations: (orgs: Organization[]) => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [selectedOrganization, setSelectedOrganizationState] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem("selectedOrganization")
      if (stored) {
        try {
          setSelectedOrganizationState(JSON.parse(stored))
        } catch (error) {
          console.error("Failed to parse stored organization:", error)
        }
      }
    }
  }, [])

  // Save to localStorage when changed
  const setSelectedOrganization = (org: Organization | null) => {
    setSelectedOrganizationState(org)
    if (typeof window !== 'undefined') {
      if (org) {
        localStorage.setItem("selectedOrganization", JSON.stringify(org))
      } else {
        localStorage.removeItem("selectedOrganization")
      }
    }
  }

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrganization,
        setSelectedOrganization,
        organizations,
        setOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}
