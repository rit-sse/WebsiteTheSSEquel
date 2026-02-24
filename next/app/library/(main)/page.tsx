"use client" // This was needed to clear cache issues with NextJS
import LibraryQuickLink from "@/components/library/LibraryQuickButton";
import { FeaturedContainer } from "@/components/library/search/FeaturedContainer";
import { FeaturedContainerSkeleton } from "@/components/library/search/FeaturedContainerSkeleton";
import process from "process";
import { useState, useEffect } from "react";
import SearchBar from "@/components/library/search/SearchBar";


export default function LibraryHome() {

    // const categories = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json());
    // const authLevel = await getAuth();

    const [categories, setCategories] = useState<{ [key: string]: { books: any[] } }>({});

    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories")
            .then((resp) => {
                if (!resp.ok) return {};
                return resp.json();
            })
            .then((categoriesData) => {
                if (!categoriesData || typeof categoriesData !== "object" || Array.isArray(categoriesData)) {
                    setCategories({});
                    return;
                }
                setCategories(categoriesData as { [key: string]: { books: any[] } });
            })
            .catch(() => setCategories({}));
    }, []);

    return (
        <div className="w-[80%] h-full relative flex items-center flex-col bg-white">
            <SearchBar />
            {
                (Object.keys(categories).length === 0) ? (
                    <div className="w-full">
                        <FeaturedContainerSkeleton />
                        <FeaturedContainerSkeleton />
                    </div>
                ) : (
                    Object.keys(categories).map((categoryKey) => (
                        <FeaturedContainer
                            key={categoryKey}
                            props={{
                                books: Array.isArray(categories[categoryKey]?.books) ? categories[categoryKey].books : [],
                                header: categoryKey
                            }}
                        />
                    ))
                )
            }

            <div className="w-[100%] md:w-[60%] grid grid-cols-2 text-center gap-6 mt-5">
                <LibraryQuickLink props={{ label: "Browse All Books", link: "/library/catalog" }} />
                <LibraryQuickLink props={{ label: "Textbook Donations", link: "/library/donations" }} />
            </div>


        </div>
    );
}
