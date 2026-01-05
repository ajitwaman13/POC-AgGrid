import React, { useEffect, useMemo, useState, useRef } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import { onchanges_Editing_manual } from "../grid/inlineEditing";
import SaveButton from "./SaveButton";

const DEFAULT_PAGE_SIZE = 20;

import { defaultColDef } from "../utils/defaultColDef";

const CustomAgrid = () => {
  const [rowData, setRowData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);
  const [sortModel, setSortModel] = useState([]);
  const [editedRow, setEditedRow] = useState(null);
  const [change, setChange] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [editedRowNode, setEditedRowNode] = useState(null);

  // useref  used the

  const editedRowsRef = useRef({});

  const fetchData = async () => {
    if (!gridApi) return;
    console.log("gridApi ", gridApi);

    const sortModel = gridApi
      .getColumnState()
      .filter((c) => c.sort)
      .map((c) => ({ colId: c.colId, sort: c.sort }));
    const payload = {
      page,
      limit: pageSize,
      sortModel,
      filterModel: gridApi.getFilterModel(),
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

  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortModel, gridApi]);

  useEffect(() => {
    if (change) {
      alert("Save the data first");
    }
  }, [change]);

  /* ================= SORT ================= */
  // const onSortChanged = (params) => {
  //   const columnState = params.api.getColumnState();

  //   const sortModel = columnState
  //     .filter((col) => col.sort)
  //     .map((col) => ({
  //       colId: col.colId,
  //       sort: col.sort,
  //     }));

  //   setSortModel(sortModel);
  //   setPage(1);
  // };

  /* ================= FILTER ================= */
  const onFilterChanged = () => {
    setPage(1);
    fetchData();
  };

  /* ================= PAGINATION INFO ================= */
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);

  // col def
  const columnDefs = useMemo(
    () => [
      { field: "sku", sortable: true },
      { field: "name", sortable: true, editable: true },
      {
        field: "category",
        editable: true,
        cellEditor: "agRichSelectCellEditor",
        cellEditorParams: {
          values: ["Electronics", "Books", "Clothing"],
          allowTyping: true,
          filterList: true,
        },
      },
      { field: "brand", editable: true },
      { field: "sellingPrice", sortable: true, editable: true },
      {
        field: "discountPercent",
        editable: true,
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
        cellEditor: "agNumberCellEditor",

        valueSetter: (params) => {
          const tax = Number(params.newValue);
          const discount = Number(params.data?.discountPercent);

          if (isNaN(tax)) return false;
          if (tax < 0 || tax > 100) return false;

          if (!isNaN(discount) && tax > discount) {
            return false;
          }

          params.data.taxPercent = tax;
          return true;
        },

        cellClassRules: {
          "tax-invalid": (params) => {
            const tax = Number(params.data?.taxPercent);
            const discount = Number(params.data?.discountPercent);
            return !isNaN(tax) && !isNaN(discount) && tax > discount;
          },
        },

        tooltipValueGetter: () =>
          "Tax Percent cannot be greater than Discount Percent",
      },
      {
        field: "quantityInStock",
        editable: true,
        cellClassRules: {
          "low-stock-cell": (p) =>
            p.data.quantityInStock < p.data.minimumStockLevel,
        },
      },
      { field: "minimumStockLevel", editable: true },
      { field: "isActive", sortable: true },
      { field: "createdAt" },
    ],
    []
  );

  return (
    <>
      <SaveButton
        // editedRow={editedRow}
        editedRowsRef={editedRowsRef}
        editedRowNode={editedRowNode}
        setChange={setChange}
        gridApi={gridApi}
      />

      <div className="ag-theme-alpine" style={{ height: 700 }}>
        <AgGridReact
          theme="legacy"
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onSortChanged={fetchData}
          onFilterChanged={onFilterChanged}
          getRowId={(params) => params.data._id}
          stopEditingWhenCellsLoseFocus={false}
          invalidEditValueMode="block"
          onCellValueChanged={(params) =>
            onchanges_Editing_manual(
              params,
              setEditedRow,
              setEditedRowNode,
              setChange,
              editedRowsRef
            )
          }
          rowClassRules={{
            "unsaved-row": (p) => p.data?._isDirty === true,
          }}
          onGridReady={(params) => setGridApi(params.api)}
        />
      </div>

      {/* CUSTOM PAGINATION */}
      <div
        style={{ display: "flex", justifyContent: "space-between", padding: 8 }}
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

        <div>
          <button disabled={page === 1} onClick={() => setPage(1)}>
            {"<<"}
          </button>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            {"<"}
          </button>
          <span>
            {" "}
            Page {page} of {totalPages}{" "}
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

export default CustomAgrid;
