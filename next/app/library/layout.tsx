"use client"
import LibraryFooter from "@/components/library/LibraryFooter";
import TopGradient from "@/components/library/TopGradient";

export default function LibraryLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col items-center bg-white min-h-screen w-screen z-[20]`}>
            <div className="h-[250px]" />
            {children}
            <TopGradient />
            <LibraryFooter />
        </div>
    );
}