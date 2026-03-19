"use client";
import SSELogoFullWhite from "./SSELogoFullWhite";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TopGradient() {
  const [pathname] = useState(() =>
    typeof window === "undefined" ? "/library" : window.location.pathname
  );
  const [authLevel, setAuthLevel] = useState<{ [key: string]: any }>({
    isOfficer: false,
  });

  const searchBarOffset =
    pathname.endsWith("/library") || pathname.includes("/library/search");
  const isAtHome = pathname.endsWith("/library");

  useEffect(() => {
    fetch("/api/authLevel")
      .then((resp) => resp.json())
      .then((authData) => {
        setAuthLevel(authData);
      });
  }, []);

  return (
    <div className="w-full h-[240px] bg-[linear-gradient(360deg,#474747_0%,#2C2C2C_100%)] absolute top-0 left-0 flex items-center justify-between flex-col z-[-10]">
      <div className="w-[80%] pt-[15px] flex flex-row items-center h-fit">
        <SSELogoFullWhite />
        <div className="w-[2px] h-[40px] bg-white mx-5" />
        <h1 className="text-white font-rethink font-bold text-xl md:text-2xl font-serif">
          Webb Library
        </h1>
      </div>
      <div
        className={
          "w-[80%] flex flex-row justify-end " +
          (searchBarOffset ? "mb-[50px]" : "")
        }
      >
        {authLevel.isOfficer || authLevel.isMentor ? (
          <Link
            href="/library/mentorportal"
            className={
              "relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8"
            }
          >
            Mentor Portal
          </Link>
        ) : (
          <></>
        )}
        {!isAtHome ? (
          <>
            <Link
              href="/library"
              onClick={() => {
                !searchBarOffset ? history.back() : null;
              }}
              className="relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!searchBarOffset) {
                  history.back();
                }
              }}
              className="relative block text-center md:text-right text-white p-0 m-0 text-xl italic bottom-[-2px] ml-8"
            >
              Go Back
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
