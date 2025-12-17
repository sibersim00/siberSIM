// SelectInput.js
import React from 'react';
import { Field, ErrorMessage } from 'formik';

const SelectInputField = ({ label, name, options, ...props }) => {
    const customStyles = {
        control: (styles, { isFocused, isDisabled }) => ({
          ...styles,
          borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
          boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
          "&:hover": {
            borderColor: isDisabled
              ? "#e8e8f7"
              : isFocused
              ? "#00d683"
              : styles.borderColor,
          },
        }),
    };
      
    const theme = (theme) => ({
    ...theme,
    colors: {
        ...theme.colors,
        primary25: "var(--primary-bg-color)",
        primary: "var(--primary-bg-color)",
    },
    });


    const getSelectStyles = (fieldName) => {
    const error =
        validationExperience.errors[fieldName] &&
        validationExperience.touched[fieldName];
    return error
        ? {
            ...customStyles,
            control: (styles) => ({
            ...styles,
            borderColor: "#EB5757",
            boxShadow: "0 0 0 0.001rem #EB5757",
            }),
        }
        : customStyles;
    };
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <Field as="select" id={name} name={name} className="form-control" {...props} theme={theme} styles={customStyles}>
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Field>
      <ErrorMessage name={name} component="div" className="text-danger" />
    </div>
  );
};

export default SelectInputField;


