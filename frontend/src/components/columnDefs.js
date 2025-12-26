export const columnDefs = [
    { field: "sku", sortable: true },
    { field: "name", sortable: true, editable: true, filter: "agTextColumnFilter" },
    { field: "category", editable: true, cellEditor: "agTextCellEditor" },
    { field: "brand", editable: true, cellEditor: "agTextCellEditor" },
    { field: "sellingPrice", sortable: true, editable: true, filter: "agNumberColumnFilter" },
    {
      field: "discountPercent",
      editable: true,
      cellEditor: "agNumberCellEditor",
      valueSetter: discountValidator,
    },
    { field: "taxPercent" },
    { field: "quantityInStock" },
    { field: "minimumStockLevel" },
    { field: "warehouseLocation" },
    { field: "supplierName" },
    { field: "isActive", sortable: true, filter: "agSetColumnFilter" },
    { field: "createdAt" },
  ];
  