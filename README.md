# AutoFlow – Marketing Landing Page

Static, dependency-free landing page (HTML + CSS + vanilla JS) with a custom
canvas-based 3D engine in the logo's crimson / gold / black theme.

```
index.html            main page (12 sections)
privacy.html          privacy policy (linked from forms + footer)
404.html              not-found page
css/styles.css        all styles (design tokens at the top)
js/config.js          ★ EDIT THIS: form endpoints, analytics, email, phone, socials
js/scene3d.js         3D engine (faceted logo arrow, shards, dust)
js/main.js            nav, scroll effects, tabs, validation, form submit, analytics
assets/img/           logo + favicon + OG image
assets/team/          member-1..5.svg placeholders  → add member-N.jpg to replace
assets/screens/       drop real prototype PNGs here (see README.txt in that folder)
```

## 1. Things to replace before the viva
1. **Product name** – "AutoFlow" is a placeholder. Search & replace it in `index.html`, `privacy.html`, `404.html`, `site.webmanifest`.
2. **Team** – edit names / roles / descriptions in the `#team` section of `index.html`, then add square photos as
   `assets/team/member-1.jpg` … `member-5.jpg` (they appear automatically; update the `alt` text with real names).
3. **Prototype screens** – export your Figma frames as PNG and save with the names listed in `assets/screens/README.txt`.
   They replace the built-in mockups automatically.
4. **Contact details & socials** – `js/config.js`.
5. **Domain** – replace `https://autoflow.lk/` in `<head>` of `index.html`, `robots.txt`, `sitemap.xml` with your real domain.

## 2. Make the forms really deliver data
1. Create a free form at https://formspree.io (or Web3Forms / Getform). Create **two** forms: waitlist + contact.
2. Paste the endpoint URLs into `js/config.js → formEndpoints`.
3. Test: submit both forms – you receive an email and the submission appears in the dashboard.
Until then the page runs in *demo mode* (data only saved in the browser + a visible note).

## 3. Analytics
- Google Analytics 4: put your `G-XXXXXXXXXX` in `ga4Id`. Events sent: `waitlist_signup`, `contact_submit`, `cta_click`, `showcase_tab`, `generate_lead`.
- Or Plausible: set `plausibleDomain`.

## 4. Publish with your own domain + HTTPS (free options)
**Cloudflare Pages / Netlify / Vercel / GitHub Pages** – all give free HTTPS.
1. Push this folder to your team's Git repo (`git init && git add . && git commit -m "Landing page"`).
2. Connect the repo to the host (no build command, publish directory = `/`).
3. Buy a `.lk` (ldf.lk / register.lk) or `.com` domain, add it in the host's *Custom domain* settings, and create the DNS records they show you.
4. Wait for the HTTPS certificate (usually minutes), then open the site on phone + laptop.

## 5. Local preview
```
python3 -m http.server 8000   # then open http://localhost:8000
```
