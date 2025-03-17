export function compareDateStrings(date1: string, date2: string){
    let currentDate = Date.now();
    let diff1 = new Date(date1).getTime() - currentDate;
    let diff2 = new Date(date2).getTime() - currentDate;
    return diff1 - diff2;
}

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