import { saveRowToServer } from "../utils/saveRowToServer";
// save the backend
export const onchanges_Editing_manual = (
  params,
  setEditedRow,
  setEditedRowNode,
  setChange,
  editedRowsRef
) => {
  console.log("on chanage editing ...");

  // set the unsave State
  if (params.oldValue != params.newValue) {
    console.log("isdirty", params.data._isDirty);

    params.data._isDirty = true;
    params.node.setDataValue("_isDirty", true);

    editedRowsRef.current[params.node.id] = params.node;

    // optional but good
    params.api.redrawRows({ rowNodes: [params.node] });

    setEditedRowNode(params.node);
    setChange(true);
  }

  setEditedRow(params.data);
};

// export const onchanges_Editing_manual = (
//   params,
//   setEditedRow,
//   setEditedRowNode,
//   setChange
// ) => {
//   console.log("updating the data...");
//   console.log(params.data);
//   if (params.oldValue === params.newValue) return;

//   // ✅ ONLY rowNode
//   params.node.setDataValue("_isDirty", true);
//   // ✅ force rowClassRules to re-evaluate
//   params.api.redrawRows({ rowNodes: [params.node] });

//   setEditedRow(params.data);
//   setEditedRowNode(params.node);
//   setChange(true);
// };

// export const onchanges_Editing_manual = (
//   params,
//   setEditedRow,
//   setEditedRowNode
// ) => {
//   if (params.oldValue === params.newValue) return;

//   // mark row dirty
//   params.node.setDataValue("_isDirty", true);

//   // redraw only this row
//   params.api.redrawRows({ rowNodes: [params.node] });

//   setEditedRow(params.data);
//   setEditedRowNode(params.node);
// };

// export const onchanges_Editing_manual = (params, setEditedRow) => {
//   if (params.oldValue === params.newValue) return;

//   params.node.setDataValue("_isDirty", true);

//   // params.api.redrawRows({ rowNodes: [params.node] });
//   params.api.refreshCells({
//     rowNodes: [params.node],
//     force: true,
//   });

//   setEditedRow(params.data);
// };

// auto save
export const onchangesEditingAutoSave = (params) => {
  saveRowToServer(params.data);
};
