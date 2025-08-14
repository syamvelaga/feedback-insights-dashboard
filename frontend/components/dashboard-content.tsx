"use client"

import { DashboardStats } from "@/components/dashboard-stats"
import { FeedbackLists } from "@/components/feedback-lists"
import { DashboardFilters } from "@/components/dashboard-filters"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { InstructorRatingChart } from "@/components/instructor-rating-chart"
import { FeedbackTrendsChart } from "@/components/feedback-trends-chart"
import { RatingDistributionChart } from "@/components/rating-distribution-chart"
import { useDashboard } from "@/components/dashboard-context"

export function DashboardContent() {
  const { updateFilters, loading } = useDashboard()

  return (
    <div className="space-y-6">
      <DashboardFilters onFiltersChange={updateFilters} />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <DashboardStats />

          <div className="grid gap-6 xl:grid-cols-2">
            <InstructorRatingChart />
            <FeedbackTrendsChart />
          </div>

          <div className="grid gap-6 xl:grid-cols-4">
            <div className="xl:col-span-1">
              <RatingDistributionChart />
            </div>
            <div className="xl:col-span-3">
              <FeedbackLists />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
