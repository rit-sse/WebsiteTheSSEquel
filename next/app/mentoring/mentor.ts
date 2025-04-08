import {getMentorTime } from "./timeSlot"
import { Time } from "./timeSlot"

export interface Mentors{
    id:number
    name: string
    major: string
    time: Time[]
    courses: string[]
    skills: string[]
    selected: boolean
}


export function setSelectedMentor(mentor:Mentors){
    mentor.selected = true
}

export function unSetSelectedMentor(mentor:Mentors){
    mentor.selected = false
}

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

export async function getMentorClasses(string:String[],mentors:Mentors[]){
    var data:any[] = []
    try{
        var response = await fetch("http://localhost:3000/api/courseTaken")
        if (response.ok){
            data = await response.json()
            var i = 0
            while(i< data.length){
                if(!string.includes(data[i].course.title))[
                    string.push(data[i].course.title)
                ]
                var k = 0
                while(k<mentors.length){
                    if(mentors[k].id == data[i].mentorId){
                        mentors[k].courses.push(data[i].course.title)
                    }
                    k++
                }
                i++
            }
        }
    } catch(error) {throw error}
}



export async function getData(mentorList:Mentors[]) {
    var data:any[] = []
    try{
        var response = await fetch("http://localhost:3000/api/mentor")
        if (response.ok){
            data = await response.json()
            var i = 0
            while(i< data.length){
                mentorList.push({major:"SWEN",name: data[i].user.name,time:[],courses:[],id:data[i].id,skills:[],selected:false})
                i++
            }
        }
    } catch(error) {throw error}
}

export async function setSkills(skills:String[],mentors:Mentors[]){
    var data:any[] = []
    try{
        var response = await fetch("http://localhost:3000/api/mentorSkill")
        if (response.ok){
            data = await response.json()
            var i = 0
            while(i<data.length){
                var k = 0
                if(!skills.includes(data[i].skill.skill))[
                    skills.push(data[i].skill.skill)
                ]
                while(k<mentors.length){
                    if(mentors[k].id == data[i].mentor_Id){
                        mentors[k].skills.push(data[i].skill.skill)
                    }
                    k++
                }
                i++
            }
        }
    } catch(error) {throw error}
}

export async function setSchedule(mentors:Mentors[]){
    var data:any[] = []
    try{
        var response = await fetch("http://localhost:3000/api/schedule")
        if (response.ok){
            data = await response.json()
            var i = 0
            while(i<data.length){
                var time = new Date(data[i].schedule[0].hourBlock.startTime).toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                var day = data[i].schedule[0].hourBlock.weekday
                var name = data[i].user.name
                var mentorTime = getMentorTime(time,day)
                var k = 0
                while (k < mentors.length){
                    if(mentors[k].name == name){
                        mentors[k].time.push(mentorTime)
                    }
                    k++
                }
                i++
            }
        }
    } catch(error) {throw error}
}