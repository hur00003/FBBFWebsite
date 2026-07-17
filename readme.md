# Fire Breathing Blowfish — WordPress theme

A custom theme for the Fire Breathing Blowfish dragon boat team (Portland,
OR): Home, About, Races, Gallery, Race Day Gallery, Merch, Sponsors, and
Donate. Built from the team's brand design system — no page builder, no
paid plugins (Merch is real WooCommerce + Printful, both free plugins).

## 1. First-time setup

1. Activate the theme under **Appearance → Themes** (if you haven't
   already — activating it once automatically fills every page with the
   real 2026 season content: races, sponsors, costume-parade photos, and
   gallery photos, so the site is never empty). Merch products come from
   your real Printful catalog instead — see section 2a.
2. Go to **Settings → Permalinks** and click **Save** once — this turns on
   clean URLs for the Races/Sponsors/Products/etc. sections.
3. Under **Pages → Add New**, create one page for each row below, and under
   **Page Attributes → Template** (in the right-hand sidebar) pick the
   matching template. The page's exact title doesn't matter — the URL slug
   is what the navigation menu and internal links use, so keep the slugs
   as shown:

   | Slug (URL)          | Template            |
   |----------------------|----------------------|
   | `about`               | About               |
   | `races`               | Races               |
   | `gallery`             | Gallery             |
   | `race-day-gallery`    | Race Day Gallery    |
   | `sponsors`            | Sponsors            |
   | `donate`              | Donate              |

   The homepage needs no page at all — it renders automatically at your
   site's root address. **Merch doesn't get a template either** — see
   section 2a, it's WooCommerce's own Shop page.

## 2. Editing content you'll change often

Everything below is a normal WordPress post type with its own entry in the
left-hand admin menu — no special plugin, no page builder. Add, edit, or
delete entries the same way you would a blog post.

- **Races** — one post per race. Fill in the date, location, and result
  (leave Result set to "Upcoming" until a race has actually happened, then
  switch it to Gold/Silver/Bronze). The Races page sorts by date
  automatically.
- **Sponsors** — one post per sponsor logo on the Sponsors page wall. Set
  the post's **Featured Image** to their logo and (optionally) their
  website URL.
- **Gallery Categories** — this is what controls the *tabs* on the Gallery
  page (and the matching sections on Race Day Gallery). Find it under
  **Gallery Photos → Gallery Categories** in the left-hand admin menu. Add
  a new term and a new tab appears on the live site automatically — no
  code, no developer needed. Each term has:
  - **Name** — the tab label (e.g. "Salem Costumes").
  - **Description** — an optional sub-heading shown under the tab's title.
  - **Tab order** — a plain number field on the term's add/edit screen;
    lower numbers show first. "Best Of The Blowfish" always shows first
    regardless of this — it isn't a real category (see below).
- **Gallery Photos** — one post per photo/video tile. Assign it to a
  **Gallery Category** (in the right-hand box, same as tagging a blog post)
  to place it on that tab. Fields:
  - **Featured Image** — the tile's cover photo.
  - **Additional photos** — the "Manage Additional Photos" button lets you
    attach a small set of extra photos to one tile. On the live site that
    tile gets a "+N" badge and clicking it opens all of them in a
    prev/next lightbox — handy for a tile that should show several shots
    from the same moment instead of making a separate tile for each.
  - **Caption** — shown under the tile.
  - **Year** / **Costume theme** — fill both in for costume-parade photos
    and the tile shows "Theme · Year" as its caption automatically.
  - **Video File URL** — use the **Choose Video** button to make the tile
    a video instead of a photo; add a **Badge label** (e.g. "Drone · 2026")
    to show a small tag on it.
  - **Featured in "Best Of The Blowfish"** — a checkbox, not a category.
    Check it on any photo in any category to also show it on the Best Of
    tab — this is how that tab gets its hand-picked mix instead of pulling
    from one folder.
  - **Feature large in grid** — makes the tile show bigger in its grid.
  - The **Section** dropdown only matters for the small photo strip on the
    Home page — leave it blank for anything meant for the Gallery/Race Day
    Gallery pages. **That strip only supports photos, not video** — if a
    post you want to feature there is a video, set a screenshot of it as
    the Featured Image and use the **Instagram Post URL** field so the
    tile still links to the real post on Instagram (where the video
    actually plays) instead of just your profile.

