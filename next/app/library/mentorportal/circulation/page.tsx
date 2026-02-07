"use client"

import { useState } from "react";

export default function CirculationPage() {
    const [isbnLookup, setIsbnLookup] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectFilter, setSelectFilter] = useState("id");

    async function circulationLookup() {
        await fetch("/api/library/copies?" + (selectFilter === "isbn" ? "isbn=" + isbnLookup : "id=" + isbnLookup)).then(res => res.json()).then(data => {
            console.log(data);
            if (data.error) {
                alert(data.error);
            } else {
                setSearchResults(data);
            }
        }).catch(e => {
            console.error(e);
        })
    }

    const setAvailable = async (id: number, available: boolean) => {
        let updatedResults = searchResults.map(async (copy) => {
            if (copy.id === id) {
                fetch("/api/library/copies", {
                    method: "PUT",
                    body: JSON.stringify({
                        id: id,
                        checkedOut: !available,
                    }),
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                return {
                    ...copy,
                    checkedOut: !available,
                }
            }
            return copy;
        });
        setSearchResults(await Promise.all(updatedResults));
    }

    return (
        <div className="w-[100%] px-5">
            <p>Search</p>
            <div>
                <select className="py-0 mr-2" value={selectFilter} onChange={e => setSelectFilter(e.target.value)}>
                    <option value="id">ID</option>
                    <option value="isbn">ISBN</option>
                </select>
                <input placeholder="Search" className="py-0 px-1" onChange={e => setIsbnLookup(e.target.value)} onKeyUp={e => e.key === "Enter" ? circulationLookup() : null} />
                <button className=" ml-2 px-2 from-gray-200 to-gray-300 bg-gradient-to-b text-black border hover:from-gray-100 hover:to-gray-200 ">Search</button>
            </div>
            <table className="w-full mt-2 border [&_td]:border [&_td]:px-4">
                <tbody>
                    <tr className="bg-gray-200">
                        <td className="w-[30px]"><input type="checkbox" /></td>
                        <td>ID</td>
                        <td>ISBN</td>
                        <td>Checked Out</td>
                    </tr>
                    {
                        searchResults.map((copy, index) => (
                            <tr key={index}>
                                <td className="w-[30px]"><input type="checkbox" /></td>
                                <td>{copy.id}</td>
                                <td>{copy.ISBN}</td>
                                <td><input type="checkbox" checked={copy.checkedOut} onChange={e => setAvailable(copy.id, !e.target.checked)} /></td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>
        </div>
    );
}