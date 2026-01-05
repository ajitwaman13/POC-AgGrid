// export const saveRowToServer = async (rowData) => {
//   try {
//     console.log("💾 SAVING ROW TO SERVER:", rowData);

//     const res = await fetch(`http://localhost:3000/${rowData._id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(rowData),
//     });

//     const data = await res.json();
//     console.log(" SAVE RESPONSE:", data);
//   } catch (err) {
//     console.error("SAVE FAILED:", err);
//   }
// };
// this import
export const saveRowToServer = async (rowData, gridApi) => {
  try {
    console.log("updating ..", gridApi);
    console.log("row data ", rowData);
    await fetch(`http://localhost:3000/${rowData._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rowData),
    });

    // ✅ clear dirty flag
    rowData._isDirty = false;

    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }
  } catch (err) {
    console.error("SAVE FAILED:", err);
  }
};

// utils/saveRowsToServer.js
export const saveRowsToServerBulk = async (rows, gridApi) => {
  try {
    console.log("💾 BULK SAVING ROWS:", rows.length);

    const res = await fetch("http://localhost:3000/bulk-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });

    // rowData._isDirty = false;
    // if (gridApi) {
    //   gridApi.refreshCells({ force: true });
    // }
    const data = await res.json();
    console.log("save the data", data);
    if (gridApi) {
      gridApi.refreshCells({ force: true });
    }

    return data;
  } catch (err) {
    console.error("failed:", err);
    throw err;
  }
};

// export const saveRowToServer = async (rowData, rowNode) => {
//   try {
//     await fetch(`http://localhost:3000/${rowData._id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(rowData),
//     });
//     console.log(rowData);

//     // ✅ clear highlight safely
//     rowNode.setDataValue("_isDirty", false);
//     // ✅ redraw ONLY this row (no focus loss)
//     rowNode.gridApi.redrawRows({ rowNodes: [rowNode] });
//   } catch (err) {
//     console.error("SAVE FAILED:", err);
//   }
// };

// export const saveRowToServer = async (rowData, rowNode) => {
//   try {
//     await fetch(`http://localhost:3000/${rowData._id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(rowData),
//     });

//     // clear dirty flag
//     rowNode.setDataValue("_isDirty", false);

//     // ✅ correct redraw
//     rowNode.api.redrawRows({ rowNodes: [rowNode] });
//   } catch (err) {
//     console.error("SAVE FAILED:", err);
//   }
// };

// export const saveRowToServer = async (rowData, gridApi) => {
//   try {
//     await fetch(`http://localhost:3000/${rowData._id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(rowData),
//     });

//     // 🔑 re-fetch live rowNode
//     const rowNode = gridApi.getRowNode(rowData._id);
//     if (!rowNode) return;

//     // clear highlight
//     rowNode.setDataValue("_isDirty", false);

//     // redraw only this row (no focus loss)
//     gridApi.redrawRows({ rowNodes: [rowNode] });
//   } catch (err) {
//     console.error("SAVE FAILED:", err);
//   }
// };
