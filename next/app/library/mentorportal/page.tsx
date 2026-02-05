

export default function MentorPortal() {
    return (
        <>
            <h2>Welcome to the Mentor Portal!</h2>
            <p>Note: This is an area usually intended for mentors to edit and add books. If someone wants to check out a book, please use the mentor computer !</p>
            <span className="[&_a]:ml-[4px]">Quick Links:
                <a href="/library/mentorportal/editbook" className="underline text-blue-500">Edit Book</a>
                <a href="/library/mentorportal/addbook" className="underline text-blue-500">Add Book</a>
            </span>
        </>
    );
}