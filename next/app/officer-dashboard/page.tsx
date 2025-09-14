"use client";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import DashboardButton from "./DashboardButton";

const OfficerDashboard = () => {
  return (
    <>
      <div className="w-[80%] flex items-start justify-between">
        <div className="w-[24%] pb-[10px] bg-white rounded-[14px]">
          <p className="w-full pl-[25px] py-[12px] border-b-[1px] text-[18px]">Officer Dashboard</p>
          <DashboardButton isEnabled={true} text="Dashboard"/>
          <DashboardButton isEnabled={false} text="Account Management"/>
          <DashboardButton isEnabled={false} text="Website Management"/>
        </div>
        <div className="w-[75%] h-[150px] bg-white rounded-[14px]">

        </div>
      </div>
    </>
  );
};

export default OfficerDashboard;
