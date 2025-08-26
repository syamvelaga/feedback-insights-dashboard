"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, TrendingUp, Users, MessageSquare } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchColleges } from "@/lib/api-client"

interface ProcessedData {
  success: boolean
  error?: string
  timestamp?: string
  total_entries?: number
  summary?: {
    sentiment_distribution: { positive: number; negative: number; neutral: number }
    average_rating: number
    total_flagged: number
    instructors_count: number
  }
  instructor_stats?: Record<string, any>
  flagged_entries?: any[]
  all_entries?: any[]
}

export default function SheetsUrlProcessor() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ProcessedData | null>(null)
  const [flaggedPage, setFlaggedPage] = useState(1)
  const flaggedPageSize = 5
  const [campuses, setCampuses] = useState<string[]>([])
  const [selectedCampus, setSelectedCampus] = useState<string>("")

  const processUrl = async () => {
    if (!url.trim()) return

    setLoading(true)
    try {
      // In a real implementation, you would call your Python script here
      // For now, we'll simulate the processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate processed data response
      const mockData: ProcessedData = {
        success: true,
        timestamp: new Date().toISOString(),
        total_entries: 25,
        summary: {
          sentiment_distribution: { positive: 15, negative: 3, neutral: 7 },
          average_rating: 4.2,
          total_flagged: 3,
          instructors_count: 4,
        },
        instructor_stats: {
          "G v yashaswi": {
            total_responses: 12,
            average_rating: 4.5,
            sentiment_breakdown: { positive: 8, negative: 1, neutral: 3 },
          },
          "John Smith": {
            total_responses: 8,
            average_rating: 3.9,
            sentiment_breakdown: { positive: 4, negative: 2, neutral: 2 },
          },
        },
        flagged_entries: [
          {
            id: 1,
            student_name: "Student A",
            instructor: "John Smith",
            rating: 2,
            session_feeling: "It was confusing and hard to follow",
            sentiment_analysis: {
              overall: { sentiment: "negative", score: -0.8, confidence: 85 },
            },
          },
        ],
      }

      setData(mockData)
    } catch (error) {
      setData({ success: false, error: "Failed to process data" })
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800"
      case "negative":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const flaggedTotalPages = Math.max(
    1,
    Math.ceil((data?.flagged_entries?.length || 0) / flaggedPageSize)
  )

  const pagedFlaggedEntries = (data?.flagged_entries || []).slice(
    (flaggedPage - 1) * flaggedPageSize,
    (flaggedPage - 1) * flaggedPageSize + flaggedPageSize
  )

  // Reset to first page whenever dataset changes
  if (flaggedPage !== 1 && (data?.flagged_entries?.length || 0) > 0) {
    // ensure current page is within bounds
    const maxPage = Math.max(1, Math.ceil((data?.flagged_entries?.length || 0) / flaggedPageSize))
    if (flaggedPage > maxPage) setFlaggedPage(1)
  }

  // Load campuses on mount
  useEffect(() => {
    let isMounted = true
    fetchColleges().then((res) => {
      if (!isMounted) return
      if (res.success && Array.isArray(res.data)) {
        setCampuses(res.data)
      } else {
        setCampuses([])
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const processCampus = async (campus: string) => {
    if (!campus) return
    setLoading(true)
    try {
      // Simulate processing for selected campus; replace with real API if available
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData: ProcessedData = {
        success: true,
        timestamp: new Date().toISOString(),
        total_entries: 25,
        summary: {
          sentiment_distribution: { positive: 15, negative: 3, neutral: 7 },
          average_rating: 4.1,
          total_flagged: 3,
          instructors_count: 4,
        },
        instructor_stats: {
          "G v yashaswi": {
            total_responses: 12,
            average_rating: 4.5,
            sentiment_breakdown: { positive: 8, negative: 1, neutral: 3 },
          },
          "John Smith": {
            total_responses: 8,
            average_rating: 3.9,
            sentiment_breakdown: { positive: 4, negative: 2, neutral: 2 },
          },
        },
        flagged_entries: [
          {
            id: 1,
            student_name: "Student A",
            instructor: "John Smith",
            rating: 2,
            session_feeling: `Campus ${campus}: It was confusing and hard to follow`,
            sentiment_analysis: {
              overall: { sentiment: "negative", score: -0.8, confidence: 85 },
            },
          },
        ],
      }

      setData(mockData)
    } catch (error) {
      setData({ success: false, error: "Failed to process campus data" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Google Sheets Data Processor</h1>
        <p className="text-gray-600">Enter your Google Sheets API URL to fetch and analyze feedback data</p>
      </div>

      {/* Campus Selector and (optional) URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Data Source</CardTitle>
          <CardDescription>Select a campus to load the dashboard. URL input is optional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Select
                value={selectedCampus}
                onValueChange={(val) => {
                  setSelectedCampus(val)
                  // Auto-load on selection
                  processCampus(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={campuses.length ? "Select campus" : "Loading campuses..."} />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Optional: paste API URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={processUrl} disabled={loading || (!url.trim() && !selectedCampus)}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Load"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {data.error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{data.error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{data.total_entries}</p>
                        <p className="text-sm text-gray-600">Total Responses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold">{data.summary?.average_rating}</p>
                        <p className="text-sm text-gray-600">Average Rating</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold">{data.summary?.total_flagged}</p>
                        <p className="text-sm text-gray-600">Flagged Issues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-2xl font-bold">{data.summary?.instructors_count}</p>
                        <p className="text-sm text-gray-600">Instructors</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sentiment Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge className={getSentimentColor("positive")}>
                      Positive: {data.summary?.sentiment_distribution.positive}
                    </Badge>
                    <Badge className={getSentimentColor("negative")}>
                      Negative: {data.summary?.sentiment_distribution.negative}
                    </Badge>
                    <Badge className={getSentimentColor("neutral")}>
                      Neutral: {data.summary?.sentiment_distribution.neutral}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Instructor Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Instructor Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.instructor_stats &&
                      Object.entries(data.instructor_stats).map(([name, stats]: [string, any]) => (
                        <div key={name} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{name}</h3>
                            <Badge variant="outline">{stats.average_rating}/5</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>Total Responses: {stats.total_responses}</p>
                            <div className="flex gap-2">
                              <span className="text-green-600">+{stats.sentiment_breakdown.positive}</span>
                              <span className="text-red-600">-{stats.sentiment_breakdown.negative}</span>
                              <span className="text-gray-500">~{stats.sentiment_breakdown.neutral}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Flagged Entries */}
              {data.flagged_entries && data.flagged_entries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Flagged Issues</CardTitle>
                    <CardDescription>Negative feedback that requires attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[480px] overflow-y-auto pr-2 space-y-4">
                      {pagedFlaggedEntries.map((entry, index) => (
                        <div key={index} className="p-4 border-l-4 border-red-500 bg-red-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2">
                              <Badge variant="destructive">Rating: {entry.rating}/5</Badge>
                              <Badge className={getSentimentColor(entry.sentiment_analysis.overall.sentiment)}>
                                {entry.sentiment_analysis.overall.sentiment}
                              </Badge>
                            </div>
                            <div className="text-right space-y-0.5">
                              {typeof entry.sentiment_analysis?.overall?.confidence !== "undefined" && (
                                <div className="text-sm text-red-700">
                                  Confidence: {Number(entry.sentiment_analysis.overall.confidence).toFixed(0)}%
                                </div>
                              )}
                            {entry.timestamp && (
                              <div className="text-sm text-gray-500">
                                {new Date(entry.timestamp).toLocaleString()}
                              </div>
                            )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Instructor Name:</span> <span className="font-semibold text-gray-900">{entry.instructor}</span>
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Student Name:</span> <span className="font-normal">{entry.student_name}</span>
                            </p>
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Student Feedback:</span> "{entry.session_feeling}"
                            </p>
                            {entry.additional_comments && entry.additional_comments !== "No" && (
                              <p className="text-sm">
                                <span className="font-semibold">Additional:</span> {entry.additional_comments}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Page {flaggedPage} of {flaggedTotalPages}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFlaggedPage((p) => Math.max(1, p - 1))}
                          disabled={flaggedPage === 1}
                          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFlaggedPage((p) => Math.min(flaggedTotalPages, p + 1))
                          }
                          disabled={flaggedPage === flaggedTotalPages}
                          className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
