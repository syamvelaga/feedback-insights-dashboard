"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, BarChart3, Brain, Target, Hash } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface SentimentResultsProps {
  data: any[]
  analytics: {
    distribution: {
      positive: { count: number; percentage: number }
      negative: { count: number; percentage: number }
      neutral: { count: number; percentage: number }
    }
    averageScore: number
    averageConfidence: number
    topEmotions: Array<{ emotion: string; count: number; percentage: number }>
    topKeywords: Array<{ keyword: string; count: number; percentage: number }>
    totalAnalyzed: number
  } | null
  textColumn: string
}

const COLORS = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#6b7280",
}

const EMOTION_COLORS = {
  joy: "#fbbf24",
  anger: "#ef4444",
  sadness: "#3b82f6",
  fear: "#8b5cf6",
  surprise: "#f97316",
  disgust: "#84cc16",
}

export function SentimentResults({ data, analytics, textColumn }: SentimentResultsProps) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">No sentiment analysis data available.</p>
        </CardContent>
      </Card>
    )
  }

  const pieData = [
    { name: "Positive", value: analytics.distribution.positive.count, color: COLORS.positive },
    { name: "Negative", value: analytics.distribution.negative.count, color: COLORS.negative },
    { name: "Neutral", value: analytics.distribution.neutral.count, color: COLORS.neutral },
  ]

  const emotionData = analytics.topEmotions.map((emotion) => ({
    name: emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1),
    value: emotion.count,
    percentage: emotion.percentage,
    color: EMOTION_COLORS[emotion.emotion as keyof typeof EMOTION_COLORS] || "#6b7280",
  }))

  const keywordData = analytics.topKeywords.slice(0, 8).map((keyword) => ({
    name: keyword.keyword,
    value: keyword.count,
    percentage: keyword.percentage,
  }))

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "negative":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getSentimentBadge = (sentiment: string, confidence: number) => {
    const variant = sentiment === "positive" ? "default" : sentiment === "negative" ? "destructive" : "secondary"
    return (
      <Badge variant={variant} className="capitalize">
        {sentiment} ({Math.round(confidence * 100)}%)
      </Badge>
    )
  }

  const getEmotionBadges = (emotions: string[]) => {
    return emotions.map((emotion, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {emotion}
      </Badge>
    ))
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAnalyzed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Positive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.distribution.positive.count}</div>
            <Progress value={analytics.distribution.positive.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.distribution.positive.percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Negative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.distribution.negative.count}</div>
            <Progress value={analytics.distribution.negative.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.distribution.negative.percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Minus className="h-4 w-4 text-gray-500" />
              Neutral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{analytics.distribution.neutral.count}</div>
            <Progress value={analytics.distribution.neutral.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.distribution.neutral.percentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              AI Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{Math.round(analytics.averageConfidence * 100)}%</div>
            <Progress value={analytics.averageConfidence * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Avg Score: {analytics.averageScore.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {emotionData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Emotion Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={emotionData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} (${emotionData.find((d) => d.name === name)?.percentage.toFixed(1)}%)`,
                      "Count",
                    ]}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {emotionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {keywordData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Top Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={keywordData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} occurrences`, "Frequency"]} />
                  <Bar dataKey="value" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed AI Analysis Results</CardTitle>
          <CardDescription>Individual sentiment analysis with emotion detection and keyword extraction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data.map((row, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Entry #{index + 1}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{row[textColumn] || "No text content"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(row.sentimentAnalysis.sentiment)}
                    {getSentimentBadge(row.sentimentAnalysis.sentiment, row.sentimentAnalysis.confidence)}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Score: {row.sentimentAnalysis.score > 0 ? "+" : ""}
                    {row.sentimentAnalysis.score.toFixed(3)}
                  </span>
                  <span>Confidence: {Math.round(row.sentimentAnalysis.confidence * 100)}%</span>
                </div>

                {row.sentimentAnalysis.emotions && row.sentimentAnalysis.emotions.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Detected Emotions:</p>
                    <div className="flex flex-wrap gap-1">{getEmotionBadges(row.sentimentAnalysis.emotions)}</div>
                  </div>
                )}

                {row.sentimentAnalysis.keywords && row.sentimentAnalysis.keywords.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Key Terms:</p>
                    <div className="flex flex-wrap gap-1">
                      {row.sentimentAnalysis.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
