"use client";

import React, { useEffect, useState } from "react";
import GoLink, { GoLinkProps } from "./GoLink";
import { GoLinksContainerProps } from "@/app/(main)/go/page";
import { filterGoLinks } from "@/lib/filter";
import { GoLinkButton } from "@/app/(main)/go/MakeNewGoLink";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// Skeleton component for GoLink cards
function GoLinkSkeleton() {
  return (
    <Card depth={2} className="flex p-4">
      <div className="flex-grow space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-6 w-6 ml-3" />
    </Card>
  );
}

const GoLinksContainer: React.FC<GoLinksContainerProps> = ({
  goLinkData,
  fetchData,
}) => {
  const pinnedGoLinks = goLinkData
    .filter((data) => data.pinned === true)
    .map((data, index) => (
      <GoLink key={`pinned-${data.id}`} {...data} fetchData={fetchData} />
    ));

  const unpinnedGoLinks = goLinkData
    .filter((data) => !data.pinned)
    .map((data, index) => (
      <GoLink key={`unpinned-${data.id}`} {...data} fetchData={fetchData} />
    ));

  const [goLinkList, setGoLinkList] = useState<React.JSX.Element[]>([]);

  const updateGoLinkList = (givenFilter: string) => {
    if (givenFilter === "" || givenFilter === null) {
      setGoLinkList([...pinnedGoLinks, ...unpinnedGoLinks]);
    } else {
      const filteredGoLinkData = filterGoLinks(givenFilter, goLinkData);
      setGoLinkList(
        filteredGoLinkData.map((data, index) => (
          <GoLink key={index} {...data} fetchData={fetchData} />
        ))
      );
    }
  };

  useEffect(() => {
    updateGoLinkList("");
  }, [goLinkData]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const givenFilter = event.target.value;
    updateGoLinkList(givenFilter);
  };

  return (
    <section className="py-8 px-4 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <Card depth={1} className="p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-primary">
              Go Links
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
              GoLinks are URL shortcuts to access SSE&apos;s frequently used external websites or resources. 
              Important golinks are marked with a gold star.
            </p>
          </div>
          
          <div className="relative w-full max-w-md mx-auto mb-6">
            <Search className="h-[18px] w-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search golinks..."
              className="pl-10 h-11 border-2 border-black rounded-lg"
              onChange={(event) => handleFilterChange(event)}
            />
          </div>

          {goLinkData.length > 0 ? (
            goLinkData[0].id === -1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <GoLinkSkeleton />
                <GoLinkSkeleton />
                <GoLinkSkeleton />
                <GoLinkSkeleton />
                <GoLinkSkeleton />
                <GoLinkSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <GoLinkButton fetchData={fetchData} />
                {goLinkList}
              </div>
            )
          ) : (
            <div className="text-center py-10 text-muted-foreground">No GoLinks available</div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default GoLinksContainer;
