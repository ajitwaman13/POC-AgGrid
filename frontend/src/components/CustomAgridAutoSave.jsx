import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { onchangesEditingAutoSave } from "../grid/inlineEditing";
import { defaultColDef } from "../utils/defaultColDef";

// default page no
const DEFAULT_PAGE_SIZE = 20;

const CustomAgridAutoSave = () => {
  // use states
  const [rowData, setRowData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({});

  // getting the data
  const fetchData = async () => {
    const payload = {
      page,
      limit: pageSize,
      sortModel,
      filterModel,
    };

    const res = await fetch("http://localhost:3000/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setRowData(data.rows);
    setTotalRows(data.total);
  };

  // side effect
  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortModel, filterModel]);

  // on sorting
  const onSortChanged = (params) => {
    const columnState = params.api.getColumnState();

    const sortModel = columnState
      .filter((col) => col.sort)
      .map((col) => ({
        colId: col.colId,
        sort: col.sort,
      }));

    setSortModel(sortModel);
    setPage(1);
  };

  // on filter
  const onFilterChanged = (params) => {
    const model = params.api.getFilterModel();
    setFilterModel(model);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);

  // column defs (COMMENTS NOT REMOVED)
  const columnDefs = useMemo(
    () => [
      { field: "sku", sortable: true },
      {
        field: "name",
        sortable: true,
        editable: true,
        // filter: "agTextColumnFilter",
      },
      { field: "category", editable: true, cellEditor: "agTextCellEditor" },
      { field: "brand", editable: true, cellEditor: "agTextCellEditor" },
      {
        field: "sellingPrice",
        sortable: true,
        editable: true,
        // filter: "agNumberColumnFilter",
      },
      // { field: "discountPercent", editable:true, cellEditor:"agNumberCellEditor"},
      {
        field: "discountPercent",
        editable: true,
        cellEditor: "agNumberCellEditor",
        valueSetter: (params) => {
          const value = Number(params.newValue);
          if (isNaN(value)) return false;
          if (value < 0 || value > 100) return false;
          params.data.discountPercent = value;
          return true;
        },
      },
      { field: "taxPercent" },
      { field: "quantityInStock", editable: true },
      { field: "minimumStockLevel", editable: true },
      { field: "warehouseLocation" },
      { field: "supplierName" },
      // { field: "supplierContact" },
      { field: "isActive", sortable: true }, // filter: "agSetColumnFilter"
      { field: "createdAt" },
    ],
    []
  );

  return (
    <>
      <div className="ag-theme-alpine" style={{ height: 700 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          stopEditingWhenCellsLoseFocus={true}
          suppressMultiSort
          theme="legacy"
          onSortChanged={onSortChanged}
          onFilterChanged={onFilterChanged}
          onCellValueChanged={onchangesEditingAutoSave}
          rowClassRules={{
            "unsaved-row": (params) => params.data?._isDirty === true,
          }}
        />
      </div>

      {/* pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderTop: "1px solid #dcdcdc",
          background: "#fafafa",
          fontSize: 13,
        }}
      >
        <div>
          Page Size:&nbsp;
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

        <div>
          {startRow} to {endRow} of {totalRows}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button disabled={page === 1} onClick={() => setPage(1)}>
            {"<<"}
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            {"<"}
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            {">"}
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            {">>"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomAgridAutoSave;
