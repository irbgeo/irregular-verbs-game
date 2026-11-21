# Stage 1: foundation

**Status:** active — PRD and TRD approved, code done and checked locally;
waiting for the owner's VK app to run the VK checks in RESULT.md.

**Goal:** an empty game runs inside VK; tooling, tests, Makefile, CI deploy
on tag and the platform port (VK Bridge init + storage) are in place.

**Why:** check the risky VK parts (Bridge, Storage, hosting, CI token) on a
tiny game before real logic depends on them.

**Next steps:** owner creates the VK app and GitHub secret/variables →
`make deploy` + tag deploy → tick the "Waiting" list in RESULT.md → stage 2
`domain`.

**Entry points:** `docs/stages/01-foundation/` (PRD, TRD, RESULT),
`src/platform/`, `Makefile`, `.github/workflows/deploy.yml`.
