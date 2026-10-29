---
name: DocuMind
description: Team documents you can question together, where every answer carries its sources like a boarding pass.
colors:
  ink: "#0b0d10"
  ink-hover: "#1c2127"
  ink-2: "#474c55"
  ink-3: "#60656d"
  panel-ground: "#edeff2"
  surface: "#ffffff"
  sunken: "#f2f3f5"
  hairline: "#d5d8dd"
  rail: "#0b0d10"
  rail-2: "#1c2127"
  rail-ink: "#e6e8eb"
  rail-ink-2: "#9aa0a8"
  gate-yellow: "#ffd400"
  gate-yellow-soft: "#fff4bf"
  signal-red: "#c4231c"
  signal-red-soft: "#fdecea"
  signal-red-on-ink: "#ff6b5e"
  dark-ground: "#0b0d10"
  dark-surface: "#15181d"
  dark-sunken: "#101317"
  dark-ink: "#f2f3f5"
  dark-ink-2: "#b4b9c1"
  dark-ink-3: "#8d939c"
  dark-hairline: "#2a2f37"
  dark-rail: "#101317"
  dark-gate-yellow-soft: "#2e2a0c"
  dark-signal-red: "#ff6b5e"
  dark-signal-red-soft: "#3a1614"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(48px, 7.6vw, 118px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  display-section:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(36px, 4.4vw, 64px)"
    fontWeight: 700
    lineHeight: 0.95
  figure:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "38px"
    fontWeight: 600
    lineHeight: 1
  figure-stub:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 1
  wordmark:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Red Hat Text Variable, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Red Hat Text Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Red Hat Text Variable, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  answer:
    fontFamily: "Red Hat Text Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Red Hat Mono Variable, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
  data:
    fontFamily: "Red Hat Mono Variable, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  notch: "3px"
  chip: "4px"
  control: "5px"
  pass: "6px"
  landing-pass: "14px"
spacing:
  hair: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  panel: "20px"
  lg: "24px"
  page: "32px"
  page-mobile: "16px"
  container: "1280px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
  button-primary-active:
    backgroundColor: "{colors.gate-yellow}"
    textColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-secondary-active:
    backgroundColor: "{colors.gate-yellow}"
    textColor: "{colors.ink}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    textColor: "{colors.signal-red}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "40px"
  button-sm:
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  status-chip-ready:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
  status-chip-processing:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
  status-chip-error:
    backgroundColor: "{colors.signal-red-soft}"
    textColor: "{colors.signal-red}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
  status-chip-changed:
    backgroundColor: "{colors.gate-yellow}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 8px"
  source-chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.chip}"
    padding: "0 8px"
    height: "28px"
  source-chip-active:
    backgroundColor: "{colors.gate-yellow}"
    textColor: "{colors.ink}"
  source-pass:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pass}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pass}"
  top-bar:
    backgroundColor: "{colors.rail}"
    textColor: "{colors.rail-ink-2}"
    height: "56px"
---

# Design System: DocuMind

## Overview

**Creative North Star: "The Gate Board and the Pass"**

DocuMind treats documents like travel documents. The workspace is a live departures board that tells you what changed since you last looked; every source an answer cites is a segmented boarding pass you can verify at a glance. The world is printed ephemera rendered as interface: ink bars, panel-grey ground, white passes divided by thin rules, uppercase mono segment labels, condensed figures, a perforated stub carrying the S-number.

Density is operational, not airy. Tables, counts and timestamps are first-class and tabular; prose is short and set in a quiet sans. The palette is almost entirely ink and steel, so the one yellow carries meaning every time it appears: something changed, something is now, something is pressed. Red appears only for failure. State is always carried by form as well as colour, so the board reads the same in light, dark and for colour-blind users.

The system explicitly rejects the RAG category default it was built against: soft rounded cards, a blue primary, chat bubbles, and grey source chips that hide where an answer came from.

