"use client";

import GoLinksContainer from "@/app/(main)/go/GoLinksContainer";
import { GoLinkProps } from "./GoLink";
import { useCallback, useEffect, useState } from "react";

export interface CreateGoLinkProps {
  fetchData: () => Promise<void>;
}

export interface GoLinksContainerProps {
  goLinkData: GoLinkProps[];
  fetchData: () => Promise<void>;
}

export interface golinkInterf {
  id: number;
  golink: string;
  url: string;
  description: string;
  isPinned: boolean;
  isPublic: boolean;
}

let mapFunc = (item: any) => ({
  id: item.id,
  goUrl: item.golink,
  url: item.url,
  description: item.description ?? "",
  pinned: item.isPinned,
  officer: !item.isPublic,
})

const GoLinksPage = () => {
  const [goLinkData, setGoLinkData]: [any[], any] = useState([{id:-1}]);
  const fetchData = useCallback(async () => {
    const data: golinkInterf[] = await fetch("/api/golinks/public").then((response) => response.json());
    const authLevel = await fetch("/api/authLevel").then(resp => resp.json())
    const isOfficer = authLevel["isOfficer"]
    if(isOfficer) {
      const officerData: golinkInterf[] = await fetch("/api/golinks/officer").then((response) => response.json());
      setGoLinkData([
        ...officerData.map(mapFunc),
        ...data.map(mapFunc)
      ])
    } else {
      setGoLinkData([
        ...data.map(mapFunc)
      ])
    }
    setGoLinkData
  }, []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {}, [goLinkData]);

  return (
    <>
      <GoLinksContainer goLinkData={goLinkData} fetchData={fetchData} />
    </>
  );
};

export default GoLinksPage;
