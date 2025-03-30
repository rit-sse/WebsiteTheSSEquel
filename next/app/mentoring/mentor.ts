import { AllMentorTime } from "./timeSlot"
import { Time } from "./timeSlot"

export interface Mentors{
    name: string
    major: string
    time: Time[]
    courses: string[]
}

export const mockmentors: Mentors[] = [
    {major: "SWEN", name: "John Mentor", time: [AllMentorTime[2][2],AllMentorTime[3][1],AllMentorTime[1][2]],courses:["SWEN-261","SWEN-123","SWEN-444"]},
    {major: "SWEN", name: "SSE Dave", time: [AllMentorTime[1][2],AllMentorTime[3][4],AllMentorTime[2][3]],courses:["SWEN-261","SWEN-214","SWEN-250"]},
    {major: "CS", name: "Jackoson Es",time: [AllMentorTime[1][3],AllMentorTime[4][5],AllMentorTime[2][4]],courses:["SWEN-334","SWEN-261"]},
    {major: "GDD",name: "Anthony Peng",time: [AllMentorTime[1][3],AllMentorTime[2][5],AllMentorTime[4][1]],courses:["SWEN-261","SWEN-444"]}
]



export function sortMentorMajor(mentor:Mentors[]){
    var mentorMajors:Mentors[][] = [];
    for(let i = 0; i < mentor.length; i++){
        var oldMajor:boolean = false
        for(let k = 0; k < mentorMajors.length; k++){
            if(mentorMajors[k][0].major == mentor[i].major){
                mentorMajors[k].push(mentor[i])
                oldMajor = true
            }
        }
        if(oldMajor == false){
            var x:Mentors[] = []
            x.push(mentor[i])
            mentorMajors.push(x) 
        }
    }
    return mentorMajors;
}

export function sortMentorClasses(mentor:Mentors[]){
    var mentorClasses:Mentors[][] = [];
    for(let i = 0; i < mentor.length; i++){
        var oldClass:boolean = false
        for(let k = 0; k < mentorClasses.length; k++){
            if(mentorClasses[k][0].courses == mentor[i].courses){
                mentorClasses[k].push(mentor[i])
                oldClass = true
            }
        }
        if(oldClass == false){
            var x:Mentors[] = []
            x.push(mentor[i])
            mentorClasses.push(x) 
        }
    }
    return mentorClasses;
}
