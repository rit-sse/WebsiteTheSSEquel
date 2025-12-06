"use client";

import React, {useState, useEffect} from "react";
import {TeamMember} from "../leadership/team";


// export interface TeamMember {
//   officer_id: string,
//   user_id: string;
//   name: string;
//   image: string;
//   title: string;
//   desc?: string;
//   linkedin?: string;
//   github?: string;
//   email: string;
// }


interface SessionUser  {
  teamMember?: TeamMember;
};

export default function UserProfileClient() {
    const [formData, setFormData] = useState({
        user_email: '',
        linkedIn: '',
        gitHub: '',
        description: '',
        start_date: '',
        end_date: ''
    });

    const [statusMsg, setStatusMsg] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [userID, setUserID] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [linkedIn, setLinkedIn] = useState('');
    const [gitHub, setGitHub] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(true);


    useEffect(() => {
            const load = async () => {
                try {
                    const sessRes = await fetch('/api/auth/session');
                    const sess: SessionUser | null = await (sessRes.ok ? sessRes.json() : null);
                    const sessEmail = sess?.teamMember?.email ?? (sess as any)?.user?.email;
                    const sessName  = sess?.teamMember?.name  ?? (sess as any)?.user?.name;
                        
                    if (sessEmail) setEmail(sessEmail);
                    if (sessName) setName(sessName);
    
                    const usersRes = await fetch('/api/user');
                    if (usersRes.ok) {
                        const users = await usersRes.json();
                        const me = users.find((u: any) => u.email === sessEmail);
                        if (me) {
                            setUserID(me.id ?? null);
                            setDescription(me.description ?? "");
                            setLinkedIn(me.linkedIn ?? "");
                            setGitHub(me.gitHub ?? "");
                            setImageUrl(me.imageUrl ?? "");
                        }
                    }
                } catch (error) {
                    console.error('Error loading user profile:', error);
                } finally {
                    setLoading(false);
                }
            };
            void load();
        }, []);


if(loading){
    return <div> Loading</div>
}

const saveProfile = async () =>{
    if(!userID){
        return setStatusMsg("User ID not found. Cannot save profile.");
    }
    setStatusMsg("Saving...")
    try{
        const payload = {
            id: name,
            email: email,
            description: description,
        }
        const res = await fetch(`/api/user`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if(!res.ok) throw new Error ("Failed to save");
        const updated = await res.json();
        setName(updated.name ?? name);
        setStatusMsg("Saved successfully.");
        setTimeout(() => setStatusMsg(null), 3000);
    }catch(e){
        console.error(e);
        setStatusMsg("Save failed. Try again.");
    }
};

    return (
        <div>
            {/* User profile client content */}
            <section className = "mb-6">
                <h3 className = "text-2xl font-bold mb-4">User Profile</h3>
                <div className="grid gap-3">
                    <label className="flex flex-col">
                        <span className="font-semibold">Display Name</span>
                        <input className="input input-bordered mt-1" value={name} onChange={(e) => setName(e.target.value)} />
                    </label>

                    <label className="flex flex-col">
                        <span className="font-semibold">Email</span>
                        <input className="input input-bordered mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </label>
                </div>
                
                <label className="flex flex-col">
                    <span className="font-semibold">Bio</span>
                    <textarea className="textarea textarea-bordered mt-1" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>

                <div className ="flex gap-3 mt-2">
                    <button className="btn btn-primary" onClick={() => {saveProfile}}>Save Profile</button>
                    <button className="btn" onClick={() => { setName(""); setEmail(""); setDescription("");  }}>Reset</button>
                </div>
            </section>
  
        </div>
  
  

    );
}