# Gluons interface design

The public site and owner workspace share a visual system. The design is built around a small business owner checking what needs attention, reviewing a proposal, and getting back to work.

## GitHub skills used

Reviewed and applied on 2026-10-29:

- [Anthropic Frontend Design](https://github.com/anthropics/skills/tree/main/skills/frontend-design): visual direction, a deliberate type scale, subject-specific content, restrained motion, and screenshot critique.
- [Vercel Web Design Guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines), using its [current interface checklist](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md): keyboard focus, readable content, accessible controls, responsive layout, reduced motion, and numeric alignment.

These were read as design guidance; no third-party skill scripts were executed or global skills installed. The implementation stays in this repository.

## Direction and tokens

The previous pale green text, tiny responsive labels, and decorative integration diagram made the product harder to read. The revised direction puts a concrete approval workflow in the hero and uses color to distinguish actions from status.

| Token   | Value     | Purpose                                        |
| ------- | --------- | ---------------------------------------------- |
| Ink     | `#172b4d` | Headings and important values                  |
| Muted   | `#53647c` | Supporting text with useful contrast           |
| Canvas  | `#f4f6fa` | Workspace background                           |
| Paper   | `#ffffff` | Cards and public page                          |
| Action  | `#2855d9` | Primary buttons, selected navigation and chart |
| Success | `#176b55` | Approval and enabled status                    |

Manrope Variable is self-hosted through Fontsource, with `font-display: swap`; builds and visitors do not need Google Fonts. One family covers both headings and body text. The workspace uses 14–16px body and control text, 12–13px supporting labels, and responsive 30–40px page headings. Marketing headings have a separate fluid scale. Numbers use tabular spacing where they are compared.

The public page is left aligned, with a focused two-column hero that becomes one column on phones:

```text
Logo             Navigation                 Open demo

Clear promise                  Sample workday
What help looks like           Request → draft → owner review
Trial request / video          Another task awaiting review

Everyday services              Calls / records / owner control
Setup sequence                 Your work → setup → trial
Trial explanation              Dashboard preview
Free trial request
```

The blue time-returned card anchors the owner dashboard. Other metrics stay quieter. At narrower sizes, cards reflow rather than shrinking text. Wide data tables scroll inside their cards. Service choices stack on phones, and editable catalog/stock tables keep their own scroll area.

## Source organization

- `globals.css`: component structure, layout geometry, and existing responsive structure.
- `design-system.css`: palette, typography, control sizes, presentation and responsive design rules. Superseded matching declarations were removed from the base stylesheet.
- `page.tsx`: the public page and illustrative approval preview.
- `ui.tsx`: shared controls and labelled native dialogs.

## Interaction details

Keyboard skip links and visible focus rings cover both the public page and workspace. Closed phone navigation is removed from keyboard navigation; the drawer supports Escape and returns focus to its opener. Dialogs have accessible titles. Activity rows support Enter and Space. Page navigation no longer waits for an exit animation. Reduced motion is respected by the remaining entry animation and CSS.

The preview in the landing hero is an illustration with an accessible description. Its smaller labels are not live application controls. Trial requests, review actions, service settings, activity details and PDF export remain functional.
