import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap"; 
import Flowchart from "./flowchart";  
import { useRouter } from "next/router";  
     
const CreateScenario = (props) => {
  const { scenarioId,setScenarioId, setTabIndex, setView, setRowValues} = props;

    const { query, push } = useRouter();
    const scenario_id = query && query.scenario; 
    const [selectedScenario, setSelectedScenario] = useState(null);

    const [numLans, setNumLans] = useState(1); // Default value 1
    return (
        <> 
             <Row className="row-sm mg-t-10">
                <Col md={12}>
                    <Card className="custom-card">
                        <Card.Body>
                                <Flowchart numLans={numLans}  
                                setNumLans={setNumLans}
                                //  toBeDragComponent={toBeDragComponent} 
                                //  selectedComponent={selectedComponent}
                                  scenarioId={scenarioId}
                                   setScenarioId={setScenarioId}
                                    setTabIndex={setTabIndex}
                                     setView={setView} 
                                     setRowValues={setRowValues} selectedScenario={selectedScenario}/>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

CreateScenario.layout = "Contentlayout";
export default CreateScenario;
