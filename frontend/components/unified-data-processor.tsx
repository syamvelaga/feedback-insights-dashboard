// "use client";

// import type React from "react";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Upload,
//   Link,
//   BarChart3,
//   TrendingDown,
//   Users,
//   MessageSquare,
//   AlertTriangle,
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { BeautifulDashboard } from "@/components/beautiful-dashboard";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { LoadingSpinner } from "@/components/loading-spinner";

// interface ProcessedData {
//   summary: {
//     total_responses: number;
//     negative_count: number;
//     positive_count: number;
//     neutral_count: number;
//     average_rating: number;
//   };
//   instructor_stats: Array<{
//     instructor: string;
//     total_responses: number;
//     average_rating: number;
//     negative_count: number;
//     sentiment_score: number;
//   }>;
//   flagged_entries: Array<{
//     student_name: string;
//     instructor: string;
//     feedback: string;
//     rating: number;
//     sentiment: string;
//     confidence: number;
//     timestamp: string;
//   }>;
//   all_data: Array<{
//     timestamp: string;
//     email: string;
//     student_name: string;
//     session_feedback: string;
//     instructor: string;
//     rating: number;
//     additional_comments: string;
//     sentiment: string;
//     confidence: number;
//     is_flagged: boolean;
//   }>;
// }

// const API_BASE_URL = "http://127.0.0.1:5000";
// //const API_BASE_URL = "https://feedback-insights-dashboard.onrender.com/";

// export default function UnifiedDataProcessor() {
//   const [activeTab, setActiveTab] = useState("url");
//   const [sheetsUrl, setSheetsUrl] = useState("");
//   const [csvFile, setCsvFile] = useState<File | null>(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processedData, setProcessedData] = useState<ProcessedData | null>(
//     null
//   );
//   const [error, setError] = useState("");
//   const [selectedCampus, setSelectedCampus] = useState<string>("");
//   const [loadingSeconds, setLoadingSeconds] = useState(0);

//   const handleUrlSubmit = async (overrideUrl?: string) => {
//     const urlToProcess = (overrideUrl ?? sheetsUrl).trim();
//     if (!urlToProcess) {
//       setError("Please enter a valid Google Sheets URL");
//       return;
//     }

//     setIsProcessing(true);
//     setError("");
//     // Clear previous dashboard while switching/loading new campus
//     setProcessedData(null);
//     setLoadingSeconds(0);

//     try {
//       console.log("Processing Google Sheets URL:", urlToProcess);

//       const response = await fetch(`${API_BASE_URL}/process-sheets`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ url: urlToProcess }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.error || "Failed to process Google Sheets data"
//         );
//       }

//       const data: ProcessedData = await response.json();
//       setProcessedData(data);
//       console.log("Successfully processed data:", data);
//     } catch (err) {
//       console.error("Error processing Google Sheets:", err);
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Failed to process Google Sheets data. Please check the URL and try again."
//       );
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   // Tick loading timer while processing
//   useEffect(() => {
//     if (!isProcessing) return;
//     const timer = setInterval(() => {
//       setLoadingSeconds((s) => s + 1);
//     }, 1000);
//     return () => clearInterval(timer);
//   }, [isProcessing]);

//   const formatSeconds = (total: number) => {
//     const m = Math.floor(total / 60)
//       .toString()
//       .padStart(2, "0");
//     const s = (total % 60).toString().padStart(2, "0");
//     return `${m}:${s}`;
//   };

//   // Predefined campus URLs
//   const CAMPUS_URLS: { label: string; url: string }[] = [
//     {
//       label: "Annamachary Campus",
//       url: "https://script.google.com/macros/s/AKfycbwDPe0atDqJ5p3WJuVCj45XvwEyi8xvR-ViJ9OiGHM5ZOQ_GSmzvUzkGFPMv5Zw7ZNnhw/exec",
//     },
//     {
//       label: "CDU",
//       url: "https://script.google.com/macros/s/AKfycbxFtDGzzz7zKfY7rfx7AwmPjJgATljD6znnscB6hpiQAUYya3iJFAql3SOAxUFUB7xcNw/exec",
//     },
//     {
//       label: "SGU",
//       url: "https://script.google.com/macros/s/AKfycbwLuRr55LFLPC1BP0EKH2rgYQGeR_Mz2Hmlp_oXMv0Oklf2bzBZ-1vcUuMeu3kgZ3sPPw/exec",
//     },
//     {
//       label: "VGU",
//       url: "https://script.google.com/macros/s/AKfycbyncQNtCdVWhdCza6z8WTFxV9EZZMkkDirgAOCGrI2H0aWND06JcbQfjdrbPB79nB09Bw/exec",
//     },
//     {
//       label: "Mallareddy",
//       url: "https://script.google.com/macros/s/AKfycbyJDCvQBWyV_kpaM5Wh3aSZvBYEkQGcb3XxJ36NSg6nC0qIGVfHj_HgTmbcpCpoPbOfGA/exec",
//     },
//     // Add more campuses here as needed
//   ];

