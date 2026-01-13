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

// app.get("/data", async (req, res) => {
//   try {
//     console.log("Api HIT");
//     const alldata = await Inventory.find();
//     if (!alldata) {
//       return res.json({ message: "feteching error ..." });
//     }
//     res.json({ message: "data fetch..", alldata });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ error: error });
//   }
// });

// app.get("/data/sort", async (req, res) => {
//   try {
//     const { page = 1, limit = 20, sortField, sortOrder } = req.query;

//     console.log("✅ /data/sort HIT", req.query);

//     const skip = (page - 1) * limit;

//     const sortQuery = {};
//     if (sortField && sortOrder) {
//       sortQuery[sortField] = sortOrder === "asc" ? 1 : -1;
//     }

//     const [rows, total] = await Promise.all([
//       Inventory.find({}).sort(sortQuery).skip(skip).limit(Number(limit)).lean(),
//       Inventory.countDocuments(),
//     ]);

//     res.json({ rows, total });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// app.get("/data/sort", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       sortField,
//       sortOrder,
//       ...filters
//     } = req.query;

//     console.log("hit the api end point ..");

//     const skip = (page - 1) * limit;

//     // Sorting
//     const sortQuery = {};
//     if (sortField) {
//       sortQuery[sortField] = sortOrder === "asc" ? 1 : -1;
//     }

//     // Filtering
//     const filterQuery = {};
//     Object.keys(filters).forEach((key) => {
//       filterQuery[key] = { $regex: filters[key], $options: "i" };
//     });

//     const [rows, total] = await Promise.all([
//       Inventory.find(filterQuery)
//         .sort(sortQuery)
//         .skip(skip)
//         .limit(Number(limit))
//         .lean(),
//       Inventory.countDocuments(filterQuery),
//     ]);

//     res.json({ rows, total });
//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

// post
// app.post("/api/inventory", async (req, res) => {
//   try {
//     const {
//       startRow = 0,
//       endRow = 20,
//       sortModel = [],
//       filterModel = {},
//     } = req.body;

//     const limit = endRow - startRow;
//     const skip = startRow;

//     const sortQuery = {};
//     sortModel.forEach((s) => {
//       sortQuery[s.colId] = s.sort === "asc" ? 1 : -1;
//     });

//     const filterQuery = {};

//     for (const field in filterModel) {
//       const filter = filterModel[field];

//       if (filter.filterType === "text") {
//         filterQuery[field] = {
//           $regex: filter.filter,
//           $options: "i",
//         };
//       }

//       if (filter.filterType === "number") {
//         if (filter.type === "greaterThan") {
//           filterQuery[field] = { $gt: filter.filter };
//         }
//         if (filter.type === "lessThan") {
//           filterQuery[field] = { $lt: filter.filter };
//         }
//       }

//       if (filter.filterType === "boolean") {
//         filterQuery[field] = filter.filter;
//       }
//     }

//     const [rows, totalCount] = await Promise.all([
//       Inventory.find(filterQuery)
//         .sort(sortQuery)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Inventory.countDocuments(filterQuery),
//     ]);

//     res.json({
//       rows,
//       totalCount,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// cors setup
// app.post("/data", async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       sortModel = [],
//       filterModel = {},
//       groupKeys = [], // Received from AG Grid
//       rowGroupCols = [], // Received from AG Grid
//     } = req.body;
//    console.log("backend hit")
//     // console.log("BACKEND REQUEST - groupKeys:", groupKeys);

//     const skip = (page - 1) * limit;

//     /* ===== 1. BUILD FILTERS (Your existing logic) ===== */
//     const filterQuery = {};
//     for (const field in filterModel) {
//       const f = filterModel[field];
//       if (field === "isActive" && f.filterType === "set") {
//         const booleanValues = f.values.map(
//           (val) => val === "true" || val === true
//         );
//         filterQuery[field] = { $in: booleanValues };
//         continue;
//       }
//       if (f.filterType === "text") {
//         filterQuery[field] = { $regex: f.filter, $options: "i" };
//       }
//       if (f.filterType === "number") {
//         const value = Number(f.filter);
//         if (f.type === "equals") filterQuery[field] = value;
//         if (f.type === "greaterThan") filterQuery[field] = { $gt: value };
//         if (f.type === "lessThan") filterQuery[field] = { $lt: value };
//       }
//     }

//     /* ===== 2. HANDLE GROUPING LOGIC ===== */

//     // SCENARIO A: Fetching the Top-Level Groups (A1, B2, C3, D4)
//     if (groupKeys.length === 0 && rowGroupCols.length > 0) {
//       const groupField = rowGroupCols[0].field; // usually "warehouseLocation"

//       const rows = await Inventory.aggregate([
//         { $match: filterQuery }, // Apply active filters first
//         {
//           $group: {
//             _id: `$${groupField}`, // Group by warehouseLocation
//             [groupField]: { $first: `$${groupField}` },
//             quantityInStock: { $sum: "$quantityInStock" }, // Enterprise Aggregation
//             sellingPrice: { $avg: "$sellingPrice" },
//             childCount: { $sum: 1 }, // Tells AG Grid how many items are inside
//           },
//         },
//         { $sort: { [groupField]: 1 } }, // Default alpha sort
//         { $skip: skip },
//         { $limit: limit },
//       ]);

//       // For groups, the total count is the number of unique groups
//       const totalCountResults = await Inventory.distinct(
//         groupField,
//         filterQuery
//       );

//       return res.json({
//         rows,
//         total: totalCountResults.length,
//       });
//     }

//     // SCENARIO B: Fetching items INSIDE a group (e.g., inside "A1")
//     if (groupKeys.length > 0) {
//       const groupField = rowGroupCols[0].field;
//       const groupValue = groupKeys[0];

//       // Add the group selection to the query
//       const groupFilter = { ...filterQuery, [groupField]: groupValue };

//       const [rows, total] = await Promise.all([
//         Inventory.find(groupFilter).skip(skip).limit(limit).lean(),
//         Inventory.countDocuments(groupFilter),
//       ]);

//       return res.json({ rows, total });
//     }

//     // SCENARIO C: Fallback (Flat list - no grouping active)
//     const sortQuery = {};
//     if (sortModel.length) {
//       sortQuery[sortModel[0].colId] = sortModel[0].sort === "asc" ? 1 : -1;
//     }

//     const [rows, total] = await Promise.all([
//       Inventory.find(filterQuery)
//         .sort(sortQuery)
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       Inventory.countDocuments(filterQuery),
//     ]);

//     res.json({ rows, total });
//   } catch (err) {
//     console.error("API ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// });


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
   console.log("group keys in backend",groupKeys);
    console.log(`Backend hit: Fetching from index ${start} with limit ${limit}`);

    // ✅ FIXED: AG Grid sends the exact index to skip as 'startRow' 
    // We mapped 'startRow' to 'start' in the frontend. 
    // So we use 'start' directly.
    const skip = parseInt(start); 

    /* ===== 1. BUILD FILTERS (Kept exactly as yours) ===== */
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

    /* ===== 2. HANDLE GROUPING LOGIC ===== */

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

    /* ===== SCENARIO C: Flat list ===== */
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
    const bulkOps = rows.map((row) => {
      const { _id, _isDirty, _isNew, ...cleanData } = row;
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
