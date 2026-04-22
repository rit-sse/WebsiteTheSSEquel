-- Vice President is a real primary officer once elected, even though the
-- seat is filled via a running-mate invitation rather than a direct
-- nomination. Flip the existing OfficerPosition row so the VP gets the
-- same primary-only dashboard access (e.g. the Elections panel) as the
-- rest of the executive team. The election system already excludes VP
-- from the direct-nomination grid via `isTicketDerivedOffice("Vice
-- President")`, so this change does NOT make VP separately nominatable.
UPDATE "OfficerPosition"
SET    "is_primary" = TRUE
WHERE  "title" = 'Vice President';
