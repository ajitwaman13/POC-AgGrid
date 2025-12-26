import React from "react";
import Aggird from "./components/Aggird";
import CustomAgrid from "./components/CustomAgrid";
import Normalgrid from "./components/Normalgrid";

const App = () => {
  return (
    <div>
      {/* <h2>Ag-Grid origin</h2>
      <Aggird /> */}
      <h1>Custom Ag Grid</h1>
      <CustomAgrid />
      {/* <h1>Normal Grid</h1>
      <Normalgrid /> */}
    </div>
  );
};

export default App;
