"use client"

import GoLinksContainer from "@/app/go/GoLinksContainer";
import { GoLinkProps } from "./GoLink";
import { useCallback, useEffect, useState } from "react";

export interface CreateGoLinkProps {
    fetchData: () => Promise<void>; 
}

export interface GoLinksContainerProps {
    goLinkData: GoLinkProps[];
    fetchData: () => Promise<void>; 
}

const GoLinksPage = () => {
    const [goLinkData, setGoLinkData] = useState([]);
    const fetchData = useCallback(async() => {
        const response = await fetch("http://localhost:3000/api/golinks/public");
        const data = await response.json();
        setGoLinkData(data.map((item: { id: number, golink: string; url: string; description: string; isPinned: boolean; }) => ({
            id: item.id,
            goUrl: item.golink,
            url: item.url,
            description: item.description ?? '', 
            pinned: item.isPinned, 
        })));
    }, [])
    useEffect(() => {
        fetchData()
    }, [fetchData]);

    useEffect(() => {}, [goLinkData]); 
    
    return (
        <>
            <GoLinksContainer goLinkData={goLinkData} fetchData={fetchData} />
        </>
    )
}


export default GoLinksPage;