"use client"
import { useRef, useState } from "react";

export default function EditBook() {

    const [isbnInput, setIsbnInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");
    const [finishedEditing, setFinishedEditing] = useState(false);
    const inputFile = useRef<HTMLInputElement>(null);
    const [pickedImage, setPickedImage] = useState<string>("");
    const [showCustomImage, setShowCustomImage] = useState(false);

    const fetchISBN = () => {
        setPickedImage("");
        setFinishedEditing(false);
        setLoading(true);
        setLoaded(false);
        setError("");
        setShowCustomImage(false);
        fetch("/api/library/book?isbn=" + isbnInput).then((res) => res.json()).then((data) => {
            setLoading(false);
            if (data.error) {
                setError(data.error);
                return;
            }
            setBookData(data);
            setLoaded(true);
        })
    }

    const [bookData, setBookData] = useState<{
        ISBN: string;
        name: string;
        authors: string;
        image: string;
        description: string;
        publisher: string;
        edition: string;
        keyWords: string;
        classInterest: string;
        yearPublished: number;
    }>({
        ISBN: "",
        name: "",
        authors: "",
        image: "",
        description: "",
        publisher: "",
        edition: "",
        keyWords: "",
        classInterest: "",
        yearPublished: 0,
    });

    const editBook = (field: string, value: string) => {
        setBookData({
            ...bookData,
            [field]: (field == "yearPublished") ? parseInt(value) : value,
        });
    }

    const finishEditing = () => {
        setFinishedEditing(false);
        fetch("/api/library/book", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(bookData)
        }).then((res) => res.json()).then((data) => {
            if (data.error) {
                setError(data.error);
                return;
            }
            if (pickedImage && pickedImage.startsWith("data:")) {
                fetch("/api/library/uploadImage", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ISBN: bookData.ISBN,
                        imageData: pickedImage,
                    })
                }).then((res) => res.json()).then((data) => {
                    if (data.error) {
                        setError(data.error);
                        return;
                    }
                    setBookData({
                        ...bookData,
                        image: data.imageUrl,
                    });
                    setShowCustomImage(false);
                    setFinishedEditing(true);
                })
            } else {
                setBookData(data);
                setLoaded(true);
                setFinishedEditing(true);
            }
        })

    }

    const inputHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            fetchISBN();
        } else {
            setIsbnInput((e.target as HTMLInputElement).value);
        }
    }

    const onImageRequestClick = () => {
        inputFile.current?.click();
    }

    const readImage = () => {
        if (!inputFile.current?.files?.[0]) return;
        const reader = new FileReader();
        reader.addEventListener('load', (event) => {
            setPickedImage(event.target?.result as string);
            setShowCustomImage(true);
        });
        reader.readAsDataURL(inputFile.current?.files?.[0]!);
    }

    return (
        <>
            <div className="flex justify-center items-center w-[100%]">
                <input className="w-[80%] max-w-[500px]" placeholder="Input ISBN" value={isbnInput} onChange={(e) => setIsbnInput(e.target.value)} onKeyUp={inputHandler} />
                <img src="/library-icons/explore.png" alt="Search" className="w-[30px] h-[30px] ml-2 cursor-pointer" onClick={fetchISBN} />
            </div>
            {
                error ? (
                    <div className="w-full h-[50px] flex justify-center items-center text-red-500">
                        <img src="/library-icons/error.png" alt="Error" className="w-[20px] h-[20px] mr-2" />

                        <span>{error}</span>
                    </div>
                ) : null
            }
            {
                loading ? (
                    <div className="w-full h-[200px] flex justify-center items-center">
                        <span>Loading...</span>
                    </div>
                ) : null
            }
            {
                loaded ? (
                    <div className="p-4 w-fit min-w-[300px] md:min-w-[800px] mx-auto mt-4 border border-gray-300 rounded-md flex [&_input]:w-full ">
                        <input type="file" id="fileUpload" ref={inputFile} className="hidden" onChange={readImage} />
                        <div className="flex flex-col items-center pointer" onClick={onImageRequestClick}>
                            {bookData.image ? (
                                <img src={showCustomImage ? pickedImage : bookData.image + "?" + Date.now()} alt={bookData.name} className="mt-4 w-[200px] h-auto" />
                            ) : null}
                            <div className="mt-3 flex items-center cursor-pointer">
                                <img src="/library-icons/openfile.png" alt="Search" className="w-[25px] h-[25px] ml-2 cursor-pointer" />
                                <p className="pl-2 text-blue-600 underline hover:text-blue-800">Change Image</p>
                            </div>
                        </div>
                        <div className="[&_div]:flex  [&_div]:items-center [&_div]:mt-2 [&_input]:py-[3px] [&_input]:ml-3 pl-5 w-[80%]">
                            <div><strong>Name:</strong> <input value={bookData.name} onChange={(e) => editBook("name", e.target.value)} /></div>
                            <div><strong>Authors:</strong> <input value={bookData.authors} onChange={(e) => editBook("authors", e.target.value)} /></div>
                            <div><strong>ISBN:</strong> <input value={bookData.ISBN} readOnly type="text" className="bg-gray-300" /></div>
                            <div><strong>Publisher:</strong> <input value={bookData.publisher} onChange={(e) => editBook("publisher", e.target.value)} /></div>
                            <div><strong>Edition:</strong> <input value={bookData.edition} onChange={(e) => editBook("edition", e.target.value)} /></div>
                            <div><strong>Year Published:</strong> <input value={bookData.yearPublished} type="number" onChange={(e) => editBook("yearPublished", e.target.value)} /></div>
                            <div><strong>Description:</strong> <input value={bookData.description} onChange={(e) => editBook("description", e.target.value)} /></div>
                            <div><strong>Keywords:</strong> <input value={bookData.keyWords} onChange={(e) => editBook("keyWords", e.target.value)} /></div>
                            <div><strong>Class Interest:</strong> <input value={bookData.classInterest} onChange={(e) => editBook("classInterest", e.target.value)} /></div>
                            <div className="flex justify-end [&_button]:ml-3 [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-md  mt-4">
                                <button className="from-green-600 to-green-700 bg-gradient-to-t text-white font-bold border border-solid border-black hover:from-green-500 hover:to-green-600" onClick={finishEditing}>Apply</button>
                                <button className="from-red-600 to-red-700 bg-gradient-to-t text-white font-bold border border-solid border-black hover:from-red-500 hover:to-red-600" onClick={() => {setLoaded(false)}}>Cancel</button>
                            </div>
                        </div>

                    </div>
                ) : null
            }
            {
                finishedEditing ? (
                    <div className="w-[40%] h-[60px] flex justify-center items-center text-black-500 mt-4 bg-green-300 border-2 border-green-500 border-dashed rounded">
                        <img src="/library-icons/checkmark.png" alt="Success" className="w-[20px] h-[20px] mr-2" />
                        <span>Book updated successfully!</span>
                    </div>
                ) : null
            }
        </>
    );
}