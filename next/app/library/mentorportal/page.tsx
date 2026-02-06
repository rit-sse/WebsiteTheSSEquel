

export default function MentorPortal() {
    return (
        <>
            <div className="w-[80%] [&_h2]:py-4 [&_p]:py-2 [&_details]:py-2 ">
                <h2 className="italic"><img src="/library-icons/information.png" className="inline mr-2"/>Welcome to the Mentor Portal!</h2>
                <p>Note: This is an area usually intended for mentors to edit and add books. If someone wants to check out a book, please use the mentor computer !</p>
                <span className="[&_a]:ml-[4px]">Quick Links:
                    <a href="/library/mentorportal/editbook" className="underline text-blue-500">Edit Book</a>
                    <a href="/library/mentorportal/addbook" className="underline text-blue-500">Add Book</a>
                </span>
                <details className="" open>
                    <summary className="border-b text-[20px] cursor-pointer">Guide: Adding a book</summary>
                    <ol type="1" className="list-decimal pl-5 [&_li]:py-1">
                        <li>Go to <a href="/library/mentor/addbook" className="underline text-blue-500">Add Book</a></li>
                        <li><b>Important:</b> See if the book exists first!</li>
                        <li>S</li>
                    </ol>
                </details>  
            </div>
        </>
    );
}