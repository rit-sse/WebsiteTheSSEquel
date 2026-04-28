-- Add WITHDRAWN to ElectionNominationStatus so candidates can pull
-- out of a race after accepting (distinct from DECLINED, which
-- means "never said yes"). The IRV tally already filters by
-- `status = ACCEPTED`, so WITHDRAWN nominees auto-disappear from
-- the ballot — voters who ranked them just flow to their next
-- preference, exactly as if the candidate had been eliminated.
ALTER TYPE "ElectionNominationStatus" ADD VALUE IF NOT EXISTS 'WITHDRAWN';
