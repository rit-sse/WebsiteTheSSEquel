"use client"
import SSELogoFullWhite from "./SSELogoFullWhite";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function TopGradient() {

    const [isAtHome, setIsAtHome] = useState(true);
    const [authLevel, setAuthLevel] = useState<{ [key: string]: any }>({ isOfficer: false });

    useEffect(() => {
        setIsAtHome(window.location.href.endsWith("/library"));
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/authLevel").then(resp => resp.json()).then(authData => { setAuthLevel(authData); });
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
            <div className={"w-[80%] flex flex-row justify-end " + (isAtHome ? "mb-[50px]" : "")}>
                {
                    (authLevel.isMember || (authLevel.membershipCount > 0)) ? (
                        <a href="/library/officer" className={"relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px]"}>
                            My Card
                        </a>
                    ) : <></>
                }
                {
                    (authLevel.isOfficer || authLevel.isMentor) ? (
                        <a href="/library/officer" className={"relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8"}>
                            Mentor Portal
                        </a>
                    ) : <></>
                }
                {
                    (!isAtHome) ? (<>
                        <a href="/library" onClick={() => { (!isAtHome) ? history.back() : null }} className="relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8">
                            Home
                        </a>
                        <a href="#" onClick={() => { (!isAtHome) ? history.back() : null }} className="relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8">
                            Go Back
                        </a>
                    </>
                    ) : <></>
                }
            </div>
        </div>
    )
}