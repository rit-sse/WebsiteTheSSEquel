"use client"
import SSELogoFullWhite from "./SSELogoFullWhite";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function TopGradient() {

    const [isAtHome, setIsAtHome] = useState(true);

    useEffect(() => {
        setIsAtHome(window.location.href.endsWith("/library"));
    }, []);

    return (
        <div className="w-full h-[240px] bg-[linear-gradient(360deg,#474747_0%,#2C2C2C_100%)] absolute top-0 left-0 flex items-center justify-between flex-col z-[-10]">
            <div className="w-[80%] pt-[15px] flex flex-row items-center h-fit">
                <SSELogoFullWhite />
                <div className="w-[2px] h-[40px] bg-white mx-5" />
                <h1 className="text-white font-rethink font-bold text-xl md:text-2xl font-serif">
                    Ryan Webb Library
                </h1>

            </div>
            <div className="w-[80%]">
                {
                    (!isAtHome) ? (
                        <a href="#" onClick={() => { (!isAtHome) ? history.back() : null }} className="relative block w-full text-right text-white p-0 m-0 text-xl italic bottom-[-2px]">
                            Go Back
                        </a>
                    ) : <></>
                }
            </div>
        </div>
    )
}