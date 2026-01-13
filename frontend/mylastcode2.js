import React, { useRef, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

// Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;

const ExcelInventoryEnterpriseGrid = () => {
  const gridRef = useRef(null);

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
  };

  const [pinnedTopRowData, setPinnedTopRowData] = React.useState([
    { ...EMPTY_ROW },
  ]);

  const columnDefs = useMemo(
    () => [
      {
        field: "warehouseLocation",
        enableRowGroup: true,
        filter: "agTextColumnFilter",
        editable: true,
      },
      {
        field: "category",
        enableRowGroup: true,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Electronics", "Furniture", "Office", "Accessories"],
        },
        editable: true,
      },
      {
        field: "sku",
        filter: "agTextColumnFilter",
      },
      {
        field: "sellingPrice",
        filter: "agNumberColumnFilter",
        editable: true,
        cellEditor: "agNumberCellEditor",
        // valueFormatter: (price) =>
        //   price.value ? `$${price.value.toFixed(2)}` : "",
      },
      {
        field: "discountPercent",
        editable: true,
        filter: "agNumberColumnFilter",
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const value = Number(params.newValue);
          if (isNaN(value) || value < 0 || value > 100) return false;
          params.data.discountPercent = value;
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
        filter: "agNumberColumnFilter",
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const tax = Number(params.newValue);
          const discount = Number(params.data?.discountPercent);
          if (isNaN(tax) || tax < 0 || tax > 100 || tax > discount)
            return false;
          params.data.taxPercent = tax;
          return true;
        },
        cellClassRules: {
          "tax-invalid": (params) =>
            Number(params.data?.taxPercent) >
            Number(params.data?.discountPercent),
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
        filter: "agSetColumnFilter",
        cellEditor: "agCheckboxCellEditor",
        cellEditorParams: {
          values: [true, false],
        },
      },
      {
        field: "createdAt",
        hide: false,
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
      floatingFilter: true,
      resizable: true,
      editable: true,
    }),
    []
  );

  const exportTOExcel = useCallback(() => {
    gridRef.current.api.exportDataAsExcel();
  }, []);

  const serverSideDatasource = useCallback(
    () => ({
      getRows: async (params) => {
        const { startRow, groupKeys, rowGroupCols, sortModel, filterModel } =
          params.request;

        const payload = {
          start: startRow,
          limit: PAGE_SIZE,
          groupKeys,
          rowGroupCols,
          sortModel:
            sortModel?.length > 0
              ? sortModel
              : [{ colId: "createdAt", sort: "desc" }],
          filterModel,
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
        } catch (err) {
          console.error("Fetch failed", err);
          params.fail();
        }
      },
    }),
    []
  );

  const onGridReady = useCallback(
    (params) => {
      params.api.setGridOption("serverSideDatasource", serverSideDatasource());
    },
    [serverSideDatasource]
  );

  return (
    <div className="ag-theme-quartz-dark" style={{ height: 700 }}>
      <button onClick={exportTOExcel}>Export to Excel</button>

      <button
        style={{ color: "yellow" }}
        onClick={() => {
          const pinnedRowNode = gridRef.current.api.getPinnedTopRow(0);
          const newRow = { ...pinnedRowNode.data };

          if (!newRow.sku) {
            alert("SKU is required");
            return;
          }

          setPinnedTopRowData([
            {
              ...newRow,
              _isNew: false,
              _isSaved: true,
            },
          ]);
        }}
      >
        Preview
      </button>

      <button
        onClick={async () => {
          const pinnedRowNode = gridRef.current.api.getPinnedTopRow(0);
          if (!pinnedRowNode) return;

          const newRow = {
            ...pinnedRowNode.data,
            _isNew: true,
          };

          await fetch("http://localhost:3000/data/bulk-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: [newRow] }),
          });

          gridRef.current.api.applyServerSideTransaction({
            add: [newRow],
          });

          setPinnedTopRowData([{ ...EMPTY_ROW }]);
        }}
      >
        Add Data
      </button>

      <button
        style={{ backgroundColor: "red" }}
        onClick={async () => {
          const dirtyNodes = [];

          gridRef.current.api.forEachNode((node) => {
            if (!node.rowPinned && node.data?._isDirty) {
              dirtyNodes.push(node);
            }
          });

          if (dirtyNodes.length === 0) {
            alert("No changes to save");
            return;
          }

          await fetch("http://localhost:3000/data/bulk-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rows: dirtyNodes.map((n) => n.data),
            }),
          });

          dirtyNodes.forEach((node) => {
            node.data._isDirty = false;
            node.setData(node.data);
          });

          alert(`${dirtyNodes.length} rows saved successfully`);
        }}
      >
        Save All Changes
      </button>

      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowModelType="serverSide"
        onGridReady={onGridReady}
        pagination={true}
        paginationPageSize={PAGE_SIZE}
        cacheBlockSize={PAGE_SIZE}
        rowGroupPanelShow="onlyWhenGrouping"
        groupDisplayType="groupRows"
        animateRows={true}
        stopEditingWhenCellsLoseFocus={true}
        enterMovesDown={false}
        enterMovesDownAfterEdit={false}
        // ✅ REQUIRED FIX
        onCellKeyDown={(params) => {
          if (params.event.key === "Enter") {
            params.api.stopEditing();
          }
        }}
        onCellValueChanged={(params) => {
          if (!params.node.rowPinned && params.oldValue !== params.newValue) {
            params.data._isDirty = true;
          }
        }}
        onCellEditingStopped={(params) => {
          if (!params.node.rowPinned) {
            params.api.refreshCells({
              rowNodes: [params.node],
              force: true,
            });
          }
        }}
        pinnedTopRowData={pinnedTopRowData}
        rowClassRules={{
          "row-new": (p) => !p.node.rowPinned && p.data?._isNew === true,
          "row-dirty": (p) => !p.node.rowPinned && p.data?._isDirty === true,
        }}
        // copy and past from excel
        copyHeadersToClipboard={true}
        cellSelection={true}
        suppressClipboardPaste={false}
        suppressLastEmptyLineOnPaste={true}
      />
    </div>
  );
};

export default ExcelInventoryEnterpriseGrid;
