import Link from "next/link";


export const CTAButton: React.FC<{ href: string, text: string }> = ({ href, text }) => (
    <Link
        href={href}
        className=" min-w-[9rem] rounded-2xl p-px bg-gradient-to-tl from-emerald-400 to-sky-400 active:scale-95 transition-all hover:shadow-radial-lg hover:shadow-[#113D40]"
    >
        <div className="font-medium bg-slate-850 hover:bg-gradient-to-tl hover:from-emerald-400 hover:to-sky-400 hover:text-slate-950 p-4 rounded-[calc(1.2rem-4px)] transition-all">
            {text}
        </div>
    </Link>
);