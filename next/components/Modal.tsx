import React, { useRef, useEffect, ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
	const dialogRef = useRef<HTMLDialogElement>(null)
	
	useEffect(() => {
		const dialogElement = dialogRef.current
		if (dialogElement) {
			if (isOpen) dialogElement.showModal()
			else dialogElement.close()
		}
  	}, [isOpen])

	const handleClose = () => onClose?.()

	// Close modal when clicking outside of it
	const handleClickOutside = (e: React.MouseEvent<HTMLDialogElement>) => {
		if (dialogRef.current && e.target === dialogRef.current) handleClose()
	}

	return <>
		<dialog
			className='w-full max-w-lg bg-transparent px-4'
			ref={dialogRef}
			onClose={handleClose}
			onClick={handleClickOutside}
		>
			{children}
		</dialog>
	</>
}

export default Modal