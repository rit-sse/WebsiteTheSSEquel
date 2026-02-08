"use client"
import { useState, useEffect } from "react";

export default function CategoryRow(props: { category: any }) {
    const { category } = props;

    const [categoryName, setCategoryName] = useState(category.categoryName);
    const [books, setBooks] = useState(category.books.map((book: any) => book.ISBN).join(", "));

    const [editing, setEditing] = useState(false);

    const finishEditing = async () => {
        await fetch("/api/library/categories", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: category.id,
                categoryName: categoryName,
                books: books.split(",").map((isbn: string) => isbn.trim())
            })
        });
        setEditing(false);
    }

    const trashit = async () => {
        if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
            return;
        }
        await fetch("/api/library/categories", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: category.id,
            })
        });
        setEditing(false);
        window.location.reload()
    }

    return (
        <tr key={category.id}>
            <td>{category.id}</td>
            {
                editing ? (
                    <>
                        <td><input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="border w-full" /></td>
                        <td><input value={books} onChange={(e) => setBooks(e.target.value)} className="borde w-full" /></td>
                    </>
                ) : (
                    <>
                        <td>{categoryName}</td>
                        <td>{books}</td>
                    </>
                )
            }
            <td className="text-center">
                {
                    !editing ? (
                        <img src="/library-icons/pencil.png" alt="Modify" className="w-5 h-5 inline" onClick={() => setEditing(true)} />
                    ) :
                        <>
                            <img src="/library-icons/checkmark.png" alt="Finish" className="w-5 h-5 inline" onClick={finishEditing} />
                            <img src="/library-icons/error.png" alt="Cancel" className="w-5 h-5 inline ml-2" onClick={() => setEditing(false)} />
                            <img src="/library-icons/trash-it.png" alt="Delete" className="w-5 h-5 inline ml-2" onClick={trashit} />
                        </>

                }
            </td>
        </tr>
    )
}