"use client"
import { useState, useEffect } from "react";
import CategoryRow from "@/components/library/mentorportal/category";
import NewCategory from "@/components/library/mentorportal/newcategory";
import Image from "next/image";

export default function MentorPortal() {

    const [categories, setCategories] = useState<{ [key: string]: any }>({});
    const [adding, setAdding] = useState(false);
    const [finishedLoading, setFinishedLoading] = useState(false);

    useEffect(() => {
        fetch("/api/library/categories?simple=true").then(res => res.json()).then(data => {
            setCategories(data);
            console.log(data)
            setFinishedLoading(true);
        });
    }, [])

    return (
        <>
            <div className="w-[100%] px-5 ">
                <h2 className="italic"><Image src="/library-icons/category.png" alt="Category" className="inline mr-2" width={20} height={20} />Categories</h2>
                <table className="w-full mt-2 border [&_td]:border [&_td]:px-4">
                    <tbody>
                        <tr className="bg-gray-200">
                            <td>ID</td>
                            <td>Name</td>
                            <td>ISBNs</td>
                            <td className="w-fit">Modify</td>
                        </tr>
                        {Object.entries(categories).map(([categoryName, category]) => (
                            <CategoryRow key={categoryName} category={category} />
                        ))}
                        {adding && <NewCategory />}
                    </tbody>
                </table>
                <p className="w-full text-center block">{finishedLoading ? "" : "Loading..."}</p>
                <a className="underline text-blue-500 w-full text-right block my-3 cursor-pointer" onClick={() => setAdding(true)}>+ Create new category</a>
            </div>
        </>
    );
}