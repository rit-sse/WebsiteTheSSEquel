import SSELogoFullWhite from "./SSELogoFullWhite";

export default function LibraryFooter() {
    return(
        <div className="w-full h-[240px] bg-[linear-gradient(360deg,#474747_0%,#2C2C2C_100%)] flex justify-center items-center pb-8 z-[1] mt-[100px]">
            <div className="w-[80%] pt-[15px] flex flex-col items-center justify-between h-fit md:flex-row">
                <SSELogoFullWhite />
                <div className="text-white font-rethink font-normal text-lg flex flex-col gap-2 text-center mt-[15px] md:text-right md:mt-0">
                    <a href="/library" className="hover:text-gray-300 transition-colors duration-200">Home</a>
                    <a href="/about/leadership" className="hover:text-gray-300 transition-colors duration-200">Leadership</a>
                </div>
            </div>
        </div>
    )
}