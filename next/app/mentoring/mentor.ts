import { AllMentorTime } from "./timeSlot"
import { Time } from "./timeSlot"

const timeslot_y = 20
const timeslot_x = 50

export interface Mentors{
    name: string
    time: Time[]
    courses: string[]
    color: string
}

export const mockmentors: Mentors[] = [
    {name: "John Mentor", time: [AllMentorTime[2][2],AllMentorTime[3][1],AllMentorTime[1][2]],courses:["SWEN-261","SWEN-123","SWEN-444"],color:'red'},
    {name: "SSE Dave", time: [AllMentorTime[1][2],AllMentorTime[3][4],AllMentorTime[2][3]],courses:["SWEN-261","SWEN-214","SWEN-250"],color:'blue'},
]