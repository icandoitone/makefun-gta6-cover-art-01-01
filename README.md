# Vice Sunset — Cover Maker

A fully offline web app that turns your photos and a caption into
multi-panel cover art in the style of GTA 6 posters: a Vice City
sunset / neon colour grade, bold caption lettering, and a comic-book
panel collage. Export the finished cover as a PNG in 1080 x 1080,
1080 x 1350, or 1920 x 1080.

## Use it

Serve `app/` with any static file server and open `index.html` in a
desktop browser. No network is used: every file the app loads lives
under `app/`, and your photos are read on your own machine, never
uploaded.

1. Pick photos: upload up to three of your own, or use the two built-in
   samples, or the procedurally drawn sunset scene.
2. Pick a layout: Collage, Hero Split, or Strips.
3. Click a panel to select it, then set its photo, crop (drag to pan,
   scroll to zoom) and colour grade.
4. Write the title and subtitle, pick a title theme.
5. Choose an export size and press Export PNG.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor's look, motion tokens included
- `app/src/cover.js` — the cover rendering engine (layouts, grades,
  lettering, the drawn sunset scene)
- `app/src/main.js` — the editor: state, uploads, panel editing,
  export, self-test
- `app/samples/` — two sample photos, free to use
- `main.ts` — the entry program: copies `app/` and `screenshots/`
  to the output directory and writes `dossier.json`
- `screenshots/` — renders of the app at work

Everything here is original work. No Rockstar Games logo, artwork,
character or font is used anywhere.

## License

MIT — see `LICENSE`.
