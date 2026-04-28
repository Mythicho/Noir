export type Product = {
  id: string;
  name: string;
  origin: string;
  category: string;
  price: number;
  blurb: string;
  description: string;
  image: string;
  gallery: string[];
  tastingNotes: string[];
  importNote: string;
  outOfStock?: boolean;
  _deleted?: boolean;
};

export const PRODUCTS: Product[] = [
  {
    id: "kitkat-matcha",
    name: "Japanese Matcha KitKat",
    origin: "Shizuoka, Japan",
    category: "Japanese",
    price: 1299,
    blurb: "Japan-only green tea wafers with a mellow matcha snap.",
    description: "A cult Japanese KitKat flavor built around creamy white chocolate and green tea character. The wafer is light and crisp, while the coating brings a grassy, bittersweet matcha note that feels far more refined than a regular candy bar.",
    image: "https://images.unsplash.com/photo-1614088684717-be21ff992eb9?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1614088684717-be21ff992eb9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Green tea", "Creamy wafer", "Soft bitterness", "Japanese confectionery"],
    importNote: "Imported on demand from Japanese retail lots. Flavors rotate by availability.",
  },
  {
    id: "buldak-ramen",
    name: "Samyang Buldak Fire Noodles",
    origin: "South Korea",
    category: "Korean",
    price: 599,
    blurb: "Viral Korean fire noodles with intense spicy chicken flavor.",
    description: "The famous Samyang Buldak ramen that took the internet by storm. These thick, chewy noodles are coated in a fiery gochugaru-based sauce with roasted chicken notes. Available in original, 2x spicy, carbonara, and cheese variants.",
    image: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Fire spice", "Chewy noodles", "Roasted chicken", "Addictive heat"],
    importNote: "Imported directly from Korean manufacturers. Check variant preference in order notes.",
  },
  {
    id: "takis-fuego",
    name: "Takis Fuego Rolled Tortilla Chips",
    origin: "Mexico / USA",
    category: "American",
    price: 899,
    blurb: "Intense chilli-lime rolled chips rarely found in Indian stores.",
    description: "Takis Fuego is loud, acidic and unapologetically spicy. Each rolled tortilla chip is coated with a hot chilli-lime seasoning that hits fast, stays crunchy and makes it one of the most requested imported snack drops.",
    image: "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621447504864-d8686e12698c?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Chilli", "Lime", "Corn crunch", "High heat"],
    importNote: "Sourced from North American distributors. Stock moves quickly because of short drop windows.",
  },
  {
    id: "pocky-strawberry",
    name: "Glico Pocky Strawberry",
    origin: "Osaka, Japan",
    category: "Japanese",
    price: 449,
    blurb: "Classic Japanese biscuit sticks dipped in strawberry cream.",
    description: "The iconic Pocky stick with sweet strawberry coating over a crispy biscuit base. A perfect balance of fruity sweetness and buttery crunch that has made it Japan's most beloved snack export.",
    image: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Strawberry cream", "Buttery biscuit", "Light crunch", "Sweet finish"],
    importNote: "Authentic Japanese import, not the international reformulation.",
  },
  {
    id: "hot-cheetos-limon",
    name: "Cheetos Flamin' Hot Limon",
    origin: "USA",
    category: "American",
    price: 999,
    blurb: "Crunchy cheese puffs with chilli heat and lime acid.",
    description: "The American Flamin Hot Limon profile balances cheesy corn crunch with bright lime and chilli powder. It is one of the most recognizable US snack flavors and a frequent import request.",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2uj68?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1568702846914-96b305d2uj68?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Chilli", "Lime", "Cheese", "Corn crunch"],
    importNote: "Limited US import stock; best enjoyed fresh because spice coatings soften over time.",
  },
  {
    id: "korean-honey-butter",
    name: "Korean Honey Butter Chips",
    origin: "South Korea",
    category: "Korean",
    price: 749,
    blurb: "Sweet-salty potato chips with buttered honey aroma.",
    description: "A Korean snack classic with a glossy sweet-salty profile. The chips open with butter and honey, then finish with potato crispness that makes them dangerously easy to finish.",
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Honey", "Butter", "Potato", "Sweet-salty"],
    importNote: "Imported through Korean snack suppliers in small carton quantities.",
  },
  {
    id: "ramune-soda",
    name: "Japanese Ramune Soda Set",
    origin: "Osaka, Japan",
    category: "Drinks",
    price: 1199,
    blurb: "Marble-sealed Japanese soda bottles in rotating flavors.",
    description: "Ramune is as much ritual as refreshment: pop the marble seal, watch the fizz lift, then sip a crisp Japanese soda. This set rotates through melon, original, strawberry and yuzu-style flavors.",
    image: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Fizz", "Melon", "Citrus", "Candy soda"],
    importNote: "Glass bottles are packed with extra insulation and ship only in metro-safe lanes.",
  },
  {
    id: "oreo-cakesters",
    name: "Oreo Cakesters Soft Cakes",
    origin: "USA",
    category: "American",
    price: 1099,
    blurb: "Soft Oreo-style snack cakes with vanilla creme filling.",
    description: "A nostalgic American snack with two soft chocolate cakes wrapped around classic creme. It eats more like a whoopie pie than a biscuit, making it a fun import for collectors and Oreo fans.",
    image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=800&q=80",
    ],
    tastingNotes: ["Cocoa cake", "Vanilla creme", "Soft bite", "Sweet finish"],
    importNote: "Imported from US grocery drops when fresh-dated packs are available.",
  },
];
