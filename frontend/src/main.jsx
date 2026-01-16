import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";

import "ag-grid-community/styles/ag-theme-quartz.css";

// ✅ Community
import { AllCommunityModule } from "ag-grid-community";

import {
  ServerSideRowModelModule,
  SetFilterModule,
  MultiFilterModule,
  SideBarModule,
  StatusBarModule,
  RowGroupingModule,
  ExcelExportModule,
  CsvExportModule,
  RowGroupingPanelModule,
  FiltersToolPanelModule,
  ColumnsToolPanelModule,
  CellSelectionModule,
  ClipboardModule,
  ServerSideRowModelApiModule,
  enableCellChangeFlash
} from "ag-grid-enterprise";

ModuleRegistry.registerModules([
  AllCommunityModule,

  // Enterprise
  ServerSideRowModelModule,
  SetFilterModule,
  MultiFilterModule,
  SideBarModule,
  StatusBarModule,
  RowGroupingModule,
  ExcelExportModule,
  CsvExportModule,
  RowGroupingPanelModule,
  FiltersToolPanelModule,
  ColumnsToolPanelModule,
  CellSelectionModule,
  ClipboardModule,
  ServerSideRowModelApiModule,
  enableCellChangeFlash
]);

createRoot(document.getElementById("root")).render(<App />);
