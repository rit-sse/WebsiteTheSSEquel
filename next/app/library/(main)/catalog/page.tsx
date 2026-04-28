"use client"; // This was needed to clear cache issues with NextJS
import process from "process";
import { useState, useEffect } from "react";
import GeneralBookContainer from "@/components/library/search/GeneralBookContainer";
import GeneralBookContainerSkeleton from "@/components/library/search/GeneralBookSkeleton";
import { Book } from "@/components/library/Book";

export default function LibraryCatalog() {
  // const categories = await fetch((process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") + "/api/library/categories").then(resp => resp.json());
  // const authLevel = await getAuth();

  const [catalogue, setCatalogue] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogue() {
      try {
        const resp = await fetch(
          (process.env.INTERNAL_API_URL ? process.env.INTERNAL_API_URL : "") +
            "/api/library/books?count=true"
        );
        const catalogueData = await resp.json();

        if (cancelled) {
          return;
        }

        if (!resp.ok) {
          setCatalogue([]);
          setError("Unable to load the library catalog right now.");
          setLoaded(true);
          return;
        }

        setCatalogue(Array.isArray(catalogueData) ? catalogueData : []);
        setError(
          Array.isArray(catalogueData)
            ? null
            : "Unable to load the library catalog right now."
        );
      } catch {
        if (cancelled) {
          return;
        }

        setCatalogue([]);
        setError("Unable to load the library catalog right now.");
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadCatalogue();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-[80%] h-full relative flex flex-col md:flex-row flex-wrap justify-between pt-5">
      {loaded && error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loaded && catalogue.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No library books are available yet.
        </p>
      ) : loaded
        ? catalogue.map((book) => (
            <GeneralBookContainer key={book.ISBN} book={book} />
          ))
        : Array.from({ length: 15 }).map((_, index) => (
            <GeneralBookContainerSkeleton key={index} />
          ))}
    </div>
  );
}
