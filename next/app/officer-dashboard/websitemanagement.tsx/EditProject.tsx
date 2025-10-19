import { FC, use, useEffect, useState } from "react";

type ProjectStrucure = {
    id: number;
    title: string;
    description: string;
    leadid: number;
    progress: string;
    repoLink: string;
    contentURL: string;
    projectImage: string;
    completed: boolean;
};

const EditProjectModal: FC<{ project: ProjectStrucure | null, visible: boolean, hideModal: () => void, triggerReload: () => void }> = ({ project, visible, hideModal, triggerReload }) => {

    const [title, setTitle] = useState(project?.title);
    const [description, setDescription] = useState(project?.description);
    const [leadId, setLeadId] = useState(project?.leadid);
    const [progress, setProgress] = useState(project?.progress);
    const [repoLink, setRepoLink] = useState(project?.repoLink);
    const [contentURL, setContentURL] = useState(project?.contentURL);
    const [projectImage, setProjectImage] = useState(project?.projectImage);
    const [completed, setCompleted] = useState(project?.completed);

    useEffect(() => {
        setTitle(project?.title);
        setDescription(project?.description);
        setLeadId(project?.leadid);
        setProgress(project?.progress);
        setRepoLink(project?.repoLink);
        setContentURL(project?.contentURL);
        setProjectImage(project?.projectImage);
        setCompleted(project?.completed);
    }, [project]);
    
    let editProject = () => {
        // This might seem a bit sloppy, but it was somehow getting passed through as a string...
        let selectUserID: any = leadId;
        if (typeof selectUserID == "string" || selectUserID instanceof String) {
            selectUserID = parseInt(selectUserID.toString())
        }
        // This uses the variables made in the edit project modal
        // id uses the project.id, as it is assumed to stay constant.
        // That also goes for the contentURL
        let payload = {
            id: project?.id,
            title: title,
            description: description,
            repoLink: repoLink,
            contentURL: contentURL,
            leadid: selectUserID,
            projectImage: (projectImage == null ? "" : projectImage),
            completed: completed
        }

        console.log(JSON.stringify(payload))

        // Send a PUT request to /api/project, with the edited project information alongside appropiate headers.
        // Once done, we unload and refresh the page to get the updated projects.
        fetch("/api/project", {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(() => {
            hideModal()
            triggerReload();
        })
    }

    return (
        <div className={"absolute inset-0 w-full h-full z-50 flex justify-center items-center" + (visible ? "" : " hidden")}>
            <div className="absolute inset-0 w-full h-full bg-black/30 backdrop-blur-[10px]" onClick={(e) => { hideModal() }} />
            <div className="bg-base-100 p-6 rounded-lg shadow-lg z-50">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        editProject();
                    }}
                    className="space-y-4 w-[520px]"
                >
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            value={title ?? ""}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description ?? ""}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                            rows={4}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Lead ID</label>
                        <input
                            type="number"
                            value={leadId ?? ""}
                            onChange={(e) => setLeadId(e.target.value === "" ? (undefined as any) : Number(e.target.value))}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Progress</label>
                        <input
                            type="text"
                            value={progress ?? ""}
                            onChange={(e) => setProgress(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Repository Link</label>
                        <input
                            type="url"
                            value={repoLink ?? ""}
                            onChange={(e) => setRepoLink(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Content URL</label>
                        <input
                            type="url"
                            value={contentURL ?? ""}
                            onChange={(e) => setContentURL(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Project Image URL</label>
                        <input
                            type="url"
                            value={projectImage ?? ""}
                            onChange={(e) => setProjectImage(e.target.value)}
                            className="w-full border rounded px-3 py-2 bg-base-200"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            id="completed"
                            type="checkbox"
                            checked={!!completed}
                            onChange={(e) => setCompleted(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="completed" className="text-sm">
                            Completed
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={hideModal}
                            className="px-4 py-2 rounded border"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default EditProjectModal;