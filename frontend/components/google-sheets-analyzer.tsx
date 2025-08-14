"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, ExternalLink } from "lucide-react"
import { analyzeSentimentWithAI, calculateSentimentAnalytics, type SentimentResult } from "@/lib/ai-sentiment-analysis"

interface FeedbackData {
  Timestamp: string
  "Email Address": string
  "Student Name": string
  "How do you feel about the session": string
  "Select the Instructor": string
  "How do you rate Session": number
  "Anything you want to convey": string
}

interface AnalyzedFeedback extends FeedbackData {
  sessionSentiment: SentimentResult
  additionalSentiment?: SentimentResult
  overallSentiment: SentimentResult
}

interface GoogleSheetsAnalyzerProps {
  onAnalysisComplete: (data: AnalyzedFeedback[], analytics: any) => void
}

export function GoogleSheetsAnalyzer({ onAnalysisComplete }: GoogleSheetsAnalyzerProps) {
  const [apiUrl, setApiUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchAndAnalyzeData = async () => {
    if (!apiUrl.trim()) {
      setError("Please enter a valid Google Sheets API URL")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch data from Google Sheets API
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FeedbackData[] = await response.json()

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No data found or invalid data format")
      }

      // Analyze sentiment for each feedback entry
      const analyzedData: AnalyzedFeedback[] = []

      for (const feedback of data) {
        // Analyze main session feedback
        const sessionSentiment = analyzeSentimentWithAI(feedback["How do you feel about the session"])

        // Analyze additional comments if provided
        let additionalSentiment: SentimentResult | undefined
        if (
          feedback["Anything you want to convey"] &&
          feedback["Anything you want to convey"].toLowerCase() !== "no" &&
          feedback["Anything you want to convey"].trim() !== ""
        ) {
          additionalSentiment = analyzeSentimentWithAI(feedback["Anything you want to convey"])
        }

        // Calculate overall sentiment by combining both texts
        const combinedText = `${feedback["How do you feel about the session"]} ${feedback["Anything you want to convey"] || ""}`
        const overallSentiment = analyzeSentimentWithAI(combinedText)

        analyzedData.push({
          ...feedback,
          sessionSentiment,
          additionalSentiment,
          overallSentiment,
        })
      }

      // Calculate analytics
      const analytics = calculateSentimentAnalytics(analyzedData.map((d) => d.overallSentiment))

      setLastFetch(new Date())
      onAnalysisComplete(analyzedData, analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch and analyze data")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Google Sheets Feedback Analyzer
        </CardTitle>
        <CardDescription>
          Enter your Google Apps Script API URL to fetch and analyze student feedback in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://script.googleusercontent.com/macros/echo?user_content_key=..."
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={fetchAndAnalyzeData} disabled={isLoading || !apiUrl.trim()} className="min-w-[120px]">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Fetch & Analyze
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {lastFetch && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">Last updated: {lastFetch.toLocaleString()}</Badge>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Expected data format:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Timestamp</li>
            <li>Student Name</li>
            <li>How do you feel about the session (analyzed for sentiment)</li>
            <li>Select the Instructor</li>
            <li>How do you rate Session (1-5 rating)</li>
            <li>Anything you want to convey (analyzed for sentiment)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
