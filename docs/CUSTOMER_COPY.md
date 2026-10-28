# Customer-facing copy

The landing page and owner workspace explain the service from the business owner's perspective:

- Which everyday tasks Gluons can help prepare: customer calls, orders, replies, stock alerts, expense records and summaries.
- Help getting the business's details, catalog, opening hours and preferences set up.
- The owner's ability to approve, edit or reject a proposed action.
- A trial alongside the current way of working, followed by a comparison using the owner's baseline and clearly estimated results.
- Clear usage and savings information in the owner's workspace.

Company operating strategy and engineering architecture belong in implementation documentation, not customer marketing or onboarding. The customer screens use service names and enabled status rather than implementation definitions or statistics about other businesses. Public navigation leads to product help and the sample dashboard.

The demo walkthrough, captions, poster, page metadata and accessible labels follow the same customer narrative. Screenshots and sample figures are illustrative; they are not testimonials or promised savings. No unsupported price, savings guarantee, expert endorsement or case-study claim is introduced.

`src/lib/service-copy.ts` keeps service names and descriptions consistent across the dashboard. The HTTP acceptance suite checks that the rendered landing page and demo captions do not regress to internal delivery-strategy language. Desktop and phone layouts are also reviewed visually.
