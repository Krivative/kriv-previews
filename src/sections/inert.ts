// Previews never call, message or email the business and never send visitors
// elsewhere: outbound links render as <a> without href, which cannot be focused
// or followed. In-page anchors (#services, #top) stay live. The one exception is
// the stock-photo credit in the footer (PhotoCredits in Chrome.tsx): Unsplash's
// API terms require live links to the photographer and to Unsplash.
export const inert = { "aria-disabled": true, title: "Disabled in this concept preview" } as const;
