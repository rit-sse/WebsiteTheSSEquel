import Link from "next/link";


export const CTAButton: React.FC<{ href: string, text: string }> = ({ href, text }) => (
    <Link
        href={href}
        className="
            inline-block rounded-xl p-0.5 
            text-base-100 bg-gradient-to-br from-primary to-secondary hover:from-base-content hover:to-secondary
            hover:shadow-radial-lg hover:shadow-primary/30
            active:scale-95 transition-all
        "
    >
        <div className="
            block rounded-[10px] px-5 py-3 font-medium 
            hover:bg-gradient-to-br hover:from-base-100 hover:to-base-100 hover:text-base-content transition-all
        ">
            {text}
        </div>
    </Link>
);