**Key Characteristics:**
- Ink top bar and ink departures band; light panel-grey ground below (dark theme: ink ground, slate panels).
- One alert yellow (#FFD400) with a reserved vocabulary; no other accent hue.
- Three-voice type: Barlow Condensed for identifiers and counts, Red Hat Mono for labels and data, Red Hat Text for prose.
- Square-ish corners (4-6px), hairline-drawn panels, segments split by thin vertical rules, dashed stub edges with punched notches.
- Status by form: solid outline ready, dashed in progress, red error, yellow just changed.
- Light and dark themes are both first-class; English and Spanish are both first-class.

## Colors

Ink and steel neutrals on a cool panel grey, with a single gate-board yellow and a signal red that is used only for failure.

### Primary
- **Rail Ink** (`ink` / `rail`): primary buttons, source chips S1..Sn, the top bar, the dashboard departures band, the landing ground, the admin rail, strong outlines (`line-strong`) and the light-theme focus outline. In dark theme primary inverts to Dark Ink (`dark-ink`) with ink text, while the rail stays dark (`dark-rail`).
- **Rail Lift** (`ink-hover` / `rail-2`): primary hover, rule lines and fills inside the ink bars (search field, user initials, nav hover, segment dividers on the band).

### Secondary
- **Gate Yellow** (`gate-yellow`): the only accent. See The Gate Board Yellow Rule for where it may appear. Text on yellow is always Rail Ink.
- **Pale Gate** (`gate-yellow-soft`; dark `dark-gate-yellow-soft`): the resting tint of a changed or unread row (recent documents board, unread notifications) once it sits on a light surface instead of the ink band.

### Tertiary
- **Signal Red** (`signal-red`; dark `dark-signal-red`): error chips, failed counts, error text, invalid field borders, danger buttons.
- **Signal Red Wash** (`signal-red-soft`; dark `dark-signal-red-soft`): error chip fill and failed log rows.
- **Signal Red on Ink** (`signal-red-on-ink`): red on always-dark surfaces (the departures band, admin band) in both themes.

### Neutral
- **Panel Ground** (`panel-ground`; dark `dark-ground`): the page behind panels. Deliberately lightened from #E6E8EB (now `rail-ink`) so white panels separate by a hairline rather than a heavy contrast step.
- **Pass White** (`surface`; dark `dark-surface`): panels, passes, inputs, menus, drawers, composer.
- **Sunken** (`sunken`; dark `dark-sunken`): row hover, ghost-button hover, menu-item hover.
- **Ink 2** (`ink-2`; dark `dark-ink-2`): secondary text, descriptions, excerpts.
- **Ink 3** (`ink-3`; dark `dark-ink-3`): labels, timestamps, placeholders, dashed in-progress borders.
- **Hairline** (`hairline`; dark `dark-hairline`): rules between rows, segment dividers, dashed stub edges, input borders at rest.
- **Rail Text** (`rail-ink`) and **Rail Text Muted** (`rail-ink-2`): text on the ink bars; white for active or primary text there.

### Named Rules
**The Gate Board Yellow Rule.** Yellow means "changed" or "now", never decoration. Its sanctioned uses are: a document that just finished or failed (NOW READY row and chip, held until acknowledged), unread counts and unread rows, the active citation (S-chip and its ring-2 pass), the active nav underline, the pressed state of primary and secondary buttons, the focus ring of text fields and the composer, the dark-theme focus outline, the streaming cursor, transient confirmations (export queued), text selection, and the brand plate (logo mark, AI avatar). The one at-rest yellow action is Upload on the departures band. A new surface that wants yellow must fit one of these.

**The Red Is Failure Rule.** Red appears only for errors and destructive actions. Never for emphasis, never for counts that are not failures (a failed count of 0 is white, not red).

**The Ink Bars Stay Ink Rule.** The top bar, departures band and admin rail are dark in both themes; their text uses the rail tokens, and red on them uses `signal-red-on-ink`.

## Typography

**Display Font:** Barlow Condensed 500/600/700 (with Arial Narrow, sans-serif), self-hosted via Fontsource.
**Body Font:** Red Hat Text Variable (with system-ui, sans-serif).
**Label/Mono Font:** Red Hat Mono Variable (with ui-monospace, monospace).

**Character:** A condensed, DIN-like gate-board face for things you would read off a departures screen (counts, S-numbers, the wordmark, landing headlines), a tracked mono for the printed segment labels and every figure, and a neutral humanist sans so answers and descriptions stay calm and readable.

### Hierarchy
- **Display** (Barlow Condensed 700, uppercase, clamp(48px, 7.6vw, 118px), line-height 0.9): the landing headline only, printed inside the pass, max 16ch.
- **Display Section** (Barlow Condensed 700, uppercase, clamp(36px, 4.4vw, 64px), 0.95): landing section heads; the closing head runs to clamp(40px, 5.4vw, 84px).
- **Figure** (Barlow Condensed 600, 38px, line-height 1): dashboard counts; 34px for the S-number on a stub and onboarding steps; 22-26px for room-header and room-card counts; up to clamp(96px, 12vw, 180px) for the landing stub's S1.
- **Wordmark** (Barlow Condensed 700, uppercase, 20-22px, 0.06em): "DocuMind" beside the mark.
- **Headline** (Red Hat Text 600, 26px, tight, -0.015em): page titles via PageHeader and the admin `.page-title`; the dashboard greeting is 28px.
- **Title** (Red Hat Text 600, 15-16px): panel and section headings, row names (14px semibold).
- **Body** (Red Hat Text 400, 15px): descriptions and form text; 13-14px for secondary lines; landing body 18-20px, max 62ch.
- **Answer** (Red Hat Text 400, 16px, line-height 1.7): chat messages, column max 768px.
- **Label** (Red Hat Mono 600, 11px, 0.08em, uppercase, Ink 3): segment labels, table headers, status chips, timestamps in lists.
- **Data** (Red Hat Mono 600, 13px, tabular): page numbers, match scores, chunk counts, dates, file types; 12px for times.

### Named Rules
**The Three Voices Rule.** Condensed for identifiers and counts, mono for labels and numbers, sans for sentences. A number in a sans paragraph, or a sentence set in condensed, is out of world.

**The Segment Label Rule.** Every uppercase mono label names the field directly beneath or beside it (DOCUMENT, PAGE, MATCH, READY). Labels are data captions on a pass, not decorative overlines above headings.

## Layout

The app is a fixed-height shell: a 56px ink top bar and a scrolling main region. Content sits in a centred container of 1280px with 16px side padding on phones and 32px from 640px, 32px vertical rhythm between sections, 20px panel padding, 12px row padding.

- **Ink top bar**: mark, Dashboard / Documents / Chat Rooms / Members / Settings, a 288px search field with ⌘K hint (from 1024px), theme toggle, notifications, user menu. Under 768px the nav collapses into a drop-down ink sheet with a yellow dot on the active item. Search is hidden on /documents, which has its own search field; ⌘K focuses that one instead.
- **Departures band** (dashboard): a full-width ink band with greeting and actions on top, then a 5:6 split: segmented count strip (3 columns on phones, 5 from 640px) and the live queue. When nothing is in flight the queue collapses to a single calm line with a yellow check.
- **Board below**: on the light ground, a 1fr / 340px split from 1024px: recent-documents table left; room pass-cards and activity right.
- **Room**: a segmented header strip (name, DOCS, HERE NOW, export), a centred conversation column (max 768px) with avatar gutter of 32px, and a 420px right rail of source passes, documents and people on the ground colour. Under 1280px the rail becomes an overlay toggled from the header.
- **Auth**: a 5:6 split with an ink side showing an example pass, the form on the ground.
- **Landing**: an ink page with one full-width pass (1fr / 300px stub from 1024px; the stub folds to the bottom on smaller screens), container 1440px, sides 16/32/56px.
- **Admin**: a 248px ink left rail instead of a top bar, pages at 32px padding, max 1280px, 24px gap; its dashboard opens on the same ink band, collapsing to one column under 760px.

Breakpoints are Tailwind's defaults (640 / 768 / 1024 / 1280px).

## Elevation & Depth

Flat and hairline-drawn. Panels are separated from the ground by a one-pixel ring plus a barely-there drop, never by a soft cloud shadow. Only things that float above the page (menus, drawers, the landing pass, the auth example pass) get the raised shadow, and a room card lifts to raised on hover. On the ink bars depth is expressed only by 1px rail-2 rules.

### Shadow Vocabulary
- **Pass hairline** (`box-shadow: 0 0 0 1px rgb(11 13 16 / 0.09), 0 1px 2px rgb(11 13 16 / 0.05)`; dark `0 0 0 1px rgb(255 255 255 / 0.07), 0 1px 2px rgb(0 0 0 / 0.4)`): every resting panel, pass, table card and the user-initials avatar.
- **Raised** (`box-shadow: 0 0 0 1px rgb(11 13 16 / 0.09), 0 12px 32px -12px rgb(11 13 16 / 0.28)`; dark `0 0 0 1px rgb(255 255 255 / 0.08), 0 16px 36px -12px rgb(0 0 0 / 0.8)`): user menu, notification drawer, landing pass, hovered room cards.

### Named Rules
**The Hairline Rule.** A panel is drawn by its 1px ring, not lifted. If a surface needs more separation, use a rule or the ground colour, not a bigger shadow.

## Shapes

Square-ish and printed. Controls use 5px corners, chips and source chips 4px, panels and passes 6px, small badges and the ⌘K key 3px. Circles appear only as punched notches and status dots. The landing pass is the one large object and uses 14px.

Segments inside a pass or strip are divided by thin vertical rules (`hairline`, or `rail-2` on ink). The stub of a pass is separated by a dashed rule and two half-circle notches cut at the tear line, filled with whatever sits behind (`--notch`, defaulting to the ground). The logo mark is a yellow 5px plate with an ink "D" and a single notch on its right edge. Empty states are dashed-outline boxes, matching the in-progress form.

## Components

### Buttons
Ink and decisive; pressing lights the gate.
- **Shape:** 5px corners; 40px tall (32px small), 16px sides (12px small), 14px semibold.
- **Primary:** Rail Ink fill, white text; hover Rail Lift; pressed Gate Yellow with ink text.
- **Secondary:** Pass White with a 1px ink outline; hover Sunken; pressed yellow.
- **Ghost:** Ink 2 text, hover ink on Sunken.
- **Danger:** red text and outline; hover fills red.
- **Press:** every pressable scales to 0.97 on :active (160ms ease-out); colours transition at 140ms. Disabled is 50% opacity.
- **On ink:** the band uses a ghost (rail text), an outlined (rail-ink-2 at 50%) and the yellow Upload; the landing closing CTA is a white button that presses yellow.
- **Admin:** Material buttons are forced to 5px corners, 600 weight, no letter-spacing, same press scale.

### Chips
- **Status chip:** mono 11px uppercase label, 4px corners, 1px border, 2px 8px padding. READY: solid ink outline. PROCESSING / UPLOADED / PENDING: dashed Ink 3 outline, Ink 2 text. ERROR: red outline on red wash. Just changed: yellow fill reading "NOW READY" / "NOW FAILED". On ink, ready outlines go white, in-progress dashed rail-ink-2, error uses Signal Red on Ink. The admin `.tag` family mirrors this exactly (plain, `--fill`, `--alert`, `--danger`, `--pending`).
- **Source chip (S1..Sn):** mono 12px semibold, 28px tall, 4px corners, ink fill; the active one turns yellow and its pass gets a 2px yellow ring.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** Pass White on the ground; outlined (no fill) with rail-2 borders on the ink band.
- **Shadow Strategy:** pass hairline at rest (see Elevation).
- **Border:** none on light panels; internal rows split by `hairline` top borders; header rows bordered below.
- **Internal Padding:** 20px panel headers and table cells, 16px 12px for list rows and passes.
- **Room card:** a mini pass, name and "opened" label left, a dashed-ruled 80px stub with the document count in condensed figures.

### Inputs / Fields
- **Style:** Pass White, 1px Hairline border, 5px corners, 44px tall, 14px side padding, 15px text; label above in the mono Label style.
- **Focus:** border goes ink and a 2px Gate Yellow ring appears (composer: ring on the whole field via focus-within). On ink the search field is rail-2 filled with the same yellow ring.
- **Error:** red border and red 13px message below; hints in Ink 3.
- **Global focus:** every other focusable gets a 2px outline offset 2px, ink in light and yellow in dark.

### Navigation
- **Top bar:** 14px Red Hat Text, rail-ink-2 at rest, white on hover; the current page is white semibold with a 2px yellow underline drawn as an inset shadow at the bar's bottom edge. Icon buttons are rail-ink-2, hovering to rail-2 fill.
- **Settings tabs:** 14px, a 2px ink underline for the active tab on a hairline baseline.
- **Admin rail:** 248px ink column; active item gets a rail-2 fill, white text and a yellow icon.
- **Locale switch:** a segmented EN / ES control in 12px mono uppercase, 5px outer corners; the selected half is filled ink (or rail-ink on ink).

### Source Pass (signature)
The citation as a segmented pass. Left: DOCUMENT label with the file name (14px semibold, wraps after underscores, two lines max), PAGE label with the page in mono, then the excerpt (14px, Ink 2, four lines max). Right: a 112px stub behind a dashed rule with two punched notches, carrying SOURCE, the S-number in 34px condensed and the MATCH score in mono (0.00 format). Active: 2px yellow ring. Passes stack in the room's right rail and appear on the auth and landing screens with the same anatomy.

### Departures Queue (signature)
Rows of name, status chip and mono time on the ink band. A row whose status just changed turns solid yellow with an ink-outlined NOW READY / NOW FAILED chip, travels above other rows, reranks in place (400ms FLIP) and holds its yellow until the user opens the document. New rows drop in from 6px above. On the light board the same change shows as a Pale Gate row with a yellow chip.

### Motion
- **Easing:** ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, ease-in-out `cubic-bezier(0.77, 0, 0.175, 1)`, drawer `cubic-bezier(0.32, 0.72, 0, 1)`; base colour transitions 140ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Durations:** press 160ms; menus enter 150ms and leave 100ms (scale 0.97, rise 4px, from the trigger); drawer 300ms in, 200ms out; rerank move 400ms, row enter 250ms; row colour 300ms; the landing pass rises 16px once over 600ms.
- **Reduced motion:** fewer and gentler, not none. Keyframe animations are zeroed, travel (press scale, menu/drawer/row translate, rerank move) is dropped, fades and colour changes stay.

### Theming and Language
The Vue app applies a `.dark` class on `<html>` before first paint from the saved `theme` or the OS preference; the top bar toggles it. All colours flow through `--dm-*` custom properties mapped into Tailwind with `@theme inline`. The Angular admin redeclares the same `--dm-*` values in its stylesheet (kept in sync by hand), follows the OS preference only, and generates its Material M2 theme from three project ramps (ink, yellow, red). Copy comes from typed vue-i18n catalogues (en, es), saved in `locale`, defaulting from the browser language with English fallback, and sets `<html lang>`. Layouts must hold Spanish lengths: labels truncate, segment strips wrap.

## Do's and Don'ts

### Do:
- **Do** draw panels with the pass hairline on Panel Ground (#EDEFF2), not a heavier shadow or a darker ground.
- **Do** carry every status by form and colour together: solid outline ready, dashed in progress, red error, yellow just changed.
- **Do** show citations as S-chips that open Source Passes with DOCUMENT, PAGE, excerpt, S-number and MATCH visible.
- **Do** set counts and S-numbers in Barlow Condensed, labels and figures in Red Hat Mono with tabular numbers, prose in Red Hat Text.
- **Do** use 4px / 5px / 6px corners for chips / controls / panels.
- **Do** keep the ink bars dark in both themes and use `signal-red-on-ink` for errors on them.
- **Do** set `--notch` to the colour behind a pass when it sits on anything other than the ground.
- **Do** give every pressable the 0.97 press and every text field the yellow focus ring.
- **Do** build every new string in both en and es catalogues.

### Don't:
- **Don't** use yellow outside The Gate Board Yellow Rule: no yellow headings, borders, illustrations or resting buttons other than the band's Upload.
- **Don't** introduce a second accent hue; blue primaries in particular are the category default this world refuses.
- **Don't** render chat as bubbles or sources as grey chips; messages sit in an avatar gutter and sources are ink S-chips with passes.
- **Don't** use soft, large-radius cards in the app; the 14px landing pass is the only large object.
- **Don't** use red for anything but failure and destructive actions.
- **Don't** set uppercase mono labels above headings as decoration; a label always names the value beside or beneath it.
- **Don't** show the top-bar search on /documents; that page owns its search field and ⌘K.
