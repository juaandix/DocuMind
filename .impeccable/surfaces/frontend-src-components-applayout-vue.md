---
version: 1
slug: "frontend-src-components-applayout-vue"
primary_target: "frontend/src/components/AppLayout.vue"
related_targets: ["frontend/src/views","admin-panel/src/app"]
---

# Surface brief — DocuMind app shell (Vue frontend + Angular admin)

Scope: every authenticated screen of the Vue app (dashboard, documents, document detail/upload, chat rooms, room, settings, members, profile) plus auth screens, and the Angular admin panel sharing the same world. Visitor mode: Operate.

Audience/job: generic work teams upload documents and question them together; they must always know each document's processing state and where every answer came from. Admin: platform admins scan workspaces, users, logs.

Constraints: light and dark themes both first-class; EN/ES i18n; citations always visible; standard web controls only; Tailwind v4 tokens via @theme; Angular Material themed from the same tokens.

Memorable moment: a document finishing processing reranks into the board and holds its yellow highlight until the user has seen it.

Unresolved: final display face licensing (self-hosted Google Font), admin chart palette.

## Direction contract

Surface round (seed:200257693372791a): structure "departures band" chosen over three-pane and top-bar board.

THESIS: DocuMind treats documents like travel documents: every source is a segmented pass you can verify at a glance, and the workspace is a live board that tells you what changed. It refuses the category default of soft cards, blue primary and chat bubbles with grey source chips.

OWN-WORLD: Ink #0B0D10 rail and primary actions, slate/steel neutrals, panel grey ground (#EDEFF2: lightened from the card's #E6E8EB in the "more professional" round so white panels separate by a hairline instead of a heavy contrast step), white surfaces, one alert yellow #FFD400 reserved for change and the active primary state; red only for errors. Condensed DIN-like display for identifiers and counts, uppercase tracked mono for labels and tabular data, a neutral sans for prose. Square-ish 4–6px corners, hairline rules, segments divided by thin vertical rules; perforated stub edge on source passes. Dark theme: ink ground, slate panels, same yellow.

STORY: The user sees what changed since they looked, opens the room, asks, and verifies each claim against its pass without leaving the conversation.

FIRST VIEWPORT: Ink top bar (mark, Dashboard / Documents / Chat Rooms / Members / Settings, search ⌘K (hidden on /documents, which has its own search field; ⌘K focuses that one), theme, notifications, user menu). Dashboard opens on a full-width ink departures band: greeting and Upload (yellow) on top, segmented counts (documents, ready, processing, failed, storage) left, live queue right listing what is processing, just finished (yellow row NOW READY) or failed; when nothing is in flight the queue collapses to one calm line. Below on the light ground: recent documents board and a column with chat rooms (pass cards) and activity. Room: header strip with room id, docs, people present; conversation centre with avatars and S1…Sn chips; right column of source passes.

FORM: challenger vernacular-ephemera-boarding-pass-and-gate-board (re-roll round 1, over assigned "press clipping bureau"); seed:7a5fd59d1b71770c. Signature interaction: status change reranks the board row in place (FLIP) and holds the yellow highlight until acknowledged.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
