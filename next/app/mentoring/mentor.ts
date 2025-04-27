import {convertMentorTimetoData, getMentorTime } from "./timeSlot"
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
            console.log(data[0])
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
                var time = new Date("1970-01-01T16:00:00.000Z").toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'UTC'
                  });
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

//all post commands 

const createUser = async (name: string, email: string) => {
    const response = await fetch("http://localhost:3000/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name:name, email:email }),
    });
  
    if (!response.ok) {
      throw new Error(await response.text());
    }
  
    const user = await response.json();
    return user; // This will contain id, name, email
  };

const createMentor = async (userId: number, isActive: boolean, expirationDate: string) => {
  const response = await fetch("http://localhost:3000/api/mentor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, isActive, expirationDate })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const mentor = await response.json();
  return mentor;
};

const getOrCreateSkill = async (skill: string) => {
    const res = await fetch("http://localhost:3000/api/skill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({skill }),
    });
  
    if (!res.ok && res.status !== 422) {
      throw new Error(await res.text());
    }
  
    const result = await res.json();
    return result; // Will contain id and skill name
};

const linkSkillToMentor = async (mentor_Id: number, skill_Id: number) => {
    const res = await fetch("http://localhost:3000/api/mentorSkill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mentor_Id,skill_Id }),
    });
  
    if (!res.ok) {
      throw new Error(await res.text());
    }
  
    return await res.json();
  };

const createHourBlock = async (weekday: string, startTime: string) => {
    const res = await fetch("http://localhost:3000/api/hourBlocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({weekday, startTime }),
    });
    return await res.json(); // will include hourBlock.id
  };

const createSchedule = async (mentorId: number, hourBlockId: number) => {
  const response = await fetch("http://localhost:3000/api/schedule", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mentorId, hourBlockId }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json(); // Returns the created schedule
};

const assignCourseToMentor = async (mentorId: number, courseId: number) => {
  const res = await fetch("http://localhost:3000/api/courseTaken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentorId, courseId }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json(); // returns courseTaken entry
};

const createDepartment = async (title: string, shortTitle: string) => {
    const res = await fetch("http://localhost:3000/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({title, shortTitle }),
    });
  
    if (!res.ok) {
      throw new Error(await res.text());
    }
  
    return await res.json(); // returns { id, title, shortTitle }
  };

const createCourse = async (title: string, code: string, departmentId: number) => {
  const res = await fetch("http://localhost:3000/api/course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, code, departmentId }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return await res.json(); // returns course with id
};



export const createNewMentorWithUser = async (mentorName:string,mentorEmail:string,times:Time[],skills:string[], courses:string[]) => {
    try {
        
      const newUser = await createUser(mentorName, mentorEmail);
        
      const expiration = new Date();
      expiration.setFullYear(expiration.getFullYear() + 1);
      
      const newMentor = await createMentor(newUser.id, true, expiration.toISOString());
      for (const timeSlot of times) {
        const newHourBlock = await createHourBlock("Monday", convertMentorTimetoData(timeSlot));
        const newSchedule = await createSchedule(newMentor.id, newHourBlock.id);
      }
      for (const skill of skills) {
        try {
          const skillData = await getOrCreateSkill(skill); // Handles duplicates gracefully
          await linkSkillToMentor(newMentor.id, skillData.id);
        } catch (err) {
          console.warn(`Could not process skill "${skill}":`, err);
        }
      }
      for (const course of courses) {
        const department = await createDepartment(course, course);
        const courseData = await createCourse(course, course, department.id);
        await assignCourseToMentor(newMentor.id, courseData.id);
      }
  
      console.log("Mentor created:", newMentor);
    } catch (err) {
      console.error("Error creating mentor:", err);
    }
};