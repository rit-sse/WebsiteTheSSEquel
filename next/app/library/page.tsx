
import LibraryQuickLink from "@/components/library/LibraryQuickButton";
import { FeaturedContainer } from "@/components/library/search/FeaturedContainer";

export default function LibraryHome() {
    return (
        <div className="w-[80%] relative flex items-center flex-col bg-white">
            <input className="z-[2] top-[-40px] relative w-[100%] text-[25px] border-none py-[22px] px-[20px] rounded-lg shadow-2xl" placeholder="Search our collection (Course-Code, ISBN, Name, etc...)" />
            <FeaturedContainer props={{
                books: [
                    {
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },{
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },{
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },
                ],
                header: "Software Engineering"
            }} />
            <FeaturedContainer props={{
                books: [
                    {
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },{
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },{
                        image: "https://m.media-amazon.com/images/I/71ctQa73Z4L._SL1464_.jpg",
                        bookName: "Rapid Development: Taming Wild Software Schedules",
                        authorName: "Steve McConnell",
                        ISBN: "978-1556159006",
                        stockNumber: 3
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/81IGFC6oFmL._SL1500_.jpg",
                        bookName: "Design Patterns: Elements of Reusable Object-Oriented Software",
                        authorName: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
                        ISBN: "978-0201633610",
                        stockNumber: 2
                    },
                    {
                        image: "https://m.media-amazon.com/images/I/910O9hrStjL._SL1500_.jpg",
                        bookName: "Software Project Survival Guide",
                        authorName: "Steve McConnell",
                        ISBN: "978-1572316218",
                        stockNumber: 3
                    },
                ],
                header: "Computer Science"
            }} />
            <div className="w-[100%] md:w-[60%] grid grid-cols-2 text-center gap-6">
                <LibraryQuickLink props={{label: "Advanced Search", link: "#"}} />
                <LibraryQuickLink props={{label: "Browse All Books", link: "#"}} />
                <LibraryQuickLink props={{label: "View Books by Keywords", link: "#"}} />
                <LibraryQuickLink props={{label: "Textbook Donations", link: "/library/donations"}} />
            </div>
        </div>
    );
}