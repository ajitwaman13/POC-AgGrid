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

const DataManagerGrid = () => {
  const gridRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [gridApi, setGridApi] = useState(null);

  // Unified Fetch Function
  const loadData = useCallback(async () => {
    const api = gridRef.current?.api;
    console.log("API", api);
    if (!api) return;

    setLoading(true);
    const payload = {
      page: Math.floor(page),
      limit: pageSize,
      sortModel: api
        .getColumnState()
        .filter((c) => c.sort)
        .map((c) => ({ colId: c.colId, sort: c.sort })),
      filterModel: api.getFilterModel(),
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
  }, [page, pageSize]);

  // Trigger fetch on pagination or when grid is ready
  useEffect(() => {
    if (gridApi) {
      loadData();
    }
  }, [page, pageSize, gridApi, loadData]);

  const columnDefs = useMemo(
    () => [
      { field: "_id", sortable: true, filter: "agTextColumnFilter" },
      { field: "sku", sortable: true, filter: "agTextColumnFilter" },
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
          "tax-invalid": (params) => {
            const tax = Number(params.data?.taxPercent);
            const discount = Number(params.data?.discountPercent);
            return tax > discount;
          },
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
      { field: "isActive", sortable: true, filter: true },
    ],
    []
  );

  const onSave = async () => {
    const changedRows = [];
    const changedNodes = [];
    console.log("changeRow", changedRows);
    console.log("changedNodes", changedNodes);

    gridRef.current.api.forEachNode((node) => {
      console.log("Gridref current api", gridRef);
      if (node.data._isDirty) {
        console.log("node data ", node.data);
        console.log(
          " changedRows.push(node.data);",
          changedRows.push(node.data)
        );
        console.log("changedNodes.push(node)", changedNodes.push(node));
      }
    });

    if (changedRows.length === 0) return alert("No changes detected");

    try {
      await fetch("http://localhost:3000/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: changedRows }),
      });

      alert("Saved Successfully");

      // CLEAR HIGHLIGHTS manually
      changedNodes.forEach((node) => {
        node.setDataValue("_isDirty", false);
      });

      loadData();
    } catch (error) {
      alert("Save failed!");
    }
  };

  const triggerRefresh = () => {
    if (page === 1) loadData();
    else setPage(1);
  };

  return (
    <div className="container">
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button onClick={onSave} style={{ padding: "10px" }} disabled={loading}>
          Save Changes
        </button>
        {loading && <span>Loading...</span>}
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{
            flex: 1,
            minWidth: 120,
            resizable: true,
            floatingFilter: true,
          }}
          onGridReady={(params) => setGridApi(params.api)}
          onSortChanged={triggerRefresh}
          onFilterChanged={triggerRefresh}
          getRowId={(params) => params.data._id}
          onCellValueChanged={(params) => {
            if (params.oldValue !== params.newValue) {
              params.data._isDirty = true;
              params.api.applyTransaction({ update: [params.data] });
            }
          }}
          rowClassRules={{ "unsaved-row": (p) => p.data?._isDirty === true }}
          theme="legacy"
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span> Page {Math.floor(page)} </span>
        <button
          disabled={page * pageSize >= totalRows}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
    </div>
  );
};

export default DataManagerGrid;
