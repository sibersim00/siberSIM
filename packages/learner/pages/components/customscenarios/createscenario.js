import React, { useState } from "react";
import { Row, Col, Card,  } from "react-bootstrap"; 
import Flowchart from "./flowchart";  
import { useRouter } from "next/router";  
     
const CreateScenario = (props) => {
  const { scenarioId,setScenarioId, setTabIndex, setView, setRowValues} = props;

    const { query } = useRouter();
    const [selectedScenario, setSelectedScenario] = useState(null);

    const [numLans, setNumLans] = useState(1); // Default value 
    return (
        <> 
             <Row className="row-sm mg-t-10">
                <Col md={12}>
                    <Card className="custom-card">
                        <Card.Body>
                                <Flowchart numLans={numLans}  
                                setNumLans={setNumLans}
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
