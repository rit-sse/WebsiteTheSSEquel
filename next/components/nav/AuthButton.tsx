'use client';
import { signIn, signOut, useSession } from "next-auth/react";
import HoverBoldButton from "../common/HoverBoldButton";
import DarkModeToggle from "../common/DarkModeToggle";
import { Theme } from '@/types/theme';
import { useTheme } from "next-themes";
import { useState } from "react";
// import { bttntxt } from "react"

export default function AuthButton() {
    const { theme, setTheme } = useTheme()
    const [text, setText] = useState('Light Mode')
    
    
    {/*"https://www.flaticon.com/free-icons/" */}
    
    const handleToggleChange = () => {
    const nextTheme = theme === Theme.Dark ? Theme.Light : Theme.Dark;
        const nextText = text === 'Dark Mode' ? 'Light Mode':'Dark Mode';

        setTheme(nextTheme);
        setText(nextText);
    };

    const { data: session } = useSession();

    if (session) {
        console.log("User image:", session.user?.image);
        return (
            <>
                
                <div className="dropdown dropdown-bottom dropdown-end">
                    
                    <img tabIndex={0} role="button" src ={session.user?.image ?? undefined} alt="account_img" className="w-10 h-10 rounded-full hover:border-2 hover:border-blue-500" />

                    <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 cursor-pointer shadow-[0_0_12px_rgba(59,130,246,0.6)] ">
                            {/* account button  */}

                            <li className=" rounded-[.5em] ">
                                <a>
                                    <img src= {session.user?.image ?? undefined} alt="account_img" className="rounded-full w-10 h-10" />
                                    {session.user?.name}
                                </a>
                            </li>

                            <li className="rounded-[.5em] " onClick={handleToggleChange}>
                                <a>
                                    <p className="text-sm">{text}</p>
                                </a>
                            </li>

                            <hr/>

                            <li className="rounded-[.5em] !text-red-600" onClick={()=>signOut()}>
                                <a>  
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                    </svg>
                                    
                                    Logout
                                </a>
                            </li>


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
            </>
        );
    }
}