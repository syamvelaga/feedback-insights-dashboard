import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Star, MessageSquare } from "lucide-react"

interface AnalyzedFeedback {
  Timestamp: string
  "Email Address": string
  "Student Name": string
  "How do you feel about the session": string
  "Select the Instructor": string
  "How do you rate Session": number
  "Anything you want to convey": string
  sessionSentiment: any
  additionalSentiment?: any
  overallSentiment: any
}

interface FeedbackDashboardProps {
  data: AnalyzedFeedback[]
  analytics: any
}

export function FeedbackDashboard({ data, analytics }: FeedbackDashboardProps) {
  // Calculate instructor performance
  const instructorStats = data.reduce(
    (acc, feedback) => {
      const instructor = feedback["Select the Instructor"]
      if (!acc[instructor]) {
        acc[instructor] = {
          name: instructor,
          totalFeedback: 0,
          averageRating: 0,
          totalRating: 0,
          sentimentScore: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        }
      }

      acc[instructor].totalFeedback++
      acc[instructor].totalRating += feedback["How do you rate Session"]
      acc[instructor].averageRating = acc[instructor].totalRating / acc[instructor].totalFeedback
      acc[instructor].sentimentScore += feedback.overallSentiment.score

      if (feedback.overallSentiment.sentiment === "positive") acc[instructor].positive++
      else if (feedback.overallSentiment.sentiment === "negative") acc[instructor].negative++
      else acc[instructor].neutral++

      return acc
    },
    {} as Record<string, any>,
  )

  const instructorData = Object.values(instructorStats).map((stat: any) => ({
    ...stat,
    averageSentiment: stat.sentimentScore / stat.totalFeedback,
    positivePercentage: (stat.positive / stat.totalFeedback) * 100,
  }))

  // Sentiment distribution data for pie chart
  const sentimentData = [
    { name: "Positive", value: analytics.positive, color: "#22c55e" },
    { name: "Negative", value: analytics.negative, color: "#ef4444" },
    { name: "Neutral", value: analytics.neutral, color: "#6b7280" },
  ]

  // Recent feedback
  const recentFeedback = data
    .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">From {Object.keys(instructorStats).length} instructors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.reduce((sum, f) => sum + f["How do you rate Session"], 0) / data.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((analytics.positive / data.length) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">{analytics.positive} positive responses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.averageConfidence * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">AI analysis confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instructor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Instructor Performance</CardTitle>
            <CardDescription>Average rating and sentiment by instructor</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={instructorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageRating" fill="#3b82f6" name="Avg Rating" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overall sentiment analysis results</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>Latest student responses with sentiment analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentFeedback.map((feedback, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{feedback["Student Name"]}</Badge>
                    <Badge variant="outline">{feedback["Select the Instructor"]}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{feedback["How do you rate Session"]}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      feedback.overallSentiment.sentiment === "positive"
                        ? "default"
                        : feedback.overallSentiment.sentiment === "negative"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {feedback.overallSentiment.sentiment} ({(feedback.overallSentiment.confidence * 100).toFixed(0)}%)
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>Session feedback:</strong> "{feedback["How do you feel about the session"]}"
                </p>
                {feedback["Anything you want to convey"] &&
                  feedback["Anything you want to convey"].toLowerCase() !== "no" && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Additional comments:</strong> "{feedback["Anything you want to convey"]}"
                    </p>
                  )}
                <p className="text-xs text-muted-foreground">{new Date(feedback.Timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Keywords */}
      {analytics.topKeywords && analytics.topKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>Most frequently mentioned terms in feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.topKeywords.slice(0, 20).map((keyword: any, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword.word} ({keyword.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
