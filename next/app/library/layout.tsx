import LibraryFooter from "@/components/library/LibraryFooter";
import TopGradient from "@/components/library/TopGradient";
import { Inter, Rethink_Sans, PT_Serif } from 'next/font/google';


const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

const rethinkSans = Rethink_Sans({
    subsets: ['latin'],
    variable: '--font-rethink',
});

const ptSerif = PT_Serif({
    subsets: ['latin'],
    weight: ['400', '700'],
    variable: '--font-pt-serif',
});

export default function LibraryLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`flex flex-col items-center bg-white min-h-fit w-screen z-[20]`}>
            <div className="h-[250px]" />
            {children}
            <TopGradient />
            <LibraryFooter />
        </div>
    );
}