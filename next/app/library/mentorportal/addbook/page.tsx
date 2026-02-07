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
    const [registerNewPrompt, setRegisterNewPrompt] = useState(false);
    const [lookupISBNInput, setLookupISBNInput] = useState("");

    const [newBookData, setNewBookData] = useState<{
        ISBN: string;
        name: string;
        authors: string;
        description: string;
        publisher: string;
        edition: string;
        keyWords: string;
        classInterest: string;
        yearPublished: number;
    }>({
        ISBN: "",
        name: "",
        authors: "",
        description: "",
        publisher: "",
        edition: "",
        keyWords: "",
        classInterest: "",
        yearPublished: new Date().getFullYear(),
    });

    const addExistingBook = () => {
        fetch("/api/library/copies", {
            method: "POST",
            body: JSON.stringify({
                ISBN: bookData.ISBN,
            }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then((res) => res.json()).then((data) => {
            if (data.error) {
                setError(data.error);
            } else {
                setBookData({
                    ...bookData,
                    stockNumber: bookData.stockNumber + 1,
                });
            }
        })
    }
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
    const lookupISBN = () => {
        fetch("/api/library/isbnlookup?isbn=" + lookupISBNInput, {
        }).then((res) => res.json()).then((data) => {
            if (data.error) {
                setError(data.error);
            } else {
                setNewBookData({
                    ...newBookData,
                    ISBN: data.ISBN,
                    name: data.name,
                    description: data.description,
                    publisher: data.publisher,
                    yearPublished: data.yearPublished,
                });
            }
        })
    }

    const lookupOnIsbnSearch = () => {
        window.open("http://isbnsearch.org/isbn/" + lookupISBNInput, "_blank");
    }

    return (
        <div className="w-[100%] flex flex-col items-center mb-10">
            <div className="flex justify-center items-center w-[100%]">
                <input className="w-[80%] max-w-[500px]" placeholder="Find if ISBN exists in database" onChange={e => { setIsbnInput(e.target.value) }} onKeyUp={e => e.key == "Enter" ? fetchISBNExists() : null} />
                <img src="/library-icons/search.png" alt="Search" className="w-[30px] h-[30px] ml-2 cursor-pointer" onClick={fetchISBNExists} />
            </div>
            {
                error ? (
                    <div className="mt-4 flex items-center" >
                        <img src="/library-icons/error.png" alt="Error" className="w-[20px] h-[20px] mr-2" />
                        <p className="text-red-500 ">{error}</p>
                    </div >
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
                            <td>{bookData.ISBN} <img className="w-[20px] h-[20px] inline cursor-pointer" src="/library-icons/information.png" alt="Book" onClick={() => location.href = "/library/catalog/" + bookData.ISBN} /></td>
                            <td>{bookData.stockNumber}</td>
                            <td className=" text-right border-none max-w-[50px]"><button onClick={addExistingBook} className="px-3 from-sky-800 to-sky-500 bg-gradient-to-b text-white font-bold rounded hover:to-sky-400 hover:from-sky-700 italic">Add</button></td>
                        </tr>
                    </table>
                ) : null
            }
            <div className="py-4 flex items-center">
                <p>Or</p>
                <button className=" ml-3 px-3 py-2 from-sky-800 to-sky-500 bg-gradient-to-b text-white font-bold rounded hover:to-sky-400 hover:from-sky-700 italic" onClick={() => { setBookExists(false); setRegisterNewPrompt(true) }}>Register New</button>
            </div>
            {
                registerNewPrompt ? (
                    <div className="w-[80%] border p-4">
                        <h2 className="text-xl font-bold mb-4 w-full text-center">Register New Book</h2>
                        <div className="w-full flex flex-row justify-center items-center mb-4 ">
                            <input type="text" placeholder="Attempt auto-fill with ISBN using OpenLibrary" className="w-[40%] min-w-[250px]" onChange={e => setLookupISBNInput(e.target.value)} onKeyUp={e => e.key == "Enter" ? lookupISBN() : undefined} />
                            <img src="/library-icons/search-web.png" alt="Search" className="h-full ml-4 cursor-pointer inline" onClick={lookupISBN} />
                            <button className=" ml-3 px-3 py-2 from-gray-200 to-gray-300 bg-gradient-to-b text-black border hover:from-gray-100 hover:to-gray-200 " onClick={lookupOnIsbnSearch}>See in ISBN Search</button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <input placeholder="ISBN" className="p-2 border" value={newBookData.ISBN} onChange={e => setNewBookData({ ...newBookData, ISBN: e.target.value })} />
                            <input placeholder="Title" className="p-2 border" value={newBookData.name} onChange={e => setNewBookData({ ...newBookData, name: e.target.value })} />
                            <input placeholder="Authors (separated by semicolons)" className="p-2 border" value={newBookData.authors} onChange={e => setNewBookData({ ...newBookData, authors: e.target.value })} />
                            <input placeholder="Publisher" className="p-2 border" value={newBookData.publisher} onChange={e => setNewBookData({ ...newBookData, publisher: e.target.value })} />
                            <input placeholder="Edition" className="p-2 border" value={newBookData.edition} onChange={e => setNewBookData({ ...newBookData, edition: e.target.value })} />
                            <input placeholder="Year Published" type="number" className="p-2 border" value={newBookData.yearPublished} onChange={e => setNewBookData({ ...newBookData, yearPublished: parseInt(e.target.value) })} />
                            <textarea placeholder="Description" className="p-2 border" value={newBookData.description} onChange={e => setNewBookData({ ...newBookData, description: e.target.value })} />
                            <input placeholder="Keywords (separated by commas)" className="p-2 border" value={newBookData.keyWords} onChange={e => setNewBookData({ ...newBookData, keyWords: e.target.value })} />
                            <input placeholder="Class Interest" className="p-2 border" value={newBookData.classInterest} onChange={e => setNewBookData({ ...newBookData, classInterest: e.target.value })} />
                            <input placeholder="Image URL" className="p-2 border" type="file" />
                            <button className="px-3 from-green-600 to-green-700 bg-gradient-to-t text-white font-bold border border-solid border-black hover:from-green-500 hover:to-green-600 rounded mt-3">Add</button>
                        </div>
                    </div>
                ) : null
            }

        </div>
    );
}