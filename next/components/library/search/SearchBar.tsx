"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

  function gotoSearch() {
    router.push("/library/search?query=" + encodeURIComponent(searchInput));
  }

  return (
    <input
      className="z-[2] top-[-40px] relative w-[100%] text-[25px] border-none py-[22px] px-[20px] rounded-lg shadow-2xl"
      placeholder="Search our collection (Course-Code, ISBN, Name, etc...)"
      value={searchInput}
      onChange={(e) => setSearchInput(e.target.value)}
      onKeyUp={(e) => (e.key == "Enter" ? gotoSearch() : null)}
    />
  );
}
