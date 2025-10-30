import React, { useState, Fragment, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button, Row, Col, Form,Spinner } from "react-bootstrap";
import { saveCategories,updateCategories } from "../../redux/slices/component/categories";
import Select from "react-select";
 
const CopyScenarioModal = (props) => {
  const { openFlag, setcopyModal, scenarioId , oneClick, handleOneClick, selectedScenario, scenarioDropDownData,setSelectedScenario} = props;
  const dispatch = useDispatch();
  const [modalTitle, setModalTitle] = useState('Add');

  const noEmojiTest = (value) => {
     if (typeof value !== "string") return true;
     return !emojiRegex.test(value);
   }; 
 

    

  const viewDemoShow = (modal) => { if (modal === false) { setcopyModal(false); } };

  const handleSubmit = (data) => {
  
    const Id = rowValues?.componentcategoryid;
     
    if(rowValues?.componentcategoryid==0){
      const payload = {
        name: data.parentcategoryname,
        description : data.description ? data.description.trim() : '',  
    };
      dispatch(saveCategories(payload));
      handleOneClick(true)
    }else{
      const payload = {
        componentcategoryid: Id,
        name: data.parentcategoryname,
        description :  data.description ? data.description.trim() : '',  
    };
      dispatch(updateCategories(payload, Id));
      handleOneClick(true)
    }
  };

  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static">
          
                <Modal.Header>
                  <Modal.Title>Select Diagram from Existing Scenario</Modal.Title>
                  <i
                    className="fas fa-close fs-18"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                     viewDemoShow(false);
                    }}
                  ></i>
                </Modal.Header>
                <Modal.Body>
                  <Row>
                    <Form.Group
                      as={Col}
                      md="12"
                      controlid="validationFormik102"
                      className="mb-3"
                    >
                      <Form.Label> Scenario <span className="text-danger">*</span></Form.Label>
                          <Select
                        theme={(theme) => ({
                            ...theme,
                            colors: {
                                ...theme.colors,
                                primary25: "var(--primary-bg-color)",
                                primary: "var(--primary-bg-color)",
                            },
                        })}
                        name="copy_scenario_id"
                        value={selectedScenario}
                        options={scenarioDropDownData}
                        placeholder="Copy Scenario"
                        onChange={(selectedOption) => setSelectedScenario(selectedOption)}
                        menuPosition="fixed"
                        
                    />
                    <small class="text-warning d-block mt-1">Note: Selecting a new diagram will remove the current one.</small>
                    </Form.Group>

                   
                  </Row>
                </Modal.Body>
                <Modal.Footer>
               
                  <Button
                    variant="secondary"
                    onClick={() => {
                      viewDemoShow(false);
                    }}
                  >
                    Close
                  </Button>
                </Modal.Footer>
              
        </Modal>
      </Fragment>
    </>
  );
};

export default CopyScenarioModal;
 