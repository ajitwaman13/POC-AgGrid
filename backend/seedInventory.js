import mongoose from "mongoose";
import Inventory from "./db.js";

// 🔹 DB connection
const MONGO_URI = "mongodb://127.0.0.1:27017/aggrid";
const TOTAL = 6000;

// 🔹 Helpers
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const categories = ["Electronics", "Furniture", "Office", "Accessories"];
const subCategories = ["Mobile", "Laptop", "Chair", "Table", "Monitor"];
const brands = ["Apple", "Samsung", "Dell", "HP", "Lenovo", "Sony"];
const warehouses = ["A1", "B2", "C3", "D4"];
const suppliers = ["ABC Traders", "Global Supply", "Prime Distributors"];

function generateItem(i) {
  const cost = random(1000, 40000);
  const price = cost + random(500, 8000);

  return {
    sku: `SKU-${100000 + i}`,
    name: `Product ${i + 1}`,
    description: `Auto generated inventory item ${i + 1}`,

    category: pick(categories),
    subCategory: pick(subCategories),
    brand: pick(brands),

    costPrice: cost,
    sellingPrice: price,
    discountPercent: random(0, 30),
    taxPercent: 18,

    quantityInStock: random(0, 500),
    minimumStockLevel: random(5, 20),
    warehouseLocation: pick(warehouses),

    supplierName: pick(suppliers),
    supplierContact: `9${random(100000000, 999999999)}`,

    isActive: Math.random() > 0.1,
    isReturnable: Math.random() > 0.2,

    manufactureDate: new Date(2022, random(0, 11), random(1, 28)),
    expiryDate: new Date(2026, random(0, 11), random(1, 28)),
    lastRestockedAt: new Date(),

    createdBy: "seed-script",
    notes: "Inserted for AG Grid testing",
  };
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    // OPTIONAL: clear old data
    await Inventory.deleteMany({});
    console.log("🗑 Old inventory cleared");

    const data = Array.from({ length: TOTAL }, (_, i) => generateItem(i));

    await Inventory.insertMany(data);
    console.log(`🚀 ${TOTAL} inventory records inserted`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
