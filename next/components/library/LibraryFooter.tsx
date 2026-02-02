import SSELogoFullWhite from "./SSELogoFullWhite";

export default function LibraryFooter() {
    return(
        <div className="w-full h-[240px] bg-[linear-gradient(360deg,#474747_0%,#2C2C2C_100%)] flex justify-center items-center pb-8 z-[1] mt-[100px]">
            <div className="w-[80%] pt-[15px] flex flex-row items-center justify-between h-fit">
                <SSELogoFullWhite />
                <div className="text-white font-rethink font-normal text-lg flex flex-col gap-2 text-right">
                    <a href="#" className="hover:text-gray-300 transition-colors duration-200">Home</a>
                    <a href="#" className="hover:text-gray-300 transition-colors duration-200">Contact</a>
                    <a href="#" className="hover:text-gray-300 transition-colors duration-200">Register for an SSE Library Card</a>
                </div>
            </div>
        </div>
    )
}