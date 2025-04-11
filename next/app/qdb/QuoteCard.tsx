'use client';

import { GoLinkDelete, GoLinkEdit, QuoteDelete, QuoteEdit } from "@/components/common/Icons";
import { Quote } from "./Quotes";
import { useState, useEffect, SetStateAction } from "react";
import { useEffectAsync } from "@/lib/utils";
import { fetchAuthLevel } from "@/lib/api";

export const QuoteCard = (quote: Quote) => {

    const [editableQuote, setEditableQuote] = useState<Quote | null>(null);
    const [editableQuotes, setEditableQuotes] = useState<{ quote: string, author: string }[]>([]);

    const updateEditableQuoteField = (
        index: number,
        field: "quote" | "author",
        value: string
    ) => {
        const updatedQuotes = [...editableQuotes];
        updatedQuotes[index][field] = value;
        setEditableQuotes(updatedQuotes);
    };

    const removeQuoteField = (index: number) => {
        if (editableQuotes.length > 1) {
            const updated = editableQuotes.filter((_, i) => i !== index);
            setEditableQuotes(updated);
        }
    };

    const addQuoteField = () => {
        setEditableQuotes([...editableQuotes, { quote: "", author: "" }]);
    };


    const handleCancel = () => {
        setEditableQuote(null);
    };

    const breakUpQuoteString = (quoteString: String) => {
        let parts = quoteString.split(/[\n\[\]]/);
        parts = parts.filter(item => item !== "");
        console.log(parts);
        const quotesArray: { quote: string, author: string }[] = [];

        for (let i = 0; i < parts.length; i += 2) {
            let quote = parts[i + 1].trim() || "Author";
            if (quote.length > 0 && quote.charAt(0) === '"') {
                quote = quote.substring(1);
            }
            if (quote.length > 0 && quote.charAt(quote.length - 1) === '"') {
                quote = quote.substring(0, quote.length - 1);
            }
            const author = parts[i]?.trim() || "";

            if (quote) {
                quotesArray.push({ quote, author });
            }
        }

        setEditableQuotes(quotesArray);
    }

    const handleSave = async () => {
        if (!editableQuote) return;

        const reconstructedQuote = editableQuotes
            .map(q => `${q.quote} [${q.author}]`)
            .join("\n");

        try {
            const response = await fetch("/api/quotes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editableQuote.id,
                    quote: reconstructedQuote,
                    author: editableQuote.tags[0] // or however you handle this
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

    const openEditModal = (quoteObj: Quote) => {
        setEditableQuote(quoteObj);
        breakUpQuoteString(quoteObj.quote);

        setTimeout(() => {
            (
                document.getElementById(`edit-quote-${quoteObj.id}`) as HTMLFormElement
            )?.showModal();
        }, 0);
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
                <br></br>
                <p>{quote.tags}</p>

                {/* Button and dialog box for editing a quote */}
                <button onClick={() => openEditModal(quote)}>
                    <QuoteEdit />
                </button>
                <dialog id={`edit-quote-${quote.id}`} className="modal">
                    <div className="modal-box">
                        <p>Edit</p>
                        <h1 className="text-lg font-bold mb-4">Edit Quote</h1>

                        {editableQuotes.map((entry, index) => (
                            <div key={index} className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Enter quote"
                                    value={entry.quote}
                                    onChange={(e) => updateEditableQuoteField(index, "quote", e.target.value)}
                                    className="input input-bordered w-full mb-2"
                                />
                                <input
                                    type="text"
                                    placeholder="Enter author (optional)"
                                    value={entry.author}
                                    onChange={(e) => updateEditableQuoteField(index, "author", e.target.value)}
                                    className="input input-bordered w-full"
                                />
                                {editableQuotes.length > 1 && (
                                    <button
                                        className="btn btn-sm btn-error mt-2"
                                        onClick={() => removeQuoteField(index)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}

                        <button className="btn btn-outline btn-accent mb-4" onClick={addQuoteField}>
                            + Add another section
                        </button>



                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                    handleCancel();
                                    (document.getElementById(`edit-quote-${quote.id}`) as HTMLFormElement).close();
                                }}
                                className="btn btn-primary"
                            >
                                Save
                            </button>
                            <button
                                className="btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleCancel();
                                    (document.getElementById(`edit-quote-${quote.id}`) as HTMLFormElement).close();
                                }}
                            >
                                Cancel
                            </button>
                        </div>

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
