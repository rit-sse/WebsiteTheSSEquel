'use client';

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const MakeNewQuote = () => {
  const [open, setOpen] = useState(false);
  const [quotes, setQuotes] = useState([{ quote: "", author: "" }]);
  const [userId, setUserID] = useState(0);
  const [isOfficer, setIsOfficer] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await fetch("/api/authLevel").then((r) => r.json());
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
    const hasEmptyFields = quotes.some(q => !q.quote.trim());

    if (hasEmptyFields) {
      toast.error("All quote fields must be filled out.");
      return;
    }

    quotes.forEach(q => {
      if (q.author === "") {
        q.author = "Anonymous";
      }
    });

    const combinedQuote = quotes.map(q => `[${q.author}] "${q.quote}"`).join("\n");

    const authorSet: string[] = [];
    quotes.forEach(q => {
      if (q.author.trim() && !authorSet.includes(q.author.trim())) {
        authorSet.push(q.author.trim());
      }
    });

    const authorString = authorSet.length > 0 ? authorSet.join(", ") : "Anonymous";

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

      setOpen(false);
      setQuotes([{ quote: "", author: "" }]);
      window.location.reload();
    } catch (error) {
      toast.error("Error creating quote");
    }
  };

  if (!isOfficer) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-4 h-full bg-background rounded-md shadow-md justify-items-center hover:shadow-lg transition-shadow border-2 border-border/30 hover:border-primary text-xl"
      >
        Add A Quote
      </button>

      <Modal open={open} onOpenChange={setOpen} title="Add a Quote" className="max-w-xl">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {quotes.map((entry, index) => (
            <div key={index} className="space-y-2 p-3 border border-border/30 rounded-base">
              <div className="space-y-1">
                <Label htmlFor={`quote-${index}`}>Quote</Label>
                <Input
                  id={`quote-${index}`}
                  placeholder="Enter quote"
                  value={entry.quote}
                  onChange={(e) => handleQuoteChange(index, "quote", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`author-${index}`}>Author</Label>
                <Input
                  id={`author-${index}`}
                  placeholder="Enter author (optional)"
                  value={entry.author}
                  onChange={(e) => handleQuoteChange(index, "author", e.target.value)}
                />
              </div>
              {quotes.length > 1 && (
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
          <Button variant="neutral" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={createQuote}>Submit Quotes</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default MakeNewQuote;
