import React from 'react'
import MultiSelect from "react-select";

const SelectInput = (props) => {
    const objectArray = [
        { value: 10, label: "10" },
        { value: 20, label: "20 " },
        { value: 50, label: "50" },
      ];
  return (
    <div>
    <MultiSelect 
      instanceId="range-selector"
      options={objectArray}
      onChange={props.onChange}
      singleSelect
    
    //   value={props.value}
      displayValue="key"
    />
  </div>
  )
}

export default SelectInput
