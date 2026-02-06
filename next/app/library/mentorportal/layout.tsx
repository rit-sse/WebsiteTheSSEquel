"use client"

export default function LibraryLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col items-center bg-white min-h-screen w-screen z-[20] text-black`}>

            <div className=" w-full">
                <h1 className="text-3xl font-semibold mb-4 text-white px-5 py-4 from-blue-950 to-blue-800 bg-gradient-to-l">SSE Library System</h1>
                <div className="[&_a]:mr-3 flex flex-row justify-between bg-white px-5 pb-4">
                    <div>
                        <a href="/library/mentorportal" className="underline text-blue-500">Dashboard</a>
                        <a href="/library/mentorportal/editbook" className="underline text-blue-500">Edit Book</a>
                        <a href="/library/mentorportal/addbook" className="underline text-blue-500">Add Book</a>
                        <a href="/library/mentorportal/circulation" className="underline text-blue-500">Circulation</a>
                    </div>
                    <a href="/library" className="underline text-blue-500">Back to Library</a>
                </div>

            </div>
            {children}
        </div>
    );
}