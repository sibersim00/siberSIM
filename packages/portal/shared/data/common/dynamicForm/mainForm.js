// DynamicForm.js
import React from 'react';
import { Formik, Form} from 'formik';
import { Col} from "react-bootstrap";
import * as Yup from 'yup';
import InputField from './inputField';
import SelectInputField from './selectField';
import RadioInput from './radioField';
import { error } from '../vaidationMessage/formValidationMsg';
import '../../../utils/i18n'
import { useTranslation } from "react-i18next";

const DynamicForm = ({ formSchema, onSubmit }) => {
  // Convert JSON schema to Yup validation schema
  const { t, i18n } = useTranslation();
  const validationSchema = Yup.object().shape(
    formSchema?.form_payloads.reduce((acc, field) => {
      acc[field.name] = field.is_required && Yup.string().required(error.required) || Yup.string();
      return acc;
    }, {})
  );

  const handleReset = (resetForm) => {
    // Reset form fields
    resetForm();
  };

  return (
    <Formik
      initialValues={formSchema?.form_payloads.reduce((acc, field) => {
        let check = formSchema?.form_value[field.name]
        acc[field.name] = check || '';
        return acc;
      }, {})}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
    >
      {({ isSubmitting, dirty, resetForm }) => (
        <Form className='row'>
          {formSchema?.form_payloads.map((field,index) => {
            
            switch (field.type) {
              case 'select':
                return <Col md={6} key={index}><SelectInputField key={field.name} {...field} /></Col>;
              case 'checkbox':
                // return <CheckboxInput key={field.name} {...field} />;
              case 'radio':
                return <Col md={6} key={index}><RadioInput key={field.name} {...field} /></Col>;
              case 'text':
                return <Col md={6} key={index}><InputField key={field.name} {...field} /></Col>;
              case 'email':
                return <Col md={6} key={index}><InputField key={field.name} {...field} /></Col>;
              default:
                return null;
            }
          })}
          <hr></hr>
          <div className="mb-3 text-right">
            <button
              type="submit"
              className="btn btn-primary"
            >
              {t("common.submit")}
            </button>
            <button
              type="button"
              className="btn btn-secondary ms-2"
              onClick={() => handleReset(resetForm)}
            >
              {t("common.reset")}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default DynamicForm;