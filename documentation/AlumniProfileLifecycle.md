# Alumni and Profile Lifecycle

This document describes the lifecycle for profile completion memberships, alumni candidate generation, and S3 image handling.

## Academic Term Model

- Terms are represented as `SPRING`, `SUMMER`, `FALL` plus a year.
- Current term is computed from the current date:
  - Jan-May: `SPRING`
  - Jun-Jul: `SUMMER`
  - Aug-Dec: `FALL`
- Graduation is treated as "passed" when the current term is after the saved graduation term/year.

## Profile Completion Membership Logic

- Membership is awarded when these fields are all present:
  - `graduationTerm`
  - `graduationYear`
  - `major`
  - `gitHub`
  - `linkedIn`
- The award is idempotent for a term using:
  - `profileCompletionGrantedTerm`
  - `profileCompletionGrantedYear`
- A user can receive this award once per term if they remain eligible.

## Alumni Candidate Review Queue

- On profile save and sign-in, graduation status is evaluated.
- If graduation has passed and the user has no alumni row and no candidate row:
  - A pending `AlumniCandidate` row is created from profile snapshot fields.
- Officer review happens via `/api/alumni-candidates`:
  - `GET`: list queue items (officer-only)
  - `PUT`: approve/reject candidate (officer-only)
- Approve creates or updates an `Alumni` row and links `userId`.

## S3 Image Conventions

- Database canonical value for user/alumni uploaded images is an S3 key.
- UI/API boundary resolves keys to renderable URLs through shared utilities.
- Profile image keys are user-scoped under:
  - `uploads/profile-pictures/{userId}/...`
- Server enforces ownership checks before accepting profile image keys.

## Leadership Photo Source

- Leadership cards use only assigned user profile image data:
  - `profileImageKey`
  - fallback `googleImageURL`
  - final fallback avatar
- Position-scoped officer image uploads are deprecated.
