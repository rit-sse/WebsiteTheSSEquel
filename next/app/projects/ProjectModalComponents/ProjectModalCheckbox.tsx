interface ProjectModalCheckboxArguments {
    label: string;
    checked: boolean;
    setChecked: Function;
}

const ProjectModalCheckbox = ({
    label,
    checked,
    setChecked
}: ProjectModalCheckboxArguments) => {
    const CHECKBOX_SIZE = 42

    let toggle = () => {
        setChecked(!checked)
    }

    return(
        <div className="w-full flex justify-between items-center mt-[10px]">
            <p>{label}</p>
            {
                checked ? 
                <svg width={CHECKBOX_SIZE} height={CHECKBOX_SIZE} className={`fill-primary cursor-pointer`} viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" onClick={toggle}><path d="M3 4H4V3H18V4H17V5H5V17H17V11H18V10H19V18H18V19H4V18H3V4M6 9H8V10H9V11H10V12H12V11H13V10H14V9H15V8H16V7H17V6H18V5H19V4H21V6H20V7H19V8H18V9H17V10H16V11H15V12H14V13H13V14H12V15H10V14H9V13H8V12H7V11H6V9Z" /></svg>
                :
                <svg width={CHECKBOX_SIZE} height={CHECKBOX_SIZE} className={`fill-accent cursor-pointer`} viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" onClick={toggle}><path d="M3 4H4V3H18V4H19V18H18V19H4V18H3V4M5 17H17V5H5V17Z" /></svg>
                
            }
        </div>
    )
}

export default ProjectModalCheckbox;