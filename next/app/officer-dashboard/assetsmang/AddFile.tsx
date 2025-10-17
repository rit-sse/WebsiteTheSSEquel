'use client'
import { AddSquareIcon } from '@/components/common/Icons'
import React from 'react'

const AddFile: React.FC = () => {
    return (
        <button
            className="w-[300px] h-[100px] bg-[#e6f7ff] border-[3px] border-dotted border-[#1e90ff] text-[#034f84] text-[18px] rounded-[6px] cursor-pointer flex flex-row items-center justify-center text-[#1e90ff]"
        >
            <AddSquareIcon className="stroke-[#1e90ff] w-10 h-10 mr-[10px]" />
            Add File
        </button>
    )
    
}
export default AddFile