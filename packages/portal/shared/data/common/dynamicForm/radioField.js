// RadioInput.js
import React from 'react';
import { Field, ErrorMessage } from 'formik';

const InputField = ({ label, name, options = [], ...props }) => {
  return (
    <div className="mb-3">
      <label className="form-label">
        {label}{" "}<span className="text-danger">{props?.is_required && "*"}</span>
      </label>
      {props?.type === "radio" ? (
        <div>
          {options.map((option) => (
            <div key={option.value} className="form-check form-check-inline">
              <Field
                type="radio"
                id={`${name}_${option.value}`}
                name={name}
                value={option.value}
                className="form-check-input"
              />
              <label htmlFor={`${name}_${option.value}`} className="form-check-label">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      ) : (
        <Field
          type={props?.type === "email" ? "email" : "text"}
          id={props?.id}
          name={name}
          className="form-control"
          placeholder={props?.placeholder}
        />
      )}
      <ErrorMessage name={name} component="div" className="text-danger" />
    </div>
  );
};

export default InputField;
