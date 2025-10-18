const ROOT_URL =
  process.env.NEXT_PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

/**
 * MiniApp configuration object. Must follow the Farcaster MiniApp specification.
 *
 * @see {@link https://miniapps.farcaster.xyz/docs/guides/publishing}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjEzOTEzOTEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhlMTI4MWFGRjVBQjY1RDIyMWFjYzZkM0U3QjA3NjJFRTA5MzlBMTJBIn0",
    payload: "eyJkb21haW4iOiJuZXctbWluaS1hcHAtcXVpY2tzdGFydC1pbmRvbC1wc2kudmVyY2VsLmFwcCJ9",
    signature: "73OcY3lc5hmUFORKy0iMpGYVD+2dE87Yl9YGTBJtC+J2D3jLmeld9QMdOYXXlj2hzLcgqE4lxJsRpdNTprXkqRw="
  },
  miniapp: {
    version: "1",
    name: "Cubey", 
    subtitle: "Your AI Ad Companion", 
    description: "Ads",
    screenshotUrls: [`${ROOT_URL}/screenshot-portrait.png`],
    iconUrl: `${ROOT_URL}/blue-icon.png`,
    splashImageUrl: `${ROOT_URL}/blue-hero.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "social",
    tags: ["marketing", "ads", "quickstart", "waitlist"],
    heroImageUrl: `${ROOT_URL}/blue-hero.png`, 
    tagline: "",
    ogTitle: "",
    ogDescription: "",
    ogImageUrl: `${ROOT_URL}/blue-hero.png`,
    noindex: true

  },
  baseBuilder : {
    ownerAddress: "0x117379afFF198d6F7d4A9Ea3438ED9DD94418dAA"
  }
} as const;

