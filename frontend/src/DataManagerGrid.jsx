import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const DataManagerGrid = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  const [pinnedTopRowData, setPinnedTopRowData] = useState([
    {
      sku: "",
      name: "",
      category: "",
      sellingPrice: null,
      discountPercent: null,
      taxPercent: null,
      quantityInStock: null,
      minimumStockLevel: null,
      isActive: true,
      _isNew: true,
      _isDirty: false,
    },
  ]);

  // --- 1. DATA LOADING ---
  const loadData = useCallback(async () => {
    if (!gridApi) return;

    setLoading(true);
    const payload = {
      page,
      limit: pageSize,
      sortModel: gridApi
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: gridApi.getFilterModel(),
    };

    try {
      const res = await fetch("http://localhost:3000/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setRowData(data.rows || []);
      setTotalRows(data.total || 0);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, gridApi]);

  useEffect(() => {
    if (gridApi) loadData();
  }, [page, pageSize, gridApi, loadData]);

  // --- 2. COLUMN DEFINITIONS ---
  const columnDefs = useMemo(
    () => [
      {
        field: "sku",
        sortable: true,
        filter: "agTextColumnFilter",
        editable: true,
      },
     
      { field: "category", editable: true, filter: "agTextColumnFilter" },
      { field: "sellingPrice", editable: true, filter: "agNumberColumnFilter" },
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
        cellClassRules: {
          "low-stock-cell": (p) =>
            p.data.quantityInStock < p.data.minimumStockLevel,
        },
        filter: "agNumberColumnFilter",
      },
      {
        field: "minimumStockLevel",
        editable: true,
        filter: "agNumberColumnFilter",
      },
      { field: "isActive", sortable: true, filter: true, editable: true },
    ],
    []
  );

  const onCellValueChanged = (params) => {
    if (params.node.rowPinned === "top") {
      params.data._isDirty = true;
      setPinnedTopRowData([{ ...params.data }]);
      return;
    }
    if (params.oldValue !== params.newValue) {
      params.data._isDirty = true;
      params.api.applyTransaction({ update: [params.data] });
    }
  };

  const onFileUploaded = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/upload-excel", {
        method: "POST",
        body: formData,
      });

      const rawData = await response.json();

      // 1. NORMALIZE KEYS: Convert "SKU" to "sku", "NAME" to "name", etc.
      const normalizedData = rawData.map((item) => ({
        sku: item.SKU,
        name: item.NAME,
        category: item.CATEGORY,
        sellingPrice: item.SELLINGPRICE,
        discountPercent: item.DISCOUNTPERCENT,
        taxPercent: item.TAXPERCENT,
        quantityInStock: item.QUANTITYINSTOCK,
        minimumStockLevel: item.MINIMUMSTOCKLEVEL,
        isActive: item.ISACTIVE,
      }));

      const updates = [];
      const additions = [];
      console.log(rowData);
      normalizedData.forEach((newRow) => {
        // console.log("row data ",new)
        const existing = rowData.find((r) => r.sku === newRow.sku);

        if (existing) {
          // It's an update - this will now trigger correctly!
          updates.push({
            ...existing,
            ...newRow,
            _isDirty: true,
            _isNew: false,
          });
        } else {
          // It's new
          additions.push({
            ...newRow,
            _isDirty: true,
            _isNew: true,
          });
        }
      });

      // 3. APPLY TO GRID
      if (updates.length > 0) gridApi.applyTransaction({ update: updates });
      if (additions.length > 0)
        gridApi.applyTransaction({ add: additions, addIndex: 0 });

      alert(
        `Excel Processed: ${additions.length} new records and ${updates.length} updates found.`
      );
    } catch (error) {
      console.error("Upload failed", error);
      alert("Error processing file. Check console.");
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const onSaveExcel = async () => {
    const dirtyRows = [];
    gridApi.forEachNode((node) => {
      if (node.data._isDirty) dirtyRows.push(node.data);
    });

    if (dirtyRows.length === 0) return alert("No changes to save");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/data/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: dirtyRows }),
      });

      if (res.ok) {
        alert("Saved Successfully!");
        await loadData();
      }
    } catch (err) {
      alert("Save failed!");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Inventory Data");

    worksheet.columns = columnDefs.map((col) => ({
      header: col.field.toUpperCase(),
      key: col.field,
      width: 20,
    }));

    gridApi.forEachNodeAfterFilterAndSort((node) => {
      worksheet.addRow(node.data);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Inventory_Export.xlsx");
  };

  // add the row data

  const addData = async () => {
    gridApi.stopEditing();
    const { _isNew, _isDirty, ...cleanData } = pinnedTopRowData[0];

    setLoading(true);
    try {
      //  this is update and new create
      const res = await fetch("http://localhost:3000/data/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [cleanData] }),
      });

      if (res.ok) {
        alert("New record saved!");
        loadData();
        setPinnedTopRowData([
          {
            sku: "",
            name: "",
            category: "",
            sellingPrice: null,
            discountPercent: null,
            taxPercent: null,
            quantityInStock: null,
            minimumStockLevel: null,
            isActive: true,
            _isNew: true,
            _isDirty: false,
          },
        ]);
      }
    } catch (error) {
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div
        style={{
          marginBottom: 15,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button onClick={onSaveExcel} disabled={loading}>
          Save Changes
        </button>
        <button onClick={addData} disabled={loading}>
          Add Row
        </button>
        {/* <button onClick={exportToExcel}>Export Excel</button> */}
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={onFileUploaded}
          disabled={loading}
        />
        {loading && <span>Loading...</span>}
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          pinnedTopRowData={pinnedTopRowData}
          columnDefs={columnDefs}
          defaultColDef={{
            flex: 1,
            minWidth: 120,
            resizable: true,
            floatingFilter: true,
          }}
          onGridReady={(params) => setGridApi(params.api)}
          getRowId={(params) => params.data._id || params.data.sku}
          onCellValueChanged={onCellValueChanged}
          rowClassRules={{ "unsaved-row": (p) => p.data?._isDirty === true }}
          theme={"legacy"}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span> Page {page} </span>
        <button
          disabled={page * pageSize >= totalRows}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DataManagerGrid;
