'use client';

import SettingsIcon from "@/components/settings-icon";
import TrashIcon from "@/components/trash-icon";
import { Quote } from "./Quotes";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const QuoteCard = (quote: Quote) => {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editableQuotes, setEditableQuotes] = useState<{ quote: string, author: string }[]>([]);
    const [isOfficer, setIsOfficer] = useState(false);

    const fetchData = useCallback(async () => {
        const data = await fetch("/api/authLevel").then((r) => r.json());
        setIsOfficer(data.isOfficer);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    const breakUpQuoteString = (quoteString: string) => {
        let parts = quoteString.split(/[\n[\]]/);
        parts = parts.filter(item => item !== "");
        const quotesArray: { quote: string, author: string }[] = [];

        for (let i = 0; i < parts.length; i += 2) {
            let quoteText = parts[i + 1]?.trim() || "Author";
            if (quoteText.length > 0 && quoteText.charAt(0) === '"') {
                quoteText = quoteText.substring(1);
            }
            if (quoteText.length > 0 && quoteText.charAt(quoteText.length - 1) === '"') {
                quoteText = quoteText.substring(0, quoteText.length - 1);
            }
            const author = parts[i]?.trim() || "";

            if (quoteText) {
                quotesArray.push({ quote: quoteText, author });
            }
        }

        setEditableQuotes(quotesArray);
    };

    const handleSave = async () => {
        const hasEmptyFields = editableQuotes.some(q => !q.quote.trim());
        if (hasEmptyFields) {
            toast.error("All quote fields must be filled out.");
            return;
        }

        editableQuotes.forEach((q) => {
            if (!q.author.trim()) {
                q.author = "Anonymous";
            }
        });

        const combinedQuote = editableQuotes
            .map(q => `[${q.author}] "${q.quote}"`)
            .join("\n");

        const authorSet: string[] = [];
        editableQuotes.forEach(q => {
            if (q.author.trim() && !authorSet.includes(q.author.trim())) {
                authorSet.push(q.author.trim());
            }
        });

        const authorString = authorSet.length > 0 ? authorSet.join(", ") : "Anonymous";

        const updatedQuote = {
            id: quote.id,
            quote: combinedQuote,
            author: authorString,
        };

        try {
            const response = await fetch("/api/quotes", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedQuote),
            });

            if (!response.ok) {
                throw new Error("Failed to update quote");
            }

            setEditOpen(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Error updating quote");
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

            setDeleteOpen(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            toast.error("Error deleting quote");
        }
    };

    const openEditModal = () => {
        breakUpQuoteString(quote.quote);
        setEditOpen(true);
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
                    const quoteText = line.substring(end + 1).trim();
                    return `${author}: ${quoteText}`;
                }
                return line.trim();
            });
    };

    if (isOfficer) {
        return (
            <>
                <div className="border-l-8 border-primary rounded-lg bg-background w-11/12 py-5 px-12 mx-auto items-center content-center gap-10 my-4">
                    {formatQuote(quote.quote).map((line, index) => (
                        <p className="" key={index}>{line}</p>
                    ))}
                    <br />
                    <p>{quote.tags}</p>

                    <button 
                        onClick={openEditModal}
                        aria-label="Edit quote"
                        className="hover:scale-110 transition-transform inline-flex"
                    >
                        <SettingsIcon size={24} isHovered duration={2} />
                    </button>

                    <button 
                        onClick={() => setDeleteOpen(true)}
                        aria-label="Delete quote"
                        className="hover:scale-110 transition-transform text-destructive inline-flex ml-2"
                    >
                        <TrashIcon size={24} isHovered />
                    </button>
                </div>

                {/* Edit Modal */}
                <Modal open={editOpen} onOpenChange={setEditOpen} title="Edit Quote" className="max-w-xl">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {editableQuotes.map((entry, index) => (
                            <div key={index} className="space-y-2 p-3 border border-border rounded-base">
                                <div className="space-y-1">
                                    <Label htmlFor={`edit-quote-${quote.id}-${index}`}>Quote</Label>
                                    <Input
                                        id={`edit-quote-${quote.id}-${index}`}
                                        placeholder="Enter quote"
                                        value={entry.quote}
                                        onChange={(e) => updateEditableQuoteField(index, "quote", e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`edit-author-${quote.id}-${index}`}>Author</Label>
                                    <Input
                                        id={`edit-author-${quote.id}-${index}`}
                                        placeholder="Enter author (optional)"
                                        value={entry.author}
                                        onChange={(e) => updateEditableQuoteField(index, "author", e.target.value)}
                                    />
                                </div>
                                {editableQuotes.length > 1 && (
                                    <Button
                                        variant="neutral"
                                        size="sm"
                                        onClick={() => removeQuoteField(index)}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        ))}

                        <Button variant="neutral" onClick={addQuoteField}>
                            + Add another section
                        </Button>
                    </div>

                    <ModalFooter>
                        <Button variant="neutral" onClick={() => setEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save</Button>
                    </ModalFooter>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Quote">
                    <p className="text-foreground">Are you sure you want to delete this quote?</p>
                    <ModalFooter>
                        <Button variant="neutral" onClick={() => setDeleteOpen(false)}>No</Button>
                        <Button onClick={handleDelete}>Yes</Button>
                    </ModalFooter>
                </Modal>
            </>
        );
    }

    return (
        <div className="border-l-8 border-primary rounded-lg bg-background w-11/12 py-5 px-12 mx-auto items-center content-center gap-10 my-4">
            {formatQuote(quote.quote).map((line, index) => (
                <p key={index}>{line}</p>
            ))}
        </div>
    );
};
