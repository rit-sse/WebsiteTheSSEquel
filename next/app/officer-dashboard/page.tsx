"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import DashboardButton from "./DashboardButton";
import UserManagement from "./usermanagement/UserManagement";

const OfficerDashboard = () => {
  let [userIsOfficer, setOfficer] = useState(false);

    useEffect(() => {
        fetch("/api/authLevel")
        .then(resp => resp.json())
        .then(authLevelInfo => {
            if(!authLevelInfo["isOfficer"]) {
                location.href = "/"
            } else {
                setOfficer(true);
            }
        })
    })
  const dashboardPages: { [key: string]: React.FC } = {
    "Account Management": UserManagement
  };

  const [selectedPage, setSelectedPage] = useState<string>("Account Management");

  if(userIsOfficer) {
    return (
      <>
        <div className="w-[85%] flex items-start justify-between">
          <div className="w-[24%] pb-[10px] bg-white rounded-[14px]">
            <p className="w-full pl-[25px] py-[12px] border-b-[1px] text-[18px]">Officer Dashboard</p>
            <DashboardButton isEnabled={true} text="User Management"/>
            <DashboardButton isEnabled={false} text="Website Management"/>
            <DashboardButton isEnabled={false} text="Assets/Resources"/>
          </div>
          <div className="w-[75%] p-[15px] bg-white rounded-[14px]">
            {
              React.createElement(dashboardPages[selectedPage])
            }
          </div>
        </div>
      </>
    );
  } else {
    return (<></>)
  }
};

export default OfficerDashboard;
