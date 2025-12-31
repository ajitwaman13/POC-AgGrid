import express from "express";
import mongoose from "mongoose";
import Inventory from "./db.js";
import cors from "cors";
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
app.post("/data", async (req, res) => {
  try {
    const { page = 1, limit = 20, sortModel = [], filterModel = {} } = req.body;

    console.log("➡️ BACKEND BODY:", req.body);

    const skip = (page - 1) * limit;

    /* ===== SORT ===== */
    const sortQuery = {};
    if (sortModel.length) {
      sortQuery[sortModel[0].colId] =
        sortModel[0].sort === "asc" ? 1 : -1;
    }

    /* ===== FILTER ===== */
    const filterQuery = {};

    for (const field in filterModel) {
      const f = filterModel[field];

      /* ===== BOOLEAN (IMPORTANT FIX) ===== */
      if (field === "isActive") {
        const parsed = parseBoolean(f.filter);
        if (parsed !== null) {
          filterQuery[field] = parsed;
        }
        continue; // ⛔ stop here for boolean
      }

      /* ===== TEXT ===== */
      if (f.filterType === "text") {
        filterQuery[field] = {
          $regex: f.filter,
          $options: "i",
        };
      }

      /* ===== NUMBER ===== */
      if (f.filterType === "number") {
        const value = Number(f.filter);
        if (f.type === "equals") filterQuery[field] = value;
        if (f.type === "greaterThan") filterQuery[field] = { $gt: value };
        if (f.type === "lessThan") filterQuery[field] = { $lt: value };
      }
    }

    console.log("📦 FINAL FILTER:", filterQuery);
    console.log("↕️ SORT:", sortQuery);
    console.log("📏 SKIP:", skip, "LIMIT:", limit);

    const [rows, total] = await Promise.all([
      Inventory.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filterQuery),
    ]);
    // console.log(rows)

    res.json({ rows, total });
  } catch (err) {
    console.error(" API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// app.get("/data", async (req, res) => {
//   try {
//     console.log("➡️ BACKEND QUERY PARAMS:", req.query);

//     /* ===================== BASIC PARAMS ===================== */
//     const limit = parseInt(req.query.limit, 10) || 20;
//     const sortField = req.query.sortField || "_id";
//     const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

//     const sort = { [sortField]: sortOrder };
//     let filterQuery = {};

//     /* ===================== FILTERING ===================== */
//     if (req.query.filters) {
//       const filters = JSON.parse(req.query.filters);
//       console.log("🔍 PARSED FILTER MODEL:", filters);

//       Object.keys(filters).forEach((field) => {
//         const f = filters[field];

//         /* ---------- TEXT FILTER ---------- */
//         if (f.filterType === "text") {
//           filterQuery[field] = {
//             $regex: f.filter,
//             $options: "i",
//           };
//         }

//         /* ---------- NUMBER FILTER ---------- */
//         if (f.filterType === "number") {
//           const value = Number(f.filter);

//           if (f.type === "equals") {
//             filterQuery[field] = value; // ✅ exact match
//           }

//           if (f.type === "greaterThan") {
//             filterQuery[field] = { $gt: value };
//           }

//           if (f.type === "lessThan") {
//             filterQuery[field] = { $lt: value };
//           }

//           if (f.type === "greaterThanOrEqual") {
//             filterQuery[field] = { $gte: value };
//           }

//           if (f.type === "lessThanOrEqual") {
//             filterQuery[field] = { $lte: value };
//           }

//           if (f.type === "inRange") {
//             filterQuery[field] = {
//               $gte: Number(f.filter),
//               $lte: Number(f.filterTo),
//             };
//           }
//         }

//         /* ---------- SET FILTER (boolean / enum) ---------- */
//         if (f.filterType === "set") {
//           filterQuery[field] = { $in: f.values };
//         }
//       });
//     }

//     console.log("📦 FINAL MONGO QUERY:", filterQuery);
//     console.log("↕️ SORT:", sort);
//     console.log("📏 LIMIT:", limit);

//     /* ===================== QUERY ===================== */
//     const rows = await Inventory.find(filterQuery)
//       .sort(sort)
//       .limit(limit)
//       .lean();

//     res.json({ rows });
//   } catch (err) {
//     console.error("❌ API ERROR:", err);
//     res.status(500).json({ error: err.message });
//   }
// });



// update the table or data
app.put("/:id", async (req, res) => {
  try {
   console.log("Api hit editing ...")
   
   const id = req.params.id;
   const updateData = req.body;
   console.log("id ",id)
  //  console.log(id ,updateData)
  //   console.log("UPDATE ID:", id);
  //   console.log("UPDATE DATA:", updateData);

    const updatedRow = await Inventory.findByIdAndUpdate(
      id,
      updateData,
      { new: true}
    );
    // console.log(updatedRow)

    if (!updatedRow) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    res.status(200).json({
      message: "Data updated successfully",
      data: updatedRow,
    });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({
      message: "Failed to update data",
      error: error.message,
    });
  }
});


app.listen(3000, () => {
  console.log("server runing at the 3000");
});
