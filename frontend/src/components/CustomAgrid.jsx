import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
// import { themeBalham } from 'ag-grid-community';  //themes
import { onchangesEditing } from "./inline_Editing";
// import save  button
import SaveButton from "./SaveButton";
// default page no
const DEFAULT_PAGE_SIZE = 20;

const CustomAgrid = () => {
  // use  states
  const [rowData, setRowData] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalRows, setTotalRows] = useState(0);

  const [sortModel, setSortModel] = useState([]);

  const [filterModel, setFilterModel] = useState({});

  // edit the row
  const [editedRow, setEditedRow] = useState(null);

  //  unsave navigator 

  const [change,setChange]=useState(false)


// alert unsave 
if(change){
  alert("Save the data first")
  setChange(false)
}

  // save to db
  // const [saveRowToServer]=useState();

  //  getting the data
  const fetchData = async () => {
    // body req data
    const payload = {
      page,
      limit: pageSize,
      sortModel,
      filterModel,
    };

    console.log("📤 FRONTEND PAYLOAD:", payload);

    const res = await fetch("http://localhost:3000/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("res", res);
    const data = await res.json();

    console.log(" FRONTEND RESPONSE:", data);

    setRowData(data.rows);
    setTotalRows(data.total);
  };

  //   // save edited row to backend (NO validation)
  // const saveRowToServer = async (rowData) => {
  //   try {
  //     console.log("💾 SAVING ROW TO SERVER:", rowData);

  //     const res = await fetch(
  //       `http://localhost:3000/${rowData._id}`,
  //       {
  //         method: "PUT",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify(rowData),
  //       }
  //     );

  //     const data = await res.json();
  //     console.log(" SAVE RESPONSE:", data);
  //   } catch (err) {
  //     console.error("SAVE FAILED:", err);
  //   }
  // };

  // giving the side effect
  useEffect(() => {
    fetchData();
  }, [page, pageSize, sortModel, filterModel]);

  // on sorting the method
  const onSortChanged = (params) => {
    console.log("params onchnage sort -------------------->", params);

    const columnState = params.api.getColumnState();

    // Extract ONLY sorted columns
    const sortModel = columnState
      .filter((col) => col.sort) // asc / desc
      .map((col) => ({
        colId: col.colId,
        sort: col.sort,
      }));

    console.log("🔃 SORT MODEL (clean):", sortModel);

    setSortModel(sortModel);
    setPage(1);
  };
  // filter functionsonde
  const onFilterChanged = (params) => {
    console.log("params for the filter", params);
    const model = params.api.getFilterModel();

    console.log("🔍 FILTER MODEL:", model);
    setFilterModel(model);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = Math.min(page * pageSize, totalRows);

  // inline changes editing   ............ fun
  // const onchangesEditing=(params)=>{
  //   console.log("on chanage editing ...")
  //   console.log(params )
  //   console.log("params api on editing...",params.api)
  //   console.log("params.value",params.value)
  //   console.log("obj",{
  //     field: params.colDef.field,
  //     oldValue: params.oldValue,
  //     newValue: params.newValue,
  //     rowData: params.data,

  //   })
  //   console.log(params.node)
  //   console.log(params.columnApi)
  //   saveRowToServer(params.data)

  // }

  // const columnDefs=useMemo(()=>{columnDefs})
  // // ----------------------------------  col def
  const columnDefs = useMemo(
    () => [
      { field: "sku", sortable: true },
      {
        field: "name",
        sortable: true,
        editable: true,
        filter: "agTextColumnFilter",
      },
      { field: "category", editable: true, cellEditor: "agTextCellEditor" },
      { field: "brand", editable: true, cellEditor: "agTextCellEditor" },
      {
        field: "sellingPrice",
        sortable: true,
        editable: true,
        filter: "agNumberColumnFilter",
      },
      // { field: "discountPercent", editable:true, cellEditor:"agNumberCellEditor"},
      {
        field: "discountPercent",
        editable: true,
        cellEditor: "agNumberCellEditor",

        valueSetter: (params) => {
          const value = Number(params.newValue);

          console.log("under the discountPercent ", value);
          if (isNaN(value)) {
            alert("Discount must be a number");
            return false;
          }

          if (value < 0 || value > 100) {
            alert("Discount percent must be between 0 and 100");
            return false;
          }

          params.data.discountPercent = value;
          return true;
        },
      },
      { field: "taxPercent" },
      { field: "quantityInStock" },
      { field: "minimumStockLevel" },
      { field: "warehouseLocation" },
      { field: "supplierName" },
      // { field: "supplierContact" },
      { field: "isActive", sortable: true, filter: "agSetColumnFilter" },
      // { field: "isReturnable" },
      // { field: "manufactureDate" },
      // { field: "expiryDate" },
      // { field: "lastRestockedAt" },
      // { field: "createdBy" },
      // { field: "notes" },
      { field: "createdAt" },
      // { field: "updatedAt" },
    ],
    []
  );

  // giving the all col common functionlity
  const defaultColDef = {
    sortable: true, // sorting
    filter: true, // filter
    resizable: true, // resize (inc and desc)
    enableRowGroup: true,
  };

  return (
    <>
      <SaveButton editedRow={editedRow} />

      <div className="ag-theme-alpine" style={{ height: 700 }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onSortChanged={onSortChanged}
          onFilterChanged={onFilterChanged}
          stopEditingWhenCellsLoseFocus={true}
          suppressMultiSort
          rowGroupPanelShow="always"
          groupDisplayType="multipleColumns"
          theme={"legacy"}
          // onCellValueChanged={onchangesEditing}
          onCellValueChanged={(params) =>
            onchangesEditing(params, setEditedRow,setChange)
          }
        />
      </div>

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
        {/* LEFT — PAGE SIZE */}
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

        {/* CENTER — ROW RANGE */}
        <div>
          {startRow} to {endRow} of {totalRows}
        </div>

        {/* RIGHT — PAGINATION CONTROLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button disabled={page === 1} onClick={() => setPage(1)}>
            {"<<"}
          </button>

          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            {"<"}
          </button>

          <span style={{ margin: "0 6px" }}>
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

export default CustomAgrid;
