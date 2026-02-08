import Image from "next/image";

export default function MentorPortal() {
    return (
        <>
            <div className="w-[80%] [&_h2]:py-4 [&_p]:py-2 [&_details]:py-2 ">
                <h2 className="italic"><Image src="/library-icons/underconstruction.png" alt="Under Construction" className="inline mr-2" width={40} height={40} />Work in Progress.</h2>
                <p>Uh oh! This section is under construction.</p>
            </div>
        </>
    );
}