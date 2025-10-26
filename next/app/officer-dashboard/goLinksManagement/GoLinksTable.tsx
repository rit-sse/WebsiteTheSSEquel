import { FC, useEffect, useState } from "react";

type GoLinkStructure = {
    id: number;
    golink: string;
    url: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isPinned: boolean;
    isPublic: boolean;
};

const GoLinksTable: FC<{ isOfficer: boolean, goLinks: Array<GoLinkStructure>, goEdit: (isEditing: boolean, editData: GoLinkStructure | undefined) => void }> = ({ isOfficer, goLinks, goEdit }) => {
    return (<div>

        {goLinks.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No Go Links found.</div>
        ) : (
            <div className='w-full h-[350px] overflow-y-auto mt-[10px]'>
                <table className="min-w-full divide-y divide-base-200">
                    <thead className="bg-base-50">
                        <tr>
                            <th className="px-4 py-2 w-[10px] text-left text-xs font-medium text-base-400 uppercase tracking-wider">#</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Go Link</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">URL</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Pinned</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Unlisted</th>
                            <th className="px-4 py-2 w-32 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Edit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                        {goLinks.map((golink, idx) => (
                            <tr key={golink.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-base-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{golink.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{golink.golink}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{golink.url}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{golink.isPinned ? "✔" : "✖"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{!golink.isPublic ? "✔" : "✖"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">
                                    <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600" onClick={() => { goEdit(true, golink) }}>
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>)
}

export default GoLinksTable;