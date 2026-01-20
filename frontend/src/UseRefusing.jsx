import React, { useRef, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;

const CATEGORY_VALUES = [
  "Electronics",
  "Furniture",
  "Office",
  "Accessories",
  "Home",
];

const WAREHOUSE_VALUES = ["A", "B", "C", "D", "E"];

const UseRefusing = () => {
  const gridRef = useRef(null);

  const editedRowIdsRef = useRef(new Set());
  console.log("Edit row Id in useRef", editedRowIdsRef);

  const EMPTY_ROW = {
    sku: "",
    warehouseLocation: "",
    category: "",
    sellingPrice: null,
    discountPercent: null,
    taxPercent: null,
    quantityInStock: null,
    minimumStockLevel: null,
    isActive: true,
    _isNew: true,
    _isSaved: false,
    _isDirty: false,
  };

  const [pinnedTopRowData, setPinnedTopRowData] = React.useState([
    { ...EMPTY_ROW },
  ]);

  const columnDefs = useMemo(
    () => [
      {
        field: "warehouseLocation",
        editable: true,
        cellEditor: "agRichSelectCellEditor",
        cellEditorPopup: true,
        cellEditorPopupPosition: "under",
        cellEditorParams: { values: WAREHOUSE_VALUES },
      },
      {
        field: "category",
        editable: true,
        cellEditor: "agRichSelectCellEditor",
        cellEditorPopup: true,
        cellEditorPopupPosition: "under",
        cellEditorParams: { values: CATEGORY_VALUES },

        valueSetter: (params) => {
          const newCategory = params.newValue;
          if (newCategory === params.data.category) return false;

          params.data.category = newCategory;

          const index = CATEGORY_VALUES.indexOf(newCategory);
          if (index >= 0) {
            params.data.warehouseLocation = WAREHOUSE_VALUES[index];
          }

          params.data._isDirty = true;

          params.api.refreshCells({
            rowNodes: [params.node],
            columns: ["warehouseLocation"],
            force: true,
          });

          return true;
        },
      },
      { field: "sku" },
      {
        field: "sellingPrice",
        editable: true,
        cellEditor: "agNumberCellEditor",
      },
      {
        field: "discountPercent",
        editable: true,
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const val = Number(params.newValue);
          if (isNaN(val) || val < 0 || val > 100) return false;

          params.data.discountPercent = val;
          params.data._isDirty = true;
          editedRowIdsRef.current.add(params.node.id);

          params.api.refreshCells({
            rowNodes: [params.node],
            columns: ["taxPercent"],
            force: true,
          });

          return true;
        },
      },
      {
        field: "taxPercent",
        editable: true,
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const tax = Number(params.newValue);
          const discount = Number(params.data.discountPercent);
          if (isNaN(tax) || tax > discount) return false;

          params.data.taxPercent = tax;
          params.data._isDirty = true;
          editedRowIdsRef.current.add(params.node.id);

          return true;
        },
      },
      { field: "quantityInStock", editable: true },
      { field: "minimumStockLevel", editable: true },
      {
        field: "isActive",
        cellEditor: "agCheckboxCellEditor",
      },
      { field: "createdAt" },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 150,
      sortable: true,
      resizable: true,
      editable: () => true,
    }),
    [],
  );

  const fetchbackendData = useCallback(
    () => ({
      getRows: async (params) => {
        const payload = {
          start: params.request.startRow,
          limit: params.request.endRow - params.request.startRow,
        };

        const res = await fetch("http://localhost:3000/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        params.success({ rowData: data.rows, rowCount: data.total });
      },
    }),
    [],
  );

  const onGridReady = useCallback((params) => {
    params.api.setGridOption("serverSideDatasource", fetchbackendData());
  }, []);

  return (
    <div className="ag-theme-quartz-dark" style={{ height: 700 }}>
      <button
        onClick={async () => {
          const dirtyRows = [];

          editedRowIdsRef.current.forEach((id) => {
            const node = gridRef.current.api.getRowNode(id);
            if (node?.data) dirtyRows.push(node.data);
          });

          if (!dirtyRows.length) {
            alert("No changes");
            return;
          }

          await fetch("http://localhost:3000/data/bulk-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: dirtyRows }),
          });

          editedRowIdsRef.current.clear();
          gridRef.current.api.refreshServerSide({ purge: false });

          alert("Saved successfully");
        }}
      >
        Save All Changes
      </button>

      <AgGridReact
        ref={gridRef}
        rowModelType="serverSide"
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pinnedTopRowData={pinnedTopRowData}
        pagination
        paginationPageSize={PAGE_SIZE}
        cacheBlockSize={PAGE_SIZE}
        // maxBlocksInCache={2}
        debug={true}
        onGridReady={onGridReady}
        stopEditingWhenCellsLoseFocus
        onCellValueChanged={(params) => {
          if (!params.node.rowPinned && params.oldValue !== params.newValue) {
            params.data._isDirty = true;
            editedRowIdsRef.current.add(params.node.id);
          }
        }}
        // rowClassRules={{
        //   "row-dirty": (params) =>
        //     !params.node.rowPinned && params.data?._isDirty,
        // }}
      />
    </div>
  );
};

export default UseRefusing;
