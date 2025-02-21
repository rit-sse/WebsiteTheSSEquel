import React, { ChangeEvent } from "react";

interface ProjectModalDropdownArguments {
    text: string,
    setState: Function,
    options: {id: number, name: string}[],
    select?: string
}

const ProjectModalDropdown = ({text = "", setState, options, select = ""}: ProjectModalDropdownArguments) => {
    function changeValue(element: ChangeEvent<HTMLSelectElement>) {
        setState(element.target.value)
    }
    return(
        <div className="flex w-full justify-between">
            <p>{text}</p>
            <select onChange={changeValue} className="bg-base-200">
                {options.map((element, key) => {
                    if (element.name == select) {
                        return <option value={element.id} selected={true}>{element.name}</option>
                    } 
                    return <option value={element.id}>{element.name}</option>
                })}
            </select>
        </div>
    );
}

export default ProjectModalDropdown;