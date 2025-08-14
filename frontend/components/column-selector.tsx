"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowRight } from "lucide-react"

interface ColumnSelectorProps {
  data: any[]
  onColumnSelected: (column: string) => void
}

export function ColumnSelector({ data, onColumnSelected }: ColumnSelectorProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>("")

  if (!data || data.length === 0) return null

  const columns = Object.keys(data[0])
  const textColumns = columns.filter((col) => {
    // Check if column likely contains text (not just numbers or short codes)
    const sampleValues = data.slice(0, 5).map((row) => row[col]?.toString() || "")
    const avgLength = sampleValues.reduce((sum, val) => sum + val.length, 0) / sampleValues.length
    return avgLength > 10 // Likely text if average length > 10 characters
  })

  const handleAnalyze = () => {
    if (selectedColumn) {
      onColumnSelected(selectedColumn)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Text Column for Analysis
        </CardTitle>
        <CardDescription>Choose which column contains the text you want to analyze for sentiment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Available Columns:</p>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <Badge key={col} variant="outline">
                {col}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Recommended Text Columns:</p>
          <div className="flex flex-wrap gap-2">
            {textColumns.map((col) => (
              <Badge key={col} variant="secondary">
                {col}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Select Column:</label>
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a column to analyze" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                  {textColumns.includes(col) && (
                    <span className="ml-2 text-xs text-muted-foreground">(recommended)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedColumn && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Sample data from "{selectedColumn}":</p>
            <div className="space-y-1">
              {data.slice(0, 3).map((row, index) => (
                <p key={index} className="text-xs text-muted-foreground truncate">
                  {row[selectedColumn]?.toString() || "Empty"}
                </p>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleAnalyze} disabled={!selectedColumn} className="w-full">
          Analyze Sentiment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
