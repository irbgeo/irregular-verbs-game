# Notes

- Plain JSON of Progress with 133 words = 7 101 chars > VK value limit 4 096
  → two keys + short word codes (`go=s14`); measured worst case ~2 100 and
  ~1 300 chars.
- VK theme comes in `VKWebAppUpdateConfig` (`appearance` in apps, `scheme`
  `vkcom_dark` / `space_gray` on web); subscribe before `VKWebAppInit`.
- `window.confirm` is avoided: blocked in some VK web views → two-tap reset.
- `#0077FF` on white is 4.1:1 → small accent text uses `#006AE0`.
- Logo: 4 variants drawn on the design canvas (V3, crossed-out "ed", three
  steps, word card); owner chose **A "V3"** (best at 48 px, familiar to Russian
  learners). Outlines + VK icon sizes are stage 6 work.
