'use client';

import React from 'react';

interface DashboardButtonProps {
    isEnabled: boolean;
    text: string,
    callback: Function
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ isEnabled, text, callback }) => {
    return (
        <a
            className={
                "h-[60px] w-full text-[18px] pl-[25px] relative flex items-center justify-start cursor-pointer" +
                (isEnabled ? " bg-[rgba(0,0,0,.05)]" : " opacity-[.5]")
            }
            onClick={() => {callback()}}
        >
            {text}
            {isEnabled && (
                <div className="absolute left-0 top-0 h-full w-1 bg-[#0070f3]" />
            )}
        </a>
    );
};

export default DashboardButton;