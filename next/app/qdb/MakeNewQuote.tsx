'use client';

import { fetchAuthLevel } from "@/lib/api";
import { useEffectAsync } from "@/lib/utils";
import { getSession, useSession } from "next-auth/react";
import { useState } from "react";

export const MakeNewQuote = () => {

  const { data: session }: any = useSession();
  const [quote, setQuote] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [pinned, setPinned] = useState(false);
  const [officer, setOfficer] = useState(false);
  const [userId, setUserID] = useState(0);

  const [isOfficer, setIsOfficer] = useState(false);
  useEffectAsync(async () => {
    const data = await fetchAuthLevel();
    setIsOfficer(data.isOfficer);
    setUserID(data.userId);
  }, []);

  const createQuote = async () => {
    if (!quote.trim()) {
      alert("Quote cannot be empty");
      return;
    }

    const newQuote = {
      dateAdded: new Date().toISOString(),
      quote,
      userId: userId,
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
      setQuote("");
      setAuthor("");
    } catch (error) {
      alert("Error creating quote");
    }
    window.location.reload();
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