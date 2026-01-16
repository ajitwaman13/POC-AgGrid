import React, { useRef, useMemo, useCallback, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;

const ExcelInventoryBatchEditingGrid = () => {
  const gridRef = useRef(null);

  // =============================
  // Pinned (Add New Row)
  // =============================
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
  };

  const [pinnedTopRowData, setPinnedTopRowData] = useState([{ ...EMPTY_ROW }]);

  // =============================
  // Column Definitions
  // =============================
  const columnDefs = useMemo(
    () => [
      {
        field: "warehouseLocation",
        editable: true,
        filter: "agTextColumnFilter",
        enableRowGroup: true,
      },
      {
        field: "category",
        editable: true,
        enableRowGroup: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Electronics", "Furniture", "Office", "Accessories"],
        },
      },
      {
        field: "sku",
        filter: "agTextColumnFilter",
      },
      {
        field: "sellingPrice",
        editable: true,
        filter: "agNumberColumnFilter",
        cellEditor: "agNumberCellEditor",
      },
      {
        field: "discountPercent",
        editable: true,
        filter: "agNumberColumnFilter",
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const v = Number(params.newValue);
          if (isNaN(v) || v < 0 || v > 100) return false;
          params.data.discountPercent = v;
          return true;
        },
      },
      {
        field: "taxPercent",
        editable: true,
        filter: "agNumberColumnFilter",
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const tax = Number(params.newValue);
          const discount = Number(params.data.discountPercent);
          if (isNaN(tax) || tax < 0 || tax > 100 || tax > discount) return false;
          params.data.taxPercent = tax;
          return true;
        },
        cellClassRules: {
          "tax-invalid": (p) =>
            Number(p.data?.taxPercent) >
            Number(p.data?.discountPercent),
        },
      },
      {
        field: "quantityInStock",
        editable: true,
        filter: "agNumberColumnFilter",
        cellClassRules: {
          "low-stock-cell": (p) =>
            p.data.quantityInStock < p.data.minimumStockLevel,
        },
      },
      {
        field: "minimumStockLevel",
        editable: true,
        filter: "agNumberColumnFilter",
      },
      {
        field: "isActive",
        editable: true,
        filter: "agSetColumnFilter",
        cellEditor: "agCheckboxCellEditor",
        filterParams: { values: [true, false] },
      },
      {
        field: "createdAt",
        sort: "desc",
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleString() : "",
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 150,
      sortable: true,
      resizable: true,
      floatingFilter: true,
    }),
    []
  );

  // =============================
  // Server Side Datasource
  // =============================
  const datasource = useCallback(() => {
    return {
      getRows: async (params) => {
        const payload = {
          start: params.request.startRow,
          limit: params.request.endRow - params.request.startRow,
          sortModel:
            params.request.sortModel?.length > 0
              ? params.request.sortModel
              : [{ colId: "createdAt", sort: "desc" }],
          filterModel: params.request.filterModel,
          rowGroupCols: params.request.rowGroupCols,
          groupKeys: params.request.groupKeys,
        };

        try {
          const res = await fetch("http://localhost:3000/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          params.success({
            rowData: data.rows,
            rowCount: data.total,
          });
        } catch (e) {
          params.fail();
        }
      },
    };
  }, []);

  const onGridReady = useCallback((params) => {
    params.api.setGridOption("serverSideDatasource", datasource());
  }, [datasource]);

  // =============================
  // Batch Save
  // =============================
  const saveBatchChanges = async () => {
    const changedRows = [];

    gridRef.current.api.forEachNode((node) => {
      if (!node.rowPinned && node.data && node.data.__changed) {
        changedRows.push(node.data);
      }
    });

    if (!changedRows.length) {
      alert("No changes to save");
      return;
    }

    await fetch("http://localhost:3000/data/bulk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: changedRows }),
    });

    gridRef.current.api.refreshServerSide({ purge: false });
    gridRef.current.api.undoRedoService.clearUndoRedoStack();
  };

  // =============================
  // Cancel Batch
  // =============================
  const cancelBatch = () => {
    gridRef.current.api.undoRedoService.clearUndoRedoStack();
    gridRef.current.api.refreshServerSide({ purge: false });
  };

  // =============================
  // Add New Row
  // =============================
  const addPinnedRow = async () => {
    const row = gridRef.current.api.getPinnedTopRow(0).data;
    if (!row.sku) return alert("SKU is required");

    await fetch("http://localhost:3000/data/bulk-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: [row] }),
    });

    gridRef.current.api.refreshServerSide({ purge: false });
    setPinnedTopRowData([{ ...EMPTY_ROW }]);
  };

  // =============================
  // Render
  // =============================
  return (
    <div className="ag-theme-quartz-dark" style={{ height: 700 }}>
      {/* Toolbar */}
      <div style={{ marginBottom: 10 }}>
        <button onClick={() => gridRef.current.api.exportDataAsExcel()}>
          Export Excel
        </button>

        <button onClick={() => gridRef.current.api.undoRedoService.undo()}>
          Undo
        </button>

        <button onClick={() => gridRef.current.api.undoRedoService.redo()}>
          Redo
        </button>

        <button style={{ background: "green", color: "#fff" }} onClick={saveBatchChanges}>
          Save All
        </button>

        <button style={{ background: "orange" }} onClick={cancelBatch}>
          Cancel
        </button>

        <button style={{ marginLeft: 8 }} onClick={addPinnedRow}>
          Add Row
        </button>
      </div>

      <AgGridReact
        ref={gridRef}
        rowModelType="serverSide"
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pinnedTopRowData={pinnedTopRowData}
        pagination
        paginationPageSize={PAGE_SIZE}
        cacheBlockSize={PAGE_SIZE}
        onGridReady={onGridReady}

        /* 🔥 BATCH EDITING */
        editType="batch"
        undoRedoCellEditing
        undoRedoCellEditingLimit={100}
        stopEditingWhenCellsLoseFocus={false}

        /* UX */
        animateRows
        rowGroupPanelShow="always"
        groupDisplayType="groupRows"
        sideBar={{ toolPanels: ["columns", "filters"] }}
      />
    </div>
  );
};

export default ExcelInventoryBatchEditingGrid;
