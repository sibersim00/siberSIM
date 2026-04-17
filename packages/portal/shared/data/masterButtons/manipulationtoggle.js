import React, { useState } from "react";

const ManipulationToggleButton = (props) => {
  const { data,handleManipulationStatusSwitch } = props;
  const [isChecked, setIsChecked] = useState(JSON.parse(data?.manipulation_flag));

  const handleToggle = (values) => {
      handleManipulationStatusSwitch(values)
  };
  
  const handleOnChange = ()=>{}

  return (
    <div className="form-group">
      <label className="custom-switch">
        <input
          type="checkbox"
          name="custom-switch-checkbox1"
          className="custom-switch-input"
          // defaultChecked
          checked={isChecked}
          onChange={handleOnChange}
          onClick={e => handleToggle(data)}
        />
        {/* <span className="custom-switch-indicator custom-switch-indicator-md">{isChecked ? 'ON' : 'OFF'}</span> */}
        <span className="custom-switch-indicator custom-switch-indicator-md"></span>
      </label>
    </div>
  );
};

export default ManipulationToggleButton;
