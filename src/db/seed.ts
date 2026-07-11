import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.insert(products).values([
    {
    name: "Farm Fresh Whole Milk",
    description:
      "Pure, creamy whole milk sourced directly from local farms. Rich in calcium, protein, and essential vitamins. Perfect for drinking, cooking, and baking.",
    price: "68.00",
    image: "/images/fresh-milk.jpg",
    category: "Milk",
    stock: 200,
    unit: "1 Litre",
    isActive: true,
  },
  {
    name: "Natural Greek Yogurt",
    description:
      "Thick, creamy Greek yogurt made from fresh whole milk. Packed with probiotics and protein. Available in plain flavor - perfect with fruits and granola.",
    price: "120.00",
    image: "/products/yogurt.jpg",
    category: "Yogurt",
    stock: 150,
    unit: "400 gm",
    isActive: true,
  },
  {
    name: "Aged Cheddar Cheese",
    description:
      "Premium aged cheddar cheese with a sharp, rich flavor. Aged for 12 months for the perfect taste. Great for sandwiches, burgers, and cheese boards.",
    price: "349.00",
    image: "/products/cheese.jpg",
    category: "Cheese",
    stock: 100,
    unit: "200 gm",
    isActive: true,
  },
  {
    name: "Creamy Salted Butter",
    description:
      "Fresh churned salted butter made from pure cream. Rich, golden color with a smooth, creamy texture. Ideal for cooking, baking, and spreading.",
    price: "56.00",
    image: "/products/butter.jpg",
    category: "Butter",
    stock: 180,
    unit: "100 gm",
    isActive: true,
  },
  {
    name: "Heavy Whipping Cream",
    description:
      "Rich and luxurious heavy cream with 36% milk fat. Perfect for whipping, making sauces, soups, and desserts. Ultra-pasteurized for freshness.",
    price: "85.00",
    image: "/products/cream.jpg",
    category: "Cream",
    stock: 120,
    unit: "200 ml",
    isActive: true,
  },
  {
    name: "Fresh Paneer",
    description:
      "Soft, fresh paneer (cottage cheese) made from whole milk. Perfect for Indian curries, tikka, and grilled dishes. No preservatives added.",
    price: "99.00",
    image: "/products/paneer.jpg",
    category: "Paneer",
    stock: 80,
    unit: "200 gm",
    isActive: true,
  },
  {
    name: "Pure Desi Ghee",
    description:
      "Traditional clarified butter made from pure cow milk cream. Rich golden color with a nutty aroma. Perfect for cooking, frying, and traditional recipes.",
    price: "599.00",
    image: "/products/ghee.jpg",
    category: "Ghee",
    stock: 90,
    unit: "500 ml",
    isActive: true,
  },
  {
    name: "Low-Fat Milk",
    description:
      "Light and refreshing toned milk. All the goodness of whole milk with less fat. Great for health-conscious consumers and everyday use.",
    price: "54.00",
    image: "/products/fresh-milk.jpg",
    category: "Milk",
    stock: 250,
    unit: "1 Litre",
    isActive: true,
  },
  ]);

  console.log("✅ Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});