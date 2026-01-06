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

  const loadData = useCallback(async () => {
    const api = gridRef.current?.api;
    if (!api) return;

    setLoading(true);
    const payload = {
      page,
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

  useEffect(() => {
    if (gridApi) loadData();
  }, [page, pageSize, gridApi, loadData]);

  const columnDefs = useMemo(
    () => [
      // { field: "_id" },

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

  //  update
  const onSave = async () => {
    const changedRows = [];
    const changedNodes = [];

    gridRef.current.api.forEachNode((node) => {
      if (node.data._isDirty && !node.data._isNew) {
        changedRows.push(node.data);
        changedNodes.push(node);
      }
    });

    if (!changedRows.length) {
      alert("No changes detected");
      return;
    }

    try {
      await fetch("http://localhost:3000/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: changedRows }),
      });

      alert("Saved Successfully");

      changedNodes.forEach((node) => node.setDataValue("_isDirty", false));

      loadData();
    } catch {
      alert("Save failed!");
    }
  };

  // add the row
  // const addData = async () => {
  //   gridRef.current.api.stopEditing();
  //   const pinnedRow = pinnedTopRowData[0];
  //   const { _isNew, _isDirty, ...cleanData } = pinnedRow;
  //   console.log("new data ", cleanData);

  //   setLoading(true);
  //   try {
  //     const res = await fetch("http://localhost:3000/data/bulk-create", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ rows: [cleanData] }),
  //     });

  //     const data = await res.json();
  //     console.log("Data", data);

  //     const result = gridRef.current.api.applyTransaction({
  //       add: [data],
  //       addIndex: 0,
  //     });
  //     //   in built fun to show new row in top
  //     if (result.add && result.add.length > 0) {
  //       const addedNode = result.add[0];

  //       gridRef.current.api.flashCells({
  //         rowNodes: [addedNode],
  //         flashDuration: 3000,
  //         fadeDuration: 1000,
  //       });

  //       gridRef.current.api.ensureIndexVisible(0, "top");
  //     }
  //     setPinnedTopRowData([
  //       {
  //         sku: "",
  //         name: "",
  //         category: "",
  //         sellingPrice: null,
  //         discountPercent: null,
  //         taxPercent: null,
  //         quantityInStock: null,
  //         minimumStockLevel: null,
  //         isActive: true,
  //         _isNew: true,
  //         _isDirty: false,
  //       },
  //     ]);
  //     alert("New data saved successfully!");
  //     // loadData();
  //   } catch (error) {
  //     alert("Server error occurred.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const addData = async () => {
    // gridRef.current.api.stopEditing();
    const pinnedRow = pinnedTopRowData[0];
    const { _isNew, _isDirty, ...cleanData } = pinnedRow;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/data/bulk-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [cleanData] }),
      });

      const responseJson = await res.json();

      const rowToInsert = responseJson.newdata && responseJson.newdata[0];

      const result = gridRef.current.api.applyTransaction({
        add: [rowToInsert],
        addIndex: 0,
      });

      if (result.add && result.add.length > 0) {
        const addedNode = result.add[0];
        gridRef.current.api.flashCells({
          rowNodes: [addedNode],
          flashDuration: 3000,
        });
        gridRef.current.api.ensureIndexVisible(0, "top");
      }

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

      alert("New data saved successfully!");

      setTotalRows((prev) => prev + 1);
    } catch (error) {
      console.error(error);
      alert("Server error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const triggerRefresh = () => {
    if (page === 1) loadData();
    else setPage(1);
  };

  return (
    <div className="container">
      <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
        <button onClick={onSave} disabled={loading}>
          Save Changes
        </button>
        <button onClick={addData} disabled={loading}>
          Add Row
        </button>
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
          onSortChanged={triggerRefresh}
          onFilterChanged={triggerRefresh}
          getRowId={(params) => params.data._id}
          onCellValueChanged={onCellValueChanged}
          rowClassRules={{
            "unsaved-row": (p) => p.data?._isDirty === true,
          }}
          theme="legacy"
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
