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

const GoLinksTable: FC<{ isOfficer: boolean, goLinks: Array<GoLinkStructure> }> = ({ isOfficer, goLinks }) => {
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
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Pinned</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Public</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Created At</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-base-400 uppercase tracking-wider">Updated At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-base-200">
                        {goLinks.map((golink, idx) => (
                            <tr key={golink.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-base-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-base-400">{golink.id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>)
}

export default GoLinksTable;