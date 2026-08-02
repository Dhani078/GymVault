// Web Ad Banner Component
// 
// AdSense verification script is loaded via web/index.html <head> tag.
// Ad slots are NOT rendered until Google approves the site (status: "Sedang disiapkan").
// Rendering <ins class="adsbygoogle"> before approval causes AdSense to inject
// error iframes with unpredictable heights, which breaks the flex layout and
// pushes the bottom tab bar off-screen.
//
// Once AdSense status changes to "Siap" (Ready), uncomment the ad slot rendering below.

export default function DummyAdBanner() {
  // Return null until AdSense site approval is complete.
  // The verification script in web/index.html is sufficient for Google's crawler.
  return null;
}
