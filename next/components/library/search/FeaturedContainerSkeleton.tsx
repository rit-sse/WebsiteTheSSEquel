"use client"

type Book = {
    id: number;
    ISBN: string;
    name: string;
    authors: string;
    image: string;
    description: string;
    publisher: string;
    edition: string;
    keyWords: string;
    classInterest: string;
    yearPublished: string;
    stockNumber: number;
};

export function FeaturedContainerSkeleton() {



    return (
        <div className="w-full flex flex-col items-start mt-[15px] px-2 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8">
            <div className="w-[300px] h-[40px] bg-gray-300 animate-pulse rounded mb-6" />
            <div className="flex flex-row items-top  w-[100%] overflow-x-scroll justify-start scrollbar-hide ">
                <div
                    className="flex-none w-[180px] h-[220px] bg-gray-300 animate-pulse mr-4 last:mr-0 cursor-pointer rounded"
                />
                                <div
                    className="flex-none w-[180px] h-[220px] bg-gray-300 animate-pulse mr-4 last:mr-0 cursor-pointer rounded"
                />
                                <div
                    className="flex-none w-[180px] h-[220px] bg-gray-300 animate-pulse mr-4 last:mr-0 cursor-pointer rounded"
                />
                                <div
                    className="flex-none w-[180px] h-[220px] bg-gray-300 animate-pulse mr-4 last:mr-0 cursor-pointer rounded"
                />
                                <div
                    className="flex-none w-[180px] h-[220px] bg-gray-300 animate-pulse mr-4 last:mr-0 cursor-pointer rounded"
                />

            </div>
        </div>
    );
}