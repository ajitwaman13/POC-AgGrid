import React from "react";
import { saveRowToServer } from "../utils/saveRowToServer";

const SaveButton = ({ editedRow, setChange, gridApi }) => {
  return (
    <button
      disabled={!editedRow}
      onClick={async () => {
        await saveRowToServer(editedRow, gridApi);

        // reset unsaved flag
        setChange(false);

        alert("Saved to backend");
      }}
    >
      Save Data
    </button>
  );
};

export default SaveButton;
