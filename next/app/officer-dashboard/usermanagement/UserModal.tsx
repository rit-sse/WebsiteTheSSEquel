import React, { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react'

type userType = {id: number, name: string, email: string, isOfficer: boolean, officerRegistered: boolean, officerPosition: string };

const UserModal: React.FC<{ user: userType, visibleHook: Function }> = ({ user, visibleHook }) => {

    const [userid, setUserID] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [isOfficer, setIsOfficer] = useState<boolean>(false);
    const [officerRegistered, setOfficerRegistered] = useState<boolean>(false);
    const [officerPosition, setOfficerPosition] = useState<string>("");
    const [availablePositions, setAvailablePositions] = useState<string[]>([]);
    useEffect(() => {
        setUserID(user.id);
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setIsOfficer(user.isOfficer ?? false);
        setOfficerRegistered(user.officerRegistered ?? false);
        setOfficerPosition(user.officerPosition ?? "");

        fetch("/api/officerPositions")
            .then(resp => resp.json())
            .then((resp: {title: string}[]) => {
                setAvailablePositions(resp.map((val, id) => (val['title'])))
            });
    }, [])

    function setUserInformation(): void {
        let userPayload: userType = {
            id: userid,
            name: name,
            email: email,
            isOfficer: isOfficer,
            officerRegistered: officerRegistered,
            officerPosition: officerPosition,
        }

        if(userPayload.officerRegistered) {
            console.log("Is officer registered, simple!")
        } else {
            console.log("Not officer registered, will require a more detailed placement");
        }
    }

    return (
        <div>
            <div className='absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,.2)] backdrop-blur-md z-[51] flex justify-center items-center' onClick={() => { visibleHook(false) }}></div>
            <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                <div className='w-[40%] bg-white rounded-lg flex items-center flex-col px-[25px] z-[51] py-[20px]'>
                    <div className="w-full"><h3>User Edit</h3></div>
                    <div className='w-full'>
                        <p>Name:</p>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className='w-full'
                        />
                    </div>
                    <div className='w-full mt-2'>
                        <p>Email:</p>
                        <input
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className='w-full'
                        />
                    </div>
                    <div className='w-full mt-2'>
                        <p>Officer Position:</p>
                        <select value={officerPosition != "" ? officerPosition : "None"} onChange={e => {setOfficerPosition(e.target.value)}}>
                            <option value="None">None</option>
                            {
                                availablePositions.map((val, ind) => (
                                    <option key={ind} value={val}>{val}</option>
                                ))
                            }
                        </select>
                    </div>
                    <div className='w-full mt-2 flex justify-end'>
                        <button className='py-[8px] px-[15px] bg-green-200 rounded-lg' onClick={setUserInformation}>Submit</button>
                        <button className='py-[8px] px-[15px] bg-red-200 rounded-lg ml-[5px]'>Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default UserModal;