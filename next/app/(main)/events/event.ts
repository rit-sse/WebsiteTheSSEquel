export interface Event {
    id?: string,
    title: string,
    date: string,
    location: string,
    image: string,
    description: string,
    attendanceEnabled?: boolean,
    grantsMembership?: boolean
}