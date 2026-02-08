import Image from "next/image"

export default function GeneralBookContainer({ book }: { book: any }) {
    return (<div
        key={book.ISBN}
        className="flex w-[100%] mr-4 last:mr-0 cursor-pointer z-5 mt-4"
    >
        <Image
            src={book.image}
            alt={book.name}
            className="w-[100px] h-[130px] object-cover rounded-md shadow-sm bg-gray-200"
            width={180}
            height={220}
        />
        <div className="w-full ml-5">
            <h3 className="mt-2 text-lg font-medium">{book.name}</h3>
            <p className="text-sm text-gray-600">{book.authors}</p>
            <p className="text-sm text-gray-500">ISBN: {book.ISBN}</p>
        </div>
    </div>)
}