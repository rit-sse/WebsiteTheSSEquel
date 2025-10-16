'use client';
import { signIn, signOut, useSession } from "next-auth/react";
import HoverBoldButton from "../common/HoverBoldButton";
import { useState } from "react";

export default function AuthButton() {
    const { data: session } = useSession();
    

// https://lh3.googleusercontent.com/a/ACg8ocIS0hBsn0dZt0yuiodYPD9RARxdpwhSjxRFNAEo_ObCzOgocg=s96-c
    if (session) {
        console.log("User image:", session.user?.image);
        return (
            <>
                {/* <HoverBoldButton className="text-left" text="Logout" dataLabel="Logout" onClick={() => signOut()} /> */}
                {/* <span>{session.user?.name}</span> */}
                <div className="dropdown dropdown-bottom dropdown-end">
                    
                    <img tabIndex={0} role="button" src ={session.user?.image ?? undefined} alt="account_img" className="w-10 h-10 rounded-full hover:border-2 hover:border-blue-500" />

                    <ul tabIndex={0} className="dropdown-content menu bg-white rounded-box w-52 p-2 cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.6)]">
                            <li className="hover:bg-blue-200 rounded-[.5em]">
                                <a>
                                    <img src= {session.user?.image ?? undefined} alt="account_img" className="rounded-full w-10 h-10" />
                                    {session.user?.name}
                                
                                </a>
                            </li>
                            
                            <li className="hover:bg-blue-200 rounded-[.5em]"><a><span>{'\u2699'}</span> settings</a></li>
                            <hr/>
                            <li style={{color: 'red'}} className="hover:bg-blue-200 rounded-[.5em]" onClick={()=>signOut()}><a> ➜] Logout</a></li>
                    </ul>
                </div> 
            </>
        );
    } else {
        return (
            // Setting the data-label to "Sign Out" is a hack to prevent
            // layout shift when the button changes from "Sign In" to "Sign Out"
            // data-label is used by the bold-pseudo CSS class to display a pseudo-element
            <>
                <HoverBoldButton className="text-left" text="Login" dataLabel="Logout" onClick={() => signIn('google')} />
                {/* <div className="bg-neutral text-neutral-200 w-10 h-10 rounded-full flex items-center justify-center">
                    <span>A</span>
                </div> */}
            </>
        );
    }
}