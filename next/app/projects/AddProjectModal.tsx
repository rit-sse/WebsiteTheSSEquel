import React, { useEffect, useState } from "react";
import ProjectModalInput from "./ProjectModalComponents/ProjectModalInput";
import ProjectModalDropdown from "./ProjectModalComponents/ProjectModalDropdown";
import ProjectModalCheckbox from "./ProjectModalComponents/ProjectModalCheckbox";

/**
 * Creates the AddProjectModal. This is where Officers or other authorized users can create projects
 * @param enabled If the modal is enabled
 * @param setEnabled The useState that is associated with the enabled value. 
 * @returns AddProjectModal with any adjustments
 */
const AddProjectModal = ({
                            enabled,
                            setEnabled,
                            reloadOnAdd,
                            reloadFunction
                        }: 
                        {
                            enabled: boolean,
                            setEnabled: Function,
                            reloadOnAdd?: boolean,
                            reloadFunction?: Function
                        }) => {

    // useStates for the text inputs
    /**
     * I hope this is pretty self-explainatory. Though if the Project Model changes in the near future, reflect it with "model Project" in schema.prisma
     */
    const [titleText, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectUser, setUser] = useState(1);
    const [progress, setProgress] = useState("");
    const [repoLink, setRepoLink] = useState("");
    const [contentURL, setContentURL] = useState("");
    const [projectImage, setProjectImage] = useState("");
    const [completed, setCompleted] = useState(false);

    const [users, setUsers] = useState([]);
    // Get all the users
    useEffect(() => {
        fetch("/api/user") // Fetch users
        .then(resp => resp.json()) // JSON parse it.
        .then((resp) => {
            setUsers(resp) // Set our user array.
        })
    }, [])

    // This sets the modal visiblity to false. setEnabled a function passed through as setAddProjectModal in ProjectModal.tsx
    let exit = () => {
        setEnabled(false)
    }

    // Uploading function whwen the user is done.
    let upload = () => {
        // Lets check for the fields if they are valid. If they are not, they get pushed to invalidFields
        // We do not need to check selectUser as there is a default (1)
        // We are trimming these fields to prevent white-space from succeeding.
        let invalidFields = [];
        if(titleText.trim() == "")
            invalidFields.push("title");
        if(description.trim() == "")
            invalidFields.push("description");
        if(progress.trim() == "")
            invalidFields.push("progress");

        // If invalidFields captured any cases, then we know something went wrong, alert the user, and join the missing fields into a string.
        if(invalidFields.length > 0) {
            // Ok this looks REALLY weird but what it does is combined 3 strings together.
            // First substring and the last substring are modified so that when we join invalidFields, it'll show up as a proper list.
            // a.k.a Each field will be split with a "- (invalid field)" without it going on the same line as the first and last substrings.
            alert("The required fields: \n\- " + invalidFields.join("\n\- ") + " \nare empty!")
            return;
        }

        // This might seem a bit sloppy, but it was somehow getting passed through as a string...
        let selectUserID: any = selectUser;
        if(typeof selectUserID == "string" || selectUserID instanceof String) {
            selectUserID = parseInt(selectUserID.toString())
        }
        // The payload. This uses all the variables set before.
        // TODO: Make sure there are checks in place so there are no values missing.
        let payload = {
            "title": titleText,
            "description": description,
            "leadid": selectUserID, 
            "progress": progress,
            "repoLink": repoLink,
            "contentURL": contentURL,
            "projectImage": projectImage,
            "completed": completed
        }
        // Make a POST request to /api/project with the payload, alongside appropiate headers. Once done, exit the Project Modal.
        // TODO: Make a message alerting the user that the process started, this prevents the user from spamming that Add button.
        fetch("/api/project", {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
                "Content-Type": "application/json"
            }
        }).then(() => {
            exit();
            if(reloadOnAdd)
                location.reload()
            else {
                setTitle("");
                setDescription("");
                setUser(1);
                setProgress("");
                setRepoLink("");
                setContentURL("");
                setProjectImage("");
                setCompleted(false);
                if(reloadFunction)
                    reloadFunction();
            }
        })
    }

    return(
        <div>
            {/* Check if the Add Project Modal is enabled or not. */}
            { enabled ? 
            <div className="fixed top-[0px] left-[0px] w-[100%] h-[100%] z-[100]
                                flex items-center justify-center">
                    {/* The black backdrop. */}
                    <div className="absolute top-0 left-0 w-[100%] h-[100%] backdrop-blur-[15px] bg-black/25" onClick={exit}></div>

                    {/* Actual Modal Container */}
                    <div className="relative w-[900px] h-[800px] z-[50] bg-base-100 rounded-lg overflow-hidden
                                    flex justify-center items-center">
                        {/* This is the top accent bar. */}
                        <div className="absolute top-0 left-o w-[100%] h-[15px] bg-accent rounded-t-lg">
                        </div>
                        {/* Actual Modal Content */}
                        <div className="flex w-[90%] h-[90%] flex-col">
                            
                             {/* This is the "top bar" of the Modal. Contains the project title text, settings (if the user is an officer), and the exit button. */}
                             <div className="flex items-center justify-between">
                                {/* Title of Modal */}
                                <h3 className="text-primar h-[10%]y">Add Project</h3>

                                {/* Exit Button Container */}
                                <div className="flex justify-center h-full items-center">
                                    {/* Exit Button */}
                                    <svg width="30px" height="30px" viewBox="-0.5 0 25 25" className="fill-primary cursor-pointer" onClick={exit} xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 21.32L21 3.32001" className="stroke-primary" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M3 3.32001L21 21.32" className="stroke-primary" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>

                                </div>
                            </div>
                            {/* Actual content of the Modal */}
                            <div className="flex h-[90%] w-[100%] flex-col items-center overflow-y-scroll">
                                {/* These ProjectModalInputs are associated to their respective variables. */}
                                <ProjectModalInput label="Title *" setTextState={setTitle} presetValue={titleText}/>
                                <ProjectModalInput label="Description *" setTextState={setDescription} isRichText={true} presetValue={description}/>
                                <ProjectModalDropdown text={"Select Lead"} setState={setUser} options={users} />
                                <ProjectModalInput label="Progress *" setTextState={setProgress}  presetValue={progress}/>
                                <ProjectModalInput label="Repository Link" setTextState={setRepoLink}  presetValue={repoLink}/>
                                <ProjectModalInput label="Content URL" setTextState={setContentURL}  presetValue={contentURL}/>
                                <ProjectModalInput label="Project Image URL" setTextState={setProjectImage}  presetValue={projectImage}/>
                                <ProjectModalCheckbox label="Completed" checked={completed} setChecked={setCompleted}/>
                                {/* 
                                    Add/Cancel button container 
                                    Creates spacing at the top, and it uses a flex to shove all the buttons to the right.
                                */}
                                <div className="mt-[20px] flex w-full justify-end">
                                    {/* Sppoky div! Don't worry, this just groups the buttons together. */}
                                    <div className="">
                                        {/* Add button */}
                                        <button className="bg-success text-black p-[12px] px-[25px] rounded-lg" onClick={upload}>Add</button>
                                        {/* Cancel button */}
                                        <button className="bg-base-200 p-[10px] px-[25px] rounded-lg ml-[15px]" onClick={exit}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
            : // If the add project modal enabled is not true (aka no events made it open), return something empty.
            undefined}
        </div>
    )
}
export default AddProjectModal;