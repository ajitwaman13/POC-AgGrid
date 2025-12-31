import React, { useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const ComboBox = () => {
  const [rowData] = useState([
    { sku: "A1", category: "Electronics", brand: "Sony" },
    { sku: "A2", category: "Books", brand: "Penguin" },
    { sku: "A3", category: "Clothing", brand: "Zara" },
  ]);

  const columnDefs = useMemo(
    () => [
      { field: "sku", sortable: true },

      {
        field: "category",
        headerName: "Category (Searchable ComboBox)",
        editable: true,

        cellEditor: "agRichSelectCellEditor",
        cellEditorPopup: true, // 🔑 REQUIRED

        cellEditorParams: {
          values: [
            "Electronics",
            "Books",
            "Clothing",
            "Furniture",
            "Groceries",
            "Toys",
          ],
          allowTyping: true,
          filterList: true,
          searchType: "contains",
          highlightMatch: true,
          valueListMaxHeight: 200,
        },
      },
      { field: "brand", editable: true },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      resizable: true,
      sortable: true,
      editable: true,
    }),
    []
  );

  return (
    <div className="ag-theme-alpine" style={{ height: 400, padding: 20 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        stopEditingWhenCellsLoseFocus={true}
        theme={"legacy"}
      />
    </div>
  );
};

export default ComboBox;
