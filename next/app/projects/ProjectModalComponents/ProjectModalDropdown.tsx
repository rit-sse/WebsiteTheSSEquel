import React, { ChangeEvent } from "react";

// Arguments used for the Add Project Modal and the Project Modal (edit) dropdown.
interface ProjectModalDropdownArguments {
    text: string,
    setState: Function,
    options: {id: number, name: string}[],
    select?: string
}
/**
 * This creates a dropdown with a label and is selectable.
 * 
 * WARNING: This is used and designed *specifically* for a user select, hence the element.name == select.
 * If you want to modify it, make sure you are not messing other things up
 * @param text This is used as the "name" of the input. Is located next to the dropdown.
 * @param setState This uses the setState function, when the value changes, it fires to that with the value.
 * @param options The options that can be selected
 * @param select Gets a selected user.
 * @returns 
 */
const ProjectModalDropdown = ({text = "", setState, options, select = ""}: ProjectModalDropdownArguments) => {
    // When the value of the dropdown changes, fire the setState function with the element's value.
    function changeValue(element: ChangeEvent<HTMLSelectElement>) {
        setState(element.target.value)
    }

    return(
        <div className="flex w-full justify-between">
            {/* The Label */}
            <p>{text}</p>
            {/* Create the dropdown, map the options to their own option and value */}
            <select onChange={changeValue} className="bg-base-200">
                {options.map((element, key) => {
                    // Again, if you are not using this *specifically* to designate users, modify this!
                    // This compares an element in options that has a value "name" with the select, and if they match, we know this specific option is selected.
                    if (element.name == select) {
                        // If the condition succeeds, return the option as selected.
                        // I did not make a check if theres duplicates, as I assume there are no duplicate names
                        return <option value={element.id} selected={true}>{element.name}</option>
                    } 
                    // Return as normal.
                    return <option value={element.id}>{element.name}</option>
                })}
            </select>
        </div>
    );
}

export default ProjectModalDropdown;