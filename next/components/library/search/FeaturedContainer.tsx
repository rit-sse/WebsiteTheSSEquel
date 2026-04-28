"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Book } from "../Book";

export function FeaturedContainer({
  props,
}: {
  props: { books: Book[]; header: string };
}) {
  const books = Array.isArray(props.books) ? props.books : [];
  const router = useRouter();
  const coverClasses =
    "w-full h-[220px] rounded-md shadow-sm bg-gray-200 flex items-center justify-center text-center text-sm font-medium text-gray-500 px-4";

  function onClickBook(book: Book) {
    // Placeholder for future functionality when a book is clicked
    router.push("/library/catalog/" + book.ISBN);
  }

  return (
    <div className="w-full flex flex-col items-center mt-[15px] px-2 md:px-4 lg:px-6 ">
      <h2 className="w-full text-3xl font-normal font-sans mb-6">
        {props.header}
      </h2>
      <div className="flex flex-row items-top  w-[100%] overflow-x-scroll justify-start scrollbar-hide">
        {books.map((book) => (
          <div
            key={book.ISBN}
            className="flex-none w-[180px] mr-4 last:mr-0 cursor-pointer z-5"
            onClick={() => onClickBook(book)}
          >
            {book.image ? (
              <Image
                src={book.image}
                alt={book.name}
                className="w-full h-[220px] object-cover rounded-md shadow-sm bg-gray-200"
                width={180}
                height={220}
              />
            ) : (
              <div className={coverClasses}>No cover available</div>
            )}
            <h3 className="mt-2 text-lg font-medium truncate">{book.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">{book.authors}</p>
            <p className="text-sm text-gray-500">ISBN: {book.ISBN}</p>
            <p
              className={`mt-1 text-sm font-semibold ${book.stockNumber > 0 ? "text-green-600" : "text-red-600"}`}
            >
              {book.stockNumber > 0
                ? `(${book.stockNumber}) on shelf`
                : "Out of stock"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
