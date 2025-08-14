"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Link,
  BarChart3,
  TrendingDown,
  Users,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BeautifulDashboard } from "@/components/beautiful-dashboard";

interface ProcessedData {
  summary: {
    total_responses: number;
    negative_count: number;
    positive_count: number;
    neutral_count: number;
    average_rating: number;
  };
  instructor_stats: Array<{
    instructor: string;
    total_responses: number;
    average_rating: number;
    negative_count: number;
    sentiment_score: number;
  }>;
  flagged_entries: Array<{
    student_name: string;
    instructor: string;
    feedback: string;
    rating: number;
    sentiment: string;
    confidence: number;
    timestamp: string;
  }>;
  all_data: Array<{
    timestamp: string;
    email: string;
    student_name: string;
    session_feedback: string;
    instructor: string;
    rating: number;
    additional_comments: string;
    sentiment: string;
    confidence: number;
    is_flagged: boolean;
  }>;
}

const API_BASE_URL = "http://127.0.0.1:5000";

export default function UnifiedDataProcessor() {
  const [activeTab, setActiveTab] = useState("url");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [error, setError] = useState("");

  const handleUrlSubmit = async () => {
    if (!sheetsUrl.trim()) {
      setError("Please enter a valid Google Sheets URL");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      console.log("Processing Google Sheets URL:", sheetsUrl);

      const response = await fetch(`${API_BASE_URL}/process-sheets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: sheetsUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to process Google Sheets data"
        );
      }

      const data: ProcessedData = await response.json();
      setProcessedData(data);
      console.log("Successfully processed data:", data);
    } catch (err) {
      console.error("Error processing Google Sheets:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process Google Sheets data. Please check the URL and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError("Please select a CSV file");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      console.log("Processing CSV file:", csvFile.name);

      const formData = new FormData();
      formData.append("file", csvFile);

      const response = await fetch(`${API_BASE_URL}/process-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process CSV file");
      }

      const data: ProcessedData = await response.json();
      setProcessedData(data);
      console.log("Successfully processed CSV data:", data);
    } catch (err) {
      console.error("Error processing CSV:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process CSV file. Please check the file format and try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError("");
    } else {
      setError("Please select a valid CSV file");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4 pb-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Student Feedback & Instructor Performance Analytics Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Analyze student feedback with AI-powered sentiment detection and
            comprehensive reporting
          </p>
        </header>

        <Card className="shadow-sm border-gray-200">
          <CardHeader className="bg-white">
            <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              Data Input
            </CardTitle>
            <CardDescription className="text-gray-600">
              Select your data source to begin sentiment analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger
                  value="url"
                  className="flex items-center gap-2 data-[state=active]:bg-white"
                >
                  <Link className="h-4 w-4" />
                  Google Sheets
                </TabsTrigger>
                <TabsTrigger
                  value="csv"
                  className="flex items-center gap-2 data-[state=active]:bg-white"
                >
                  <Upload className="h-4 w-4" />
                  CSV File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="sheets-url"
                    className="text-sm font-medium text-gray-700"
                  >
                    Google Sheets API URL
                  </Label>
                  <Input
                    id="sheets-url"
                    placeholder="Enter your Google Apps Script URL..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-sm text-gray-500">
                    Paste the Google Apps Script URL that returns your feedback
                    data in JSON format
                  </p>
                </div>
                <Button
                  onClick={handleUrlSubmit}
                  disabled={isProcessing || !sheetsUrl.trim()}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing
                    ? "Analyzing Data..."
                    : "Analyze Google Sheets Data"}
                </Button>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6 mt-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="csv-file"
                    className="text-sm font-medium text-gray-700"
                  >
                    CSV File Upload
                  </Label>
                  <div className="space-y-2">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {csvFile && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Selected: {csvFile.name}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload a CSV file containing student feedback data with
                    columns for names, instructors, feedback text, and ratings
                  </p>
                </div>
                <Button
                  onClick={handleCsvUpload}
                  disabled={isProcessing || !csvFile}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? "Analyzing Data..." : "Analyze CSV Data"}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {processedData && <BeautifulDashboard data={processedData} />}
      </div>
    </div>
  );
}
