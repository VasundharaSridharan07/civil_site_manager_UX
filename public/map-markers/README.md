# Map markers

Drop your custom device marker assets in this folder. They are served as static
files by Vite at runtime under `${import.meta.env.BASE_URL}map-markers/{file}`
and referenced by `src/components/ProjectMapView.tsx`.

## Format

- Preferred: **SVG**, 48 x 48 viewBox, transparent background.
- Acceptable: **PNG**, 48 x 48 logical px (96 x 96 actual for retina).
- The complete visual (status-colored circle, ring, glyph) should be baked into
  each file. The code does **not** apply a tint or background; whatever ships
  in the file is what renders on the map.

If you ship PNG instead of SVG, change the extension constant in
`ProjectMapView.tsx` (`MARKER_EXT = 'svg'`) to `'png'`.

## Filename convention

`{deviceType-lowercased}-{status}.{svg|png}`

Expected files for the current `DEVICES` in `src/data/devices.ts`:

- `ec520-active.svg`, `ec520-idle.svg`, `ec520-offline.svg`
- `gcs900-active.svg`, `gcs900-idle.svg`, `gcs900-offline.svg`
- `sps986-active.svg`, `sps986-idle.svg`, `sps986-offline.svg`
- `tsc7-active.svg`, `tsc7-idle.svg`, `tsc7-offline.svg`
- `td520-active.svg`, `td520-idle.svg`, `td520-offline.svg`

## Fallback

If an asset is missing the map renders a built-in default marker via
`_fallback.svg`. Ship that file too if you want a custom fallback; otherwise
the bundled minimal pin renders.