//   const handleCsvUpload = async () => {
//     if (!csvFile) {
//       setError("Please select a CSV file");
//       return;
//     }

//     setIsProcessing(true);
//     setError("");

//     try {
//       console.log("Processing CSV file:", csvFile.name);

//       const formData = new FormData();
//       formData.append("file", csvFile);

//       const response = await fetch(`${API_BASE_URL}/process-csv`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || "Failed to process CSV file");
//       }

//       const data: ProcessedData = await response.json();
//       setProcessedData(data);
//       console.log("Successfully processed CSV data:", data);
//     } catch (err) {
//       console.error("Error processing CSV:", err);
//       setError(
//         err instanceof Error
//           ? err.message
//           : "Failed to process CSV file. Please check the file format and try again."
//       );
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file && file.type === "text/csv") {
//       setCsvFile(file);
//       setError("");
//     } else {
//       setError("Please select a valid CSV file");
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4">
//       <div className="max-w-7xl mx-auto space-y-8">
//         <header className="text-center space-y-4 pb-8 border-b border-gray-200">
//           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
//             Student Feedback & Instructor Performance Analytics Dashboard
//           </h1>
//           <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
//             Analyze student feedback with AI-powered sentiment detection and
//             comprehensive reporting
//           </p>
//         </header>

//         <Card className="shadow-sm border-gray-200">
//           <CardHeader className="bg-white">
//             <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
//               <div className="p-2 bg-blue-50 rounded-lg">
//                 <Upload className="h-5 w-5 text-blue-600" />
//               </div>
//               Data Input
//             </CardTitle>
//             <CardDescription className="text-gray-600">
//               Select your data source to begin sentiment analysis
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="bg-white">
//             <Tabs
//               value={activeTab}
//               onValueChange={setActiveTab}
//               className="w-full"
//             >
//               <TabsList className="grid w-full grid-cols-2 bg-gray-100">
//                 <TabsTrigger
//                   value="url"
//                   className="flex items-center gap-2 data-[state=active]:bg-white"
//                 >
//                   <Link className="h-4 w-4" />
//                   Google Sheets
//                 </TabsTrigger>
//                 <TabsTrigger
//                   value="csv"
//                   className="flex items-center gap-2 data-[state=active]:bg-white"
//                 >
//                   <Upload className="h-4 w-4" />
//                   CSV File
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="url" className="space-y-6 mt-6">
//                 <div className="space-y-3">
//                   <Label className="text-sm font-medium text-gray-700">Campus</Label>
//                   <Select
//                     onValueChange={(val) => {
//                       const selected = CAMPUS_URLS.find((c) => c.label === val);
//                       if (selected) {
//                         setSheetsUrl(selected.url);
//                         setSelectedCampus(val);
//                         // Trigger processing immediately for selected campus
//                         handleUrlSubmit(selected.url);
//                       }
//                     }}
//                   >
//                     <SelectTrigger className="h-11">
//                       <SelectValue placeholder="Select a campus (no URL required)" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {CAMPUS_URLS.map((c) => (
//                         <SelectItem key={c.label} value={c.label}>
//                           {c.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//                 <div className="space-y-3">
//                   <Label
//                     htmlFor="sheets-url"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     Google Sheets API URL
//                   </Label>
//                   <Input
//                     id="sheets-url"
//                     placeholder="Enter your Google Apps Script URL..."
//                     value={sheetsUrl}
//                     onChange={(e) => setSheetsUrl(e.target.value)}
//                     className="h-11"
//                   />
//                   <p className="text-sm text-gray-500">
//                     Select a campus from above to auto-fill, or paste a URL
//                     that returns your feedback data in JSON format
//                   </p>
//                 </div>
//                 <Button
//                   onClick={() => handleUrlSubmit()}
//                   disabled={isProcessing}
//                   className="w-full h-11 bg-blue-600 hover:bg-blue-700"
//                 >
//                   {isProcessing
//                     ? "Analyzing Data..."
//                     : "Analyze Google Sheets Data"}
//                 </Button>
//               </TabsContent>

//               <TabsContent value="csv" className="space-y-6 mt-6">
//                 <div className="space-y-3">
//                   <Label
//                     htmlFor="csv-file"
//                     className="text-sm font-medium text-gray-700"
//                   >
//                     CSV File Upload
//                   </Label>
//                   <div className="space-y-2">
//                     <Input
//                       id="csv-file"
//                       type="file"
//                       accept=".csv"
//                       onChange={handleFileChange}
//                       className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                     />
//                     {csvFile && (
//                       <p className="text-sm text-green-600 flex items-center gap-2">
//                         <MessageSquare className="h-4 w-4" />
//                         Selected: {csvFile.name}
//                       </p>
//                     )}
//                   </div>
//                   <p className="text-sm text-gray-500">
//                     Upload a CSV file containing student feedback data with
//                     columns for names, instructors, feedback text, and ratings
//                   </p>
//                 </div>
//                 <Button
//                   onClick={handleCsvUpload}
//                   disabled={isProcessing || !csvFile}
//                   className="w-full h-11 bg-blue-600 hover:bg-blue-700"
//                 >
//                   {isProcessing ? "Analyzing Data..." : "Analyze CSV Data"}
//                 </Button>
//               </TabsContent>
//             </Tabs>

//             {error && (
//               <Alert className="mt-6 border-red-200 bg-red-50">
//                 <AlertTriangle className="h-4 w-4 text-red-600" />
//                 <AlertDescription className="text-red-700">
//                   {error}
//                 </AlertDescription>
//               </Alert>
//             )}
//           </CardContent>
//         </Card>

//         {isProcessing && (
//           <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
//             <div className="flex items-center gap-3 text-gray-700">
//               <LoadingSpinner size="lg" />
//               <span>Loading dashboard… {formatSeconds(loadingSeconds)}</span>
//             </div>
//           </div>
//         )}

//         {processedData && !isProcessing && (
//           <>
//             {selectedCampus && (
//               <div className="flex items-center justify-between mt-2">
//                 <h2 className="text-xl font-semibold text-gray-900">
//                   Campus: {selectedCampus}
//                 </h2>
//               </div>
//             )}
//             <BeautifulDashboard data={processedData} />
//           </>
//         )}
//       </div>
//     </div>
//   );
// }


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

const API_BASE_URL = "http://127.0.0.1:5000";

export default function UnifiedDataProcessor() {
  const [activeTab, setActiveTab] = useState("url");
  const [sheetsUrl, setSheetsUrl] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const handleUrlSubmit = async (overrideUrl?: string) => {
    const urlToProcess = (overrideUrl ?? sheetsUrl).trim();
    if (!urlToProcess) {
      setError("Please enter a valid Google Sheets URL 📋");
      return;
    }

    setIsProcessing(true);
    setError("");
    setProcessedData(null);
    setLoadingSeconds(0);

    try {
      console.log("Processing Google Sheets URL:", urlToProcess);

      const response = await fetch(`${API_BASE_URL}/process-sheets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToProcess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to process Google Sheets data 📉"
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
          : "Failed to process Google Sheets data. Please check the URL and try again. 🔍"
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

  const CAMPUS_URLS: { label: string; url: string }[] = [
    {
      label: "Annamachary Campus",
      url: "https://script.google.com/macros/s/AKfycbwDPe0atDqJ5p3WJuVCj45XvwEyi8xvR-ViJ9OiGHM5ZOQ_GSmzvUzkGFPMv5Zw7ZNnhw/exec",
    },
    {
      label: "CDU",
      url: "https://script.google.com/macros/s/AKfycbxFtDGzzz7zKfY7rfx7AwmPjJgATljD6znnscB6hpiQAUYya3iJFAql3SOAxUFUB7xcNw/exec",
    },
    {
      label: "SGU",
      url: "https://script.google.com/macros/s/AKfycbwLuRr55LFLPC1BP0EKH2rgYQGeR_Mz2Hmlp_oXMv0Oklf2bzBZ-1vcUuMeu3kgZ3sPPw/exec",
    },
    {
      label: "VGU",
      url: "https://script.google.com/macros/s/AKfycbyncQNtCdVWhdCza6z8WTFxV9EZZMkkDirgAOCGrI2H0aWND06JcbQfjdrbPB79nB09Bw/exec",
    },
    {
      label: "Mallareddy",
      url: "https://script.google.com/macros/s/AKfycbyJDCvQBWyV_kpaM5Wh3aSZvBYEkQGcb3XxJ36NSg6nC0qIGVfHj_HgTmbcpCpoPbOfGA/exec",
    },
  ];

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-6">
          <h1 className="text-4xl font-extrabold text-indigo-800 tracking-tight sm:text-5xl">
            📊 Student Feedback Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover insights from student feedback with AI-powered sentiment analysis and interactive dashboards 🌟
          </p>
        </header>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-indigo-800 flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Upload className="h-6 w-6 text-indigo-600" />
              </div>
              Data Input 📥
            </CardTitle>
            <CardDescription className="text-gray-500 text-base">
              Upload your feedback data via Google Sheets or CSV to start analyzing 🚀
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6">
                <TabsTrigger
                  value="url"
                  className="flex items-center gap-2 py-3 text-sm font-medium text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <Link className="h-5 w-5" />
                  Google Sheets 🔗
                </TabsTrigger>
                <TabsTrigger
                  value="csv"
                  className="flex items-center gap-2 py-3 text-sm font-medium text-indigo-700 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all"
                >
                  <Upload className="h-5 w-5" />
                  CSV Upload 📄
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-indigo-700">
                    Select Campus 🏫
                  </Label>
                  <Select
                    onValueChange={(val) => {
                      const selected = CAMPUS_URLS.find((c) => c.label === val);
                      if (selected) {
                        setSheetsUrl(selected.url);
                        setSelectedCampus(val);
                        handleUrlSubmit(selected.url);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500">
                      <SelectValue placeholder="Select a campus" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-lg rounded-md">
                      {CAMPUS_URLS.map((c) => (
                        <SelectItem key={c.label} value={c.label} className="py-2">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="sheets-url"
                    className="text-sm font-medium text-indigo-700"
                  >
                    Google Sheets API URL 🔗
                  </Label>
                  <Input
                    id="sheets-url"
                    placeholder="Enter your Google Apps Script URL..."
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    className="h-12 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <p className="text-sm text-gray-500">
                    Select a campus above to auto-fill or enter a custom Google Apps Script URL 📋
                  </p>
                </div>
                <Button
                  onClick={() => handleUrlSubmit()}
                  disabled={isProcessing}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Analyzing... ⏳
                    </span>
                  ) : (
                    "Analyze Google Sheets 📊"
                  )}
                </Button>
              </TabsContent>

              <TabsContent value="csv" className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="csv-file"
                    className="text-sm font-medium text-indigo-700"
                  >
                    Upload CSV File 📂
                  </Label>
                  <div className="relative">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="h-12 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all"
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Selected: {csvFile.name} ✅
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload a CSV file with columns for student names, instructors, feedback, and ratings 📄
                  </p>
                </div>
                <Button
                  onClick={handleCsvUpload}
                  disabled={isProcessing || !csvFile}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Analyzing... ⏳
                    </span>
                  ) : (
                    "Analyze CSV File 📊"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-6 bg-red-50 border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-700 font-medium">
                  Error ⚠️
                </AlertTitle>
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {isProcessing && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardContent className="flex items-center justify-center h-64">
              <div className="flex items-center gap-4 text-indigo-700">
                <LoadingSpinner size="lg" />
                <span className="text-lg font-medium">
                  Processing Data... {formatSeconds(loadingSeconds)} ⏳
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {processedData && !isProcessing && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm rounded-2xl">
            <CardHeader>
              {selectedCampus && (
                <CardTitle className="text-2xl font-semibold text-indigo-800">
                  Campus: {selectedCampus} 🏫
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              <BeautifulDashboard data={processedData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}