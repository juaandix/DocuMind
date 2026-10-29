# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Generic work teams (development, sales, operations) that accumulate scattered documentation: technical docs, sales reports in CSV, contracts and specs in PDF/DOCX. They upload documents to a shared workspace and ask questions in natural language, alone or together in real-time chat rooms. Workspace roles: OWNER, ADMIN, MEMBER. A separate PLATFORM_ADMIN operates the whole platform from the admin panel.

## Product Purpose
DocuMind centralises a team's documents and lets them query that content in natural language, with an AI answering from the documents themselves (RAG) and streaming its responses. Success: a team member finds the answer and the exact passage it came from without opening and searching files by hand.

## Positioning
Answers are grounded in the team's own documents and show their sources; questioning happens collaboratively in shared rooms in real time, not in a private chatbot.

## Operating Context
- Workspace dashboard: documents, chat rooms, processing state, storage usage.
- Documents upload asynchronously (UPLOADED → PROCESSING → READY / ERROR) via Celery; users wait for processing and get notified.
- Chat rooms attach a set of documents; several members ask and read answers together over WebSockets.
- Conversation history can be exported as PDF.
- Notifications (document ready/error, export ready, invites, storage warnings) arrive in-app and by email.
- Admin panel (Angular) for platform admins: workspaces, users, logs, notifications, metrics.

## Capabilities and Constraints
- Two front ends: main app (Vue 3 + TS + Tailwind v4) and admin panel (Angular 17 + Angular Material); both must share one identity.
- Interface must be bilingual (English and Spanish) via i18n. Not implemented yet.
- Light and dark themes are both required.
- File types: PDF, DOCX, TXT, CSV.
- LLM provider is configurable (OpenAI or Anthropic); UI must not brand itself on either.

## Brand Commitments
- Name: DocuMind.
- Visible citations: every AI answer shows the sources (document, location, excerpt) it was built from. This is core to the product.
- Light and dark mode both supported.
- No existing logo or brand assets.

## Evidence on Hand
Portfolio project: no real customers, testimonials, usage metrics or pricing. Any sample documents, names or numbers in designs are illustrative and must be labelled as such; never present them as real customers or results.

## Product Principles
1. Every answer is traceable to a passage the user can open.
2. Processing is asynchronous and must always be legible: the user knows what state each document is in.
3. Collaboration is first-class: rooms show who is present and what others asked.
4. Workspace data is tenant-scoped; nothing suggests cross-workspace visibility.
