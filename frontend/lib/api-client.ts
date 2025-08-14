// Client-side API utilities for making requests to the backend
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  filters?: any
}

export interface FeedbackApiData {
  averageRatingPerInstructor: Array<{
    instructor_name: string
    average_rating: number
    total_feedback: number
  }>
  positiveFeedback: Array<{
    id: number
    timestamp: string
    student_name: string
    session_feeling: string
    instructor_name: string
    session_rating: number
    additional_comments: string
    college_name: string
  }>
  negativeFeedback: Array<{
    id: number
    timestamp: string
    student_name: string
    session_feeling: string
    instructor_name: string
    session_rating: number
    additional_comments: string
    college_name: string
  }>
  totalFeedbackCount: number
}

export interface FeedbackFilters {
  startDate?: string
  endDate?: string
  instructor?: string
  college?: string
}

// Fetch feedback data with optional filters
export async function fetchFeedbackData(filters: FeedbackFilters = {}): Promise<ApiResponse<FeedbackApiData>> {
  try {
    const params = new URLSearchParams()

    if (filters.startDate) params.append("startDate", filters.startDate)
    if (filters.endDate) params.append("endDate", filters.endDate)
    if (filters.instructor) params.append("instructor", filters.instructor)
    if (filters.college) params.append("college", filters.college)

    const response = await fetch(`/api/feedback?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching feedback data:", error)
    return {
      success: false,
      error: "Failed to fetch feedback data",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fetch list of instructors
export async function fetchInstructors(): Promise<ApiResponse<string[]>> {
  try {
    const response = await fetch("/api/instructors")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching instructors:", error)
    return {
      success: false,
      error: "Failed to fetch instructors",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Fetch list of colleges
export async function fetchColleges(): Promise<ApiResponse<string[]>> {
  try {
    const response = await fetch("/api/colleges")

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching colleges:", error)
    return {
      success: false,
      error: "Failed to fetch colleges",
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Helper function to format date for API calls
export function formatDateForApi(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Helper function to get date ranges
export function getDateRange(range: "today" | "week" | "custom", customStart?: Date, customEnd?: Date) {
  const now = new Date()

  switch (range) {
    case "today":
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return {
        startDate: formatDateForApi(today),
        endDate: formatDateForApi(now),
      }

    case "week":
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - 7)
      return {
        startDate: formatDateForApi(weekStart),
        endDate: formatDateForApi(now),
      }

    case "custom":
      if (!customStart || !customEnd) {
        throw new Error("Custom date range requires both start and end dates")
      }
      return {
        startDate: formatDateForApi(customStart),
        endDate: formatDateForApi(customEnd),
      }

    default:
      return {}
  }
}
