import React, { ChangeEvent, FormEvent } from "react";

// The arguments used for ProjectModalInput classes.
interface ProjectModalInputArguments {
    label: string,
    setTextState: Function,
    isRichText?: boolean,
    presetValue?: string
}

/**
 * label is used to "name" the input. It gets located right next to the input
 * setTextState is the useState that the input accepts. On any change of the value, this fires the set state with the value in the input
 * isRichText makes the input multi-line or not. Most elements use single-line, so its defaulted to false.
 * presetValue can be used for the variable effected by useState, such as [presetValue, setValue] = useState("").
 */
const ProjectModalInput = (
    {
        label,
        setTextState,
        isRichText = false,
        presetValue = ""
    }: ProjectModalInputArguments
) => {

    // Any onChange events fire this. The setTextSTate is fired with target's (the element) value.
    const changeValue_rich = (evt: FormEvent<HTMLTextAreaElement>) => {
        let target = evt.target as HTMLTextAreaElement;
        setTextState(target.value);
    }

    // Any onChange events fire this. The setTextSTate is fired with target's (the element) value.
    const changeValue_input = (evt: FormEvent<HTMLInputElement>) => {
        let target = evt.target as HTMLInputElement;
        setTextState(target.value);
    }

    return(
        // Most componenets this was designed for was made to fill up horizontally, modify as you wish.
        <div className="w-full">
            {/* The Label of the Input */}
            <p>{label}</p>
            {/* The actual input. If isRichText, the top one is used, otherwise, the bottom will be used */}
            {   
                isRichText ?
                <textarea className="w-full bg-base-200" value={presetValue} onChange={changeValue_rich}/>
                :
                <input className="w-full bg-base-200" value={presetValue} onChange={changeValue_input}/>
            }
        </div>
    )
}

export default ProjectModalInput;