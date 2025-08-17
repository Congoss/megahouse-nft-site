# Megahouse NFT Site (Static Starter)

Simple static site to showcase modular 400×300 apartment tiles (PNG). Ready for GitHub Pages.

## Structure
- `index.html` – main page with grid
- `style.css` – styles
- `script.js` – configure your tiles here
- `img/` – put your 400×300 PNG tiles here

## How to use
1. Upload this repository to GitHub (e.g., `megahouse-nft-site`).
2. Go to **Settings → Pages** → Source: `main` / Folder: `/root` (or `/docs` if you move files).
3. Open the URL shown by GitHub Pages.

## Add your tiles
- Place PNG 400×300 into `img/`
- Edit `script.js` and append objects to the `tiles` array:
```js
{ id:"aquarium-002", title:"Aquarium Container", owner:"you.near", src:"img/aquarium-002.png", attrs:{ type:"aquarium", format:"400x300" } }
```

> Tip: Keep exact 400×300 to avoid layout issues.
