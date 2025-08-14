"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { TrendingUp, Star } from "lucide-react"
import { useDashboard } from "@/components/dashboard-context"

interface ChartData {
  instructor: string
  rating: number
  feedbackCount: number
  fullName: string
}

export function InstructorRatingChart() {
  const { data, loading, error } = useDashboard()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data || data.averageRatingPerInstructor.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Instructor Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">{error || "No rating data available"}</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.averageRatingPerInstructor
    .map((instructor) => ({
      instructor: instructor.instructor_name.split(" ").pop() || instructor.instructor_name,
      rating: Number(instructor.average_rating),
      feedbackCount: instructor.total_feedback,
      fullName: instructor.instructor_name,
    }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10) // Show top 10 instructors

  const chartConfig = {
    rating: {
      label: "Average Rating",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Instructor Performance Overview
        </CardTitle>
        <p className="text-sm text-muted-foreground">Average ratings across all instructors (Top 10 shown)</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis
                dataKey="instructor"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}.0`} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => [
                      <div key="tooltip" className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{props.payload?.fullName}</span>
                        </div>
                        <div className="text-sm">
                          Average Rating: <span className="font-medium">{Number(value).toFixed(1)}/5.0</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Based on {props.payload?.feedbackCount} feedback
                          {props.payload?.feedbackCount !== 1 ? "s" : ""}
                        </div>
                      </div>,
                      "",
                    ]}
                  />
                }
              />
              <Bar
                dataKey="rating"
                fill="var(--color-rating)"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
