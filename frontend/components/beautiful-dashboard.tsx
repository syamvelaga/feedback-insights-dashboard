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
  Users,
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
  const instructorData = data.instructor_stats.map((stat) => {
    const rating = stat.average_rating;
    let color = "#059669"; // Green for high performance

    if (rating < 3.5) {
      color = "#DC2626"; // Red for low performance
    } else if (rating < 4.0) {
      color = "#D97706"; // Orange for medium performance
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Responses
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {data.summary.total_responses}
            </div>
            <p className="text-xs text-blue-600 mt-1">All feedback collected</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {data.summary.average_rating.toFixed(1)}
            </div>
            <p className="text-xs text-green-600 mt-1">out of 5.0</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Negative Feedback
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {data.summary.negative_count}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {getSentimentPercentage(data.summary.negative_count)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Positive Feedback
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
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
        <InstructorPerformanceChart
          data={instructorData}
          height={400}
          animate={true}
          gradient={true}
          rounded={true}
          showLegend={true}
          description="Performance-based color coding: Green (Excellent) • Orange (Good) • Red (Needs Improvement)"
        />
      )}

      {/* Feedback Trends */}
      {trendsData.length > 1 && (
        <FeedbackTrendsChart
          data={trendsData}
          height={300}
          animate={true}
          gradient={true}
          rounded={true}
          showLegend={false}
          description="Daily number of feedback entries"
        />
      )}

      {/* Flagged Entries */}
      {data.flagged_entries.length > 0 && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="bg-transparent">
            <CardTitle className="text-xl text-red-800 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5" />
              Flagged Negative Feedback
            </CardTitle>
            <CardDescription className="text-red-700">
              Comments requiring immediate attention (
              {data.flagged_entries.length} items)
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-white rounded-lg">
            <div className="space-y-4">
              {data.flagged_entries.map((entry, index) => (
                <div
                  key={index}
                  className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-gray-900">
                        {entry.student_name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Instructor: {entry.instructor}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-red-600">
                          Rating: {entry.rating}/5
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {(entry.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <blockquote className="text-gray-800 italic border-l-2 border-gray-300 pl-4 mb-2">
                    "{entry.feedback}"
                  </blockquote>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Sentiment Analysis Summary
            </CardTitle>
            <CardDescription>
              Color legend — Green: Positive • Amber: Neutral • Red: Negative
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
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
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-800">
                  Neutral Feedback
                </span>
                <div className="text-right">
                  <div className="font-bold text-yellow-900">
                    {data.summary.neutral_count}
                  </div>
                  <div className="text-sm text-yellow-600">
                    {getSentimentPercentage(data.summary.neutral_count)}%
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
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

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Instructor Insights
            </CardTitle>
            <CardDescription>Key metrics for each instructor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.instructor_stats.map((instructor, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {instructor.instructor}
                    </h4>
                    <Badge
                      variant={
                        instructor.negative_count > 0
                          ? "destructive"
                          : "default"
                      }
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
