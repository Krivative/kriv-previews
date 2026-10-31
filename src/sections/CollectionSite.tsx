import type { SiteData } from "@/lib/site-schema";
import type { TemplateDef } from "@/lib/templates";
import type { SitePage } from "@/lib/site-pages";
import { Ribbon, Footer } from "./Chrome";
import { PageContent } from "./Pages";
import { CollectionNavigation } from "./CollectionParts";
import { collectionHomes, type CollectionComposition } from "./CollectionHomes";
import c from "./collection.module.css";
import s from "./sections.module.css";

export function CollectionSite({ site, template, page }: { site: SiteData; template: TemplateDef; page?: SitePage }) {
  const composition = template.composition as CollectionComposition;
  const Home = collectionHomes[composition];
  return <div className={`${c.root} ${c[composition]}`} data-composition={composition}>
    <Ribbon site={site} /><a href="#main-content" className={s.skipLink}>Skip to content</a>
    <div className={c.shell}><CollectionNavigation site={site} path={page?.path} />
      <main id="main-content" className={c.main}>
        {page && page.kind !== "home" ? <div className={c.detailSurface}><PageContent site={site} page={page} bold={template.look === "bold"} /></div> : <Home site={site} />}
      </main>
    </div>
    <div className={c.footer}><Footer site={site} /></div>
  </div>;
}
