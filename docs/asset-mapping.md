# AquaCircle image inventory and mapping

Inspected the supplied Downloads files before implementation. Originals are preserved in `assets/originals`. The supplied full-page reference is `website-main.png` (724 × 2172 PNG), matching the warm white, teal and photographic service-card homepage attached in the brief. `AquaCircle water care in Kolkata.png` is an alternate full-page composition, retained only as a secondary reference. No separate `image(3).png` footer reference was found.

## Hero sources

All sources are PNG. Crops below use source pixels `(left, top, right, bottom)`. Optimized WebP crops have no baked-in heading, navigation, controls, or CTA.

| Slide | Subject | Original filename and dimensions | Text/UI | Crop | Output |
| --- | --- | --- | --- | --- | --- |
| 01 Installation | RO purifier in a kitchen, circled by a water ribbon | `slider-bg-1.png`, 1585 × 992 | Product markings only; no page UI | (580, 0, 1585, 992) | `/images/hero/installation.webp` |
| 02 Routine care | Water pouring into a clear glass within a droplet composition | `slider-bg-2.png`, 1586 × 992 | None | (570, 0, 1586, 992) | `/images/hero/routine.webp` |
| 03 Filters | Three filter cartridges displayed on aqua glass plinths | `slider-bg-3.png`, 1586 × 992 | None | (620, 40, 1586, 992) | `/images/hero/filters.webp` |
| 04 Repairs | Gloved hands inspecting an open filter housing on an aqua workbench | `slider-bg-4.png`, 1586 × 992 | None | (560, 0, 1586, 992) | `/images/hero/repair.webp` |
| 05 Reinstallation | Modern aqua kitchen with an under-sink purifier and moving box | `AquaCircle Reinstallation in a Modern Kitchen-1.png`, 1586 × 992 | Original includes page UI; removed by photographic-region crop | (650, 86, 1586, 806) | `/images/hero/reinstallation.webp` |

Use `object-fit: cover` with center positioning, optionally 55% center for the installation slide. Supplied compositions retain their aqua light and water forms. The full clean sources are retained; mobile can use the same dedicated crops without inheriting blank left-hand copy space.

## Other inspected reference files

`Aqua clarity in a teardrop-3.png`, `AquaCircle filter studio in aqua ribbons-2.png`, and `Top-down repair on a turquoise workbench-4.png` are 1586 × 992 complete hero mockups with baked-in page UI. Their clean `slider-bg-*` equivalents are used instead. `AquaCircle 50% Off Water Purifier Offers.png` is an offer poster; it is excluded because prices and contact details are unverified. No competitor content is used.

## Service photography

The service thumbnails in the 724-pixel-wide homepage reference are too small for sharp desktop use. Four original illustrative photographs are generated through the built-in ImageGen tool, following that reference's warm sunlit cream kitchen, Indian technician, dark teal polo and restrained editorial photographic style. They are illustrations of the service process, not verified staff portraits. Generated originals are preserved in `assets/generated`.

The filters card uses a separate close crop of the supplied filter studio. The help-choosing-service card uses a bright kitchen crop from the supplied reinstallation photograph. The about photograph reuses the installation source with a dedicated crop; no two service cards share a photograph.

### ImageGen prompts

Common specification: photorealistic-natural, wide landscape editorial service photograph for a premium Kolkata water purifier company website; warm natural afternoon window light, cream tiled domestic kitchen, pale stone counter, realistic textures, dark teal work polo, no text, branding, watermark, border, labels or UI. Human anatomy and tools must be credible.

1. Installation: side profile of an Indian male technician in his early thirties, short wavy dark hair and trimmed beard, dark teal polo with subtle beige piping, carefully connecting a small white inlet hose beneath a clean white wall-mounted domestic water purifier. Medium-wide shot; technician at left, purifier at right, sunlit leafy plant at edge. Focus on hands and equipment.
2. Routine cleaning: close-up of a white-gloved hand wiping the outside of a transparent cylindrical filter housing with a pale blue cloth, attached beneath a white domestic water purifier in a warm cream kitchen. No face; precise, tactile detail; warm sunlight, shallow depth of field.
3. Diagnosis: side profile of an Indian male technician, wavy dark hair, trimmed beard, teal polo, examining the interior of an open white wall-mounted water purifier with a small flashlight. Realistic filter housings and tubing, no dangerous live electrical work. Hands and face visible, warm cream kitchen.
4. Reinstallation: Indian male technician in a dark teal polo, viewed from a rear three-quarter angle, aligning a clean white domestic water purifier onto an existing wall mounting in a cream kitchen. Both hands supporting the unit, moving box subtly visible below, warm natural light.

## Final derivative manifest and alt text

All assets were visually reviewed. The four generated photographs contain no UI, logos or lettering and keep the reference's warm light and teal uniforms. The fifth hero crop excludes every baked-in interface element. Run `node scripts/prepare-assets.mjs` to regenerate the optimized files from the preserved sources using Sharp.

| Public path | Dimensions | Suggested alt text |
| --- | --- | --- |
| `/images/hero/installation.webp` | 1005 × 992 | Water purifier in an aqua kitchen surrounded by a flowing water ribbon |
| `/images/hero/routine.webp` | 1016 × 992 | Fresh water pouring into a clear glass |
| `/images/hero/filters.webp` | 966 × 952 | Water filter cartridges and a membrane on translucent aqua stands |
| `/images/hero/repair.webp` | 1026 × 992 | Gloved hands inspecting a purifier filter housing |
| `/images/hero/reinstallation.webp` | 936 × 720 | Aqua kitchen with an under-sink purifier and a moving box |
| `/images/services/installation.webp` | 1200 × 800 | Technician connecting the inlet hose of a wall-mounted purifier |
| `/images/services/routine.webp` | 1200 × 800 | Gloved hand carefully cleaning a transparent filter housing |
| `/images/services/repair.webp` | 1200 × 800 | Technician inspecting purifier filters and tubing with a flashlight |
| `/images/services/filters.webp` | 931 × 795 | Three replacement water filter components on aqua stands |
| `/images/services/reinstallation.webp` | 1200 × 800 | Technician positioning a water purifier on its wall mounting |
| `/images/services/guidance.webp` | 901 × 564 | Bright modern kitchen with an under-sink water purifier |
| `/images/about/about.webp` | 1300 × 900 | Careful connection checks during a water purifier installation |

Generated originals: `assets/generated/installation.png`, `routine.png`, `repair.png`, `reinstallation.png`. Tool: built-in ImageGen, not API/CLI fallback. No production business identities or contact details were inferred from imagery.
