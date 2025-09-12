// EmailInput.js
import React from 'react';
import { Field, ErrorMessage } from 'formik';

const InputField = ({ label, name, ...props }) => {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label}{" "}<span className="text-danger">{props?.is_required && "*"} </span>
      </label>
      <Field type={props?.type=="email" ? "email" : "text"} id={props?.id} name={name} className="form-control" placeholder={props?.placeholder}/>
      <ErrorMessage name={name} component="div" className="text-danger" />
    </div>
  );
};

export default InputField;
