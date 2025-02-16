'use client';

import { GoLinkDelete } from "@/components/common/Icons";
import { fetchAuthLevel } from "@/lib/api";
import { useEffectAsync } from "@/lib/utils";
import { useState } from "react";
import { QuoteCard } from "./QuoteCard";

export const MakeNewQuote = () => {

    const [contributors, setContributors] = useState<{ contributor: string; quote: string }[]>([{ contributor: "", quote: "" }]);
    const [description, setDescription] = useState("");
    const [hideError, setHideError] = useState(true);

    const handleSetContributors = (index: number, newContributor: string) => {
        const updatedContributors = [...contributors];
        updatedContributors[index].contributor = newContributor;
        setContributors(updatedContributors);
    }

    const handleAddContributor = () => {
        setContributors([...contributors, { contributor: "", quote: "" }]);
    };

    const handleDeleteContributor = (index: number) => {
        const updatedContributors = [...contributors.slice(0, index), ...contributors.slice(index + 1)];
        setContributors(updatedContributors);
    }

    const handleSetQuotes = (index: number, newQuote: string) => {
        const updatedContributors = [...contributors];
        updatedContributors[index].quote = newQuote;
        setContributors(updatedContributors);
    }

    const verifyFields = () => {
        const blankContributor = contributors.find(quote => quote.contributor === '');
        const blankQuote = contributors.find(quote => quote.quote === '');
        if (blankContributor || blankQuote) {
            setHideError(false)
            return false
        }
        return true
    }

    const clearModal = () => {
        setHideError(true);
        setContributors([{contributor: "", quote: ""}]);
        setDescription("");
    }

    const handleCreate = () => {
        clearModal();
    }

    const [isOfficer, setIsOfficer] = useState(false);
    useEffectAsync(async () => {
        const data = await fetchAuthLevel();
        console.log(data);
        setIsOfficer(data.isOfficer);
    }, []);

    if (isOfficer) {
        return (
            <div>
                <button
                    onClick={(func) => {
                        func.preventDefault();
                        if (document) {
                            (
                                document.getElementById("create-quote") as HTMLFormElement
                            ).showModal();
                        }
                    }}
                    className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl"
                >
                    Create Quote
                </button>

                <dialog id="create-quote" className="modal">
                    <div className="modal-box">
                        <h3 className="font-bold py-4 text-xlg">Create Quote</h3>
                        <h2 hidden={hideError}>Ensure all contributor and quote fields are filled in.</h2>

                        {contributors.map((quote, index) => (
                            <div>
                                <label className="my-2 input input-bordered flex items-center gap-2">
                                    Contributor:
                                    <input
                                        type="text"
                                        className="grow text-gray-900"
                                        placeholder="You're a"
                                        value={quote.contributor}
                                        onChange={(e) => handleSetContributors(index, e.target.value)}
                                    />
                                </label>
                                <label className="my-2 input input-bordered flex items-center gap-2">
                                    Quote:
                                    <input
                                        type="text"
                                        className="grow text-gray-900"
                                        placeholder="Nerd"
                                        value={quote.quote}
                                        onChange={(e) => handleSetQuotes(index, e.target.value)}
                                    />
                                </label>
                                {contributors.length > 1 && <button onClick={() => handleDeleteContributor(index)}>
                                    <GoLinkDelete />
                                </button>}
                            </div>
                        ))}

                        <button
                            onClick={handleAddContributor}
                            className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl"
                        >
                            Add Contributor
                        </button>
                        <label className="my-2 input input-bordered flex items-center gap-2">
                            Description:
                            <input
                                type="text"
                                className="grow text-gray-900"
                                placeholder=":skull:"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </label>
                        <button
                            onClick={(func) => {
                                func.preventDefault();
                                if (document) {
                                    (
                                        document.getElementById("create-quote") as HTMLFormElement
                                    ).close();
                                    clearModal()
                                }
                            }}
                            className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl">Cancel</button>
                        <button
                            onClick={(func) => {
                                func.preventDefault();
                                if (verifyFields()) {
                                    if (document) {
                                        (
                                            document.getElementById("create-quote") as HTMLFormElement
                                        ).close();
                                        handleCreate();
                                    }
                                }
                            }}
                            className="
                p-4
                h-full
                bg-base-100
                rounded-md
                shadow-md
                justify-items-center
                hover:shadow-lg
                transition-shadow
                border-2
                border-base-content
                hover:border-info
                text-xl" type="reset">Create</button>
                    </div>
                </dialog>
            </div>
        );
    }
}

export default MakeNewQuote;