import type { TemplateDef } from "@/lib/templates";
import { dentalClear } from "./dental-clear";
import { dentalBold } from "./dental-bold";
import { aestheticCalm } from "./aesthetic-calm";
import { aestheticBold } from "./aesthetic-bold";
import { cafePoster } from "./cafe-poster";
import { cafeCalm } from "./cafe-calm";
import { restaurantCalm } from "./restaurant-calm";
import { restaurantBold } from "./restaurant-bold";
import { salonCalm } from "./salon-calm";
import { salonBold } from "./salon-bold";
import { spaCalm } from "./spa-calm";
import { spaBold } from "./spa-bold";
import { autoCalm } from "./auto-calm";
import { autoBold } from "./auto-bold";
import { gymCalm } from "./gym-calm";
import { gymBold } from "./gym-bold";
import { officeCalm } from "./office-calm";
import { officeBold } from "./office-bold";
import { resortCalm } from "./resort-calm";
import { resortBold } from "./resort-bold";
import { hvacCalm } from "./hvac-calm";
import { hvacBold } from "./hvac-bold";
import { chiroCalm } from "./chiro-calm";
import { chiroBold } from "./chiro-bold";

// Register every template here. CATALOG.md and FINGERPRINTS.md mirror this list.
export const templateList: TemplateDef[] = [
  dentalClear,
  dentalBold,
  aestheticCalm,
  aestheticBold,
  cafeCalm,
  cafePoster,
  restaurantCalm,
  restaurantBold,
  salonCalm,
  salonBold,
  spaCalm,
  spaBold,
  autoCalm,
  autoBold,
  gymCalm,
  gymBold,
  officeCalm,
  officeBold,
  resortCalm,
  resortBold,
  hvacCalm,
  hvacBold,
  chiroCalm,
  chiroBold,
];

export const templates: Record<string, TemplateDef> = Object.fromEntries(templateList.map((t) => [t.id, t]));
