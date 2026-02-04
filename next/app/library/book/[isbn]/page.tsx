"use client"
export default async function BookPage({ params }: { params: { isbn: string } }) {

    const bookData = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/books?count=true&isbn=" + params.isbn).then(resp => resp.json());

    return (
        <div className="p-4">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-[260px]">
                    <img
                        src={`${bookData.image}`}
                        alt="Book cover"
                        className="w-full h-auto object-cover rounded shadow-lg mt-[-60px] relative"
                    />
                    <button
                        type="button"
                        className="mt-3 w-full py-2.5 px-3 rounded-md border border-gray-200 bg-white text-left flex items-center gap-2.5 cursor-pointer"
                        aria-label="ISBN Lookup"
                        onClick={() => { window.location.href = "https://isbnsearch.org/isbn/" + params.isbn; }}
                    >
                        <span className="text-gray-800">ISBN Search</span>
                    </button>
                </aside>

                <section className="flex-1 max-w-[980px]">
                    <h1 className="text-[44px] leading-[1.05] mb-1">{bookData.name}</h1>
                    <p className="mt-1 text-[18px] text-gray-900">By {bookData.authors}</p>
                    <p className="mt-2 text-gray-400">ISBN: {params.isbn}</p>

                    <div className="mt-4 text-gray-800 leading-6">
                        {bookData.description}
                    </div>

                    <div className="mt-5 text-base">
                        <div className="mb-1">
                            <strong>Affiliated Courses:</strong> <span className="ml-1">{bookData.classInterest ?? "No class specified"}</span>
                        </div>
                        <div className="mb-1">
                            <strong>ISBN:</strong> <span className="ml-1">{params.isbn}</span>
                        </div>
                        <div className="mb-1">
                            <strong>Author(s):</strong> <span className="ml-1">{bookData.authors ?? "Unknown"}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Publisher:</strong> <span className="ml-1">{bookData.publisher ?? "Unknown"}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Edition:</strong> <span className="ml-1">{bookData.edition ?? "Unknown"}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Year Published:</strong> <span className="ml-1">{bookData.yearPublished ?? "Unknown"}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Keywords:</strong> <span className="ml-1">{bookData.keyWords ?? "None"}</span>
                        </div>
                        <div className="mt-1">
                            <strong>On shelf:</strong> <span className="ml-1">{bookData.stockNumber}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
