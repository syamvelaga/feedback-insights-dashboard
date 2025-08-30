"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BeautifulDashboard } from "@/components/beautiful-dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/loading-spinner";

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

// const API_BASE_URL = "http://127.0.0.1:8000";
const API_BASE_URL = "https://feedback-insights-dashboard-1.onrender.com";

export default function UnifiedDataProcessor() {
  const [activeTab, setActiveTab] = useState("campus");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  // Campus configuration with sheet IDs
  const CAMPUS_CONFIG: { label: string; sheetId: string }[] = [
    {
      label: "Annamacharya",
      sheetId: "1ZMmrHHmIAbGIERfWNnkP0cdvsXI87RzkwgZlZeXvys4",
    },
    {
      label: "CDU",
      sheetId: "1qLrf0yyziHQ9uqDywzR8OXSYHof3Yb6zRW2gXkCF6oI",
    },
    {
      label: "Mallareddy",
      sheetId: "16q8Om0Wky3qA22ATof4NleEiYGzc_4jSQbPGNaJHXKA",
    },
    {
      label: "NSRIT",
      sheetId: "1gzo8Kay2Fkpf9EdBPNHMx6i__L_HRA5URlGBCcl5miY",
    },
    {
      label: "NRI",
      sheetId: "1lrpBpg3Xdv3DH914iIVHWYwRvlq-fa2qOISl1LZEyeQ",
    },
    {
      label: "Crescent",
      sheetId: "1ZE7CP9WLOq9xYAKVcC0xFZjBKAb2NQtqQNh5F6LFQy8",
    },
    {
      label: "CIET",
      sheetId: "1VAdrCSbCshp6IywoniMvPpkqt2wdyXveLo29rYxyqAQ",
    },
    {
      label: "NIT",
      sheetId: "1ZMmrHHmIAbGIERfWNnkP0cdvsXI87RzkwgZlZeXvys4",
    },
    {
      label:"ADYPU",
      sheetId:"1Zt037mPDlvF3QvE5u4ONLKzx4t5zwY15yRRW8PuLIRI"
    },
    {
      label:"Aurora",
      sheetId:"1gToNHTcrC3vLLPg9RIV4bkHpQu0a4irXpkwOHrFM1PY"
    },
    
    
    
  ];

  const handleCampusSubmit = async (sheetId: string) => {
    if (!sheetId) {
      setError("Please select a campus 🏫");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProcessedData(null);
    setLoadingSeconds(0);

    try {
      console.log("Processing campus with sheet ID:", sheetId);

      const response = await fetch(`${API_BASE_URL}/feedback/${sheetId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to process campus data 📉"
        );
      }

      const data: ProcessedData = await response.json();
      setProcessedData(data);
      console.log("Successfully processed campus data:", data);
    } catch (err) {
      console.error("Error processing campus data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process campus data. Please try again. 🔍"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isProcessing) return;
    const timer = setInterval(() => {
      setLoadingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);

  const formatSeconds = (total: number) => {
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setError("Please select a CSV file 📂");
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
        throw new Error(errorData.error || "Failed to process CSV file 📉");
      }

      const data: ProcessedData = await response.json();
      setProcessedData(data);
      console.log("Successfully processed CSV data:", data);
    } catch (err) {
      console.error("Error processing CSV:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process CSV file. Please check the file format and try again. 🔍"
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
      setError("Please select a valid CSV file 📂");
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
                  value="campus"
                  className="flex items-center gap-2 data-[state=active]:bg-white"
                >
                  <BarChart3 className="h-4 w-4" />
                  Campus Selection
                </TabsTrigger>
                <TabsTrigger
                  value="csv"
                  className="flex items-center gap-2 data-[state=active]:bg-white"
                >
                  <Upload className="h-4 w-4" />
                  CSV File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="campus" className="space-y-6 mt-6">
                <div className="space-y-3 flex flex-col items-center">
                  <Label className="text-sm font-medium text-gray-700 text-center">
                    Select Campus 🏫
                  </Label>
                  <div className="w-full max-w-md">
                    <Select
                      onValueChange={(val) => {
                        const selected = CAMPUS_CONFIG.find((c) => c.label === val);
                        if (selected) {
                          setSelectedCampus(val);
                          // Trigger processing immediately for selected campus
                          handleCampusSubmit(selected.sheetId);
                        }
                      }}
                    >
                      <SelectTrigger className="h-14 w-full text-center text-lg font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-md hover:shadow-lg">
                        <SelectValue placeholder="🏫 Select a campus to load dashboard" />
                      </SelectTrigger>
                      <SelectContent className="w-full max-w-md bg-white border-2 border-blue-200 shadow-xl rounded-lg">
                        {CAMPUS_CONFIG.map((c, index) => (
                          <SelectItem 
                            key={c.label} 
                            value={c.label}
                            className="h-12 text-center text-base font-medium cursor-pointer transition-all duration-200 hover:scale-105 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-blue-100 data-[highlighted]:to-indigo-100 data-[highlighted]:text-blue-800 data-[highlighted]:font-semibold"
                            style={{
                              '--tw-gradient-from': index === 0 ? '#dbeafe' : index === 1 ? '#fef3c7' : '#fce7f3',
                              '--tw-gradient-to': index === 0 ? '#c7d2fe' : index === 1 ? '#fde68a' : '#fbcfe8',
                            } as React.CSSProperties}
                          >
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg">
                                {index === 0 ? '🏛️' : index === 1 ? '🎓' : '🏢'}
                              </span>
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>How it works:</strong> Select a campus from the dropdown above. 
                    The system will automatically fetch and analyze the feedback data from the 
                    corresponding Google Sheet for that campus.
                  </p>
                </div>
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

        {isProcessing && (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 text-gray-700">
              <LoadingSpinner size="lg" />
              <span>Loading dashboard… {formatSeconds(loadingSeconds)}</span>
            </div>
          </div>
        )}

        {processedData && !isProcessing && (
          <>
            {selectedCampus && (
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  Campus: {selectedCampus}
                </h2>
              </div>
            )}
            <BeautifulDashboard data={processedData} />
          </>
        )}
      </div>
    </div>
  );
}
