// Previews never call, message or email the business and never send visitors
// elsewhere: outbound links render as <a> without href, which cannot be focused
// or followed. In-page anchors (#services, #top) stay live.
export const inert = { "aria-disabled": true, title: "Disabled in this concept preview" } as const;
