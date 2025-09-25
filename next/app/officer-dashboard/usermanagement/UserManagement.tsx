"use client"
import React, { ChangeEvent, KeyboardEvent, KeyboardEventHandler, useEffect, useState } from 'react';
import UserModal from './UserModal';

type userType = {id: number, name: string, email: string, isOfficer: boolean, officerRegistered: boolean, officerPosition: string, officerId: number};

const UserManagement: React.FC = () => {
    
    let [userEditModalVis, setUserEditModalVis] = useState<boolean>(false);

    let [users, setUsers] = useState<userType[]>([]);
    let [visibleUsers, setVisible] = useState<userType[]>([]);
    let [currentEditUser, setCurrentEditUser] = useState<userType>();

    useEffect(() => {
        let usersTemp = [
        ]

        fetch("/api/user")
            .then(res => res.json())
            .then(userdata => {
                fetch("/api/officer")
                    .then(offres => offres.json())
                    .then(officerdata => {
                        console.log(officerdata)
                        for (let user of userdata) {
                            let userInfo = {
                                "id": user["id"],
                                "name": user["name"],
                                "email": user["email"],
                                "isOfficer": false,
                                "officerRegistered": false,
                                "officerPosition": "",
                                "officerId": 0
                            }
                            for (let officer of officerdata) {
                                if (officer["user"]["email"] == user["email"]) {
                                    userInfo["officerRegistered"] = true;
                                    if(officer["is_active"]) {
                                        userInfo["isOfficer"] = true;
                                        userInfo["officerPosition"] = officer["position"]["title"]
                                        userInfo["officerId"] = officer["id"] 
                                    }
                                }
                            }
                            console.log(userInfo)
                            usersTemp.push(userInfo)
                        }
                        setUsers(usersTemp)
                        setVisible(usersTemp);
                    })
            });
    }, [])

    function searchUsersByName(event: ChangeEvent<HTMLInputElement>): void {
        if(event.target.value != "") {
            let usersVis: userType[] = []
            for(let user of users) {
                if(user.name.toLowerCase().includes(event.target.value.toLowerCase())) {
                    usersVis.push(user);
                }
            }
            setVisible(usersVis);
        } else {
            setVisible(users);
        }
    }

    return (
        <div className='px-[10px]'>
            {userEditModalVis && currentEditUser != undefined ? <UserModal user={currentEditUser} visibleHook={setUserEditModalVis}/> : <></>}
            <h2>User Management</h2>
            <input className="font-mono rounded-lg" placeholder='Search by name' onChange={searchUsersByName} />
            <table className="w-full border-collapse font-mono">
                <thead>
                    <tr>
                        <th className="border px-4 py-2 bg-gray-200">Name</th>
                        <th className="border px-4 py-2 bg-gray-200">Email</th>
                        <th className="border px-4 py-2 bg-gray-200">Officer Pos.</th>
                        <th className='border px-4 py-2 bg-gray-200 w-[10%]'>View</th>
                    </tr>
                </thead>
                <tbody>
                    {visibleUsers.map((user: any, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                            <td className="border px-4 py-2">{user.name}</td>
                            <td className="border px-4 py-2">{user.email}</td>
                            <td className="border px-4 py-2">{user.isOfficer ? user.officerPosition : "Not Officer"}</td>
                            <td className="border px-4 py-2">
                                <button
                                    className="bg-blue-500 text-white w-full py-1 rounded hover:bg-blue-600"
                                    onClick={() => {setCurrentEditUser(visibleUsers[idx]); setUserEditModalVis(true)}}
                                >
                                    View
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;