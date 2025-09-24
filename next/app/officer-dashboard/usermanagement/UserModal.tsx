import React from 'react'

type userType = {name: string, email: string, isOfficer: boolean, officerRegistered: boolean, officerPosition: string};

const UserModal: React.FC<{user: userType, visibleHook: Function}> = ({user, visibleHook}) => {
    return(
        <div>
            <div className='absolute top-0 left-0 w-full h-full bg-[rgba(0,0,0,.2)] backdrop-blur-md z-[51] flex justify-center items-center' onClick={() => {visibleHook(false)}}></div>
            <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                    <div className='w-[40%] h-[80%] bg-white rounded-lg flex items-center flex-col px-[25px] z-[51]'>
                    <div className="w-full py-[15px]"><h3>User Edit</h3></div>
                    <div className='w-full'>
                        <p>Name:</p>
                        <input value={user.name} className='w-full'/>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default UserModal;