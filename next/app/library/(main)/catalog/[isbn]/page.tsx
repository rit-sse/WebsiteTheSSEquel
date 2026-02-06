"use client"

import { useEffect, useState } from "react";

export default function BookPage({ params }: { params: { isbn: string } }) {

    const [bookData, setBookData] = useState<{
        ISBN: string;
        name: string;
        authors: string;
        image: string;
        description: string;
        publisher: string;
        edition: string;
        keyWords: string;
        classInterest: string;
        yearPublished: number;
        stockNumber: number;
    }>({
        ISBN: "",
        name: "",
        authors: "",
        image: "",
        description: "",
        publisher: "",
        edition: "",
        keyWords: "",
        classInterest: "",
        yearPublished: 0,
        stockNumber: 0,
    });
    const [loaded, setLoaded] = useState(false);
    const [simpleData, setSimpleData] = useState<{ id: number, checkedOut: boolean }[]>([]);
    useEffect(() => {
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/book?count=true&isbn=" + params.isbn).then(resp => resp.json()).then(data => {
            setBookData(data);
            setLoaded(true);
        });
        fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/books?simple=true&isbn=" + params.isbn).then(resp => resp.json()).then(data => {
            setSimpleData(data);
        });
    }, []);

    return (
        <div className="p-4 w-[80%]">
            <div className="flex flex-col md:flex-row gap-8 items-start w-full">
                <aside className="w-[260px]">
                    {
                        loaded ? (
                            <img
                                src={`${bookData.image}`}
                                className={"w-full h-auto object-cover rounded shadow-lg md:mt-[-60px] relative"}
                            />
                        ) : (
                            <div className="w-full h-[380px] mt-[-60px] bg-gray-200 rounded-md shadow-md animate-pulse"></div>
                        )
                    }
                    <button
                        type="button"
                        className="mt-3 w-full py-2.5 px-3 rounded-md border border-gray-200 bg-white text-left flex items-center gap-2.5 cursor-pointer hover:bg-gray-300 duration-200"
                        aria-label="ISBN Lookup"
                        onClick={() => { window.location.href = "https://isbnsearch.org/isbn/" + params.isbn; }}
                    >
                        <span className="text-gray-800">ISBN Search</span>
                    </button>
                </aside>

                <section className="w-full max-w-[980px]">


                    {
                        loaded ? (
                            <>
                                <h1 className="text-[44px] leading-[1.05] mb-1">{bookData.name}</h1>
                                <p className="mt-1 text-[18px] text-gray-900">By {bookData.authors}</p>
                                <p className="mt-2 text-gray-400">ISBN: {params.isbn}</p>

                                <div className="mt-4 text-gray-800 leading-6">
                                    {bookData.description}
                                </div>
                                <div className="mt-5 text-base">
                                    <div className="mb-1">
                                        <strong>Affiliated Courses:</strong> <span className="ml-1">{bookData.classInterest ?? "No class specified"}</span>
                                    </div>
                                    <div className="mb-1">
                                        <strong>ISBN:</strong> <span className="ml-1">{params.isbn}</span>
                                    </div>
                                    <div className="mb-1">
                                        <strong>Author(s):</strong> <span className="ml-1">{bookData.authors ?? "Unknown"}</span>
                                    </div>
                                    <div className="mt-1">
                                        <strong>Publisher:</strong> <span className="ml-1">{bookData.publisher ?? "Unknown"}</span>
                                    </div>
                                    <div className="mt-1">
                                        <strong>Edition:</strong> <span className="ml-1">{bookData.edition ?? "Unknown"}</span>
                                    </div>
                                    <div className="mt-1">
                                        <strong>Year Published:</strong> <span className="ml-1">{bookData.yearPublished ?? "Unknown"}</span>
                                    </div>
                                    <div className="mt-1">
                                        <strong>Keywords:</strong> <span className="ml-1">{bookData.keyWords ?? "None"}</span>
                                    </div>
                                </div>
                                <table className="w-full border-collapse border border-black mt-[5px] [&_td]:px-[5px] [&_td]:py-[3px] ">
                                    <tr className="mt-6 text-lg font-semibold ">
                                        <td className="bg-gray-200 border-x border-black">Book Id</td>
                                        <td className="bg-gray-200 border-x border-black text-right">Checked Out Status</td>
                                    </tr>
                                    {
                                        simpleData.map((copy) => (
                                            <tr key={copy.id} className="text-base">
                                                <td className="border-x border-y border-black">{copy.id}</td>
                                                <td className={"border-x border-y border-black text-right" + (copy.checkedOut ? " text-red-600" : " text-green-800 font-bold")}>{copy.checkedOut ? "Checked Out" : "Available"}</td>
                                            </tr>
                                        ))
                                    }
                                </table>
                            </>
                        ) : (
                            <div className="w-full">
                                <div className="h-[45px] w-[100%] bg-gray-200 rounded mb-2 animate-pulse"></div>
                                <div className="h-[25px] w-[30%] bg-gray-200 rounded mb-2 animate-pulse" />

                                <p className="mt-2 text-gray-400">ISBN: {params.isbn}</p>

                                <div className="h-5 w-[100%] bg-gray-200 rounded mt-[12px] mb-2 animate-pulse" />
                                <div className="h-5 w-[100%] bg-gray-200 rounded mb-2 animate-pulse" />
                                <div className="h-5 w-[30%] bg-gray-200 rounded mb-2 animate-pulse" />
                                <div className="mt-5 text-base w-full">
                                    {Array.from({ length: 7 }).map((_, index) =>
                                        <div key={index} className="h-5 w-[50%] bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    )}

                                </div>
                            </div>
                        )
                    }
                </section>
            </div>
        </div>
    )
}
