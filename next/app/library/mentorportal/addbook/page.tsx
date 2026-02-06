"use client"

import { useState } from "react";


export default function AddBook() {

    const [selectionState, setSelectionState] = useState<"create-new" | "existing-book" | null>("create-new");


    return (
        <>
            <div className="flex flex-col ">
                <div>
                    <input type="radio" id="create-new" className="modal-toggle" name="bookselection" onChange={() => setSelectionState("create-new")} checked={selectionState === "create-new"} />
                    <label htmlFor="create-new" className="ml-[10px]">Create a new book</label>
                </div>
                <div>
                    <input type="radio" id="existing-book" className="modal-toggle" name="bookselection" onChange={() => setSelectionState("existing-book")} checked={selectionState === "existing-book"} />
                    <label htmlFor="existing-book" className="ml-[10px]">Add to existing book</label>
                </div>
            </div>
            {
                selectionState == "create-new" ? (
                    <>
                        <div className="flex justify-center items-center w-[100%] mt-4">
                            <input className="w-[80%] max-w-[500px]" placeholder="Attempt Autofill with ISBN with OpenLibrary"/>
                            <img src="/library-icons/search-web.png" alt="Search" className="w-[30px] h-[30px] ml-2 cursor-pointer" />
                        </div>
                        <p className="my-2">or</p>
                    </>
                ) : selectionState == "existing-book" ? (
                    <>
                    </>
                ) : null
            }
        </>
    );
}