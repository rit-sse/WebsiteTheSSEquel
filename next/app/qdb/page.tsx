'use client';

import { Quote, Quotes } from "./Quotes"
import { QuoteCard } from "./QuoteCard"
import { MakeNewQuote } from "./MakeNewQuote";
import { useEffect, useState } from "react";

const fetchQuotes = async () => {
    try {
        const response = await fetch("/api/quotes");
        if (!response.ok) {
            throw new Error("Failed to fetch quotes");
        }
        const data = await response.json();

        return data.map((quote: any) => ({
            id: quote.id,
            quote: quote.quote,
            date: quote.date_added,
            tags: quote.author ? [quote.author] : ["Anonymous"],
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

const QuoteList = () => {

    const [quotes, setQuotes] = useState<Quote[]>([])

    useEffect(() => {
        fetchQuotes().then(setQuotes);
    }, []);

    return (
        <>
            <h1>SSE Quotes</h1>
            <div >

            </div>
            <MakeNewQuote></MakeNewQuote>
            <div className="w-full">
                {quotes.map((quote, idx) => (
                    <QuoteCard key={idx} {...quote} />
                ))}
            </div>
        </>
    )
}

export default QuoteList;