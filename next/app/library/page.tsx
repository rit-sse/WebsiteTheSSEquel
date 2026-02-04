"use client" // This was needed to clear cache issues with NextJS
import LibraryQuickLink from "@/components/library/LibraryQuickButton";
import { FeaturedContainer } from "@/components/library/search/FeaturedContainer";
import { FeaturedContainerSkeleton } from "@/components/library/search/FeaturedContainerSkeleton";
import process from "process";
import {useState, useEffect} from "react";


export default function LibraryHome() {

    // const categories = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json());
    // const authLevel = await getAuth();

    const [categories, setCategories] = useState<{[key: string]: {books: any[]}}>({});
    const [authLevel, setAuthLevel] = useState<{[key: string]: boolean}>({isOfficer: false});

    useEffect(() => {
            fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json()).then(categoriesData => { setCategories(categoriesData); });

            fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/authLevel").then(resp => resp.json()).then(authData => { setAuthLevel(authData); });
    }, []);

    return (
        <div className="w-[80%] h-full relative flex items-center flex-col bg-white">
            <input className="z-[2] top-[-40px] relative w-[100%] text-[25px] border-none py-[22px] px-[20px] rounded-lg shadow-2xl" placeholder="Search our collection (Course-Code, ISBN, Name, etc...)" />
            {
                (Object.keys(categories).length === 0) ? (
                    <div className="w-full">
                        <FeaturedContainerSkeleton />
                        <FeaturedContainerSkeleton />
                        </div>
                ) : (
                    Object.keys(categories).map((categoryKey) => (
                        <FeaturedContainer key={categoryKey} props={{ books: categories[categoryKey].books, header: categoryKey }} />
                    ))
                )
            }
            
            <div className="w-[100%] md:w-[60%] grid grid-cols-2 text-center gap-6">
                <LibraryQuickLink props={{ label: "Advanced Search", link: "#" }} />
                <LibraryQuickLink props={{ label: "Browse All Books", link: "#" }} />
                <LibraryQuickLink props={{ label: "View Books by Keywords", link: "#" }} />
                <LibraryQuickLink props={{ label: "Textbook Donations", link: "/library/donations" }} />
                { (authLevel["isOfficer"]) ? (
                    <LibraryQuickLink props={{ label: "Add New Book", link: "/library/admin/add-book", adminColor: true }} />
                ) : <></> }
            </div>
        </div>
    );
}