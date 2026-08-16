Starting from the existing "One Turning World: Pakistan" application, add a restrained set of generated landmark sprites without redesigning the interface, globe, scroll system, typography, solar navigation, city ordering, or existing procedural choreography.

Use ImageGen to create original, immediately recognizable, isolated landmark cutouts:

**Islamabad:**
- Faisal Mosque, with its distinctive angular tent-fold silhouette and single minaret
- Pakistan Monument, with its four unfolding petal-shaped walls

**Karachi:**
- Mazar-e-Quaid (Jinnah's Mausoleum), with its white marble dome and geometric arches
- Merewether Clock Tower, with its Gothic stone detailing

**Lahore:**
- Badshahi Mosque, with its red sandstone domes and minarets
- Minar-e-Pakistan, with its distinctive tapering tiered tower

**Gwadar:**
- Koh-e-Batil lighthouse on its rocky coastal headland
- A traditional wooden fishing dhow with a raked mast

**Skardu:**
- K2 , a view of K2 
- Shigar Fort, with its traditional Balti timber-and-stone architecture

Do not add a Peshawar sprite. Keep Peshawar's carved-wood lattice, archway silhouettes, lantern points, and dust-mote particles procedural.

Generate each asset individually as a high-end cinematic architectural or heritage-object cutout:
- Realistic, recognizable proportions
- Clean complete silhouette
- Consistent editorial lighting
- Restrained materials and color
- No people
- No text or logos
- No skyline or unrelated scenery
- No ground or water plane extending beyond the object
- No generic planets, glossy orbs, or decorative objects unrelated to the city

Create true transparent assets, or generate them on a perfectly flat chroma-key background and remove it carefully. Optimize the final assets as transparent WebP files in `public/sprites`.

Replace weak structural 3D approximations with these landmark sprites. Keep Three.js geometry for atmospheric and decorative material: petals, leaves, particles, snow, sunset gradients, ribbons, facets, and small abstract fragments.

Add a data-driven sprite configuration containing each asset's entry point, focal point, exit point, scale, direction, orbit size, opacity, and focal position.

Animate the landmarks around the persistent globe as the user progresses through each city. Different landmarks should take focus at different moments, while the existing abstract choreography continues around them.

Do not show sprites belonging to inactive cities.