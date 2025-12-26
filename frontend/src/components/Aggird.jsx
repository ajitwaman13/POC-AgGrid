import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE_NUMBER = 1;

const AgGridTable = () => {
  const [rowData, setRowData] = useState([]);
  const [sortModel, setSortModel] = useState(null);
  const [page, setPage] = useState(DEFAULT_PAGE_NUMBER);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = async () => {
    let url = `http://localhost:3000/data?page=${page}&limit=${pageSize}`;
    console.log("page", page);
    console.log("pagesize", pageSize);
    console.log("rowdata", rowData);

    if (sortModel) {
      url += `&sortField=${sortModel.colId}&sortOrder=${sortModel.sort}`;
    }

    console.log("➡️ FETCH:", url);

    const res = await fetch(url);
    const data = await res.json();

    setRowData(data.rows);
  };

  useEffect(() => {
    fetchData();
  }, [page, sortModel, pageSize]);

  const onSortChanged = (event) => {
    const model = event.api.getColumnState().find((c) => c.sort);

    setSortModel(model ? { colId: model.colId, sort: model.sort } : null);
    setPage(1);
  };

  const onPaginationChanged = (event) => {
    const api = event.api;

    const currentPage = api.paginationGetCurrentPage() + 1;
    console.log("currentPage", currentPage);
    console.log("page", page);
    const newPageSize = api.paginationGetPageSize();
    console.log("currentPage", currentPage);
    console.log("newPageSize", newPageSize);
    console.log("page", page);
    setPage(currentPage);

    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1);
    }
  };
  const onFilterChanged = (event) => {
    console.log("event", event);
    const api = event.api;
    console.log("api", api);
    const filterModel = api.getFilterModel();
    console.log("filterModel", filterModel);
  };

  const columnDefs = useMemo(
    () => [
      { field: "_id", headerName: "ID", width: 220 },
      { field: "sku", sortable: true },
      { field: "name", sortable: true },
      { field: "category" },
      { field: "brand" },
      { field: "sellingPrice", sortable: true },
      { field: "discountPercent" },
      { field: "taxPercent" },
      { field: "quantityInStock" },
      { field: "minimumStockLevel" },
      { field: "warehouseLocation" },
      { field: "supplierName" },
      { field: "supplierContact" },
      { field: "isActive" },
      { field: "isReturnable" },
      { field: "manufactureDate" },
      { field: "expiryDate" },
      { field: "lastRestockedAt" },
      { field: "createdBy" },
      { field: "notes" },
      { field: "createdAt" },
      { field: "updatedAt" },
    ],
    []
  );

  const defaultColDef = {
    sortable: true,
    resizable: true,
    filter: true,
    flex: 1,
  };

  return (
    <div className="ag-theme-alpine" style={{ height: 600 }}>
      {console.log("page", page)}
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={pageSize}
        paginationPageSizeSelector={[20, 50, 100]}
        onSortChanged={onSortChanged}
        onPaginationChanged={onPaginationChanged}
        onFilterChanged={onFilterChanged}
        suppressMultiSort={true}
        theme="legacy"
      />
    </div>
  );
};

export default AgGridTable;
