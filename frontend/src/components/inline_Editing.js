// inline changes editing   ............ 
export const onchangesEditing=(params,setEditedRow,setChange)=>{

    console.log("on chanage editing ...")
    console.log(params )
    console.log("params api on editing...",params.api)
    console.log("params.value",params.value)
    console.log("obj",{
      field: params.colDef.field,
      oldValue: params.oldValue,
      newValue: params.newValue,
      rowData: params.data,
  
    })
  // set the unsave State
  const UnsaveCell = (params) => {
    if (params.oldValue !== params.newValue) {
      params.data._isDirty = true;
      setChange(true);
    }
  };
    console.log(params.node)
    console.log(params.columnApi)
    // saveRowToServer(params.data)
    setEditedRow(params.data);

  }

  // save edited row to backend (NO validation)
  export const saveRowToServer = async (rowData) => {
    try {
      console.log("💾 SAVING ROW TO SERVER:", rowData);
  
      const res = await fetch(
        `http://localhost:3000/${rowData._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rowData),
        }
      );
  
      const data = await res.json();
      console.log(" SAVE RESPONSE:", data);
    } catch (err) {
      console.error("SAVE FAILED:", err);
    }
  };