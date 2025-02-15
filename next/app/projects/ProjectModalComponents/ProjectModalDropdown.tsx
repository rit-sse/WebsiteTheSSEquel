import React, { ChangeEvent } from "react";

interface ProjectModalDropdownArguments {
    text: string,
    setState: Function,
    options: {id: number, name: string}[]
}

const ProjectModalDropdown = ({text = "", setState, options}: ProjectModalDropdownArguments) => {
    function changeValue(element: ChangeEvent<HTMLSelectElement>) {
        console.log(element.target.value)
    }
    console.log(options)
    return(
        <div className="flex w-full justify-between">
            <p>{text}</p>
            <select onChange={changeValue}>
                {options.map((element, key) => (
                    <option value={element.id}>{element.name}</option>
                ))}
            </select>
        </div>
    );
}

export default ProjectModalDropdown;