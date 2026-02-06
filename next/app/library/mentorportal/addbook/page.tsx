"use client"

import { useState } from "react";


export default function AddBook() {

    const [isbnInput, setIsbnInput] = useState("")
    const [error, setError] = useState("");
    const [bookExists, setBookExists] = useState(false);
    const [bookData, setBookData] = useState<{
        id: number;
        ISBN: string;
        stockNumber: number;
    }>({
        id: 0,
        ISBN: "",
        stockNumber: 0,
    });

    const fetchISBNExists = () => {
        setError("");
        setBookExists(false);
        fetch("/api/library/book?count=true&isbn=" + isbnInput).then((res) => res.json()).then((data) => {
            if (data.error) {
                // ISBN does not exist, proceed to add new book
                setError(data.error);
            } else {
                setBookExists(true);
                setBookData({
                    id: data.id,
                    ISBN: data.ISBN,
                    stockNumber: data.stockNumber,
                });
            }
        })
    }
    return (
        <>
            <div className="flex justify-center items-center w-[100%]">
                <input className="w-[80%] max-w-[500px]" placeholder="Find if ISBN exists in database" onChange={e => {setIsbnInput(e.target.value)}} onKeyUp={e => e.key == "Enter" ? fetchISBNExists() : null} />
                <img src="/library-icons/search.png" alt="Search" className="w-[30px] h-[30px] ml-2 cursor-pointer" onClick={fetchISBNExists} />
            </div>
            {
                error ? (
                    <div className="mt-4 flex items-center">
                        <img src="/library-icons/error.png" alt="Error" className="w-[20px] h-[20px] mr-2" />
                        <p className="text-red-500 ">{error}</p>
                    </div>
                ) : null
            }
            {
                bookExists ? (
                    <table className="w-[80%] max-w-[540px] border my-3 [&_td]:border [&_td]:p-2 bg-gray-100">
                        <tr >
                            <td className="bg-orange-100">ID</td>
                            <td>ISBN</td>
                            <td>In Circulation</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td className="bg-orange-100">{bookData.id}</td>
                            <td>{bookData.ISBN} <img className="w-[20px] h-[20px] inline cursor-pointer" src="/library-icons/book.png" alt="Book" onClick={() => location.href = "/library/catalog/" + bookData.ISBN}/></td>
                            <td>{bookData.stockNumber}</td>
                            <td className=" text-right border-none max-w-[50px]"><button className="px-3 from-sky-800 to-sky-500 bg-gradient-to-b text-white font-bold rounded hover:to-sky-400 hover:from-sky-700 italic">Add</button></td>
                        </tr>
                    </table>
                ) : null
            }
            <div className="py-4 flex items-center">
                <p>Or</p>
                <button className=" ml-3 px-3 py-2 from-sky-800 to-sky-500 bg-gradient-to-b text-white font-bold rounded hover:to-sky-400 hover:from-sky-700 italic">Register New</button>
            </div>
        </>
    );
}