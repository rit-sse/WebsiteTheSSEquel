"use client"

import { useSearchParams } from "next/navigation"
import PrintableSchedule from "@/app/(main)/dashboard/mentoring/components/PrintableSchedule"

export default function PrintSchedulePage() {
  const searchParams = useSearchParams()
  const scheduleId = searchParams.get("scheduleId")

  return (
    <PrintableSchedule 
      scheduleId={scheduleId ? parseInt(scheduleId) : undefined} 
    />
  )
}
