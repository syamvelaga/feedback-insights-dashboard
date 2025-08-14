"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { PieChartIcon } from "lucide-react"
import { useDashboard } from "@/components/dashboard-context"

interface SentimentData {
  name: string
  value: number
  color: string
}

export function FeedbackTrendsChart() {
  const { data, loading } = useDashboard()

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

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">No data available</p>
        </CardContent>
      </Card>
    )
  }

  const { positiveFeedback, negativeFeedback, totalFeedbackCount } = data

  const positiveCount = positiveFeedback.length
  const negativeCount = negativeFeedback.length
  const neutralCount = totalFeedbackCount - positiveCount - negativeCount

  const sentimentData: SentimentData[] = [
    {
      name: "Positive",
      value: positiveCount,
      color: "hsl(var(--chart-1))",
    },
    {
      name: "Neutral",
      value: neutralCount,
      color: "hsl(var(--chart-2))",
    },
    {
      name: "Negative",
      value: negativeCount,
      color: "hsl(var(--chart-3))",
    },
  ]

  const chartConfig = {
    positive: {
      label: "Positive",
      color: "hsl(var(--chart-1))",
    },
    neutral: {
      label: "Neutral",
      color: "hsl(var(--chart-2))",
    },
    negative: {
      label: "Negative",
      color: "hsl(var(--chart-3))",
    },
  }

  const totalFeedback = sentimentData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Sentiment Distribution
        </CardTitle>
        <p className="text-sm text-muted-foreground">Overall feedback sentiment breakdown</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      <div key="tooltip" className="flex flex-col gap-1">
                        <div className="font-medium">{name} Feedback</div>
                        <div className="text-sm">
                          Count: <span className="font-medium">{value}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {totalFeedback > 0 ? `${((Number(value) / totalFeedback) * 100).toFixed(1)}%` : "0%"} of total
                        </div>
                      </div>,
                      "",
                    ]}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="flex justify-center gap-6 mt-4">
          {sentimentData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">({item.value})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
