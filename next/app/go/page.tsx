"use client";

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
  const [goLinkData, setGoLinkData]: [any[], any] = useState([]);
  const fetchData = useCallback(async () => {
    const data: {
      id: number;
      golink: string;
      url: string;
      description: string;
      isPinned: boolean;
      isPublic: boolean;
    }[] = await fetch("/api/golinks/public").then((response) => response.json());
    setGoLinkData(
      data.map((item) => ({
        id: item.id,
        goUrl: item.golink,
        url: item.url,
        description: item.description ?? "",
        pinned: item.isPinned,
      }))
    );
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
