import React from "react";

import CustomAgrid from "./components/CustomAgrid";
import CustomAgridAutoSave from "./components/CustomAgridAutoSave";
import ComboBox from "./components/ComboBox";
import DataManagerGrid from "./DataManagerGrid";
import ExcelInventoryGrid from "./ExcelInventoryGrid";
import ExcelInventoryEnterpriseGrid from "./ExcelInventoryEnterpriseGrid";
import UseRefusing from "./UseRefusing";
const App = () => {
  return (
    <div>
      {/* <h1>Custom Ag Grid</h1> */}
      {/* <CustomAgrid /> */}

      {/* <h1>Custom Ag Grid with Auto Save</h1> */}
      {/* <CustomAgridAutoSave /> */}
      {/* combobox */}

      {/* <ComboBox /> */}
      {/* comm version */}
      {/* <DataManagerGrid /> */}

      {/* enterprise version */}
      {/* <ExcelInventoryGrid /> */}

      <ExcelInventoryEnterpriseGrid />

      {/* using the useRef*/}

      {/* <UseRefusing /> */}
    </div>
  );
};

export default App;
