// "Keep them fresh": the scroll journey on DV Shop Cebu's home page (preview-only).
// Kriv's angle 3 (2026-11-17): buying is half the story, DV Shoe Care is the other half.
// Every fact comes from dvshopcebu.com or the shop's Carousell profile, checked 2026-11-17
// (see docs/leads/dv-shop-cebu/public-data.json). No reviews are quoted, no results are
// promised, and the refund policy's "all sales are final" means no money-back promise.
// Photos are the shop's own, hotlinked from its store and credited to it: private preview only,
// and the DV Shop team approves them before anything goes public.
import type { JourneyStep } from "./dental-journey";

const cdn = (file: string, width = 1200) => `https://dvshopcebu.com/cdn/shop/files/${file}?width=${width}`;

export type SneakerStep = JourneyStep & { photo: string; photoAlt: string; fit?: "cover" | "contain" };

export const sneakerPhotos = {
  storefront: cdn("IMG_5502.jpg"),
  cafe: cdn("IMG_5526.jpg"),
  logo: cdn("dv_shop_logo.png", 640),
};

export const sneakerJourney: SneakerStep[] = [
  { id: "fresh", chapter: "Fresh out of the box", title: "Legit pairs lang, always.", narration: "Every pair at DV Shop Cebu is inspected before it's yours. That's usually where a sneaker story ends. Here, it's only halfway.",
    photo: cdn("nike-air-force-1-low-triple-white-cw2288-111-side-view.jpg"), photoAlt: "Nike Air Force 1 Low \"Triple White\", side view, from DV Shop Cebu's store", fit: "contain" },
  { id: "legit", chapter: "The legit half", title: "From Clicks to Kicks.", narration: "Online since 2020, working directly with trusted suppliers. Nike, Air Jordan, New Balance, On, Onitsuka Tiger, Adidas, Puma, Converse, Asics, Salomon and Golden Goose, each pair checked first.",
    photo: sneakerPhotos.storefront, photoAlt: "The DV Shop Cebu storefront in Celadon Town: the DV logo on the glass and the sneaker wall inside" },
  { id: "out", chapter: "Then the pair goes out", title: "Sneakers are made to be worn.", narration: "Jeepney rides, a quick rain, the first scuff in the first week. Buying them is half the story.",
    photo: cdn("nike-air-force-1-low-triple-white-cw2288-111-on-feet-view.jpg"), photoAlt: "Nike Air Force 1 Low \"Triple White\" on feet, from DV Shop Cebu's store" },
  { id: "care", chapter: "The other half", title: "DV Shoe Care.", narration: "DV Shop's own line, made for the pairs it sells: the Cleaning Kit, Shoe Cleaner, Sole White, Shoe Deodorizer, Shoe Wipes, and a Paddle Cleaner for the pickleball crowd.",
    photo: cdn("dv-shoe-cleaner-kit-100ml-front.jpg"), photoAlt: "The DV Shoe Cleaning Kit: brush, DV Shoe Cleaner bottle and cloth", fit: "contain" },
  { id: "routine", chapter: "A routine, not a rescue", title: "Small habits, fresh pairs.", narration: "Wipes in the bag for the quick touch-up. The cleaner for the weekend clean: organic oils, made for leather, canvas, nylon, rubber, vinyl, cotton, mesh and suede. Sole White for the midsoles.",
    photo: cdn("dv-shoe-cleaner-100ml-in-use.png"), photoAlt: "DV Shoe Cleaner label and how-to-use steps, from DV Shop Cebu's store", fit: "contain" },
  { id: "visit", chapter: "Come by Celadon Town", title: "Sneakers, and coffee inside.", narration: "The online shop opened its own doors in 2022, in Celadon Town, Lapu-Lapu City. Open daily, 11am to 8pm, with DV Cafe pouring coffee inside.",
    photo: sneakerPhotos.cafe, photoAlt: "Inside DV Shop Cebu: the SNEAKERS & Coffee neon, jerseys on the wall and café tables" },
  { id: "anywhere", chapter: "Wherever you are", title: "Legit pairs. Kept fresh.", narration: "Cash on delivery nationwide, plus card, e-wallets, BPI, GCash, Maya and SPayLater. Shipping nationwide and worldwide. Rated 5.0 from 75 reviews on Carousell.",
    photo: sneakerPhotos.logo, photoAlt: "The DV Shop Cebu logo", fit: "contain" },
];

/** DV Shoe Care, as listed on dvshopcebu.com/collections/dv-shoe-care (2026-11-17). */
export const shoeCare = [
  { name: "DV Shoe Cleaning Kit", size: "Set", price: 420, photo: cdn("dv-shoe-cleaner-kit-100ml-front.jpg", 640), use: "Brush, cleaner and cloth in one set." },
  { name: "DV Shoe Cleaner", size: "100ml", price: 180, photo: cdn("dv-shoe-cleaner-100ml-front.png", 640), use: "Organic oils with colloidal oatmeal. Clean and recondition." },
  { name: "DV Shoe Sole White", size: "100ml", price: 180, photo: cdn("dv-shoe-sole-white-100ml-front.png", 640), use: "For the midsoles." },
  { name: "DV Shoe Deodorizer", size: "100ml", price: 200, photo: cdn("dv-shoe-deodorizer-100ml-front.png", 640), use: "For after the clean, once the pair is dry." },
  { name: "DV Shoe Wipes", size: "1 pack, 30 pcs", price: 90, photo: cdn("shoe-cleaning-wipes-portable-care.png", 640), use: "For the bag and the quick touch-up." },
  { name: "DV Paddle Cleaner", size: "Spray", price: 250, photo: cdn("dv-paddle-cleaner-front.png", 640), use: "For pickleball paddles." },
] as const;

/** A few of the store's own best sellers, with the prices on dvshopcebu.com (2026-11-17). */
export const bestSellers = [
  { name: "Adidas Samba OG \"Cloud White\"", price: 6500, photo: cdn("adidas-samba-og-cloud-white-b75806-side-view.jpg", 640) },
  { name: "Nike Dunk Low \"Panda\"", price: 5500, photo: cdn("nike-dunk-low-panda-dd1391-100-side-view.jpg", 640) },
  { name: "Air Jordan 1 Low OG \"Chicago\"", price: 9000, photo: cdn("air-jordan-1-low-og-chicago-hq6998-600-side.jpg", 640) },
  { name: "New Balance 1906R \"White Metallic Gold\"", price: 8500, photo: cdn("new-balance-1906r-white-metallic-gold-m1906ra-side-view.jpg", 640) },
  { name: "On Cloudtilt \"Black Ivory\"", price: 12000, photo: cdn("on-cloudtilt-black-ivory-3me10101430-side-view.jpg", 640) },
  { name: "Asics Gel-Kayano 14 \"Birch Pure Silver\"", price: 10000, photo: cdn("asics-gel-kayano-14-birch-pure-silver-1203a537-200-side.jpg", 640) },
] as const;

export const peso = (n: number) => `₱${n.toLocaleString("en-PH")}`;
