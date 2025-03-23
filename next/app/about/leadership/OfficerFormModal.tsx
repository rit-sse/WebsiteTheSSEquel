"use client"

// Modal template

import React from "react";

/**
 * isOpen - Modal is open or not, T/F
 * onClose - Function prop that closes the modal
 */
interface ModalProps {
    isOpen: boolean,
    onClose: () => {},
    children: React.ReactNode
}

/**
 * Modal that takes a component as a prop to display when opened. 
 */
export default function EventFormModal ({ isOpen, onClose, children }: ModalProps)  {
    return (
        <div onClick={ onClose } className={ `fixed inset-0 flex rounded-lg justify-center items-center ${isOpen ? "visible bg-black/20" : "invisible"}` }>
            <div onClick={ (event) => event.stopPropagation() } className={ `bg-base-100 rounded-xl shadow p-6  ${isOpen ? "scale-100 opacity-100" : "scale-125 opacity-0"}` }>
                <button onClick={ onClose } className="text-xl font-bold absolute top-1 right-2 rounded-lg text-red-400 hover:bg-base-50 hover:text-red-600">
                    X
                </button>
                {children}
            </div>
        </div>
    )
}