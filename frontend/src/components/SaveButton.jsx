import React from "react";
import { saveRowToServer } from "./inline_Editing";

const SaveButton = ({ editedRow }) => {
  return (
    <button
      disabled={!editedRow}
      onClick={() => {
        saveRowToServer(editedRow);
        alert("Saved to backend");
      }}
    >
      Save Data
    </button>
  );
};

export default SaveButton;
