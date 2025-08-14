"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, TrendingUp, MessageSquare, Users } from "lucide-react"
import { useDashboard } from "@/components/dashboard-context"

export function DashboardStats() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="col-span-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{error || "No data available"}</p>
        </CardContent>
      </Card>
    )
  }

  const averageRating =
    data.averageRatingPerInstructor.length > 0
      ? (
          data.averageRatingPerInstructor.reduce((sum, instructor) => sum + instructor.average_rating, 0) /
          data.averageRatingPerInstructor.length
        ).toFixed(1)
      : "0.0"

  const totalInstructors = data.averageRatingPerInstructor.length
  const positiveFeedbackCount = data.positiveFeedback.length
  const negativeFeedbackCount = data.negativeFeedback.length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalFeedbackCount}</div>
          <p className="text-xs text-muted-foreground">Across all campuses</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageRating}</div>
          <p className="text-xs text-muted-foreground">Out of 5.0 stars</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInstructors}</div>
          <p className="text-xs text-muted-foreground">With feedback data</p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sentiment Analysis</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {/* Improved responsive layout for sentiment badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              +{positiveFeedbackCount}
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              -{negativeFeedbackCount}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Positive vs Negative</p>
        </CardContent>
      </Card>
    </div>
  )
}
