"use client";
import Image from "next/image";
import { Book } from "../Book";

export default function GeneralBookContainer({ book }: { book: Book }) {
  const coverClasses =
    "w-[100px] h-[130px] rounded-md shadow-sm bg-gray-200 flex items-center justify-center text-center text-xs font-medium text-gray-500 px-3";

  function onClickBook() {
    location.href = "/library/catalog/" + book.ISBN;
  }

  return (
    <div
      key={book.ISBN}
      className="flex w-[100%] mr-4 last:mr-0 cursor-pointer z-5 mt-4"
      onClick={onClickBook}
    >
      {book.image ? (
        <Image
          src={book.image}
          alt={book.name}
          className="w-[100px] h-[130px] object-cover rounded-md shadow-sm bg-gray-200"
          width={180}
          height={220}
        />
      ) : (
        <div className={coverClasses}>No cover available</div>
      )}
      <div className="w-full ml-5">
        <h3 className="mt-2 text-lg font-medium truncate">{book.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-1">{book.authors}</p>
        <p className="text-sm text-gray-500">ISBN: {book.ISBN}</p>
      </div>
    </div>
  );
}
