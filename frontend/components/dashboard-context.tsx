"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { FilterState } from "@/components/dashboard-filters"
import { fetchFeedbackData, getDateRange, type FeedbackApiData, type FeedbackFilters } from "@/lib/api-client"

interface DashboardContextType {
  data: FeedbackApiData | null
  loading: boolean
  error: string | null
  filters: FilterState
  updateFilters: (filters: FilterState) => void
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider")
  }
  return context
}

interface DashboardProviderProps {
  children: ReactNode
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [data, setData] = useState<FeedbackApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    college: "all",
    instructor: "all",
    dateRange: "week",
  })

  const loadData = useCallback(async (currentFilters: FilterState) => {
    try {
      setLoading(true)
      setError(null)

      // Convert filters to API format
      const apiFilters: FeedbackFilters = {}

      if (currentFilters.college !== "all") {
        apiFilters.college = currentFilters.college
      }

      if (currentFilters.instructor !== "all") {
        apiFilters.instructor = currentFilters.instructor
      }

      // Handle date range
      if (currentFilters.dateRange === "custom" && currentFilters.startDate && currentFilters.endDate) {
        const dateRange = getDateRange("custom", currentFilters.startDate, currentFilters.endDate)
        apiFilters.startDate = dateRange.startDate
        apiFilters.endDate = dateRange.endDate
      } else if (currentFilters.dateRange !== "week") {
        const dateRange = getDateRange(currentFilters.dateRange)
        apiFilters.startDate = dateRange.startDate
        apiFilters.endDate = dateRange.endDate
      }

      const response = await fetchFeedbackData(apiFilters)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || "Failed to load data")
      }
    } catch (err) {
      setError("Failed to load dashboard data")
      console.error("Dashboard data loading error:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateFilters = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
      loadData(newFilters)
    },
    [loadData],
  )

  const refreshData = useCallback(() => {
    return loadData(filters)
  }, [loadData, filters])

  // Load initial data
  useState(() => {
    loadData(filters)
  })

  const value: DashboardContextType = {
    data,
    loading,
    error,
    filters,
    updateFilters,
    refreshData,
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}
