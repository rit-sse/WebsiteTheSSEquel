"use client"
import { useState, useEffect } from "react";

export default function NewCategory() {

    const [categoryName, setCategoryName] = useState("");
    const [books, setBooks] = useState("");

    const [editing, setEditing] = useState(false);

    const finishcreation = async () => {
        await fetch("/api/library/categories", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                categoryName: categoryName,
                books: books.split(",").map((isbn: string) => isbn.trim())
            })
        });
        setEditing(false);
        window.location.reload()
    }

    return (
        <tr>
            <td>New</td>

            <td><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="border w-full" /></td>
            <td><input value={books} onChange={(e) => setBooks(e.target.value)} className="borde w-full" /></td>
            <td className="text-center">
                <img src="/library-icons/checkmark.png" alt="Finish" className="w-5 h-5 inline" onClick={finishcreation} />
            </td>
        </tr>
    )
}