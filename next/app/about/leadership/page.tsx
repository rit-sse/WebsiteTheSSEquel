"use client";

import OfficerCard from "./OfficerCard";
import { teamData, Team } from "./team";
import { useState, useCallback, useEffect } from "react";

export default function Leadership() {
  const [goLinkData, setGoLinkData]: [any[], any] = useState([]); //This makes a variable (const) right because react hates you
  const fetchData = useCallback(async () => {
    const data = await goLinksApi.fetch();
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
  /*
  goLinkData = getting the data
  setGoLinkData = changing the data
  useState() is the fcn that sets up the getting of the variable i guess
  - Abby + Ryanne
  */
  let team: Team = teamData;

  team.committee_heads.sort((a, b) => {
    if (a.title < b.title) {
      return -1;
    }
    return 1;
  });

  return (
    <>
      <section className="mt-16">
        <div className="max-w-screen-xl mx-auto px-4 text-center md:px-8">
          <div className="content-center">
            {/* Meet our team */}
            <div className="max-w-xl mx-auto">
              <h1
                className="bg-gradient-to-t from-primary to-secondary 
              bg-clip-text text-4xl font-extrabold text-transparent md:text-5xl"
              >
                Meet our Team
              </h1>
              <p className="mt-3 text-xl leading-8">
                Have questions? Feel free to reach out to any of our officers!
              </p>
            </div>
          </div>

          {/* Primary Officers */}
          <h2 className="text-xl text-center font-extrabold text-primary-focus sm:text-3xl my-12">
            Primary Officers
          </h2>
          <div className="">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {team.primary_officers.map((member, idx) => (
                <OfficerCard key={idx} teamMember={member} />
              ))}
            </div>
          </div>
          {/* Committee Heads */}
          <div className="mt-20">
            <h2 className="text-xl text-center font-extrabold text-primary-focus sm:text-3xl mb-12">
              Committee Heads
            </h2>
            <div className="">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 gap-y-8">
                {team.committee_heads.map((member, idx) => (
                  <OfficerCard key={idx} teamMember={member} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
