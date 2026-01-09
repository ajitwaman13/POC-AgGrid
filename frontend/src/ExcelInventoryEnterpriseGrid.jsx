import React, { useRef, useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";

import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;
const paginationPageSizeSelector = [10, 20, 50, 100];

const ExcelInventoryEnterpriseGrid = () => {
  const gridRef = useRef(null);

  const columnDefs = useMemo(
    () => [
      {
        field: "sku",
        filter: "agTextColumnFilter",
        editable: false,
      },
      {
        field: "name",
        filter: "agTextColumnFilter",
        editable: true,
      },
      {
        field: "category",
        filter: "agSetColumnFilter",
        editable: true,
        filterParams: {
          values: ["Electronics", "Clothing", "Home", "Toys"],
        },
      },
      {
        field: "sellingPrice",
        filter: "agNumberColumnFilter",
        editable: true,
        valueParser: (p) => Number(p.newValue),
      },
      {
        field: "quantityInStock",
        filter: "agNumberColumnFilter",
        editable: true,
        valueParser: (p) => Number(p.newValue),
      },
      {
        field: "isActive",
        filter: "agSetColumnFilter",
        editable: true,
        filterParams: {
          values: [true, false],
        },
        cellEditor: "agCheckboxCellEditor",
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 140,
      sortable: true,
      floatingFilter: true,
      resizable: true,
      filter: true,
    }),
    []
  );

  const serverSideDatasource = useCallback(
    () => ({
      getRows: async (params) => {
        console.log("Request", params.request);
        const { startRow, sortModel, filterModel } = params.request;

        // backend payload
        const payload = {
          page: Math.floor(startRow / PAGE_SIZE) + 1,
          limit: PAGE_SIZE,
          sortModel,
          filterModel,
        };

        try {
          const res = await fetch("http://localhost:3000/data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          params.success({
            rowData: data.rows,
            rowCount: data.total,
          });
        } catch (err) {
          console.error("failed to the feteching data ", err);
          params.fail();
        }
      },
    }),
    []
  );
  // thinking like this is useEffect call only once
  const onGridReady = useCallback(
    (params) => {
      console.log("call on gridready or change ..", params);
      params.api.setGridOption("serverSideDatasource", serverSideDatasource());
    },
    [serverSideDatasource]
  );

  const onCellValueChanged = async (params) => {
    if (params.oldValue === params.newValue) return;
    console.log("on cell change", params.data);
    try {
      await fetch("http://localhost:3000/data/bulk-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: [params.data] }),
      });
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div className="ag-theme-quartz-dark" style={{ height: 650 }}>
      <AgGridReact
        ref={gridRef}
        columnDefs={columnDefs}
        // def col
        defaultColDef={defaultColDef}
        onFilterChanged={true}
        // pagination
        pagination={true}
        paginationPageSize={PAGE_SIZE}
        paginationPageSizeSelector={paginationPageSizeSelector}
        cacheBlockSize={PAGE_SIZE}
        //  server side
        rowModelType="serverSide"
        // some animations
        animateRows
        onGridReady={onGridReady}
        // something change the inline editing ,
        onCellValueChanged={onCellValueChanged}
        theme={"legacy"}
        groupDisplayType="multipleColumns"
      />
    </div>
  );
};

export default ExcelInventoryEnterpriseGrid;
