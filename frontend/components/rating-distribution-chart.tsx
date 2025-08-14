"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { BarChart3, Star } from "lucide-react"
import { fetchFeedbackData } from "@/lib/api-client"

interface RatingDistribution {
  rating: string
  count: number
  percentage: number
}

export function RatingDistributionChart() {
  const [data, setData] = useState<RatingDistribution[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const response = await fetchFeedbackData()

        if (response.success && response.data) {
          // Count ratings from all feedback
          const allFeedback = [...response.data.positiveFeedback, ...response.data.negativeFeedback]

          // Add neutral feedback (total - positive - negative)
          const totalCount = response.data.totalFeedbackCount
          const knownFeedback = allFeedback.length
          const neutralCount = totalCount - knownFeedback

          // Create rating distribution
          const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

          allFeedback.forEach((feedback) => {
            if (feedback.session_rating >= 1 && feedback.session_rating <= 5) {
              ratingCounts[feedback.session_rating as keyof typeof ratingCounts]++
            }
          })

          // Estimate neutral ratings as 3-star
          ratingCounts[3] += neutralCount

          const distributionData = Object.entries(ratingCounts).map(([rating, count]) => ({
            rating: `${rating} Star${rating !== "1" ? "s" : ""}`,
            count,
            percentage: totalCount > 0 ? (count / totalCount) * 100 : 0,
          }))

          setData(distributionData)
        }
      } catch (err) {
        console.error("Failed to load rating distribution:", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    count: {
      label: "Feedback Count",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Rating Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">Breakdown of all feedback by star rating</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, props) => [
                      <div key="tooltip" className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{props.payload?.rating}</span>
                        </div>
                        <div className="text-sm">
                          Count: <span className="font-medium">{value}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {props.payload?.percentage.toFixed(1)}% of total feedback
                        </div>
                      </div>,
                      "",
                    ]}
                  />
                }
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
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
