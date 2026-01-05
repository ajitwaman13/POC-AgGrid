// // import React from "react";
// // import { saveRowToServer } from "../utils/saveRowToServer";

// // const SaveButton = ({ editedRow, setChange, gridApi }) => {
// //   return (
// //     <button
// //       disabled={!editedRow}
// //       onClick={async () => {
// //         await saveRowToServer(editedRow, gridApi);

// //         // reset unsaved flag
// //         setChange(false);

// //         alert("Saved to backend");
// //       }}
// //     >
// //       Save Data
// //     </button>
// //   );
// // };

// // export default SaveButton;
// import React from "react";
// import { saveRowsToServerBulk } from "../utils/saveRowToServer";

// const SaveButton = ({ editedRowsRef, setChange, gridApi }) => {
//   // const onSave = async () => {
//   //   const nodes = Object.values(editedRowsRef.current);

//   //   if (nodes.length === 0) {
//   //     alert("No changes to save");
//   //     return;
//   //   }

//   //   for (const node of nodes) {
//   //     await saveRowToServer(node.data, gridApi);
//   //     node.setDataValue("_isDirty", false);
//   //   }

//   //   editedRowsRef.current = {};
//   //   setChange(false);

//   //   alert("Saved all edited rows");
//   // };

//   const onSave = async () => {
//     const nodes = Object.values(editedRowsRef.current);

//     if (nodes.length === 0) return;

//     // build payload
//     const rows = nodes.map((n) => n.data);

//     await saveRowsToServerBulk(rows);

//     nodes.forEach((node) => {
//       node.setDataValue("_isDirty", false);
//     });
//     gridApi.redrawRows({ rowNodes: nodes });
//     editedRowsRef.current = {};
//     setChange(false);
//   };

//   return (
//     <button
//       disabled={Object.keys(editedRowsRef.current).length === 0}
//       onClick={onSave}
//     >
//       Save Data
//     </button>
//   );
// };

// export default SaveButton;

import React from "react";
import { saveRowsToServerBulk } from "../utils/saveRowToServer";

const SaveButton = ({ editedRowsRef, setChange, gridApi }) => {
  const onSave = async () => {
    const rowIds = Object.keys(editedRowsRef.current);
    if (rowIds.length === 0) return;

    // convert rowIds -> LIVE rowNodes
    const rowNodes = rowIds.map((id) => gridApi.getRowNode(id)).filter(Boolean);

    const rows = rowNodes.map((node) => node.data);

    await saveRowsToServerBulk(rows);

    // rowNodes.forEach((node) => {
    //   node.setDataValue("_isDirty", false);
    // });

    // // gridApi.redrawRows({ rowNodes });
    // gridApi.refreshCells({ force: true });

    editedRowsRef.current = {};
    setChange(false);
  };

  return (
    <button
      disabled={Object.keys(editedRowsRef.current).length === 0}
      onClick={onSave}
    >
      Save Data
    </button>
  );
};

export default SaveButton;
