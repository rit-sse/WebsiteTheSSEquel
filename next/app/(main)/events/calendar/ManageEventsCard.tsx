"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"

interface Props {
  modalAdd: () => void
}

const ManageEventCard = ({ modalAdd }: Props) => {
  const [isOfficer, setIsOfficer] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch("/api/authLevel")
        const userData = await response.json()
        setIsOfficer(userData.isOfficer)
      } catch (error) {
        console.error("Error checking auth level:", error)
      }
    }
    checkUserStatus()
  }, [])

  if (!isOfficer) {
    return null
  }

  return (
    <Card className="p-4 shrink-0">
      <h3 className="text-lg font-semibold mb-3 text-center">Manage Events</h3>
      <Button onClick={modalAdd} className="w-full">
        <Plus className="h-4 w-4" />
        Add Event
      </Button>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Click on an event in the calendar to view or edit
      </p>
    </Card>
  )
}

export default ManageEventCard
