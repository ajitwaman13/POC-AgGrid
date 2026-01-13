import React, { useRef, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";

// Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;

const ExcelInventoryEnterpriseGrid = () => {
  // Grid ref
  const gridRef = useRef(null);

  // Empty row template
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

  // Pinned top row state
  const [pinnedTopRowData, setPinnedTopRowData] = React.useState([
    { ...EMPTY_ROW },
  ]);

  // Column definitions
  const columnDefs = useMemo(
    () => [
      {
        field: "warehouseLocation",
        enableRowGroup: true, // grouping allowed
        filter: "agTextColumnFilter",
        editable: true,
      },
      {
        field: "category",
        enableRowGroup: true,
        filter: "agSetColumnFilter", /// Dropdown filter with checkboxes
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
          // custom validation logic
          const value = Number(params.newValue);
          if (isNaN(value) || value < 0 || value > 100) {
            // not 100>
            console.log("invalid discount percent", value);
            return false;
          }

          params.data.discountPercent = value;
          // Refresh tax column (in case tax > discount now)
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
          // tax > dicount not allowed
          if (isNaN(tax) || tax < 0 || tax > 100 || tax > discount) {
            console.log("invalid tax percent", tax);
            return false;
          }

          params.data.taxPercent = tax;
          return true;
        },
        cellClassRules: {
          // if tax > discount then apply this class
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
        filterParams: {
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

  // Default column common setting
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

  // Export  to excel
  const exportTOExcel = useCallback(() => {
    gridRef.current.api.exportDataAsExcel();
  }, []);

  // Server-side datasource
  const fetchbackendData = useCallback(
    () => ({
      getRows: async (params) => {
        const {
          startRow,
          endRow,
          sortModel,
          filterModel,
          rowGroupCols, // whihc columns are grouped
          groupKeys, // key like the group values like A B C
        } = params.request;

        // console.log("row group cols", rowGroupCols);
        // console.log("group keys", groupKeys);
        // console.log("filter model",filterModel);

        const payload = {
          start: startRow,
          limit: endRow - startRow,
          sortModel:
            sortModel?.length > 0
              ? sortModel
              : [{ colId: "createdAt", sort: "desc" }],
          filterModel,
          rowGroupCols,
          groupKeys,
        };

        try {
          const res = await fetch("http://localhost:3000/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) throw new Error("Fetch failed");

          const data = await res.json();
   console.log("params success",params.success)
          params.success({
            rowData: data.rows, /// set the data to grid   // rowData buit in KEyword 
            rowCount: data.total, // showing the total rows count  same rowCount also buit in keyword
          });
        } catch (err) {
          console.error("Server Side Datasource Error:", err);
          params.fail();
        }
      },
    }),
    []
  );

  // Grid ready
  const onGridReady = useCallback(
    (params) => {
      console.log("onGridReady params called",params);
      params.api.setGridOption("serverSideDatasource", fetchbackendData());
    },
    [fetchbackendData]
  );

  return (
    <div className="ag-theme-quartz-dark" style={{ height: 700 }}>
      {/* Toolbar */}
      <div style={{ marginBottom: "10px" }}>
        {/* export  */}
        <button onClick={exportTOExcel}>Export to Excel</button>

        <button
          style={{ color: "yellow", marginLeft: "5px" }}
          onClick={() => {
            const row = gridRef.current.api.getPinnedTopRow(0).data;
            if (!row.sku) return alert("SKU is required");

            setPinnedTopRowData([{ ...row, _isNew: false, _isSaved: true }]);
          }}
        >
          Preview
        </button>

        <button
          style={{ marginLeft: "5px" }}
          onClick={async () => {
            const row = gridRef.current.api.getPinnedTopRow(0).data;
            console.log("adding row", row);
            if (!row.sku) return alert("Please fill in SKU");

            await fetch("http://localhost:3000/data/bulk-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: [row] }),
            });

            gridRef.current.api.refreshServerSide({ purge: false });
            setPinnedTopRowData([{ ...EMPTY_ROW }]);
          }}
        >
          Add Data
        </button>
        {/* inline editing and update the data */}
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            marginLeft: "5px",
          }}
          onClick={async () => {
            // hold the dirty rows
            const dirtyRows = [];
            //  gettign dirty rows from the grid
            gridRef.current.api.forEachNode((node) => {
              // console.log("node data",node);
              // console.log("node is pinned", node.rowPinned);
              // console.log("node data is dirty", node.data?._isDirty);
              if (!node.rowPinned && node.data?._isDirty) {
                console.log("pushing dirty row", node.data);
                dirtyRows.push(node.data);
              }
            });

            if (dirtyRows.length === 0) {
              return alert("No changes");
            }
            // bulk save

            await fetch("http://localhost:3000/data/bulk-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rows: dirtyRows }),
            });
            //  server refresh wuthout full reload
            gridRef.current.api.refreshServerSide({ purge: false });
            alert("Saved successfully");
          }}
        >
          Save All Changes
        </button>
      </div>
      {/* {console.log("the gridref grid",gridRef)} */}
      <AgGridReact
        ref={gridRef}
        // Data model
        rowModelType="serverSide"
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pinnedTopRowData={pinnedTopRowData}
        // Pagination
        pagination={true}
        paginationPageSize={PAGE_SIZE}
        cacheBlockSize={PAGE_SIZE}
        // Lifecycle
        onGridReady={onGridReady}
        // Editing
        stopEditingWhenCellsLoseFocus={true}
        onCellValueChanged={(value) => {
          if (!value.node.rowPinned && value.oldValue !== value.newValue) {
            value.node.setData({ ...value.data, _isDirty: true });
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
        onCellKeyDown={(params) => {
          if (params.event.key === "Enter") {
            params.api.stopEditing();
          }
        }}
        // Row styling
        rowClassRules={{
          "row-new": (parameter) =>
            !parameter.node.rowPinned && parameter.data?._isNew,
          "row-dirty": (parameter) =>
            !parameter.node.rowPinned && parameter.data?._isDirty,
        }}
        getRowClass={(params) => {
          if (
            params.node.rowPinned === "top" &&
            params.data?._isSaved === true
          ) {
            return "pinned-preview-row";
          }
          return null;
        }}
        // Copy paste from excel
        copyHeadersToClipboard={true}
        cellSelection={true}
        suppressClipboardPaste={false}
        suppressLastEmptyLineOnPaste={true}
        rowSelection="multiple"
        // Grouping
        rowGroupPanelShow="always"
        groupDisplayType="groupRows"
        animateRows={true}
        // Side Bar Enterprise
        sideBar={{
          toolPanels: ["columns", "filters"],
          defaultToolPanel: "columns",
        }}
      />
    </div>
  );
};

export default ExcelInventoryEnterpriseGrid;
