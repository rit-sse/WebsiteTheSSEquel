export interface Time{
    day: number
    time: string
    timeslot: number
}
export const AllMentorTime: Time[][] = [
    [{day:0,time: "10:00 AM",timeslot:0},
    {day:0, time: "11:00 AM",timeslot:1},
    {day:0, time: "12:00 PM",timeslot:2},
    {day:0, time: "1:00 PM",timeslot:3},
    {day:0, time: "2:00 PM",timeslot:4},
    {day:0, time: "3:00 PM",timeslot:5},
    {day:0, time: "4:00 PM",timeslot:6},
    {day:0, time: "5:00 PM",timeslot:7}],
    [{day:1,time: "10:00 AM",timeslot:0},
    {day:1, time: "11:00 AM",timeslot:1},
    {day:1, time: "12:00 PM",timeslot:2},
    {day:1, time: "1:00 PM",timeslot:3},
    {day:1, time: "2:00 PM",timeslot:4},
    {day:1, time: "3:00 PM",timeslot:5},
    {day:1, time: "4:00 PM",timeslot:6},
    {day:1, time: "5:00 PM",timeslot:7}],
    [{day:2,time: "10:00 AM",timeslot:0},
    {day:2, time: "11:00 AM",timeslot:1},
    {day:2, time: "12:00 PM",timeslot:2},
    {day:2, time: "1:00 PM",timeslot:3},
    {day:2, time: "2:00 PM",timeslot:4},
    {day:2, time: "3:00 PM",timeslot:5},
    {day:2, time: "4:00 PM",timeslot:6},
    {day:2, time: "5:00 PM",timeslot:7}],
    [{day:3,time: "10:00 AM",timeslot:0},
    {day:3, time: "11:00 AM",timeslot:1},
    {day:3, time: "12:00 PM",timeslot:2},
    {day:3, time: "1:00 PM",timeslot:3},
    {day:3, time: "2:00 PM",timeslot:4},
    {day:3, time: "3:00 PM",timeslot:5},
    {day:3, time: "4:00 PM",timeslot:6},
    {day:3, time: "5:00 PM",timeslot:7}],
    [{day:4,time: "10:00 AM",timeslot:0},
    {day:4, time: "11:00 AM",timeslot:1},
    {day:4, time: "12:00 PM",timeslot:2},
    {day:4, time: "1:00 PM",timeslot:3},
    {day:4, time: "2:00 PM",timeslot:4},
    {day:4, time: "3:00 PM",timeslot:5},
    {day:4, time: "4:00 PM",timeslot:6},
    {day:4, time: "5:00 PM",timeslot:7}]
]

export function getMentorTime(time:String,day:String):Time {
    var Timeslice:String = time.slice(0,2)
    var timeNum = 0
    var dayNum:number = 0
    if(day == "Monday"){dayNum = 0}else if(day == "Tuesday"){dayNum = 1}else if(day == "Wednesday"){dayNum = 2}
    else if(day == "Thursday"){dayNum = 3}else if(day == "Friday"){dayNum = 4}
    if(Timeslice[1] ==':'){
        timeNum = Number(Timeslice[0]) + 2
    } else{
        if(Timeslice == "10"){timeNum = 0} else
        if(Timeslice == "11"){timeNum = 1} else
        if(Timeslice == "12"){timeNum = 2}
    }
    return AllMentorTime[dayNum][timeNum]
}

// function createTime(){
//     for(let i = 0; i<= 6; i++){
//         AllMentorTime.push([{day:i,time: "10:00 AM",timeslot:0},
//         {day:i, time: "11:00 AM",timeslot:1},
//         {day:i, time: "12:00 PM",timeslot:2},
//         {day:i, time: "1:00 PM",timeslot:3},
//         {day:i, time: "2:00 PM",timeslot:4},
//         {day:i, time: "3:00 PM",timeslot:5},
//         {day:i, time: "4:00 PM",timeslot:6},
//         {day:i, time: "5:00 PM",timeslot:7}])
//     }
// }