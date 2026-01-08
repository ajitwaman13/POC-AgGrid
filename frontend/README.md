import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const ExcelInventoryGrid = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
      _isPerfectMatch: false,
    },
  ]);

  const loadData = useCallback(async () => {
    if (!gridApi) return;

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
      // Ensure we reset flags when loading fresh data from DB
      const cleanedData = (data.rows || []).map((row) => ({
        ...row,
        _isDirty: false,
        _isPerfectMatch: false,
      }));
      setRowData(cleanedData);
      setTotalRows(data.total || 0);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  }, [page, pageSize, gridApi]);

  useEffect(() => {
    if (gridApi) loadData();
  }, [page, pageSize, gridApi, loadData]);

  const columnDefs = useMemo(
    () => [
      {
        field: "sku",
        sortable: true,
        filter: "agTextColumnFilter",
        editable: true,
      },
      { field: "name", editable: true, filter: "agTextColumnFilter" },
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
      },
      {
        field: "quantityInStock",
        editable: true,
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
    // If user manually edits, it's no longer a "perfect match" from the file
    params.data._isPerfectMatch = false;

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

    try {
      const response = await fetch("http://localhost:3000/upload-excel", {
        method: "POST",
        body: formData,
      });

      const rawData = await response.json();

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

      normalizedData.forEach((newRow) => {
        const existing = rowData.find((r) => r.sku === newRow.sku);
        console.log("existing data ", existing);

        if (existing) {
          const isPerfectMatch = Object.keys(newRow).every(
            (key) => newRow[key] === existing[key]
          );
          console.log("isPerfectMatch", isPerfectMatch);

          updates.push({
            ...existing,
            ...newRow,
            _isDirty: !isPerfectMatch, //not match it
            _isPerfectMatch: isPerfectMatch, // match it
          });
        } else {
          additions.push({
            ...newRow,
            _isDirty: true,
            _isNew: true,
            _isPerfectMatch: false,
          });
        }
      });

      if (updates.length > 0) gridApi.applyTransaction({ update: updates });
      if (additions.length > 0)
        gridApi.applyTransaction({ add: additions, addIndex: 0 });

      alert(
        `Processed: ${additions.length} new and ${updates.length} existing rows.`
      );
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      event.target.value = null;
    }
  };

  const onSaveExcel = async () => {
    const dirtyRows = [];
    gridApi.forEachNode((node) => {
      if (node.data._isDirty) dirtyRows.push(node.data);
    });

    if (dirtyRows.length === 0) return alert("No changes to save");

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
    }
  };

  return (
    <div className="container">
      {/* ADD THIS CSS BLOCK TO YOUR COMPONENT OR CSS FILE */}

      <div
        style={{
          marginBottom: 15,
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button onClick={onSaveExcel}>Save Changes</button>
        <input type="file" accept=".xlsx, .xls" onChange={onFileUploaded} />
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
          rowClassRules={{
            "unsaved-row": (p) => p.data?._isDirty === true,
            "excel-data-match": (p) => p.data?._isPerfectMatch === true,
          }}
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

export default ExcelInventoryGrid;
