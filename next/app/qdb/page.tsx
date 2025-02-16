import { Quotes } from "./Quotes"
import { QuoteCard } from "./QuoteCard"
import MakeNewQuote from "./MakeNewQuote"

const QuoteList = () => {
    return (
        <>
            <h1>QDB</h1>
            <MakeNewQuote></MakeNewQuote>
            <div className="">
                {Quotes.map((quote, idx) => (
                    <QuoteCard key={idx} {...quote} />
                ))}
            </div>
        </>
    )
}

export default QuoteList;