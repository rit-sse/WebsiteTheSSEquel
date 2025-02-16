import React, { ChangeEvent, FormEvent } from "react";

interface ProjectModalInputArguments {
    label: string,
    setTextState: Function,
    isRichText?: boolean,
    presetValue?: string
}

const ProjectModalInput = (
    {
        label,
        setTextState,
        isRichText = false,
        presetValue = ""
    }: ProjectModalInputArguments
) => {

    const changeValue = (evt: FormEvent<HTMLTextAreaElement> | FormEvent<HTMLInputElement>) => {
        setTextState(evt.currentTarget.value)
    }

    return(
        <div className="w-full">
            <p>{label}</p>
            {   
                isRichText ?
                <textarea className="w-full bg-base-200" value={presetValue} onInput={changeValue}/>
                :
                <input className="w-full bg-base-200" value={presetValue} onInput={changeValue}/>
            }
        </div>
    )
}

export default ProjectModalInput;