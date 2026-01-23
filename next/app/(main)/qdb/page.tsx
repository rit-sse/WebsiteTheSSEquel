'use client';

import { Quote, Quotes } from "./Quotes"
import { QuoteCard } from "./QuoteCard"
import { MakeNewQuote } from "./MakeNewQuote";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for quote cards
function QuoteCardSkeleton() {
    return (
        <div className="border-l-8 border-primary rounded-lg bg-background w-11/12 py-5 px-12 mx-auto my-4">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

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
    const [search, setSearch] = useState(""); // quote
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchQuotes().then((data) => {
            setQuotes(data);
            setIsLoading(false);
        });
    }, []);


    // let test = [];
    // for (const item in quotes) {
    //     test.push(item);
    // }

    return (
        <>
            {/* http://localhost:3000/qdb  w-20rem h-4rem*/}
            <h1>SSE Quotes</h1>

            <MakeNewQuote></MakeNewQuote>

            <div className="w-full flex flex-col items-center">
                <input
                    className="mt-[10px] border-2 border-border p-2 rounded w-[90%] py-[10px] bg-background"
                    type="text"
                    placeholder="Search quotes here..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                {isLoading ? (
                    <>
                        <QuoteCardSkeleton />
                        <QuoteCardSkeleton />
                        <QuoteCardSkeleton />
                        <QuoteCardSkeleton />
                    </>
                ) : (
                    quotes
                        .filter(q =>
                            q.quote.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((quote, idx) => (
                            <QuoteCard key={idx} {...quote} />
                        ))
                )}
            </div>
        </>
    )
}

export default QuoteList;