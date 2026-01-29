/**
 * Utility functions for semester-based grouping and sorting
 */

export interface SemesterInfo {
  label: string
  sortKey: string
}

/**
 * Get semester label and sort key from a date string
 * - Fall: August - December
 * - Spring: January - May
 * - Summer: June - July
 */
export function getSemester(dateString: string): SemesterInfo {
  const date = new Date(dateString)
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear()

  if (month >= 8 && month <= 12) {
    // August - December = Fall
    return { label: `Fall ${year}`, sortKey: `${year}-2` }
  } else if (month >= 1 && month <= 5) {
    // January - May = Spring
    return { label: `Spring ${year}`, sortKey: `${year}-1` }
  } else {
    // June - July = Summer
    return { label: `Summer ${year}`, sortKey: `${year}-0` }
  }
}

export interface SemesterGroup<T> {
  label: string
  sortKey: string
  items: T[]
}

/**
 * Generic function to group items by semester
 * @param items - Array of items to group
 * @param getDate - Function to extract date string from an item
 * @returns Array of semester groups sorted by most recent first
 */
export function groupBySemester<T>(
  items: T[],
  getDate: (item: T) => string
): SemesterGroup<T>[] {
  const groups: { [key: string]: SemesterGroup<T> } = {}

  for (const item of items) {
    const { label, sortKey } = getSemester(getDate(item))

    if (!groups[label]) {
      groups[label] = { label, sortKey, items: [] }
    }
    groups[label].items.push(item)
  }

  // Sort groups by sortKey descending (most recent first)
  return Object.values(groups).sort((a, b) => b.sortKey.localeCompare(a.sortKey))
}

/**
 * Identify recurring event series by grouping events with the same title
 * @param events - Array of events
 * @returns Map of event title to array of events
 */
export function identifyRecurringSeries<T extends { title: string }>(
  events: T[]
): Map<string, T[]> {
  const seriesMap = new Map<string, T[]>()

  for (const event of events) {
    const existing = seriesMap.get(event.title) || []
    existing.push(event)
    seriesMap.set(event.title, existing)
  }

  return seriesMap
}

/**
 * Sort events within a group, putting recurring series together
 * @param events - Array of events to sort
 * @param getDate - Function to extract date string from an event
 * @returns Sorted array with recurring events grouped together
 */
export function sortEventsWithRecurring<T extends { title: string }>(
  events: T[],
  getDate: (event: T) => string
): { event: T; isRecurring: boolean; seriesCount: number }[] {
  // Identify recurring series
  const seriesMap = identifyRecurringSeries(events)

  // Separate recurring and non-recurring events
  const recurring: T[] = []
  const nonRecurring: T[] = []

  for (const event of events) {
    const series = seriesMap.get(event.title) || []
    if (series.length > 1) {
      recurring.push(event)
    } else {
      nonRecurring.push(event)
    }
  }

  // Sort non-recurring by date (most recent first)
  nonRecurring.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime())

  // Sort recurring by title first, then by date within each series
  recurring.sort((a, b) => {
    if (a.title !== b.title) {
      // Sort series by the earliest date in each series
      const aSeriesDates = (seriesMap.get(a.title) || []).map((e) => new Date(getDate(e)).getTime())
      const bSeriesDates = (seriesMap.get(b.title) || []).map((e) => new Date(getDate(e)).getTime())
      const aEarliest = Math.min(...aSeriesDates)
      const bEarliest = Math.min(...bSeriesDates)
      return bEarliest - aEarliest // Most recent series first
    }
    // Within the same series, sort by date (earliest first)
    return new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime()
  })

  // Combine: recurring first, then non-recurring
  const result: { event: T; isRecurring: boolean; seriesCount: number }[] = []

  for (const event of recurring) {
    const series = seriesMap.get(event.title) || []
    result.push({
      event,
      isRecurring: true,
      seriesCount: series.length,
    })
  }

  for (const event of nonRecurring) {
    result.push({
      event,
      isRecurring: false,
      seriesCount: 1,
    })
  }

  return result
}
