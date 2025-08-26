
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InstructorPerformanceChart,
  FeedbackTrendsChart,
} from "@/components/ui/beautiful-bar-chart";
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Star,
  AlertTriangle,
  BarChart3,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface BeautifulDashboardProps {
  data: ProcessedData;
  className?: string;
}

export function BeautifulDashboard({
  data,
  className,
}: BeautifulDashboardProps) {
  const [flaggedPage, setFlaggedPage] = React.useState(1);
  const flaggedPageSize = 5;
  const flaggedTotalPages = Math.max(
    1,
    Math.ceil(data.flagged_entries.length / flaggedPageSize)
  );

  React.useEffect(() => {
    setFlaggedPage(1);
  }, [data.flagged_entries.length]);

  const pagedFlaggedEntries = React.useMemo(() => {
    const startIndex = (flaggedPage - 1) * flaggedPageSize;
    const endIndex = startIndex + flaggedPageSize;
    return data.flagged_entries.slice(startIndex, endIndex);
  }, [data.flagged_entries, flaggedPage]);

  const instructorData = data.instructor_stats.map((stat) => {
    const rating = stat.average_rating;
    let color = "#10B981"; // Green for high performance
    if (rating < 3.5) {
      color = "#EF4444"; // Red for low performance
    } else if (rating < 4.0) {
      color = "#F59E0B"; // Amber for medium performance
    }
    return {
      name: stat.instructor,
      value: stat.average_rating,
      color: color,
      fill: color,
      responses: stat.total_responses,
      negativeCount: stat.negative_count,
    };
  });

  const trendsData = React.useMemo(() => {
    const dailyCounts: { [key: string]: number } = {};
    data.all_data.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleDateString();
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, count]) => ({
        name: date,
        value: count,
      }));
  }, [data.all_data]);

  const getSentimentPercentage = (count: number) => {
    return ((count / data.summary.total_responses) * 100).toFixed(1);
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover-scale fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-800">
              Total Responses
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {data.summary.total_responses}
            </div>
            <p className="text-xs text-blue-600 mt-1">All feedback collected</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover-scale fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-800">
              Average Rating
            </CardTitle>
            <Star className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {data.summary.average_rating.toFixed(1)}
            </div>
            <p className="text-xs text-green-600 mt-1">out of 5.0</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover-scale fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-800">
              Negative Feedback
            </CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">
              {data.summary.negative_count}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {getSentimentPercentage(data.summary.negative_count)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover-scale fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-800">
              Positive Feedback
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {data.summary.positive_count}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {getSentimentPercentage(data.summary.positive_count)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructor Performance */}
      {instructorData.length > 0 && (
        <Card className="border-none shadow-lg bg-white hover-scale fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              Instructor Performance Analysis
            </CardTitle>
            <CardDescription className="text-gray-600">
              Instructors: {instructorData.length} • Performance-based color coding: <span className="text-green-600">Green (Excellent)</span> • <span className="text-amber-600">Amber (Good)</span> • <span className="text-red-600">Red (Needs Improvement)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">Total Instructors: {instructorData.length}</span>
              </div>
              <div className="text-sm text-gray-600 flex flex-wrap gap-2">
                {instructorData.map((instructor, index) => {
                  const rating = instructor.value;
                  let dotColor = "bg-green-500";
                  if (rating < 3.5) {
                    dotColor = "bg-red-500";
                  } else if (rating < 4.0) {
                    dotColor = "bg-amber-500";
                  }
                  return (
                    <span key={instructor.name} className="inline-flex items-center mr-3 mb-1">
                      {instructor.name} <span className={`inline-block w-2 h-2 rounded-full ml-1 ${dotColor}`}></span> ({instructor.value.toFixed(1)})
                      {index < instructorData.length - 1 && ","}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="relative custom-scrollbar">
              <div className="max-h-[480px] overflow-y-auto pr-2">
                <InstructorPerformanceChart
                  data={instructorData}
                  height={Math.max(300, instructorData.length * 40)}
                  animate={true}
                  gradient={true}
                  rounded={true}
                  showLegend={false}
                  title=""
                  description=""
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Trends */}
      {trendsData.length > 1 && (
        <Card className="border-none shadow-lg bg-white hover-scale fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Feedback Trends
            </CardTitle>
            <CardDescription className="text-gray-600">
              Daily number of feedback entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackTrendsChart
              data={trendsData}
              height={300}
              animate={true}
              gradient={true}
              rounded={true}
              showLegend={false}
              description=""
            />
          </CardContent>
        </Card>
      )}

      {/* Flagged Entries */}
      {data.flagged_entries.length > 0 && (
        <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover-scale fade-in">
          <CardHeader className="bg-transparent">
            <CardTitle className="text-xl font-semibold text-red-800 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              Flagged Negative Feedback
            </CardTitle>
            <CardDescription className="text-red-700">
              Comments requiring immediate attention ({data.flagged_entries.length} items)
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white rounded-lg">
            <div className="max-h-[480px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {pagedFlaggedEntries.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg hover:bg-red-100 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div />
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold text-red-600">
                        Rating: {entry.rating}/5
                      </div>
                      {typeof entry.confidence !== 'undefined' && (
                        <div className="text-sm text-red-700">
                          Confidence: {(entry.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                      {entry.timestamp && (
                        <div className="text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Instructor:</span>{" "}
                      <span className="font-semibold text-gray-900">{entry.instructor}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Student:</span>{" "}
                      <span className="font-normal">{entry.student_name}</span>
                    </p>
                    <p>
                      <span className="font-semibold">Feedback:</span>{" "}
                      <span className="italic">"{entry.feedback}"</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Page {flaggedPage} of {flaggedTotalPages}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFlaggedPage((p) => Math.max(1, p - 1))}
                  disabled={flaggedPage === 1}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFlaggedPage((p) =>
                      Math.min(flaggedTotalPages, p + 1)
                    )
                  }
                  disabled={flaggedPage === flaggedTotalPages}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  Next
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-lg bg-white hover-scale fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <Activity className="h-6 w-6 text-blue-600" />
              Sentiment Analysis Summary
            </CardTitle>
            <CardDescription className="text-gray-600">
              Color legend — <span className="text-green-600">Green: Positive</span> • <span className="text-amber-600">Amber: Neutral</span> • <span className="text-red-600">Red: Negative</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                <span className="font-medium text-green-800">
                  Positive Feedback
                </span>
                <div className="text-right">
                  <div className="font-bold text-green-900">
                    {data.summary.positive_count}
                  </div>
                  <div className="text-sm text-green-600">
                    {getSentimentPercentage(data.summary.positive_count)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors duration-200">
                <span className="font-medium text-amber-800">
                  Neutral Feedback
                </span>
                <div className="text-right">
                  <div className="font-bold text-amber-900">
                    {data.summary.neutral_count}
                  </div>
                  <div className="text-sm text-amber-600">
                    {getSentimentPercentage(data.summary.neutral_count)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200">
                <span className="font-medium text-red-800">
                  Negative Feedback
                </span>
                <div className="text-right">
                  <div className="font-bold text-red-900">
                    {data.summary.negative_count}
                  </div>
                  <div className="text-sm text-red-600">
                    {getSentimentPercentage(data.summary.negative_count)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white hover-scale fade-in">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2 text-gray-900">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              Instructor Insights
            </CardTitle>
            <CardDescription className="text-gray-600">
              Key metrics for each instructor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[480px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {data.instructor_stats.map((instructor, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {instructor.instructor}
                    </h4>
                    <Badge
                      variant={
                        instructor.negative_count > 0
                          ? "destructive"
                          : "default"
                      }
                      className="text-xs"
                    >
                      {instructor.negative_count} negative
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Responses:</span>
                      <span className="font-medium ml-1">
                        {instructor.total_responses}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg Rating:</span>
                      <span className="font-medium ml-1">
                        {instructor.average_rating.toFixed(1)}/5.0
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}