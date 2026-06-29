# Team Avatar — animated promo (Lottie)

A 15-second looping advertisement for **oh-my-cursor / Team Avatar**, authored as a
standard Bodymovin **Lottie** animation (`v5.7.0`, 1280×720, 30 fps).

Storyboard: ember intro → **TEAM AVATAR** wordmark over the campfire hero → the 8
agents pop in as a roster (name + role, element-colored rings) → a macOS terminal types
the real `curl … | bash` install → a red **COMMIT BLOCKED** stamp slams over an `as any`
commit → CTA outro. Then it loops.

## Files

| File | What it is |
| --- | --- |
| `team-avatar-promo.json` | The Lottie animation. Plays in any [lottie-web](https://github.com/airbnb/lottie-web) player. **This is the deliverable.** |
| `index.html` | Standalone preview (lottie-web from CDN) with a scrub bar. |
| `build-promo.mjs` | Generator that produced the JSON. |
| `src-img/`, `dims.json` | Embedded art (campfire hero + 8 agent faces, downscaled) the generator reads. |

## Preview

```bash
cd assets/promo
python3 -m http.server 8731
# open http://localhost:8731/index.html
```

## Embed

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js"></script>
<div id="ad" style="aspect-ratio:16/9"></div>
<script>
  lottie.loadAnimation({ container: document.getElementById('ad'),
    renderer: 'svg', loop: true, autoplay: true, path: 'team-avatar-promo.json' });
</script>
```

## Regenerate

The text is vectorized with `opentype.js` (no font dependency at playback) and the art is
base64-embedded, so the JSON is fully self-contained.

```bash
node build-promo.mjs           # writes team-avatar-promo.json
```

Requirements (macOS): `opentype.js` (resolved from the sibling `text-to-lottie` checkout —
override with `TEXT_TO_LOTTIE=/path`), and the system fonts Lato (Black/Bold/Heavy) +
Courier New Bold. To re-export an MP4/GIF, render the JSON with any Lottie renderer
(e.g. `lottie-web` + a headless capture, or `puppeteer`).
