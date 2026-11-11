# aisocnews post generator

Paste an aisocnews.com link, get ready-to-post LinkedIn images. The tool reads the page, fills 23 post
templates rebuilt 1:1 from Figma, lets you check and edit the data, and exports PNG at the Figma frame size
(1080 × 1080 or 1080 × 1350).

Templates come from the Figma file **Social-Media-Assets** (key `Je7RFQscEKud8DLm93jxUW`), page **Cyber
Futurists**: section **Website content · Square · Set 2** (node `2901:316`), plus the Top 1 mover single post
(`2869:1573`) and the Top 4 grid (`2869:4152`). They are locked: only the data changes.

## Run it

Needs Node 18 or newer. No install step, no dependencies.

```bash
node server.js
```

Then open http://localhost:8770. The small server is required: aisocnews.com sends no CORS headers, so a
browser cannot read it directly. The server only proxies `aisocnews.com` pages and serves this folder.

## Use it

1. Paste an aisocnews.com link. The page is read as soon as you paste (or press **Read page** / Enter).
2. The tool reads the page (plus its European view and its report view, for the full maturity map) and fills all 23 posts.
3. Pick a category in the header, then a post from the thumbnails. The post that matches your link opens first.
4. Check the preview. Company names and logos can be changed in the left panel; every other value (numbers,
   dates, titles, text) comes from the website as it is. See "What you can change" for the three exceptions.
5. **Download PNG** saves the current post. **Download all** saves all 23.

Before you paste a link, the tabs show the sample copy from Figma.

## Post types

The header tabs are the categories; the thumbnails under them are the posts in that category. Click a
thumbnail to open it. The thumbnails are live: they show the data the post will export.

| Category | Post | Figma frame | Size | Filled from |
|---|---|---|---|---|
| Movers | Single post | `2869:1573` (and `1762`, `1868`, `1974`, `2080`) | 1080 × 1080 | One of the top five start-ups; **Company shown** picks #1–#5 |
| Movers | Top 4 grid | `2869:4152` | 1080 × 1350 | Ranks 1–4 of the start-up Top 40 |
| Movers | Ranked list | `2901:386` | 1080 × 1080 | Five ranks of the Top 40; **Ranks shown** picks 1–5 … 36–40 |
| Movers | Europe | `2901:493` | 1080 × 1080 | Top 3 of the European view |
| Movers | Incumbents | `2901:592` | 1080 × 1080 | Top 40 including incumbents: highest incumbent + top 5 |
| Movers | Top 5, dark / light | `2886:286` / `2886:355` | 1080 × 1350 | Ranks 1–5 with stage and drivers |
| Movers | #1 finding | `2869:8339` | 1080 × 1350 | The #1 start-up and the top-5 momentum chart |
| Market | In numbers | `2901:317` | 1080 × 1080 | Section counts, article count, vendors tracked |
| Market | Maturity map | `2902:330` | 1080 × 1080 | Stage of this week's top 13 start-ups; innovating / hiring / raised counts |
| Market | Maturity arc | `2919:348` | 1080 × 1350 | Every start-up as a dot on the site's maturity map (read from the report view), top 10 numbered and listed |
| Market | Hiring | `2895:295` | 1080 × 1350 | Top 5 by open roles, split by function |
| Market | Most discussed | `2895:417` | 1080 × 1350 | Earned mentions, this period against the one before |
| Market | Market moves | `2895:595` | 1080 × 1350 | The three newest moves, one per vendor |
| Market | Launches | `2897:309` | 1080 × 1080 | The three newest product launches |
| Market | Most covered | `2897:386` | 1080 × 1080 | The two subjects with the most articles in 7 days |
| Analysis | Analyst radar | `2902:432` | 1080 × 1080 | First two analyst reports that name vendors |
| Analysis | Case study | `2895:530` | 1080 × 1350 | The newest case study |
| Analysis | Our analysis | `2897:452` | 1080 × 1080 | The newest long-form piece and its headline figure |
| Analysis | Market brief | `2897:510` | 1080 × 1080 | The newest market-brief note |
| Voices | Practitioners | `2902:502` | 1080 × 1080 | First three social posts |
| Voices | Vendor debates | `2902:564` | 1080 × 1080 | First two vendors in Thought leadership |
| Voices | Thought leadership | `2897:567` | 1080 × 1080 | The newest vendor post, as one quote |

All 23 are always generated; the link only decides which one opens (`region=europe`, `section=…`, `#mm-…`;
anything else opens the single post). `days=7`, `30` or `90` in the link sets the reporting period (default 30).

