import React, { useRef, useMemo, useCallback } from 
"react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
// Styles
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

const PAGE_SIZE = 20;

const ExcelInventoryEnterpriseGrid = () => {
  const gridRef = useRef(null);

  const columnDefs = useMemo(
    () => [
      {
        field: "warehouseLocation",
        rowGroup: true,
        enableRowGroup: true,
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        field: "sku",
        filter: "agTextColumnFilter",
        cellRenderer: (params) => (
          <span style={{ fontWeight: "bold" }}>{params.value}</span>
        ),
      },
      {
        field: "category",
        filter: "agSetColumnFilter",
        filterParams: { values: ["Electronics", "Clothing", "Home", "Toys"] },
      },
      // {
      //   field: "quantityInStock",
      //   filter: "agNumberColumnFilter",
      //   aggFunc: "sum",
      //   editable: true,
      // },
      {
        field: "sellingPrice",
        filter: "agNumberColumnFilter",
        aggFunc: "avg",
        valueFormatter: (p) => (p.value ? `$${p.value.toFixed(2)}` : ""),
      },
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
      {
        field: "isActive",
        filter: "agSetColumnFilter",
        cellEditor: "agCheckboxCellEditor",
      },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 150,
      sortable: true,
      floatingFilter: true,
      resizable: true,
    }),
    []
  );

  //
  const autoGroupColumnDef = useMemo(
    () => ({
      headerName: "Warehouse Hierarchy",
      minWidth: 250,
      cellRendererParams: {
        checkbox: true,
      },
    }),
    []
  );

  const exportTOExcel = useCallback(() => {
    gridRef.current.api.exportDataAsExcel();
  }, []);

  const serverSideDatasource = useCallback(
    () => ({
      
      getRows: async (params) => {
        console.log("SSRM Request:", params.request);
        console.log("Group Keys:", params.request.groupKeys);
        console.log("Row Group Cols:", params.request.rowGroupCols);
        console.log("Sort Model:", params.request.sortModel);
        console.log("Filter Model:", params.request.filterModel);
        console.log("value col", params.request.valueCols);

        const {
      
          groupKeys,
          rowGroupCols,
          sortModel,
          filterModel,
        } = params.request;

        const payload = {
          start: startRow,
          limit: PAGE_SIZE,
          groupKeys,
          rowGroupCols,
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
          console.error("Fetch failed", err);
          params.fail();
        }
      },
    }),
    []
  );

  const onGridReady = useCallback(
    (params) => {
      params.api.setGridOption("serverSideDatasource", serverSideDatasource());
    },
    [serverSideDatasource]
  );

  return (
    <div
      className="ag-theme-quartz-dark"
      style={{ height: 700, width: "100%" }}
    >
      <button
        onClick={exportTOExcel}
        style={{ marginBottom: "5px", fontWeight: "bold" }}
      >
        Export to Excel
      </button>
      <AgGridReact
        ref={gridRef}
        // Core Config
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        autoGroupColumnDef={autoGroupColumnDef}
        // Server-Side Specifics
        rowModelType="serverSide"
        onGridReady={onGridReady}
        cacheBlockSize={PAGE_SIZE}
        // rowGroupPanelShow="always"
        // groupDisplayType="groupRows"
        // animateRows={true}
        // rowSelection="multiple"
        // Selection & Persistence
        suppressAggFuncInHeader={true}
        getServerSideGroupKey={(dataItem) => dataItem.warehouseLocation}
        // Side Bar (Enterprise)
        sideBar={{
          toolPanels: ["columns", "filters"],
          defaultToolPanel: "columns",
        }}
        theme={"legacy"}
        // editType="singleCell"
        editType="fullRow"
      />
    </div>
  );
};

export default ExcelInventoryEnterpriseGrid;
