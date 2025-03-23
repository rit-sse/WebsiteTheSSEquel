"use client"

import { useEffect, useState } from "react";
import OfficerCard from "./OfficerCard";
import OfficerFormModal from "./OfficerFormModal";
import { Team, TeamMember } from "./team";
import ModifyOfficers from "./ModifyOfficers";
import ReplaceOfficerForm from "./ReplaceOfficerForm";

export default function Leadership() {
  const [open, setOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<TeamMember>();
  const [teamData, setTeamData] = useState<Team>({ primary_officers: [], committee_heads: [] });

  useEffect(() => {
      getOfficers();
  }, []);

  const getOfficers = async () => {
    var team: Team = { primary_officers: [], committee_heads: [] };
    try {
      const response = await fetch('http://localhost:3000/api/officer/active');
      if (!response.ok) {
        throw new Error('Failed to fetch officers');
      }
      const data = await response.json();
  
      team.primary_officers = data
        .filter((officer: any) => officer.position.is_primary)
        .map((officer: any) => ({
          name: officer.user.name,
          title: officer.position.title,
          email: officer.user.email,
        }));
  
      team.committee_heads = data
        .filter((officer: any) => !officer.position.is_primary)
        .map((officer: any) => ({
          name: officer.user.name,
          title: officer.position.title,
          email: officer.user.email,
        }));
  
    } catch (error) {
      console.error('Error:', error);
    }
    team.committee_heads.sort((a, b) => {
      if (a.title < b.title) {
        return -1;
      }
      return 1;
    });
    setTeamData(team);
  };

  return (
    <>
      <section className="mt-16">
        <OfficerFormModal isOpen={open} onClose={async () => setOpen(false)}>
          <ReplaceOfficerForm open={open} teamMember={selectedOfficer} getOfficers={getOfficers} closeModal={() => setOpen(false)}/>
        </OfficerFormModal>
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
              {teamData.primary_officers.map((member, idx) => (
                <div key={idx}>
                  <OfficerCard teamMember={member} />
                  <ModifyOfficers teamMember={member} openModal={() => setOpen(true)} setSelectedOfficer={setSelectedOfficer}/>
                </div>
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
                {teamData.committee_heads.map((member, idx) => (
                  <div key={idx}>
                    <OfficerCard teamMember={member} />
                    <ModifyOfficers teamMember={member} openModal={() => setOpen(true)} setSelectedOfficer={setSelectedOfficer}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
