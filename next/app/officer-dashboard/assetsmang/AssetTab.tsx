import React from 'react';
import AddFile from './AddFile';

const AssetTab: React.FC = () => {
    return (
        <div className='px-[10px]'>
            <h2>Asset Management</h2>
            <AddFile />
            <div className='h-[1px] w-full bg-black my-[10px]' />
        </div>
    );
};

export default AssetTab;