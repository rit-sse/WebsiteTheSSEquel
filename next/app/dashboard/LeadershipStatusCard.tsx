"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Users, ExternalLink } from "lucide-react"
import Link from "next/link"

interface Position {
  id: number
  title: string
  is_primary: boolean
  email: string
  isFilled: boolean
  activeOfficerCount: number
}

export default function LeadershipStatusCard() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPositions()
  }, [])

  const fetchPositions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/officer-positions")
      if (response.ok) {
        const data = await response.json()
        setPositions(data)
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalPositions = positions.length
  const filledPositions = positions.filter(p => p.isFilled).length
  const percentage = totalPositions > 0 ? Math.round((filledPositions / totalPositions) * 100) : 0

  // Determine color based on percentage
  const getStatusColor = () => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400"
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getProgressColor = () => {
    if (percentage >= 80) return "bg-green-600"
    if (percentage >= 50) return "bg-yellow-600"
    return "bg-red-600"
  }

  // Separate primary and committee positions
  const primaryPositions = positions.filter(p => p.is_primary)
  const committeePositions = positions.filter(p => !p.is_primary)
  const filledPrimary = primaryPositions.filter(p => p.isFilled).length
  const filledCommittee = committeePositions.filter(p => p.isFilled).length

  if (isLoading) {
    return (
      <Card depth={2} className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-2 rounded w-1/3"></div>
          <div className="h-4 bg-surface-2 rounded w-full"></div>
          <div className="h-8 bg-surface-2 rounded w-1/4"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card depth={2} className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-foreground">Leadership Status</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Officer positions filled</p>
          </div>
        </div>
        <Link href="/about/leadership" className="w-full sm:w-auto">
          <Button variant="neutral" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            View Page
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Main progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className={`text-2xl sm:text-3xl font-bold ${getStatusColor()}`}>
            {filledPositions}/{totalPositions}
          </span>
          <span className={`text-xs sm:text-sm font-medium ${getStatusColor()}`}>
            {percentage}%
          </span>
        </div>
        <div className="relative h-2 sm:h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div 
            className={`h-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Primary Officers</p>
          <p className="font-semibold text-sm sm:text-base text-foreground">
            {filledPrimary}/{primaryPositions.length} filled
          </p>
        </div>
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">Committee Heads</p>
          <p className="font-semibold text-sm sm:text-base text-foreground">
            {filledCommittee}/{committeePositions.length} filled
          </p>
        </div>
      </div>

      {/* Unfilled positions warning */}
      {filledPositions < totalPositions && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">Unfilled positions:</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {positions.filter(p => !p.isFilled).slice(0, 5).map(p => (
              <span 
                key={p.id} 
                className="text-xs px-2 py-0.5 sm:py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                {p.title}
              </span>
            ))}
            {positions.filter(p => !p.isFilled).length > 5 && (
              <span className="text-xs px-2 py-0.5 sm:py-1 text-muted-foreground">
                +{positions.filter(p => !p.isFilled).length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
