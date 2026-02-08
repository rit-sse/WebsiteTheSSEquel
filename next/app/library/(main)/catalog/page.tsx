"use client" // This was needed to clear cache issues with NextJS
import LibraryQuickLink from "@/components/library/LibraryQuickButton";
import { FeaturedContainer } from "@/components/library/search/FeaturedContainer";
import { FeaturedContainerSkeleton } from "@/components/library/search/FeaturedContainerSkeleton";
import process from "process";
import { useState, useEffect } from "react";


export default function LibraryHome() {

    // const categories = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json());
    // const authLevel = await getAuth();

    const [catalogue, setCatalogue] = useState<any[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/books?count=true").then(resp => resp.json()).then(catalogueData => { setCatalogue(catalogueData); console.log(catalogueData); });
        setLoaded(true)
    }, []);

    return (
        <div className="w-[80%] h-full relative flex flex-wrap justify-between">
            {
                loaded ? catalogue.map((book) => (
                    <div
                        key={book.ISBN}
                        className="flex-none w-[180px] mr-4 last:mr-0 cursor-pointer z-5"
                    >
                        <img
                            src={book.image}
                            alt={book.name}
                            className="w-full h-[220px] object-cover rounded-md shadow-sm"
                        />
                        <h3 className="mt-2 text-lg font-medium">{book.name}</h3>
                        <p className="text-sm text-gray-600">{book.authors}</p>
                        <p className="text-sm text-gray-500">ISBN: {book.ISBN}</p>
                        {/* <p className={`mt-1 text-sm font-semibold ${book.stockNumber > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {book.stockNumber > 0 ? `(${book.stockNumber}) on shelf` : 'Out of stock'}
                        </p> */}
                    </div>
                )) :
                    Array.from({ length: 30 }).map((_, index) => (
                        <div
                            key={index}
                            className="w-[180px] mr-4 last:mr-0 cursor-pointer z-5 my-2"
                        >
                            <div
                                className="w-full h-[240px] object-cover rounded-md shadow-sm animate-pulse bg-gray-300"
                            />
                            <div className="mt-2 w-[100%] h-[20px] bg-gray-200 mt-2" />
                            <div className="w-[80%] h-[16px] bg-gray-200 mt-2" />
                            <div className="w-[80%] h-[16px] bg-gray-200 mt-2" />

                        </div>
                    ))
            }

        </div>
    );
}