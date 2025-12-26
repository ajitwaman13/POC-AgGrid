import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    // Core identity
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
    },

    // Category & classification
    category: {
      type: String,
      index: true,
    },
    subCategory: {
      type: String,
    },
    brand: {
      type: String,
      index: true,
    },

    // Pricing
    costPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
    },

    // Stock & warehouse
    quantityInStock: {
      type: Number,
      required: true,
      index: true,
    },
    minimumStockLevel: {
      type: Number,
      default: 10,
    },
    warehouseLocation: {
      type: String,
    },

    // Supplier info
    supplierName: {
      type: String,
    },
    supplierContact: {
      type: String,
    },

    // Status & flags
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isReturnable: {
      type: Boolean,
      default: true,
    },

    // Dates
    manufactureDate: {
      type: Date,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    lastRestockedAt: {
      type: Date,
    },

    // Metadata
    createdBy: {
      type: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Inventory", inventorySchema);
