import { Quotes } from "./Quotes"
import { QuoteCard } from "./QuoteCard"

const QuoteList = () => {
    return (
        <>
            <h1>QDB</h1>
            <div className="flex gap-4">
                {Quotes.map((quote, idx) => (
                    <QuoteCard key={idx} {...quote} />
                ))}
            </div>
        </>
    )
}

export default QuoteList;