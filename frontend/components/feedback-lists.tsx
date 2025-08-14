"use client"

import { cn } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThumbsUp, ThumbsDown, Star, Calendar, User, GraduationCap } from "lucide-react"
import { useDashboard } from "@/components/dashboard-context"

interface FeedbackItem {
  id: number
  timestamp: string
  student_name: string
  session_feeling: string
  instructor_name: string
  session_rating: number
  additional_comments: string
  college_name: string
}

export function FeedbackLists() {
  const { data, loading } = useDashboard()

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No feedback data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const FeedbackCard = ({ feedback, type }: { feedback: FeedbackItem; type: "positive" | "negative" }) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    return (
      <div className="p-3 sm:p-4 border border-border rounded-lg space-y-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < feedback.session_rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{feedback.session_rating}/5</span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "flex-shrink-0",
              type === "positive"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
            )}
          >
            {type === "positive" ? <ThumbsUp className="h-3 w-3 mr-1" /> : <ThumbsDown className="h-3 w-3 mr-1" />}
            <span className="hidden sm:inline">{type}</span>
          </Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground line-clamp-2">"{feedback.session_feeling}"</p>
          {feedback.additional_comments && (
            <p className="text-sm text-muted-foreground line-clamp-3">"{feedback.additional_comments}"</p>
          )}
        </div>

        {/* Improved responsive layout for metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{feedback.student_name}</span>
            </div>
            <div className="flex items-center gap-1 min-w-0">
              <GraduationCap className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{feedback.instructor_name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="whitespace-nowrap">{formatDate(feedback.timestamp)}</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{feedback.college_name}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400 text-base sm:text-lg">
            <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Positive Feedback ({data.positiveFeedback.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 sm:h-96">
            <div className="space-y-3 sm:space-y-4 pr-2">
              {data.positiveFeedback.length > 0 ? (
                data.positiveFeedback
                  .slice(0, 10)
                  .map((feedback) => <FeedbackCard key={feedback.id} feedback={feedback} type="positive" />)
              ) : (
                <p className="text-center text-muted-foreground py-8">No positive feedback found</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400 text-base sm:text-lg">
            <ThumbsDown className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">Negative Feedback ({data.negativeFeedback.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80 sm:h-96">
            <div className="space-y-3 sm:space-y-4 pr-2">
              {data.negativeFeedback.length > 0 ? (
                data.negativeFeedback
                  .slice(0, 10)
                  .map((feedback) => <FeedbackCard key={feedback.id} feedback={feedback} type="negative" />)
              ) : (
                <p className="text-center text-muted-foreground py-8">No negative feedback found</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
