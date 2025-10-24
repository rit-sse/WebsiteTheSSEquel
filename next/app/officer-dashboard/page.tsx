"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import DashboardButton from "./DashboardButton";
import UserManagement from "./usermanagement/UserManagement";
import WebsiteManagementPage from "./websitemanagement.tsx/WebsiteManagementPage";
import AssetTab from "./assetsmang/AssetTab";

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
    "Account Management": UserManagement,
    "Website Management": WebsiteManagementPage,
    "Asset Management": AssetTab
  };

  const [selectedPage, setSelectedPage] = useState<string>("Account Management");

  if(userIsOfficer) {
    return (
      <>
        <div className="w-full md:w-[85%] flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="w-[100%] md:w-[24%] pb-[10px] bg-base-100 rounded-[14px]">
            <p className="w-full pl-[25px] py-[12px] divider-y text-[18px]">Officer Dashboard</p>
            <DashboardButton callback={() => {setSelectedPage("Account Management")} }isEnabled={(selectedPage == "Account Management")} text="User Management"/>
            <DashboardButton callback={() => {setSelectedPage("Website Management")} }isEnabled={(selectedPage == "Website Management")} text="Website Management"/>
            <DashboardButton callback={() => {setSelectedPage("Asset Management")}  }isEnabled={(selectedPage == "Asset Management")} text="Assets/Resources"/>
          </div>
          <div className="w-full md:w-[75%] p-[15px] bg-base-100 rounded-[14px]">
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
