"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Filter, Check, ChevronsUpDown, X, CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchInstructors, fetchColleges } from "@/lib/api-client"
import { format } from "date-fns"

export interface FilterState {
  college: string
  instructor: string
  dateRange: "today" | "week" | "custom"
  startDate?: Date
  endDate?: Date
}

interface DashboardFiltersProps {
  onFiltersChange: (filters: FilterState) => void
}

export function DashboardFilters({ onFiltersChange }: DashboardFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    college: "all",
    instructor: "all",
    dateRange: "week",
  })

  const [colleges, setColleges] = useState<string[]>([])
  const [instructors, setInstructors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Popover states
  const [collegeOpen, setCollegeOpen] = useState(false)
  const [instructorOpen, setInstructorOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  // Load dropdown data
  useEffect(() => {
    async function loadDropdownData() {
      try {
        setLoading(true)
        const [collegesResponse, instructorsResponse] = await Promise.all([fetchColleges(), fetchInstructors()])

        if (collegesResponse.success && collegesResponse.data) {
          setColleges(collegesResponse.data)
        }

        if (instructorsResponse.success && instructorsResponse.data) {
          setInstructors(instructorsResponse.data)
        }
      } catch (error) {
        console.error("Failed to load dropdown data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDropdownData()
  }, [])

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      college: "all",
      instructor: "all",
      dateRange: "week",
      startDate: undefined,
      endDate: undefined,
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.college !== "all") count++
    if (filters.instructor !== "all") count++
    if (filters.dateRange !== "week") count++
    return count
  }

  const formatDateRange = () => {
    switch (filters.dateRange) {
      case "today":
        return "Today"
      case "week":
        return "This Week"
      case "custom":
        if (filters.startDate && filters.endDate) {
          return `${format(filters.startDate, "MMM d")} - ${format(filters.endDate, "MMM d")}`
        }
        return "Custom Range"
      default:
        return "This Week"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 bg-muted rounded w-24 animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-8 bg-muted rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Filter */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-between min-w-[120px] sm:min-w-[140px] bg-transparent"
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span className="truncate">{formatDateRange()}</span>
                  <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="grid gap-2">
                      <Button
                        variant={filters.dateRange === "today" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateFilter("dateRange", "today")
                          setDateOpen(false)
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant={filters.dateRange === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateFilter("dateRange", "week")
                          setDateOpen(false)
                        }}
                      >
                        This Week
                      </Button>
                      <Button
                        variant={filters.dateRange === "custom" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilter("dateRange", "custom")}
                      >
                        Custom Range
                      </Button>
                    </div>
                  </div>

                  {filters.dateRange === "custom" && (
                    <div className="space-y-3">
                      <div className="grid gap-2">
                        <Label className="text-sm">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-start bg-transparent">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {filters.startDate ? format(filters.startDate, "MMM d, yyyy") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.startDate}
                              onSelect={(date) => updateFilter("startDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-sm">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="justify-start bg-transparent">
                              <CalendarIcon className="h-4 w-4 mr-2" />
                              {filters.endDate ? format(filters.endDate, "MMM d, yyyy") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.endDate}
                              onSelect={(date) => updateFilter("endDate", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => setDateOpen(false)}
                        className="w-full"
                        disabled={!filters.startDate || !filters.endDate}
                      >
                        Apply Date Range
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* College Filter */}
            <Popover open={collegeOpen} onOpenChange={setCollegeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-between min-w-[120px] sm:min-w-[140px] bg-transparent"
                >
                  <span className="truncate">{filters.college === "all" ? "All Colleges" : filters.college}</span>
                  <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search colleges..." />
                  <CommandList>
                    <CommandEmpty>No colleges found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("college", "all")
                          setCollegeOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", filters.college === "all" ? "opacity-100" : "opacity-0")}
                        />
                        All Colleges
                      </CommandItem>
                      {colleges.map((college) => (
                        <CommandItem
                          key={college}
                          value={college}
                          onSelect={() => {
                            updateFilter("college", college)
                            setCollegeOpen(false)
                          }}
                        >
                          <Check
                            className={cn("mr-2 h-4 w-4", filters.college === college ? "opacity-100" : "opacity-0")}
                          />
                          {college}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Instructor Filter */}
            <Popover open={instructorOpen} onOpenChange={setInstructorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-between min-w-[120px] sm:min-w-[140px] bg-transparent"
                >
                  <span className="truncate">
                    {filters.instructor === "all" ? "All Instructors" : filters.instructor}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search instructors..." />
                  <CommandList>
                    <CommandEmpty>No instructors found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          updateFilter("instructor", "all")
                          setInstructorOpen(false)
                        }}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", filters.instructor === "all" ? "opacity-100" : "opacity-0")}
                        />
                        All Instructors
                      </CommandItem>
                      {instructors.map((instructor) => (
                        <CommandItem
                          key={instructor}
                          value={instructor}
                          onSelect={() => {
                            updateFilter("instructor", instructor)
                            setInstructorOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.instructor === instructor ? "opacity-100" : "opacity-0",
                            )}
                          />
                          {instructor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
