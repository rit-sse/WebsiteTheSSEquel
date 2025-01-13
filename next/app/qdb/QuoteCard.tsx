import { Quote } from "./Quotes";

export const QuoteCard = (quote: Quote) => {
    return (
        <div className="border-l-8 border-blue-500 rounded-lg bg-base-100 w-11/12 py-8 px-12 mx-auto items-center content-center gap-10 my-10">
            <p className="mb-4">{quote.quote}</p>
            <p className="text-sm">{quote.description}</p>
            <div>
               {quote.tags.map((tag => (
                    <span>{tag}</span>
               )))}
            </div>
        </div>
    );
}