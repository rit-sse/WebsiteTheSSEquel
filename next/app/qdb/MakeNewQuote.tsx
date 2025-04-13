'use client';

import { useCallback, useEffect, useState } from "react";

export const MakeNewQuote = () => {

  const [quotes, setQuotes] = useState([{ quote: "", author: "" }]);
  const [userId, setUserID] = useState(0);
  const [isOfficer, setIsOfficer] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await fetch("/api/authLevel").then((response) => 
      response.json()
    )
    setIsOfficer(data.isOfficer);
    setUserID(data.userId);
  }, []);

  useEffect(() => {
    fetchData();
}, [fetchData]);
  

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
    let hasEmptyFields = quotes.some(q => !q.quote.trim());

    if (hasEmptyFields) {
      alert("All quote fields must be filled out.");
      return;
    }

    quotes.map(quote => {
      if (quote.author === "") {
        quote.author = "Anonymous";
      }
    })

    let combinedQuote = quotes.map(q => `[${q.author}] "${q.quote}"`).join("\n");

    let authorSet: string[] = [];
    quotes.forEach(q => {
      if (q.author.trim() && !authorSet.includes(q.author.trim())) {
        authorSet.push(q.author.trim());
      }
    });

    let authorString = "Anonymous";

    if (authorSet.length > 0) {
      authorString = authorSet.join(", ");
    }

    const newQuote = {
      dateAdded: new Date().toISOString(),
      quote: combinedQuote,
      userId: userId,
      author: authorString,
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
          Add A Quote
        </button>
        <dialog id="create-quote" className="modal">
          <div className="modal-box">
            <h1 className="text-lg font-bold mb-4">Add a Quote</h1>

            {quotes.map((entry, index) => (
              <div key={index} className="mb-4">
                <input
                  type="text"
                  id={`quote-${index}`}
                  placeholder="Enter quote"
                  value={entry.quote}
                  onChange={(e) => handleQuoteChange(index, "quote", e.target.value)}
                  className="input input-bordered w-full mb-2"
                />
                <input
                  type="text"
                  id={`author-${index}`}
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
              + Add another section
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
  }

}

export default MakeNewQuote;