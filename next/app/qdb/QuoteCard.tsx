import { Quote } from "./Quotes";



export const QuoteCard = (quote: Quote) => {

    const formatQuote = (quote: String) => {
        //Splits a given quote by who is quoted and the quote itself
        let splitQuote = quote.split(/[\[\]]/);
        //Goes through splitQuote and separates each line of the quote
        //e.g. Person: Quote
        let formattedStr = ""
        for (let i = 0; i < splitQuote.length; i++) {
            if (i % 2 == 0) {
                formattedStr = formattedStr + splitQuote[i] + "\n"
            }else{
                formattedStr = formattedStr + splitQuote[i] + ":"
            }
        }
        return formattedStr
    }

    return (
        <div className="border-l-8 border-blue-500 rounded-lg bg-base-100 w-11/12 py-8 px-12 mx-auto items-center content-center gap-10 my-10">

            {/* Maps through the quote after formatQuote is called and displays it
            on a separate line */}
            <div className="mb-4">{formatQuote(quote.quote).split('\n').map((line, index) => (
                <p key={index}>{line}</p>
            ))}</div>
            <p className="text-sm">{quote.description}</p>
            <div>
                {quote.tags.map((tag => (
                    <span>{tag}</span>
                )))}
            </div>
        </div>
    );
}