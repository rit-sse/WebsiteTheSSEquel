export default function GeneralBookContainerSkeleton() {
    return (<div
        className="w-[180px] mr-4 last:mr-0 cursor-pointer z-5 my-2"
    >
        <div
            className="w-full h-[240px] object-cover rounded-md shadow-sm animate-pulse bg-gray-300"
        />
        <div className="mt-2 w-[100%] h-[20px] bg-gray-200 mt-2" />
        <div className="w-[80%] h-[16px] bg-gray-200 mt-2" />
        <div className="w-[80%] h-[16px] bg-gray-200 mt-2" />

    </div>)
}