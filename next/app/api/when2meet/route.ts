import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface When2MeetSlot {
  day: string
  hour: number
  availableNames: string[]
}

interface When2MeetData {
  eventName: string
  participants: string[]
  slots: When2MeetSlot[]
  rawTimeSlots: {
    dayIndex: number
    hour: number
    minute: number
    availableIds: number[]
  }[]
}

/**
 * HTTP POST request to /api/when2meet
 * Fetches and parses When2Meet data from a given URL
 * @param request { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate When2Meet URL
    const when2meetPattern = /when2meet\.com\/\?(\d+-\w+)/
    const match = url.match(when2meetPattern)
    if (!match) {
      return NextResponse.json(
        { error: "Invalid When2Meet URL. Expected format: https://www.when2meet.com/?XXXXXXXX-XXXXX" },
        { status: 400 }
      )
    }

    const eventId = match[1]

    // Fetch the When2Meet page
    const response = await fetch(`https://www.when2meet.com/?${eventId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SSE Mentor Scheduler)",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch When2Meet page" },
        { status: 502 }
      )
    }

    const html = await response.text()

    // Parse the JavaScript data from the page
    const data = parseWhen2MeetData(html)

    if (!data) {
      return NextResponse.json(
        { error: "Failed to parse When2Meet data. The event may be expired or invalid." },
        { status: 422 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching When2Meet:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching When2Meet data" },
      { status: 500 }
    )
  }
}

/**
 * Parse When2Meet HTML to extract availability data
 */
function parseWhen2MeetData(html: string): When2MeetData | null {
  try {
    // Extract event name
    const eventNameMatch = html.match(/<span id="NewEventNameDiv"[^>]*>([^<]+)<\/span>/)
    const eventName = eventNameMatch ? eventNameMatch[1].trim() : "Unknown Event"

    // Extract PeopleNames array
    const peopleNamesMatch = html.match(/PeopleNames\s*=\s*\[([^\]]*)\]/)
    if (!peopleNamesMatch) {
      console.error("Could not find PeopleNames")
      return null
    }
    
    const peopleNamesStr = peopleNamesMatch[1]
    const participants = peopleNamesStr
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter((s) => s.length > 0)

    // Extract PeopleIDs array
    const peopleIdsMatch = html.match(/PeopleIDs\s*=\s*\[([^\]]*)\]/)
    const peopleIds = peopleIdsMatch
      ? peopleIdsMatch[1].split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : []

    // Extract TimeOfSlot array (Unix timestamps for each slot)
    const timeOfSlotMatch = html.match(/TimeOfSlot\s*=\s*\[([^\]]*)\]/)
    if (!timeOfSlotMatch) {
      console.error("Could not find TimeOfSlot")
      return null
    }
    
    const timeSlots = timeOfSlotMatch[1]
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))

    // Extract AvailableAtSlot array (which people are available at each slot)
    const availableAtSlotMatch = html.match(/AvailableAtSlot\s*=\s*\[([^\]]*)\]/)
    if (!availableAtSlotMatch) {
      console.error("Could not find AvailableAtSlot")
      return null
    }

    // AvailableAtSlot is an array of arrays, need to parse it carefully
    const availableAtSlotStr = availableAtSlotMatch[1]
    const availableAtSlot: number[][] = []
    
    // Parse the nested array structure
    let current: number[] = []
    let inArray = false
    let numStr = ""
    
    for (const char of availableAtSlotStr) {
      if (char === "[") {
        inArray = true
        current = []
      } else if (char === "]") {
        if (numStr.trim()) {
          current.push(parseInt(numStr.trim()))
        }
        numStr = ""
        if (inArray) {
          availableAtSlot.push(current)
          inArray = false
        }
      } else if (char === ",") {
        if (numStr.trim() && inArray) {
          current.push(parseInt(numStr.trim()))
        }
        numStr = ""
      } else if (char >= "0" && char <= "9") {
        numStr += char
      }
    }

    // Create a map of person ID to name
    const idToName: Record<number, string> = {}
    for (let i = 0; i < peopleIds.length && i < participants.length; i++) {
      idToName[peopleIds[i]] = participants[i]
    }

    // Process time slots into a more usable format
    const slots: When2MeetSlot[] = []
    const rawTimeSlots: When2MeetData["rawTimeSlots"] = []
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    for (let i = 0; i < timeSlots.length && i < availableAtSlot.length; i++) {
      const timestamp = timeSlots[i]
      const date = new Date(timestamp * 1000)
      const dayIndex = date.getDay()
      const hour = date.getHours()
      const minute = date.getMinutes()
      
      const availableIds = availableAtSlot[i] || []
      const availableNames = availableIds.map((id) => idToName[id]).filter(Boolean)

      // Only include Monday-Friday, 10am-6pm (matching our schedule grid)
      if (dayIndex >= 1 && dayIndex <= 5 && hour >= 10 && hour < 18) {
        // Only add full hour slots (minute === 0) or combine 15-min slots
        if (minute === 0) {
          slots.push({
            day: dayNames[dayIndex],
            hour,
            availableNames,
          })
        }

        rawTimeSlots.push({
          dayIndex,
          hour,
          minute,
          availableIds,
        })
      }
    }

    // Deduplicate and aggregate slots by day/hour
    const slotMap = new Map<string, Set<string>>()
    for (const slot of slots) {
      const key = `${slot.day}-${slot.hour}`
      if (!slotMap.has(key)) {
        slotMap.set(key, new Set())
      }
      for (const name of slot.availableNames) {
        slotMap.get(key)!.add(name)
      }
    }

    const aggregatedSlots: When2MeetSlot[] = []
    const slotEntries = Array.from(slotMap.entries())
    for (let i = 0; i < slotEntries.length; i++) {
      const [key, names] = slotEntries[i]
      const [day, hourStr] = key.split("-")
      aggregatedSlots.push({
        day,
        hour: parseInt(hourStr),
        availableNames: Array.from(names),
      })
    }

    return {
      eventName,
      participants,
      slots: aggregatedSlots,
      rawTimeSlots,
    }
  } catch (error) {
    console.error("Error parsing When2Meet data:", error)
    return null
  }
}
