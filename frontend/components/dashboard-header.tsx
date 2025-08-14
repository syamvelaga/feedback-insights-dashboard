import { GraduationCap, BarChart3 } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-border">
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2 bg-primary/10 rounded-lg">
          <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Instructor Feedback Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 line-clamp-2">
            Multi-campus instructor performance analytics and feedback insights
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
        <BarChart3 className="h-4 w-4" />
        <span className="hidden sm:inline">Real-time Analytics</span>
        <span className="sm:hidden">Live Data</span>
      </div>
    </div>
  )
}
