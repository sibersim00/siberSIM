import React, { useState, Fragment } from "react";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import Select from "react-select";

// Utility function to sanitize nodes and edges
const sanitizeFlowchartData = (data) => {
  if (!data) return { nodes: [], edges: [] };

  const nodes = (data.nodes || []).map((node) => {
    const {
      measured,
      width,
      height,
      positionAbsolute,
      dragging,
      selected,
      ...rest
    } = node;

    return {
      ...JSON.parse(JSON.stringify(rest)), // deep clone
      position: { ...(node.position || {}) },
      style: { ...(node.style || {}) },
      data: { ...(node.data || {}) },
    };
  });

  const edges = (data.edges || []).map((edge) => {
    const { width, height, selected, ...rest } = edge;
    return {
      ...JSON.parse(JSON.stringify(rest)),
      data: { ...(edge.data || {}) },
      style: { ...(edge.style || {}) },
    };
  });

  return { nodes, edges };
};

const CopyScenarioModal = ({
  openFlag,
  setcopyModal,
  scenarioDropDownData,
  setNodes,
  setEdges,
  setDraggedComponent,
  setImageNodeData,
}) => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const handleClose = () => setcopyModal(false);
  const customStyles = () => {
    return {
      control: (styles) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)",
        borderColor: "#ced4da",
        minHeight: "38px",
      }),
      multiValue: (styles) => ({
        ...styles,
        backgroundColor: "var(--primary-bg-color)",
      }),
      multiValueLabel: (styles) => ({
        ...styles,
        color: "#fff",
      }),
      multiValueRemove: (styles) => ({
        ...styles,
        color: "#fff",
        ":hover": {
          backgroundColor: "#EB5757",
          color: "white",
        },
      }),
      input: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      singleValue: (styles) => ({
        ...styles,
        color: "var(--light-text-color)",
      }),
      placeholder: (styles) => ({
        ...styles,
        color: "#aaa",
      }),
    };
  };
  const handleSubmit = () => {
    try {
      let diagramData = selectedScenario?.scenariodiagram;

      if (!diagramData) {
        alert("This scenario has no diagram data.");
        return;
      }
      // Parse diagram data if it's a string
      if (typeof diagramData === "string") {
        diagramData = diagramData.replace("flowchartData ", "");
        diagramData = JSON.parse(diagramData);
      }
      // anitize before setting state
      const { nodes, edges } = sanitizeFlowchartData(diagramData);
      if (nodes.length > 0 && edges.length >= 0) {
        setNodes(nodes);
        setEdges(edges);
      } else {
        alert("Diagram data is incomplete.");
        return;
      }
      // let componentData = selectedScenario?.digramcomponent;
      // if (componentData) {
      //   if (typeof componentData === "string") {
      //     componentData = JSON.parse(componentData);
      //   }
      //   const normalizedComponents = componentData.map((node) => ({
      //     ...node,
      //     componentid: node.componentid || node.componentId || node.id,
      //   }));
      //   setImageNodeData(normalizedComponents);
      //   setDraggedComponent(normalizedComponents);
      // }
      let componentData = selectedScenario?.digramcomponent;

if (componentData) {
  if (typeof componentData === "string") {
    componentData = JSON.parse(componentData);
  }

  // Map and attach image URL if missing
  const normalizedComponents = componentData.map((node) => {
    const nodeFromDiagram = diagramData?.nodes?.find(
      (n) => n.data?.componentid === node.componentid || n.id === node.componentid
    );

    return {
      ...node,
      componentid: node.componentid || node.componentId || node.id,
      imageurl:
        node.componentimage ||
        node.imageurl ||
        nodeFromDiagram?.data?.image ||
        "",
    };
  });

  // Update sidebar + flowchart states
  setImageNodeData(normalizedComponents);
  setDraggedComponent(normalizedComponents);
}

      handleClose();
    } catch (error) {
      console.error("Error applying scenario:", error);
      alert("Something went wrong while applying the diagram.");
    }
  };
  return (
    <Fragment>
      <Modal show={openFlag} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>Copy Diagram from Existing Scenario</Modal.Title>
          <i
            className="fas fa-close fs-18"
            style={{ cursor: "pointer" }}
            onClick={handleClose}
          ></i>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Form.Group as={Col} md="12" className="mb-3">
              <Form.Label>
                Select Scenario <span className="text-danger">*</span>
              </Form.Label>
              <Select
                theme={(theme) => ({
                  ...theme,
                  colors: {
                    ...theme.colors,
                    primary25: "var(--primary-bg-color)",
                    primary: "var(--primary-bg-color)",
                  },
                })}
                styles={customStyles()}
                value={selectedScenario}
                options={scenarioDropDownData}
                placeholder="Select scenario to copy diagram from"
                onChange={(option) => setSelectedScenario(option)}
                menuPosition="fixed"
              />
              <small className="text-warning d-block mt-2">
                Note: Applying this will replace your current diagram only.
              </small>
            </Form.Group>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </Fragment>
  );
};
export default CopyScenarioModal;
