type RemovedBlock = {
  weekday: number
  startHour: number
}

type AvailabilityEvent = {
  semesterId: number
  userId: number
  updatedAt: string
  removedBlocks: RemovedBlock[]
}

const events = new Map<string, AvailabilityEvent>()

function key(semesterId: number, userId: number): string {
  return `${semesterId}:${userId}`
}

export function recordMentorAvailabilityEvent(event: AvailabilityEvent) {
  events.set(key(event.semesterId, event.userId), event)
}

export function getMentorAvailabilityEvent(semesterId: number, userId: number): AvailabilityEvent | null {
  return events.get(key(semesterId, userId)) ?? null
}
