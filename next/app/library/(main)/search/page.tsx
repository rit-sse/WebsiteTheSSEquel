"use client"

import process from "process";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import GeneralBookContainer from "@/components/library/search/GeneralBookContainer";
import GeneralBookContainerSkeleton from "@/components/library/search/GeneralBookSkeleton";
import SearchBar from "@/components/library/search/SearchBar";

export default function SearchLibrary() {


    const searchParams = useSearchParams();
    const [catalogueData, setCatalogueData] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/search?query=" + searchParams.get("query")).then(resp => resp.json()).then(catalog => {
            setCatalogueData(catalog);
            setLoaded(true);
        });

    }, [searchParams]);

    return (
        <div className="w-[80%] h-full relative flex flex-wrap justify-between">
            <SearchBar />
            {
                loaded ? catalogueData.map((book) => (
                    <GeneralBookContainer key={book.ISBN} book={book} />
                )) :
                Array.from({ length: 8 }).map((_, index) => (
                    <GeneralBookContainerSkeleton key={index} />
                ))
            }

        </div>
    );
}