"use client" // This was needed to clear cache issues with NextJS
import process from "process";
import { useState, useEffect } from "react";
import GeneralBookContainer from "@/components/library/search/GeneralBookContainer";
import GeneralBookContainerSkeleton from "@/components/library/search/GeneralBookSkeleton";


export default function LibraryCatalog() {

    // const categories = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json());
    // const authLevel = await getAuth();

    const [catalogue, setCatalogue] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/books?count=true").then(resp => resp.json()).then(catalogueData => {
            setCatalogue(catalogueData); 
            setLoaded(true);
        });
    }, []);

    return (
        <div className="w-[80%] h-full relative flex flex-col md:flex-row flex-wrap justify-between pt-5">
            {
                loaded ? catalogue.map((book) => (
                    <GeneralBookContainer key={book.ISBN} book={book} />
                )) :
                Array.from({ length: 15 }).map((_, index) => (
                    <GeneralBookContainerSkeleton key={index} />    
                ))
            }

        </div>
    );
}