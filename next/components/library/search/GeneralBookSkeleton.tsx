export default function GeneralBookContainerSkeleton() {
    return (<div
        className="flex w-[100%] mr-4 last:mr-0 cursor-pointer z-5 mt-4"
    >
        <div
            className="w-[100px] h-[130px] object-cover rounded-md shadow-sm bg-gray-200"
        />
        <div className="w-full ml-5">
            <div className="bg-gray-300 h-6 w-3/4 mb-2 rounded" />
            <div className="bg-gray-300 h-4 w-1/2 mb-2 rounded" />
            <div className="bg-gray-300 h-4 w-1/3 rounded" />
        </div>
    </div>)
}