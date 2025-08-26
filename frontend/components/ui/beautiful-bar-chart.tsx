"use client";

import * as React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

interface BarChartData {
  name: string;
  value: number;
  color?: string;
  [key: string]: any;
}

interface BeautifulBarChartProps {
  data: BarChartData[];
  title?: string;
  description?: string;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  gradient?: boolean;
  rounded?: boolean;
  horizontal?: boolean;
  colorScheme?: "blue" | "green" | "purple" | "orange" | "red" | "custom";
  customColors?: string[];
}

const defaultColors = {
  blue: ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD"],
  green: ["#059669", "#10B981", "#34D399", "#6EE7B7"],
  purple: ["#7C3AED", "#8B5CF6", "#A78BFA", "#C4B5FD"],
  orange: ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D"],
  red: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5"],
};

export function BeautifulBarChart({
  data,
  title,
  description,
  height = 300,
  className,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  animate = true,
  gradient = false,
  rounded = true,
  horizontal = false,
  colorScheme = "blue",
  customColors,
}: BeautifulBarChartProps) {
  // Ensure we have valid data
  const validData = React.useMemo(() => {
    return data.filter(item => item && typeof item.value === 'number' && !isNaN(item.value));
  }, [data]);

  // Enhanced color handling
  const colors = React.useMemo(() => {
    if (customColors && customColors.length > 0) {
      return customColors;
    }
    if (colorScheme === "custom") {
      return ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
    }
    return defaultColors[colorScheme] || defaultColors.blue;
  }, [customColors, colorScheme]);

  const chartData = React.useMemo(() => {
    return validData.map((item, index) => ({
      ...item,
      color: item.color || colors[index % colors.length],
      fill: item.color || colors[index % colors.length],
    }));
  }, [validData, colors]);

  // Debug logging
  React.useEffect(() => {
    console.log('Chart Data:', chartData);
    console.log('Colors:', colors);
    console.log('Valid Data:', validData);
  }, [chartData, colors, validData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.name}: <span className="font-medium">{entry.value}</span>
              {entry.payload?.responses && (
                <span className="text-xs text-gray-500 ml-2">
                  ({entry.payload.responses} responses)
                </span>
              )}
              {entry.payload?.negativeCount !== undefined && (
                <span className="text-xs text-red-500 ml-2">
                  {entry.payload.negativeCount} negative
                </span>
              )}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // If no valid data, show placeholder
  if (!validData || validData.length === 0) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
            <p className="text-gray-500">No data available for chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartContent = (
    <div className="w-full h-full min-h-[300px] border border-gray-200 rounded-lg p-4">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart
          data={chartData}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 20, right: 30, left: horizontal ? 120 : 20, bottom: 5 }}
          barCategoryGap={horizontal ? "12%" : "20%"}
          barGap={horizontal ? 4 : 2}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" opacity={0.5} />
          )}
          <XAxis
            dataKey={horizontal ? "value" : "name"}
            type={horizontal ? "number" : "category"}
            domain={horizontal ? [0, "auto"] : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickMargin={10}
          />
          <YAxis
            dataKey={horizontal ? "name" : "value"}
            type={horizontal ? "category" : "number"}
            domain={!horizontal ? [0, "auto"] : undefined}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickMargin={10}
          />
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Bar
            dataKey="value"
            radius={rounded ? (horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]) : undefined}
            animationDuration={animate ? 1000 : 0}
            animationBegin={animate ? 0 : undefined}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke={entry.color}
              />
            ))}
            <LabelList
              dataKey="value"
              position={horizontal ? "right" : "top"}
              formatter={(value: any) => `${Number(value).toFixed(1)}`}
              style={{ fontSize: "12px", fill: "#374151" }}
            />
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );

  const legend = showLegend ? (
    <div className="flex flex-wrap items-center gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
      {chartData.map((item, idx) => (
        <div key={`legend-${idx}`} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-gray-700 font-medium">{item.name}</span>
          <span className="text-gray-500">({item.value})</span>
        </div>
      ))}
    </div>
  ) : null;

  if (title || description) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        {(title || description) && (
          <CardHeader className="pb-4">
            {title && (
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          {chartContent}
          {legend}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {chartContent}
      {legend}
    </div>
  );
}

// Specialized chart components for common use cases
export function SentimentBarChart({
  data,
  ...props
}: Omit<BeautifulBarChartProps, "colorScheme">) {
  const sentimentColors = ["#059669", "#F59E0B", "#DC2626"]; // Green, Orange, Red
  return (
    <BeautifulBarChart
      {...props}
      data={data}
      colorScheme="custom"
      customColors={sentimentColors}
      title="Sentiment Distribution"
      description="Distribution of feedback sentiment across responses"
    />
  );
}

export function InstructorPerformanceChart({
  data,
  ...props
}: Omit<BeautifulBarChartProps, "colorScheme">) {
  // Color code based on performance: Green for high ratings, Orange for medium, Red for low
  const performanceData = data.map((item) => {
    const rating = item.value;
    let color = "#059669"; // Green for high performance

    if (rating < 3.5) {
      color = "#DC2626"; // Red for low performance
    } else if (rating < 4.0) {
      color = "#D97706"; // Orange for medium performance
    }

    return {
      ...item,
      color,
      fill: color,
      performanceLevel:
        rating >= 4.0
          ? "Excellent"
          : rating >= 3.5
          ? "Good"
          : "Needs Improvement",
    };
  });

  return (
    <div className="w-full">
      <BeautifulBarChart
        {...props}
        data={performanceData}
        colorScheme="custom"
        customColors={performanceData.map((d) => d.color)}
        title=""
        description=""
        horizontal={true}
        showLegend={false}
      />
    </div>
  );
}

export function RatingDistributionChart({
  data,
  ...props
}: Omit<BeautifulBarChartProps, "colorScheme">) {
  const ratingColors = ["#DC2626", "#D97706", "#F59E0B", "#10B981", "#059669"]; // 1-5 stars
  return (
    <BeautifulBarChart
      {...props}
      data={data}
      colorScheme="custom"
      customColors={ratingColors}
      title="Rating Distribution"
      description="Distribution of ratings from 1 to 5"
    />
  );
}

export function FeedbackTrendsChart({
  data,
  ...props
}: Omit<BeautifulBarChartProps, "colorScheme">) {
  return (
    <BeautifulBarChart
      {...props}
      data={data}
      colorScheme="purple"
      title="Feedback Trends"
      description="Feedback volume over time"
      gradient={true}
      rounded={true}
    />
  );
}
