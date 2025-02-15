import React from "react";

interface ProjectModalInputArguments {
    label: string,
    setTextState: Function,
    isRichText?: boolean
}

const ProjectModalInput = (
    {
        label,
        setTextState,
        isRichText = false
    }: ProjectModalInputArguments
) => {

    return(
        <div className="w-full">
            <p>{label}</p>
            {
                isRichText ?
                <textarea className="w-full" />
                :
                <input className="w-full"/>
            }
        </div>
    )
}

export default ProjectModalInput;