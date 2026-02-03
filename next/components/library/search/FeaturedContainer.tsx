"use client"
type Book = {
    image: string;
    bookName: string;
    authorName: string;
    ISBN: string;
    stockNumber: number;
};

export async function FeaturedContainer({ props }: { props: { books: Book[], header: string } }) {

    function onClickBook(book: Book) {
        // Placeholder for future functionality when a book is clicked
        location.href = "/library/book/" + book.ISBN;
    }

    return (
        <div className="w-full flex flex-col items-center mt-[15px] px-2 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8">
            <h2 className="w-full text-3xl font-normal font-sans mb-6">{props.header}</h2>
            <div className="flex flex-row items-top  w-[100%] overflow-x-scroll justify-start scrollbar-hide ">
                {props.books.map((book) => (
                    <div
                        key={book.ISBN}
                        className="flex-none w-[180px] mr-4 last:mr-0 cursor-pointer"
                        onClick={() => onClickBook(book)}
                    >
                        <img
                            src={book.image}
                            alt={book.bookName}
                            className="w-full h-[220px] object-cover rounded-md shadow-sm"
                        />
                        <h3 className="mt-2 text-lg font-medium">{book.bookName}</h3>
                        <p className="text-sm text-gray-600">{book.authorName}</p>
                        <p className="text-sm text-gray-500">ISBN: {book.ISBN}</p>
                        <p className={`mt-1 text-sm font-semibold ${book.stockNumber > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {book.stockNumber > 0 ? `(${book.stockNumber}) on shelf` : 'Out of stock'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}