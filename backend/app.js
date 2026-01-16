import express from "express";
import mongoose from "mongoose";
import Inventory from "./db.js";
import multer from "multer";
import xlsx from "xlsx";
import cors from "cors";
import { CLIENT_RENEG_LIMIT } from "node:tls";
const app = express();

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/aggrid");
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB Error:", err);
    process.exit(1);
  }
}

// db
connectDB();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.get("/test", (req, res) => {
  res.status(200).json({ message: "okay it is running.." });
});


app.post("/data", async (req, res) => {
  try {
    const {
      start = 0,        // Changed from 'page' to 'start' to match AG Grid
      limit = 20,
      sortModel = [],
      filterModel = {},
      groupKeys = [],
      rowGroupCols = [],
    } = req.body;
   console.log("data fetching api hiting ..")
    // console.log(`Backend hit: Fetching from index ${start} with limit ${limit}`);

    const skip = parseInt(start); 

//  filter logic
    const filterQuery = {};
    for (const field in filterModel) {
      const f = filterModel[field];
      if (field === "isActive" && f.filterType === "set") {
        const booleanValues = f.values.map(
          (val) => val === "true" || val === true
        );
        filterQuery[field] = { $in: booleanValues };
        continue;
      }
      if (f.filterType === "text") {
        filterQuery[field] = { $regex: f.filter, $options: "i" };
      }
      if (f.filterType === "number") {
        const value = Number(f.filter);
        if (f.type === "equals") filterQuery[field] = value;
        if (f.type === "greaterThan") filterQuery[field] = { $gt: value };
        if (f.type === "lessThan") filterQuery[field] = { $lt: value };
      }
    }

// grouping 
    if (groupKeys.length === 0 && rowGroupCols.length > 0) {
      const groupField = rowGroupCols[0].field;

      const rows = await Inventory.aggregate([
        { $match: filterQuery },
        {
          $group: {
            _id: `$${groupField}`,
            [groupField]: { $first: `$${groupField}` },
            quantityInStock: { $sum: "$quantityInStock" },
            sellingPrice: { $avg: "$sellingPrice" },
            childCount: { $sum: 1 },
          },
        },
        { $sort: { [groupField]: 1 } },
        { $skip: skip }, 
        { $limit: limit },
      ]);
// total count row
      const totalCountResults = await Inventory.distinct(groupField, filterQuery);

      return res.json({
        rows,
        total: totalCountResults.length,
      });
    }

    if (groupKeys.length > 0) {
      const groupField = rowGroupCols[0].field;
      const groupValue = groupKeys[0];
      const groupFilter = { ...filterQuery, [groupField]: groupValue };

      const [rows, total] = await Promise.all([
        Inventory.find(groupFilter).skip(skip).limit(limit).lean(), // ✅ Fixed
        Inventory.countDocuments(groupFilter),
      ]);

      return res.json({ rows, total });
    }

//  sorting logic
    const sortQuery = {};
    if (sortModel.length) {
      sortQuery[sortModel[0].colId] = sortModel[0].sort === "asc" ? 1 : -1;
    } else {
      sortQuery["createdAt"] = -1; // Default sort
    }

    const [rows, total] = await Promise.all([
      Inventory.find(filterQuery)
        .sort(sortQuery)
        .skip(skip) 
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filterQuery),
    ]);

    res.json({ rows, total });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


app.put("/bulk/update", async (req, res) => {
  try {
    console.log("Bulk update API hit");

    const { rows } = req.body;
    console.log("ROw ", rows);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        message: "rows must be a non-empty array",
      });
    }

    // 2️⃣ Prepare bulk operations
    const bulkOps = rows.map((row) => {
      const { _id, ...updateData } = row; //remove _id from update

      return {
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(_id) }, // ObjectId
          update: { $set: updateData },
        },
      };
    });

    // 3️⃣ Execute bulk update
    const result = await Inventory.bulkWrite(bulkOps);

    res.status(200).json({
      message: "Bulk update successful",
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("BULK UPDATE ERROR:", error);

    res.status(500).json({
      message: "Bulk update failed",
      error: error.message,
    });
  }
});

// new data
app.post("/data/bulk-create", async (req, res) => {
  try {
    console.log(req.body);
    const newdata = await Inventory.insertMany(req.body.rows);
    console.log(newdata);
    res.status(200).json({ newdata });
  } catch (error) {
    res.status(400).json({error:"bulk create failed"})
  }
});

const upload = multer({ storage: multer.memoryStorage() });
app.post("/upload-excel", upload.single("file"), (req, res) => {
  try {
    console.log("file recived", req.file);
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const jsonData = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );
    console.log(jsonData);
    res.status(200).json(jsonData);
  } catch (error) {
    res.status(500).json({ error: "Excel parse failed" });
  }
});

// 2. Smart Sync (Upsert)
app.post("/data/bulk-sync", async (req, res) => {
  try {
    const { rows } = req.body;
    console.log("backend getting the Rows",rows)
    const bulkOps = rows.map((row) => {
      const { _id, _isDirty, _isNew, ...cleanData } = row;
      console.log("_id is the ",_id)
      return {
        updateOne: {
          filter: { sku: cleanData.sku }, // Unique Identifier
          update: { $set: cleanData },
          upsert: true, // Create if not found
        },
      };
    });
    const result = await Inventory.bulkWrite(bulkOps);
    console.log(result);
    res.status(200).json({ message: "Sync successful", result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("server runing at the 3000");
});
