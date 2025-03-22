'use client';

import { fetchAuthLevel } from "@/lib/api";
import { useEffectAsync } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";

export const MakeNewQuote = () => {

  const { data: session }: any = useSession();
  const [quote, setQuote] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [pinned, setPinned] = useState(false);
  const [officer, setOfficer] = useState(false);

  const [isOfficer, setIsOfficer] = useState(false);
  useEffectAsync(async () => {
    const data = await fetchAuthLevel();
    console.log(data);
    setIsOfficer(data.isOfficer);
  }, []);

  const createQuote = async () => {
    console.log(session?.user?.id);
    if (!quote.trim()) {
      alert("Quote cannot be empty");
      return;
    }

    const newQuote = {
      dateAdded: new Date().toISOString(),
      quote,
      userId: session?.user?.id,
      author: author || "Anonymous",
    };

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuote),
      });

      if (!response.ok) {
        throw new Error("Failed to create quote");
      }

      const result = await response.json();
      console.log("Quote Created:", result);
      alert("Quote successfully created!");
      setQuote("");
      setAuthor("");
    } catch (error) {
      console.error(error);
      alert("Error creating quote");
    }
  };

  if (isOfficer) {
    return (
      <div>
        <button
          onClick={(event) => {
            event.preventDefault();
            if (document) {
              (
                document.getElementById("create-quote") as HTMLFormElement
              ).showModal();
            }
          }}
          className="p-4 h-full bg-base-100 rounded-md shadow-md justify-items-center hover:shadow-lg transition-shadow border-2 border-base-content hover:border-info text-xl"
        >
          Create Quote
        </button>
        <dialog id="create-quote" className="modal">
          <div className="modal-box">
            <h1 className="text-lg font-bold">Add a Quote</h1>
            <input
              type="text"
              placeholder="Enter quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="input input-bordered w-full mt-2"
            />
            <input
              type="text"
              placeholder="Enter author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input input-bordered w-full mt-2"
            />
            <button
              onClick={(e) => createQuote()}
              className="btn btn-primary mt-4"
            >
              Submit Quote
            </button>
            <button className="btn btn-primary mt-4" onClick={(func) => {
                        func.preventDefault();
                        if (document) {

                            (
                                document.getElementById("create-quote") as HTMLFormElement
                            ).close();
                        }
                    }}>
                        Cancel
                    </button>
          </div>
        </dialog>
      </div>
    );
  }

}

export default MakeNewQuote;

// // Example Usage
// createQuote("The only limit to our realization of tomorrow is our doubts of today.", 4, "Franklin D. Roosevelt")
//   .then((newQuote) => console.log("Quote Created:", newQuote))
//   .catch((error) => console.error(error));