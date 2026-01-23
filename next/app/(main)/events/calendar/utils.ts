/**
 * Compare 2 date strings in ISO format
 * @param date1 First date string 
 * @param date2 Second date string
 * @returns Difference between the strings in milliseconds
 */
export function compareDateStrings(date1: string, date2: string){
    let currentDate = Date.now();
    let diff1 = new Date(date1).getTime() - currentDate;
    let diff2 = new Date(date2).getTime() - currentDate;
    return diff1 - diff2;
}

/**
 * Takes a date string in ISO format and formats it in New York timezone
 * @param isoString ISOString of date. ie 2025-03-20T07:05:00.000Z
 * @returns Formatted string of date. ie March 20 at 03:05 AM
 */
export function formatDate(isoString: string){
    const dateString = new Date(isoString).toLocaleString("en-US", { 
        timeZone: "America/New_York", 
        month: "long",
        day: "2-digit", 
        hour: "2-digit",
        minute: "2-digit" 
    })
    return dateString
}