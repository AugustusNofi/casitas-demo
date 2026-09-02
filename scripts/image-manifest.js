const STYLE_SUFFIX =
  "warm golden-hour or bright midday natural light, joyful editorial travel-" +
  "photography style, vivid but natural colors, high detail, no text, no " +
  "watermark, no logos, no visible brand names, no real recognizable people";

const IMAGES = [
  { file: "hero-banner.jpeg", aspectRatio: "16:9", prompt:
    "A sun-drenched Mediterranean coastal village on a summer morning: " +
    "whitewashed houses with terracotta roofs cascading down a hillside " +
    "toward a turquoise sea, small fishing boats in a harbor, bougainvillea " +
    "in bloom, wide-angle hero shot, small distant figures only, " + STYLE_SUFFIX },

  { file: "costa-brava-apartment-interior.jpeg", aspectRatio: "4:3", prompt:
    "Bright modern apartment living room with a private balcony overlooking " +
    "the sea, white walls, rattan furniture, potted plants, linen curtains " +
    "moving in a breeze, Costa Brava coastline visible outside, " + STYLE_SUFFIX },
  { file: "costa-brava-villa-pool.jpeg", aspectRatio: "4:3", prompt:
    "Exterior of a whitewashed Mediterranean villa with a private infinity " +
    "pool, sun loungers, pine trees, view of a rocky Costa Brava cove in the " +
    "background, midday light, " + STYLE_SUFFIX },

  { file: "andalucia-casa-rural-courtyard.jpeg", aspectRatio: "4:3", prompt:
    "Traditional Andalusian courtyard (patio) with terracotta tile floor, " +
    "a central fountain, potted geraniums on whitewashed walls, wrought-" +
    "iron balconies, dappled shade from an olive tree, " + STYLE_SUFFIX },
  { file: "andalucia-white-village-house.jpeg", aspectRatio: "4:3", prompt:
    "Exterior of a whitewashed pueblo blanco house with a narrow cobbled " +
    "street, flower pots on the walls, blue shuttered windows, warm morning " +
    "light, Andalusian hill-town setting, " + STYLE_SUFFIX },

  { file: "algarve-villa-infinity-pool.jpeg", aspectRatio: "4:3", prompt:
    "Modern single-story villa with an infinity pool that appears to merge " +
    "with the ocean horizon, limestone cliffs of the Algarve coast in the " +
    "distance, wooden sun deck, minimalist architecture, " + STYLE_SUFFIX },
  { file: "algarve-apartment-bright-interior.jpeg", aspectRatio: "4:3", prompt:
    "Airy beachside apartment bedroom with a large window showing the " +
    "Algarve coastline, light wood furniture, woven textiles, a surfboard " +
    "leaning in the corner, relaxed coastal-Portugal feel, " + STYLE_SUFFIX },

  { file: "sardinia-villa-pergola.jpeg", aspectRatio: "4:3", prompt:
    "Stone villa exterior with a wooden pergola covered in grapevines, " +
    "outdoor dining table set for a meal, umbrella pines, dry Mediterranean " +
    "garden, Sardinian countryside light, " + STYLE_SUFFIX },
  { file: "sardinia-seaview-terrace.jpeg", aspectRatio: "4:3", prompt:
    "Private terrace apartment with two lounge chairs, a small table with " +
    "coffee cups, turquoise Sardinian sea visible below cliffs, granite rock " +
    "formations, bright clear-sky morning, " + STYLE_SUFFIX },

  { file: "greek-island-cycladic-house.jpeg", aspectRatio: "4:3", prompt:
    "Classic Cycladic-style house exterior: cubic whitewashed walls, " +
    "sky-blue shutters and door, bougainvillea climbing a low wall, narrow " +
    "stone steps, Aegean sea glimpsed in the distance, " + STYLE_SUFFIX },
  { file: "greek-island-poolside-sea-view.jpeg", aspectRatio: "4:3", prompt:
    "Small private plunge pool on a whitewashed terrace overlooking the " +
    "Aegean Sea and distant islands, blue-cushioned daybed, terracotta " +
    "pots with herbs, bright Greek midday light, " + STYLE_SUFFIX },

  { file: "icon-pool.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of a swimming pool with a " +
    "diving board, simple geometric shapes, two-color palette (coral and " +
    "teal), transparent background, friendly rounded style, no text" },
  { file: "icon-pet-friendly.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of a happy dog paw print inside " +
    "a house outline, simple geometric shapes, coral and teal two-color " +
    "palette, transparent background, friendly rounded style, no text" },
  { file: "icon-sea-view.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of waves and a sun over the " +
    "horizon framed by a window shape, coral and teal two-color palette, " +
    "transparent background, friendly rounded style, no text" },
  { file: "icon-wifi.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of a wifi signal symbol inside " +
    "a rounded square badge, coral and teal two-color palette, transparent " +
    "background, friendly rounded style, no text" },
  { file: "icon-kitchen.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of a chef's hat and cooking pot, " +
    "simple geometric shapes, coral and teal two-color palette, transparent " +
    "background, friendly rounded style, no text" },
  { file: "icon-parking.jpeg", aspectRatio: "1:1", prompt:
    "Flat minimalist line-icon illustration of a letter P parking symbol " +
    "inside a rounded square badge, coral and teal two-color palette, " +
    "transparent background, friendly rounded style, no text" },

  { file: "host-portrait.jpeg", aspectRatio: "4:3", prompt:
    "A friendly-looking fictional host in their 40s standing in the sunlit " +
    "doorway of a bright Mediterranean home, warm genuine smile, casual " +
    "summer clothing, holding a set of keys, welcoming body language, " + STYLE_SUFFIX },
];

module.exports = { IMAGES };