The rank chips (**Ranks shown**, **Company shown**) work before you paste a link: Ranks shown reads
aisocnews.com for you, Company shown uses the Figma sample ranking until a page is read.

Not included: the blank format templates in the Figma section "Templates · Light" (no site data behind them).

## What you can change

Company names and logos, on every post. Everything else is copied from the website and locked, except
three pieces the website does not have, which someone has to write:

- **Practitioners**: the three statements. They start as each post's own first sentence; paraphrase them.
- **Vendor debates**: the topic chip on each card. It starts as "Thought leadership".
- **Case study**: the three steps of the diagram (text and label). They start as "Before", the vendor, "After".

Worth a look before posting, though locked:

- **Our analysis, Market brief**: the headline figure and its caption are picked out of the summary text by
  pattern.
- **Most covered**: the vendor name is guessed from the subject line when the vendor is not in the ranking
  (a company name, so you can correct it).
- **Layout warnings** appear under the preview (text cut, missing logo, fewer items than the template has).

## Edge cases

| Case | What happens |
|---|---|
| Logo not found | The tile shows the company's initials and a warning appears. Upload a logo in that row. |
| Fewer items than the template needs | The post shows what there is and a warning says how many are filled. |
| Long names, big numbers, long quotes | Text shrinks to fit its box; if it still does not fit at the minimum size it is cut with `…` and a warning appears. |
| Section missing from the page | That post keeps the Figma sample copy and a line under the link field names it. Nothing is shown when every post was filled. |

Logos: 18 vendors use the logo files from Figma (`assets/logos/`). Every other vendor uses the logo embedded
in the aisocnews.com page. Renaming a company swaps in its known logo unless you uploaded one.

## Template rules (from Figma)

- Canvas 1080 × 1080 (Top 4: 1080 × 1350). Set 2 frames: content column `x = 80`, width 920, header at
  `y = 70`, footer text at `y = 976`. Top mover and Top 4 use an 88px margin and a 904px column.
- Top mover: pink card (gradient `#de63a8` → `#d84898`), 620 × 420, rotated 7°, over a `#212225` depth
  block; the rocket and the three hairlines are the Figma SVGs, placed at their Figma positions.
- Two themes: dark `#212225` (text `#f5f5f7` / `#c5c6d1`) and light `#c5c6d1` (text `#16191a` / `#212225`).
- Font Geist: titles Medium with `-0.02em` tracking, everything else Regular. Secondary text is 70% opacity.
- Dark cards `#25262b` with a 2px dashed `#343543` border, radius 8. Light cards `#e2e3eb` / `#d1d2de`,
  radius 8, shadow `0 12 32 -8 rgba(33,34,37,0.06)`.
- Logo tile `#e2e3eb`, radius 6, logo fitted inside 75% of the tile, never stretched.
- Chips: radius 6, padding 6 × 12. Colours `#e3dfe6`, `#8da4ef`, `#d5ae39`, `#5bb98b`.
- The `cyber futurists` wordmark and EU badge are the Figma SVGs, never redrawn.
- Film grain is generated to match the Figma noise effect (measured from the Figma renders, not exported).

Exact coordinates are in `js/templates.js`, one function per frame.

## Files

| File | What it does |
|---|---|
| `server.js` | Static server + `/api/fetch` proxy, limited to aisocnews.com |
| `index.html` | Page markup; a few additions to the shared stylesheet |
| `css/system.css` | The banner generator's stylesheet, copied unchanged |
| `js/pillnav.js` | The banner generator's pill nav, copied unchanged |
| `js/templates.js` | Drawing helpers, the first ten renderers and their Figma sample copy |
| `js/templates-rankings.js`, `-portrait.js`, `-square.js`, `-arc.js` | The other thirteen renderers, added through `PostTemplates.register()` |
| `dev/compare.html`, `dev/ref/` | Dev tool: Figma frame, our render and the difference side by side (`?k=<post key>`) |
| `js/extract.js` | Reads the page HTML and builds each post's data |
| `js/app.js` | Fields, tabs, reading a link, export |
| `assets/` | Wordmark glyphs, EU badge, rocket and hairlines, vendor logos (all from Figma), footer logo |

The UI follows the banner generator's design system (dark, one accent `#8fa8ff`, Geist, no uppercase, weights
≤ 500, white focus ring on inputs, accent ring on buttons).

## If the site changes

`js/extract.js` reads the page by its structure: the two "Top 40 Movers" panels, the `section=` links with
"All N" counts, the Research firms / Social / Thought leadership sections, and the maturity map dots. If a
post stops filling after a site redesign, that file is the place to look.
