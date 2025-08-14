"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { name: "Positive", value: 15, color: "#059669" },
  { name: "Neutral", value: 8, color: "#F59E0B" },
  { name: "Negative", value: 3, color: "#DC2626" },
];

export function SimpleTestChart() {
  return (
    <div className="w-full h-64 border-2 border-red-500 p-4">
      <h3 className="text-lg font-bold mb-4">Simple Test Chart</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
