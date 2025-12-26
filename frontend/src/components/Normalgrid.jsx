import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const DEFAULT_PAGE_SIZE = 20;

const Normalgrid = () => {
  const [rowData, setRowData] = useState([]);
  const [sortModel, setSortModel] = useState(null);
  const [filterModel, setFilterModel] = useState({});
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);


  const fetchData = async () => {
    let url = `http://localhost:3000/data?limit=${pageSize}`;

    if (sortModel) {
      url += `&sortField=${sortModel.colId}&sortOrder=${sortModel.sort}`;
    }

    if (Object.keys(filterModel).length > 0) {
      url += `&filters=${encodeURIComponent(JSON.stringify(filterModel))}`;
    }

    console.log("➡️ FE FETCH:", url);

    const res = await fetch(url);
    const data = await res.json();
    setRowData(data.rows);
  };

  useEffect(() => {
    fetchData();
  }, [pageSize, sortModel, filterModel]);


  const onSortChanged = (event) => {
    const col = event.api.getColumnState().find((c) => c.sort);
    setSortModel(col ? { colId: col.colId, sort: col.sort } : null);
  }
  const onFilterChanged = (event) => {
    const model = event.api.getFilterModel();
    console.log("🔍 FILTER MODEL:", model);
    setFilterModel(model);
  };


  const onPaginationChanged = (event) => {
    const newSize = event.api.paginationGetPageSize();
    if (newSize !== pageSize) setPageSize(newSize);
  };
  const columnDefs = useMemo(
    () => [
      { field: "_id", headerName: "ID", width: 220 },
      { field: "sku", sortable: true, filter: "agTextColumnFilter" },
      { field: "name", sortable: true, filter: "agTextColumnFilter" },
      { field: "category", filter: "agTextColumnFilter" },
      { field: "brand", filter: "agTextColumnFilter" },
      { field: "sellingPrice", sortable: true, filter: "agNumberColumnFilter" },
      { field: "quantityInStock", filter: "agNumberColumnFilter" },
      { field: "isActive", filter: "agTextColumnFilter" }, 
    ],
    []
  );

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 600 }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination
        paginationPageSize={pageSize}
        paginationPageSizeSelector={[20, 50, 100]}
        onSortChanged={onSortChanged}
        onFilterChanged={onFilterChanged}
        onPaginationChanged={onPaginationChanged}
        suppressMultiSort
        theme="legacy"
      />
    </div>
  );
};

export default Normalgrid;
