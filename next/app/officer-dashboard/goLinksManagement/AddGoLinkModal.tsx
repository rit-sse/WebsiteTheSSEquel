'use client';
import { link } from 'fs';
import { fetchData } from 'next-auth/client/_utils';
import React from 'react';

const AddGoLinkModal: React.FC<{ visible?: boolean, modalVisiblecallback: Function }> = ({ visible = false, modalVisiblecallback }) => {

    const [linkName, setLinkName] = React.useState("");
    const [linkURL, setLinkURL] = React.useState("");
    const [description, setDescription] = React.useState("");
    const [officerOnly, setOfficerOnly] = React.useState(false);
    const [pinned, setPinned] = React.useState(false);

    const hideModal = () => {
        setLinkName("");
        setLinkURL("");
        setDescription("");
        setOfficerOnly(false);
        setPinned(false);
        modalVisiblecallback(false);
    }

    const handleCreate = async () => {
        try {
            const response = await fetch("/api/golinks", {
                method: "POST",
                body: JSON.stringify({
                    golink: linkName,
                    url: linkURL,
                    description: description,
                    isPinned: pinned,
                    isPublic: !officerOnly, // If it is officer, it is not public
                }),
            });

            if (response.ok) {
                hideModal();
            }
        } catch (error) { 
            console.error("Error creating GoLink:", error);
        }
    };

    return (
        <div className={"absolute inset-0 w-full h-full z-50 flex justify-center items-center" + (visible ? "" : " hidden")}>
            <div className="absolute inset-0 w-full h-full bg-black/30 backdrop-blur-[10px]" onClick={(e) => { hideModal() }} />
            <div className="bg-white p-6 rounded-lg shadow-lg z-50">
                <h2 className="text-xl font-bold mb-4">Add Go Link</h2>
                <form className="flex flex-col gap-4 w-[300px]">
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="linkName">Link Name</label>
                        <input className="w-full border border-gray-300 rounded px-3 py-2" type="text" id="linkName" name="linkName" value={linkName} onChange={(e) => setLinkName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="linkURL">Link URL</label>
                        <input className="w-full border border-gray-300 rounded px-3 py-2" type="text" id="linkURL" name="linkURL" value={linkURL} onChange={(e) => setLinkURL(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
                        <textarea className="w-full border border-gray-300 rounded px-3 py-2" id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="officerOnly" name="officerOnly" checked={officerOnly} onChange={(e) => setOfficerOnly(e.target.checked)} />
                        <label htmlFor="officerOnly" className="text-sm">Officer Only</label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="pinned" name="pinned" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
                        <label htmlFor="pinned" className="text-sm">Pinned</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={hideModal}>Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark" onClick={handleCreate}>Add Link</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddGoLinkModal;