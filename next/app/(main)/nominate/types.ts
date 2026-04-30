/**
 * Serialized payload that the server `page.tsx` hands to
 * `NominateClient`. All Date objects are pre-converted to ISO strings
 * so the data crosses the server-client boundary cleanly.
 */
export interface NominateOffice {
  id: number;
  title: string;
  description: string;
  incumbent: { id: number; name: string; image: string | null } | null;
}

export interface NominateOpenElection {
  id: number;
  title: string;
  slug: string;
  nominationsOpenAt: string;
  nominationsCloseAt: string;
  votingOpenAt: string;
  votingCloseAt: string;
  offices: NominateOffice[];
}

export interface NominateViewer {
  id: number;
  name: string;
  email: string;
  major: string | null;
  image: string | null;
}

export interface NominateRoleManifestEntry {
  title: string;
  description: string;
  incumbent: { id: number; name: string; image: string | null } | null;
  onBallot: boolean;
}

export interface NominateData {
  openElection: NominateOpenElection | null;
  viewer: NominateViewer | null;
  viewerCanNominate: boolean;
  isMember: boolean;
  isOfficer: boolean;
  nextSemesterLabel: string;
  roleManifest: NominateRoleManifestEntry[];
}
