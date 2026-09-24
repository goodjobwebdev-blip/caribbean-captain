# Harbour illustrations

## Agreed direction

Each of the 15 towns gets a unique detailed painted adventure-game harbour illustration. The approved Bridgetown sample establishes the warm tropical light, textured brushwork, weathered waterfronts, rigging, boats and working-port activity. Coastlines, buildings and cargo details follow the game's town descriptions. These are atmospheric interpretations of the fictional game world, not historical reconstructions.

## Presentation

- Show the current town's painting above its harbour description, beneath the scene heading.
- Keep text and controls outside the artwork. Buildings, voyages and battles keep their existing presentation.
- Use a 2:1 desktop image and a shorter 5:2 central crop on mobile, with a subtle theme-aware border.
- Reserve image space while loading. Supply descriptive alt text. If loading fails, remove the image and retain the existing text and controls; entering another town retries with that town's image.
- No image-generation requests occur during play, and no API key is needed to view the art.

## Assets and hosting

Runtime images live in `public/images/harbours/<port-id>-640.webp` and `<port-id>-1280.webp`. The browser chooses one resolution from `srcset`; only the current harbour's image is requested. Vite's `BASE_URL` supports the existing `/caribbean-captain/` GitHub Pages deployment. Standard static assets need no additional hosting service.

The repository contains compressed WebP exports, not the large generated PNG originals. Export settings: 640×320 and 1280×640, WebP quality 80. Keep originals outside the repository. Source artwork was created using built-in image generation, with the approved Bridgetown image as a style reference for the other towns. The final generation prompts are recorded in `harbour-art-prompts.json`.

## Town coverage

Bridgetown, Saint-Pierre, Willemstad, Basse-Terre, Capsterville, St. John's, Philipsburg, San Juan, Santo Domingo, Port-au-Prince, Havana, Santiago, Port Royal, Tortuga and San Jose.

For a new town, generate artwork in this style, export both sizes under its port ID, and update the prompt record. Verify the image at full width and in the mobile crop, check asset coverage against `PORTS`, and run the production build.
