import React from "react";

const AddProjectModal = ({
                            enabled,
                            setEnabled
                        }: 
                        {
                            enabled: boolean,
                            setEnabled: Function
                        }) => {

    // This sets the modal visiblity to false. setEnabled a function passed through as setAddProjectModal in ProjectModal.tsx
    let exit = () => {
        setEnabled(false)
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
                    <div className="relative w-[900px] h-[600px] z-[50] bg-base-100 rounded-lg overflow-hidden
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
                                <div className="flex">
                                    {/* Exit Button */}
                                    <svg width="30" height="30" viewBox="0 0 35 36" className="fill-primary cursor-pointer" onClick={exit}  xmlns="http://www.w3.org/2000/svg">
                                        <g clip-path="url(#clip0_23_61)">
                                            <path fill-rule="evenodd" clip-rule="evenodd" d="M15.9799 19.5201V32.4659H13.8773V23.1093L1.48865 35.5L0 34.0114L12.3907 21.6227H3.0341V19.5201H15.9799ZM33.5124 0.5L34.9989 1.98655L22.6103 14.3773H31.967V16.4799H19.0211V3.53408H21.1238V12.8886L33.5124 0.5Z" />
                                        </g>
                                    </svg>
                                </div>
                            </div>

                        </div>
                    </div>
            </div>
            : // Else, return something empty.
            undefined}
        </div>
    )
}
export default AddProjectModal;