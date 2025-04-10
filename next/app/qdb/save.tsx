'use client';

import { fetchAuthLevel } from "@/lib/api";
import { useEffectAsync } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";

export const MakeNewQuote = () => {
  const [quotes, setQuotes] = useState([{ quote: "", author: "" }]);
  const [userId, setUserID] = useState(0);
  const [isOfficer, setIsOfficer] = useState(false);

  useEffectAsync(async () => {
    const data = await fetchAuthLevel();
    setIsOfficer(data.isOfficer);
    setUserID(data.userId);
  }, []);

  const handleQuoteChange = (index: number, field: "quote" | "author", value: string) => {
    const updated = [...quotes];
    updated[index][field] = value;
    setQuotes(updated);
  };

  const addQuoteField = () => {
    setQuotes([...quotes, { quote: "", author: "" }]);
  };

  const removeQuoteField = (index: number) => {
    if (quotes.length > 1) {
      const updated = quotes.filter((_, i) => i !== index);
      setQuotes(updated);
    }
  };

  const createQuote = async () => {
    console.log("Called");
    const hasEmptyFields = quotes.some(q => !q.quote.trim() || !q.author.trim());

    if (hasEmptyFields) {
      alert("All quote and author fields must be filled out.");
      return;
    }
    const combinedQuote = quotes.map(q => `[${q.author}] ${q.quote}`).join("\n");
    console.log(combinedQuote);

    const data = {
      date_added: new Date().toISOString,
      quote: combinedQuote,
      author: "Anonymous",
      user_id: userId,
    };

    console.log(data);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create quote");

      setQuotes([{ quote: "", author: "" }]);
      window.location.reload();
    } catch (error) {
      alert("Error creating quote");
    }
  }

  if (!isOfficer) return null;

  return (
    <div>
      <button
        onClick={(event) => {
          event.preventDefault();
          (document.getElementById("create-quote") as HTMLFormElement).showModal();
        }}
        className="p-4 h-full bg-base-100 rounded-md shadow-md justify-items-center hover:shadow-lg transition-shadow border-2 border-base-content hover:border-info text-xl"
      >
        Create Quote
      </button>

      <dialog id="create-quote" className="modal">
        <div className="modal-box">
          <h1 className="text-lg font-bold mb-4">Add Quote(s)</h1>

          {quotes.map((entry, index) => (
            <div key={index} className="mb-4">
              <input
                type="text"
                placeholder="Enter quote"
                value={entry.quote}
                onChange={(e) => handleQuoteChange(index, "quote", e.target.value)}
                className="input input-bordered w-full mb-2"
              />
              <input
                type="text"
                placeholder="Enter author (optional)"
                value={entry.author}
                onChange={(e) => handleQuoteChange(index, "author", e.target.value)}
                className="input input-bordered w-full"
              />
              {quotes.length > 1 && (
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
            + Add another quote
          </button>

          <div className="flex gap-4">
            <button onClick={createQuote} className="btn btn-primary">
              Submit Quotes
            </button>
            <button
              className="btn"
              onClick={(e) => {
                e.preventDefault();
                (document.getElementById("create-quote") as HTMLFormElement).close();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default MakeNewQuote;
