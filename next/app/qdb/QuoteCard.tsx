'use client';

import { GoLinkDelete, GoLinkEdit, QuoteDelete, QuoteEdit } from "@/components/common/Icons";
import { Quote } from "./Quotes";
import { useState, useEffect } from "react";
import { useEffectAsync } from "@/lib/utils";
import { fetchAuthLevel } from "@/lib/api";

export const QuoteCard = (quote: Quote) => {

    const [editableQuote, setEditableQuote] = useState<Quote | null>(null);

    const handleCancel = () => {
        setEditableQuote(null);
    };

    const updateTag = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableQuote((prevQuote) => ({
            ...prevQuote!,
            tags: [e.target.value],
        }));
    };

    const updateQuote = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditableQuote((prevQuote) => ({
            ...prevQuote!,
            quote: e.target.value,
        }));
    };

    const handleSave = async () => {
        if (!editableQuote) return;

        try {
            const response = await fetch("/api/quotes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editableQuote.id,
                    quote: editableQuote.quote,
                    author: editableQuote.tags[0]
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update quote");
            }

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Error updating quote");
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch("/api/quotes", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: quote.id }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete quote");
            }

            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Error deleting quote");
        }
    };

    const [isOfficer, setIsOfficer] = useState(false);
    useEffectAsync(async () => {
        const data = await fetchAuthLevel();
        setIsOfficer(data.isOfficer);
    }, []);

    const openEditModal = (quote: Quote) => {
        setEditableQuote(quote);
        if (document) {
            (
                document.getElementById("edit-quote") as HTMLFormElement
            ).showModal();
        }
    };

    const formatQuote = (input: string) => {
        return input
            .trim()
            .split("\n")
            .map(line => {
                const start = line.indexOf("[");
                const end = line.indexOf("]");
                if (start !== -1 && end !== -1 && end > start) {
                    const author = line.substring(start + 1, end).trim();
                    const quote = line.substring(end + 1).trim();
                    return `${author}: ${quote}`;
                }
                return line.trim();
            });
    };

    if (isOfficer) {
        return (
            <div className="border-l-8 border-blue-500 rounded-lg bg-base-100 w-11/12 py-8 px-12 mx-auto items-center content-center gap-10 my-10">
                {formatQuote(quote.quote).map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
                <p>{quote.tags}</p>

                {/* Button and dialog box for editing a quote */}
                <button onClick={() => openEditModal(quote)}>
                    <QuoteEdit />
                </button>
                <dialog id="edit-quote" className="modal">
                    <div className="modal-box">
                        <p>Edit</p>
                        <label className="block text-sm font-medium text-gray-700">
                            Quote:
                        </label>
                        <input
                            type="text"
                            value={editableQuote?.quote || ""}
                            onChange={updateQuote}
                            className="mt-1 p-2 w-full border rounded-md"
                        />
                        <label className="block text-sm font-medium text-gray-700">
                            Person Quoted:
                        </label>
                        <input
                            type="text"
                            value={editableQuote?.tags[0] || ""}
                            onChange={updateTag}
                            className="mt-1 p-2 w-full border rounded-md"
                        />
                        <button className="btn btn-primary mt-4" onClick={(func) => {
                            func.preventDefault();
                            handleCancel();
                            if (document) {
                                (
                                    document.getElementById("edit-quote") as HTMLFormElement
                                ).close();
                            }
                        }}>
                            Cancel
                        </button>
                        <button className="btn btn-primary mt-4" onClick={(func) => {
                            func.preventDefault();
                            handleSave();
                            handleCancel();
                            if (document) {
                                (
                                    document.getElementById("edit-quote") as HTMLFormElement
                                ).close();
                            }
                        }}>
                            Save
                        </button>
                    </div>
                </dialog>

                {/* Button and dialog box for deleting a quote */}
                <button onClick={(func) => {
                    func.preventDefault();
                    if (document) {
                        (
                            document.getElementById(`delete-quote-${quote.id}`) as HTMLFormElement
                        )?.showModal();
                    }
                }}>
                    <QuoteDelete />
                </button>
                <dialog id={`delete-quote-${quote.id}`} className="modal">
                    <div className="modal-box">
                        <h3>Are you sure you want to delete the quote?</h3>
                        <button className="btn btn-primary mt-4" onClick={(func) => {
                            func.preventDefault();
                            if (document) {
                                (
                                    document.getElementById("delete-quote") as HTMLFormElement
                                ).close();
                            }
                        }}>
                            No
                        </button>
                        <button className="btn btn-primary mt-4" onClick={handleDelete}>
                            Yes
                        </button>
                    </div>
                </dialog>
            </div>
        );
    } else {
        return (
            <div className="border-l-8 border-blue-500 rounded-lg bg-base-100 w-11/12 py-8 px-12 mx-auto items-center content-center gap-10 my-10">
                {formatQuote(quote.quote).map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
        );
    }
};