Anywhere you see a dashed "drop a photo here" box on the live site, that's
a reserved empty slot — add a new Gallery Photo (or Race) entry in the
matching category/section and it takes that spot automatically.

## 2a. Merch store (WooCommerce + Printful)

The Merch page is a real WooCommerce store — WooCommerce's own **Shop**
page is set to your existing `/merch/` URL, so there's no separate page
template for it (it won't appear in the Pages list as something you edit
directly). WooCommerce and the Printful plugin are already installed and
active. To finish connecting it to your real catalog:

1. **Connect Printful**: wp-admin → **Printful** in the left sidebar →
   follow its "Connect your Printful account" flow. This requires logging
   into your own Printful account, so it has to be done by someone with
   those credentials — not something that can be scripted for you.
2. **Sync your catalog**: once connected, Printful → Store Setup lets you
   choose which products to sync into WooCommerce. Give each product a
   category (Products → Categories already has Tees & Jerseys, Hoodies,
   Hats, Stickers, Drinkware, Totes ready to use) so the Merch page's
   filter chips have something to filter.
3. **Set up a payment method**: WooCommerce → Settings → Payments. You'll
   need your own account with whichever processor you choose (Stripe,
   PayPal, etc.) — same as Printful, this is an account-linking step only
   the club can do.
4. **Turn off "Coming Soon" mode when ready**: WooCommerce defaults to
   hiding store pages behind a "coming soon" placeholder until you
   explicitly launch it. This is currently turned **off** so the Merch
   page shows real content immediately — if you'd rather hide the store
   until it's fully stocked, WooCommerce → Home has a "Launch your store"
   control to toggle it back on.

Until a real catalog is synced, the Merch page correctly shows WooCommerce's
own "no products found" message rather than anything broken.

## 3. Things intentionally left as code, not admin fields

- **Sponsorship tier names, prices, and perks** (Gold $750+ / Silver
  $400–$749 / Bronze up to $399) are the club's real published terms —
  they're hard-coded in `page-sponsors.php` on purpose so they can't be
  accidentally edited. Ask your developer to update that file if the terms
  change.
- **EIN** — `45-4172338`, hard-coded in the Sponsors page trust block
  (`page-sponsors.php`, search for `EIN:`). Update it there if it ever changes.
- The **sponsor inquiry form** (Sponsors page) and the **Donate** page's
  Square checkout link both work for real: the inquiry form emails
  `thefirebreathingblowfish@gmail.com` and saves a copy under **Sponsor
  Inquiries** in wp-admin; Donate sends people to the club's real Square
  checkout page.

## 4. Fonts

"Giant Head" (display headings) and "Giant Head Two" are self-hosted in
`assets/fonts/`. "Fredoka" (body text) loads from Google Fonts — the site
needs an internet connection for that one font.

## 5. Directory map

```
functions.php          theme setup, enqueues, includes
header.php / footer.php  global nav + footer
front-page.php          Home
page-about.php          About
page-races.php          Races
page-gallery.php        Gallery
page-race-day-gallery.php  Race Day Gallery
page-sponsors.php       Sponsors (tiers + inquiry form)
page-donate.php         Donate
inc/cpt-*.php           Races / Sponsors / Gallery Photos post types + Gallery Category taxonomy
inc/meta-boxes.php      shared admin-field rendering (no ACF dependency)
inc/forms.php           sponsor inquiry AJAX handler + email
inc/gallery-ajax.php    Gallery page "load more" AJAX handler
inc/seed-content.php    one-time real-content seeding on first activation
inc/helpers.php, inc/template-tags.php   small shared render helpers
inc/woocommerce.php     Merch store hooks (shop hero, filter bar, cart drawer)
woocommerce/content-product.php   product-card override for the shop loop
assets/css/tokens/      colors, typography, spacing, effects, fonts
assets/css/site.css     all page/component styles
assets/css/woocommerce.css   Merch store styling
assets/js/main.js       share buttons, donate tiles, sponsor form, mobile nav, lightbox
assets/js/gallery.js    Gallery page tab switching + "load more"
assets/js/woocommerce.js   cart drawer open/close
assets/images/, assets/video/   brand assets and real team photography/video
```
