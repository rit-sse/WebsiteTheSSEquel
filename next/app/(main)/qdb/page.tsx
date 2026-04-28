'use client';

import { Quote } from "./Quotes"
import { QuoteCard } from "./QuoteCard"
import { MakeNewQuote } from "./MakeNewQuote";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Skeleton for quote cards
function QuoteCardSkeleton() {
    return (
        <Card depth={2} className="p-5">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-32 mt-3" />
        </Card>
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
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchQuotes().then((data) => {
            setQuotes(data);
            setIsLoading(false);
        });
    }, []);

    const filteredQuotes = quotes.filter(q =>
        q.quote.toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <section className="mt-16 pb-16 w-full">
            <div className="w-full max-w-screen-xl mx-auto px-4 md:px-8">
                <Card depth={1} className="p-6 md:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-primary">SSE Quotes</h1>
                        <p className="mt-3 text-xl leading-8">
                            The legendary quote database of the Society of Software Engineers.
                        </p>
                        <div className="mt-4">
                            <MakeNewQuote />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-6 max-w-lg mx-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            className="pl-10"
                            type="text"
                            placeholder="Search quotes or authors..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Quote count */}
                    {!isLoading && (
                        <p className="text-sm text-muted-foreground text-center mb-4">
                            {filteredQuotes.length} {filteredQuotes.length === 1 ? 'quote' : 'quotes'}{search ? ' found' : ' total'}
                        </p>
                    )}

                    {/* Quotes grid */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <>
                                <QuoteCardSkeleton />
                                <QuoteCardSkeleton />
                                <QuoteCardSkeleton />
                                <QuoteCardSkeleton />
                                <QuoteCardSkeleton />
                            </>
                        ) : filteredQuotes.length === 0 ? (
                            <p className="text-center text-muted-foreground py-12">
                                {search ? 'No quotes match your search.' : 'No quotes yet. Be the first to add one!'}
                            </p>
                        ) : (
                            filteredQuotes.map((quote) => (
                                <QuoteCard key={quote.id} {...quote} />
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </section>
    )
}

export default QuoteList;