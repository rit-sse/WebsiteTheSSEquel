'use client';
import React, { useEffect, useState } from "react";
import { getData, getMentorClasses, setSchedule, setSkills, sortMentorMajor } from "./mentor";
import { Mentors } from "./mentor";
import { MentorTimeSlot } from "./mentorTimeslot";
import { AllMentorTime } from "./timeSlot";

interface TimeCell{
    row:number,
    col:number,
}

const emptyMentor:Mentors = {name: "Time Unfilled",time:[],courses:[],major: "",id:0,skills:[],selected:false}
const days:string[] =["Monday","Tuesday","Wednesday","Thursday","Friday"]
const daysAbb:string[] =["M","T","W","TH","F"]
const MentorList = ({board, handleSelectChange}:{board:MentorTimeSlot[][],handleSelectChange: (mentorName:string) => void}) =>{
    const [selectedMentor, setSelectedMentor] = useState<Mentors>(emptyMentor);
    const [isOfficer, setIsOfficer] = useState(false);
    const [creatingNewMentor,setIsCreatingNewMentor] = useState(false);
    const [newName, setNewNAme] = useState("");
    const [classes, setClasses] = useState<string[]>([]);
    const [skills, setSkillsList] = useState<string[]>([]);
    const [SelectedCells, setCells] = useState<TimeCell[]>([]);
    const [editMentor,setEditMentor] = useState(false);
    //an array of all TimeCell objects that have been selected

    const handleCreateRestCall = async() =>{
        const response = await fetch("/api/mentor/", {
            method: "POST",
            body: JSON.stringify({
                expirationDate:"None",
                isActive:true,
                userId:mentors[mentors.length-1].id+1
            }),
        });
    }

    const handleSelectCell = (row: number, col: number, isDualMentor:boolean) => {
        if(!isDualMentor){
            if(!SelectedCells.some(cell => cell.row === row && cell.col === col)){
                setCells(prev => [...prev, { row, col }]);
            }
        }
      };
    //checking for if it is a dual timeslot first then if the cell already exists within the array
    const handleMentorClick = (mentor:Mentors) => {
        setSelectedMentor(mentor);
        handleSelectChange(mentor.name)
    };

    const handleSetClasses = (classes:string) =>{
        const selectedClasses:string[] = classes.split(',').map(s => s.trim());
        setClasses(selectedClasses)
    }

    const handleSetSkills = (skills:string) =>{
        const selectedSkills:string[] = skills.split(',').map(s => s.trim());
        setSkillsList(selectedSkills)
    }

    const handleCreateNewClick = () => {
        setIsCreatingNewMentor(true)
        setSelectedMentor(emptyMentor)
    }
    const handleEditClick =() => {
        setEditMentor(true)
        setClasses(selectedMentor.courses)
        setNewNAme(selectedMentor.name)
        setSkillsList(selectedMentor.skills)
    }

    const handleExitClick = () =>{
        setIsCreatingNewMentor(false)
        setEditMentor(false)
        setSelectedMentor(emptyMentor)
        setNewNAme("")
        setClasses([])
        setSkillsList([])
        setCells([])
    }
    var mentorMajors:Mentors[][] = [];
    const [mentors, setMentors] = useState<Mentors[]>([]);

    useEffect(() => {
        (async () => {
          const data = await fetch("/api/authLevel").then((response) =>
            response.json()
          );
          console.log(data);
          setIsOfficer(data.isOfficer);
        })();
    }, []);
    //one used for fetching the data for officers the other for fetching all mentor objects similar to the one on the main page
    useEffect(() => {
        const fetchMentors = async () => {
            const mentorList: Mentors[] = [];
            const classList: string[] = [];
            const skillList: string[] = [];
            await getData(mentorList);
            await setSchedule(mentorList);
            await setSkills(skillList, mentorList);
            await getMentorClasses(classList, mentorList);
            setMentors(mentorList);
        };
        fetchMentors();
    }, []);
    mentorMajors = sortMentorMajor(mentors)
    //this is to sort all mentors into their respective majors
    //function exists in mentor.ts
    if(editMentor){
        return(<div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
            <span onClick={() => handleExitClick()} className="cursor-pointer hover:underline text-sm">
                    Back
            </span>
            <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Name</h3>
            <input type="text" className="text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Name" value={newName} onChange={(e) => setNewNAme(e.target.value)}/>
            <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Classes</h3>
            <p className="text-sm">Enter classes seperated by commas ,</p>
            <input type="text" className=" text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Classes" value={classes.toString()} onChange={(e) => handleSetClasses(e.target.value)}/>
            <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Classes</h3>
            <p className="text-sm">Enter skills seperated by commas ,</p>
            <input type="text" className="text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Skills" value={skills.toString()} onChange={(e) => handleSetSkills(e.target.value)}/>
            <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Schedule</h3>
            <div className="float-left">
                    <div className="w-9 h-6">

                    </div>
                    <div className="">
                        {AllMentorTime[0].map((timem)=>(
                            <div className="w-9 h-4 text-[8px]" style={{display: 'grid', placeItems: 'center'}}>
                                {timem.time}
                            </div>
                        ))}
                    </div>
                </div>
                    {board.map((rowItem,rowIndex)=>(
                        <div key={rowIndex} className="inline-block">
                            <div className="w-9 h-4 text-xs">
                                {daysAbb[rowIndex]}
                            </div>  
                            {rowItem.map((value,colIndex)=>(
                                <div
                                    onClick={()=> handleSelectCell(rowIndex,colIndex,value.isdualTimeSlot)}
                                    className={`w-9 h-4 border border-white 
                                    ${SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.col==colIndex && 
                                    SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.row==rowIndex &&
                                    value.mentor1.name != "Time Unfilled" ? 'bg-blue-100' : 'bg-green-500'}
                                    ${value.isdualTimeSlot ? 'bg-red-500' : 'bg-green-500'}
                                    ${value.mentor1.name != "Time Unfilled" ? 'bg-orange-500' : 'bg-green-500'}
                                    ${SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.col==colIndex && 
                                    SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.row==rowIndex ? 'bg-blue-500' : 'bg-green-500'}
                                    `}
                                />
                            
                            ))}
                        </div>
                    ))}
        </div>)
    }
    if(creatingNewMentor){
        return(
            <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
                <span onClick={() => handleExitClick()} className="cursor-pointer hover:underline text-sm">
                    Back
                </span>
                <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Name</h3>
                <input type="text" className="text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Name" value={newName} onChange={(e) => setNewNAme(e.target.value)}/>
                <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Classes</h3>
                <p className="text-sm">Enter classes seperated by commas ,</p>
                <input type="text" className=" text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Classes" value={classes.toString()} onChange={(e) => handleSetClasses(e.target.value)}/>
                <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Classes</h3>
                <p className="text-sm">Enter skills seperated by commas ,</p>
                <input type="text" className="text-sm text-gray-900 px-2 py-1 h-6" placeholder="Mentor Skills" value={skills.toString()} onChange={(e) => handleSetSkills(e.target.value)}/>
                <h3 className="text-sm font-semibold border-b border-gray-500 pb-1 mb-2">Schedule</h3>
                <div>
                <div className="float-left">
                    <div className="w-9 h-6">

                    </div>
                    <div className="">
                        {AllMentorTime[0].map((timem)=>(
                            <div className="w-9 h-4 text-[8px]" style={{display: 'grid', placeItems: 'center'}}>
                                {timem.time}
                            </div>
                        ))}
                    </div>
                </div>
                    {board.map((rowItem,rowIndex)=>(
                        <div key={rowIndex} className="inline-block">
                            <div className="w-9 h-4 text-xs">
                                {daysAbb[rowIndex]}
                            </div>  
                            {rowItem.map((value,colIndex)=>(
                                <div
                                    onClick={()=> handleSelectCell(rowIndex,colIndex,value.isdualTimeSlot)}
                                    className={`w-9 h-4 border border-white 
                                    ${SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.col==colIndex && 
                                    SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.row==rowIndex &&
                                    value.mentor1.name != "Time Unfilled" ? 'bg-blue-100' : 'bg-green-500'}
                                    ${value.isdualTimeSlot ? 'bg-red-500' : 'bg-green-500'}
                                    ${value.mentor1.name != "Time Unfilled" ? 'bg-orange-500' : 'bg-green-500'}
                                    ${SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.col==colIndex && 
                                    SelectedCells.find(cell => cell.row === rowIndex && cell.col === colIndex)?.row==rowIndex ? 'bg-blue-500' : 'bg-green-500'}
                                    `}
                                />
                            
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    if(selectedMentor.name== "Time Unfilled"){
        return(
            <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left flex flex-col ">
                <h2 className="text-2xl font-bold text-center mb-4">Mentors</h2>
                {mentorMajors.map((major)=>(
                <div className="mb-4">
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2">{major[0].major}</h3>
                    <div className="grid grid-cols-2 gap-x-6">
                        {major.map((mentor)=>(
                            <span onClick={() => handleMentorClick(mentor)} className="cursor-pointer hover:underline text-sm">
                                {mentor.name}
                            </span>
                        ))}
                    </div>
                </div>))}
                <div className="pt-4">
                    <MakeNewMentor isOfficer={true} onCreateMentor={handleCreateNewClick}/> 
                </div>
            </div>
        )
        //replace isOfficer with the const after testing is done
    } else{
        return(
            <div className="w-80 bg-gray-800 text-white p-6 rounded-2xl border border-gray-500 float-left">
                <div className="flex justify-between">
                    <span
                        onClick={() => handleExitClick()}
                        className="cursor-pointer hover:underline text-sm"
                    >
                        Back
                    </span>
                    
                    <span className="text-right">
                        <EditMentor isOfficer={true} onEditMentor={handleEditClick} />
                    </span>
                </div>

                <h2 className="text-2xl font-bold text-center mb-4">{selectedMentor.name}</h2>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Skills</h3>
                    <div className="text-sm flex space-y-2">
                        {selectedMentor.skills.map((skill)=>(
                            <span>{skill}</span>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Classes</h3>
                    <div className="text-sm flex space-y-2">
                        {selectedMentor.courses.map((coarse)=>(
                            <span>{coarse}</span>
                        ))}
                    </div>
                    <h3 className="text-lg font-semibold border-b border-gray-500 pb-1 mb-2 text-xl">Mentoring Times</h3>
                    {selectedMentor.time.map((time)=>(
                        <span>{days[time.day]}: {time.time}</span>
                    ))}
                </div>
            </div>
        )
    }
}

//if an officer exists then this button will show if not then this will not
const MakeNewMentor = ({isOfficer,onCreateMentor}: {isOfficer:boolean ,onCreateMentor: () => void}) =>{
    if(isOfficer){
        return(
            <span>
                <button onClick={onCreateMentor} className="font-semibold hover:underline text-sm">
                    Make New Mentor
                </button>
            </span>
        )
    } else {
        return(<></>)
    }
}
//same here
const EditMentor = ({isOfficer,onEditMentor}: {isOfficer:boolean,onEditMentor: () => void}) =>{
    if(isOfficer){
        return(
            <span>
                <button onClick={onEditMentor} className="font-semibold cursor-pointer hover:underline text-sm">
                    Edit Mentor
                </button>
            </span>
        )
    } else {
        return(<></>)
    }
}


export default MentorList