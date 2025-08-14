"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, AlertCircle, Brain } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { analyzeBatchSentiment, calculateSentimentAnalytics } from "@/lib/ai-sentiment-analysis"

interface CSVUploadProps {
  onDataUploaded: (data: any[], analytics: any) => void
}

export function CSVUpload({ onDataUploaded }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingStage, setProcessingStage] = useState<string>("")

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row")

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
      if (values.length === headers.length) {
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index]
        })
        data.push(row)
      }
    }

    return data
  }

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file")
        return
      }

      setIsProcessing(true)
      setError(null)
      setProcessingStage("Parsing CSV file...")

      try {
        const text = await file.text()
        const data = parseCSV(text)

        setProcessingStage("Detecting text columns...")

        const headers = Object.keys(data[0] || {})
        const textColumns = headers.filter((header) => {
          const lowerHeader = header.toLowerCase()
          return (
            lowerHeader.includes("text") ||
            lowerHeader.includes("comment") ||
            lowerHeader.includes("feedback") ||
            lowerHeader.includes("review") ||
            lowerHeader.includes("message") ||
            lowerHeader.includes("description") ||
            lowerHeader.includes("content")
          )
        })

        // If no obvious text columns, find columns with longer text content
        if (textColumns.length === 0) {
          const potentialTextColumns = headers.filter((header) => {
            const sampleValues = data.slice(0, 5).map((row) => row[header] || "")
            const avgLength = sampleValues.reduce((sum, val) => sum + String(val).length, 0) / sampleValues.length
            return avgLength > 20 // Assume text columns have longer content
          })
          textColumns.push(...potentialTextColumns)
        }

        if (textColumns.length === 0) {
          throw new Error(
            "No text columns detected. Please ensure your CSV has columns with text content for analysis.",
          )
        }

        setProcessingStage(`Analyzing sentiment using AI (${data.length} entries)...`)

        const primaryTextColumn = textColumns[0]
        const textData = data.map((row) => String(row[primaryTextColumn] || ""))

        const sentimentResults = analyzeBatchSentiment(textData)

        setProcessingStage("Calculating analytics...")

        const enrichedData = data.map((row, index) => ({
          ...row,
          sentimentAnalysis: sentimentResults[index],
        }))

        const analytics = calculateSentimentAnalytics(sentimentResults)

        setProcessingStage("Complete!")

        onDataUploaded(enrichedData, analytics)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process CSV file")
      } finally {
        setIsProcessing(false)
        setProcessingStage("")
      }
    },
    [onDataUploaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Upload CSV for AI Sentiment Analysis
        </CardTitle>
        <CardDescription>
          Upload a CSV file with text data to analyze sentiment using advanced AI. The system will automatically detect
          text columns and perform comprehensive sentiment analysis with emotion detection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragging ? "Drop your CSV file here" : "Drag and drop your CSV file"}
            </p>
            <p className="text-sm text-muted-foreground">or</p>
            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
                disabled={isProcessing}
              />
              <Button asChild variant="outline" disabled={isProcessing} className="cursor-pointer bg-transparent">
                <label htmlFor="csv-upload">{isProcessing ? "Processing..." : "Choose CSV File"}</label>
              </Button>
            </div>
            {isProcessing && processingStage && (
              <p className="text-sm text-blue-600 mt-2 flex items-center justify-center gap-2">
                <Brain className="h-4 w-4 animate-pulse" />
                {processingStage}
              </p>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            <strong>AI Analysis Features:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Automatic text column detection</li>
            <li>Advanced sentiment scoring (-1 to +1 scale)</li>
            <li>Emotion detection (joy, anger, sadness, fear, etc.)</li>
            <li>Keyword extraction and confidence scoring</li>
            <li>Context-aware analysis with negation handling</li>
          </ul>
          <p className="mt-2">
            <strong>Supported text columns:</strong> feedback, comment, text, review, message, description, content
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
