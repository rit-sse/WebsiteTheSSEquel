import SSELogoFullWhite from "./SSELogoFullWhite";

export default function TopGradient() {
    return(
        <div className="w-full h-[240px] bg-[linear-gradient(360deg,#474747_0%,#2C2C2C_100%)] absolute top-0 left-0 flex justify-center pb-8 z-[-10]">
            <div className="w-[80%] pt-[15px] flex flex-row items-center h-fit">
                <SSELogoFullWhite />
                <div className="w-[2px] h-[40px] bg-white mx-5" />
                <h1 className="text-white font-rethink font-bold text-xl md:text-2xl font-serif">
                    Ryan Webb Library
                </h1>
            </div>
        </div>
    )
}