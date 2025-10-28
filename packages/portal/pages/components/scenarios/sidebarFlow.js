import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoriesList,
  getScenarioComponentListbyCategory,
} from "../../../shared/redux/slices/common/masters";
import {
  getSenarioDigramList,
  getSingleScenarios,
  clearSingleScenarios,
} from "../../../shared/redux/slices/scenario/scenarioManage";
import CopyScenarioModal from "../../../shared/data/scenarios/copyScenarioModal";

const sidebarFlow = ({
  setDraggedNode,
  scenarioId,
  setNodes,
  setEdges,
  setDraggedComponent,
}) => {
  const dispatch = useDispatch();
  const handleOneClick = (flag) => {
    setOneClick(flag);
  };
  const {
    getMasterCatListData,
    getComponentByCatData,
    getScenarioDigListData,
    getScenarioFlowchart,
  } = useSelector((state) => {
    console.log("getMasterCatListData", state);
    return {
      getMasterCatListData:
        state &&
        state.commonMaster &&
        state.commonMaster.getMasterCatListData &&
        state.commonMaster.getMasterCatListData.data,
      getComponentByCatData:
        state &&
        state.commonMaster &&
        state.commonMaster.getScnarioComponentByCatData &&
        state.commonMaster.getScnarioComponentByCatData.data,
      getScenarioDigListData:
        state &&
        state.scenarioManage &&
        state.scenarioManage.getScenarioDigListData &&
        state.scenarioManage.getScenarioDigListData.data,
      getScenarioFlowchart:
        state &&
        state.scenarioManage &&
        state.scenarioManage.singleScenarios &&
        state.scenarioManage.singleScenarios.data,
      errorData: state && state.commonMaster && state.commonMaster.error,
    };
  });
  const getSelectStyles = (fieldName) => {
    return {
      ...customStyles,
      control: (styles, state) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)", // dark background
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--light-text-color)", // selected value text
      }),
      input: (provided) => ({
        ...provided,
        color: "var(--light-text-color)", // text while typing
      }),
    };
  };
  useEffect(() => {
    dispatch(getCategoriesList());
    dispatch(getSenarioDigramList());
  }, []);
  useEffect(() => {
    if (scenarioId) {
      const payload = { scenarioid: scenarioId };
      // dispatch(getScenarioFlow(payload));
      dispatch(getSingleScenarios(scenarioId));
    }
  }, [scenarioId]);
  console.log("scenarioId", scenarioId);

  // const handleDragStart = (e, node) => {
  //  // if (droppedImages.includes(node.id)) return; // Disable dragging if image is dropped
  //   setDraggedNode(node);  // Set the dragged node data directly
  //   console.log('nodenodenodenodettttttttttttttttttttttttt',node)
  // };
  const handleDragStart = (e, node) => {
    const normalizedNode = {
      ...node,
      componentid: node.componentid || node.componentId || node.id,
    };
    console.log("nodenodenodenodettttttttttttttttttttttttt", node);

    setDraggedNode(normalizedNode);
    console.log("nodenodenodenode normalized", normalizedNode);
  };

  const [oneClick, setOneClick] = useState(false);
  const [copyModal, setcopyModal] = useState(false);
  const [catDropDownData, setCatDropDown] = useState([]);
  const [scenarioDropDownData, setScenarioDropDownData] = useState([]);
  const [componentDropDownData, setComponentDropDown] = useState([]);
  const [componentCache, setComponentCache] = useState({});
  const [imageNodeData, setImageNodeData] = useState([]); // sidebar data
  const [droppedImages, setDroppedImages] = useState([]); // Track dropped images
  //  const [drggerdComponent,setDraggedComponent] = useState([]);
  const [toBeDragComponent, setToBeDragComponent] = useState([]);
  // States to track selected values
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  console.log("componentDropDownData", componentDropDownData);
  useEffect(() => {
    if (getMasterCatListData && getMasterCatListData.length > 0) {
      let temp = getMasterCatListData.map((cat) => ({
        value: cat?.componentcategoryid || "",
        label: cat?.componentcategory,
      }));
      setCatDropDown(temp);
    }
  }, [getMasterCatListData]);
  useEffect(() => {
    if (getScenarioDigListData && getScenarioDigListData.length > 0) {
      let temp = getScenarioDigListData.map((scenario) => ({
        value: scenario?.scenarioid || "",
        label: scenario?.scenariotitle,
        scenariodiagram: scenario?.scenariodiagram,
        digramcomponent: scenario?.components,
      }));
      setScenarioDropDownData(temp);
    }
  }, [getScenarioDigListData]);
  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption);
    setComponentDropDown([]);

    // Fetch components for the selected category
    dispatch(
      getScenarioComponentListbyCategory({
        componentcategoryid: selectedOption.value,
      })
    );

    // Restore previously selected components (if any)
    const previouslySelected = componentCache[selectedOption.value];
    setSelectedComponent(previouslySelected || []);
  };
  useEffect(() => {
    if (getComponentByCatData && getComponentByCatData.length > 0) {
      let filteredData = getComponentByCatData.map((cat) => ({
        value: cat?.vmid || "",
        label: cat?.vmid + " - " + cat?.vmname,
        networkport: cat?.networkport || "",
        subcategoryimage: cat?.imageurl || "",
        duration: cat?.duration || "",
        componentid: cat?.componentid || "",
      }));
      setComponentDropDown(filteredData);
    }
  }, [getComponentByCatData]);
  console.log(
    "selectedScenarioselectedScenarioselectedScenario",
    selectedScenario
  );

  // useEffect(() => {
  //     if (selectedScenario  && selectedScenario.scenariodiagram && selectedScenario.scenariodiagram!='' ) {

  //       const data = selectedScenario.scenariodiagram;
  //       const parsedData = JSON.parse(data.replace('flowchartData ', ''));
  //       console.log(selectedScenario,'parsedDatawww',parsedData)
  //       if (parsedData?.nodes && parsedData?.edges) {
  //         setNodes(parsedData.nodes);
  //         setEdges(parsedData.edges);
  //       }
  //     }

  //     if (selectedScenario && selectedScenario.digramcomponent) {

  //       const componentsdata = selectedScenario.digramcomponent;
  //       const parsedcomponentData = JSON.parse(componentsdata);
  //       setImageNodeData(parsedcomponentData);
  //       setDroppedImages(parsedcomponentData.map((comp) => comp.id))
  //       setDraggedComponent( parsedcomponentData );
  //     }
  //   }, [selectedScenario]);

  console.log("imageNodeDataimageNodeData", imageNodeData);
  useEffect(() => {
    if (selectedComponent && selectedComponent.length > 0) {
      console.log("selectedComponent", selectedComponent);
      setToBeDragComponent((prev) => {
        const existingIds = new Set(prev.map((item) => item.value));
        const newItems = selectedComponent.filter(
          (item) => !existingIds.has(item.value)
        );
        return [...prev, ...newItems];
      });
    }
  }, [selectedComponent]);
  useEffect(() => {
    if (toBeDragComponent && toBeDragComponent.length > 0) {
      const newNodes = toBeDragComponent.map((cat) => ({
        id: cat?.value,
        imageUrl: cat?.subcategoryimage
          ? `${process.env.API_URL_FILEMANAGER}${cat?.subcategoryimage}`
          : "",
        label: cat?.label,
        networkport: cat?.networkport,
        duration: cat?.duration,
        componentid: cat?.componentid,
      }));

      setImageNodeData((prevData) => {
        const existingIds = new Set(prevData.map((item) => item.id));
        const merged = [...prevData];

        newNodes.forEach((node) => {
          if (!existingIds.has(node.id)) {
            merged.push(node);
          }
        });

        return merged;
      });
    }
  }, [toBeDragComponent]);

  console.log("toBeDragComponentrrrrrrrrrrr", getScenarioFlowchart);
  useEffect(() => {
    if (
      getScenarioFlowchart &&
      getScenarioFlowchart.scenariodiagram &&
      getScenarioFlowchart.scenariodiagram.trim()
    ) {
      const data = getScenarioFlowchart.scenariodiagram;
      const parsedData = JSON.parse(data.replace("flowchartData ", ""));
      console.log("parsedData", parsedData);
      if (parsedData?.nodes && parsedData?.edges) {
        setNodes(parsedData.nodes);
        setEdges(parsedData.edges);
      }
    }

    // if (getScenarioFlowchart && getScenarioFlowchart.components) {

    //   const componentsdata = getScenarioFlowchart.components;
    //   const parsedcomponentData = JSON.parse(componentsdata);
    //   setImageNodeData(parsedcomponentData);
    //   setDroppedImages(parsedcomponentData.map((comp) => comp.id))
    // setDraggedComponent( parsedcomponentData );
    // }
    if (getScenarioFlowchart && getScenarioFlowchart.components) {
      const componentsdata = getScenarioFlowchart.components;
      const parsedcomponentData = JSON.parse(componentsdata);

      console.log("gggggggggggggggggggggggggggggggg", parsedcomponentData);

      // 🧠 Normalize componentid for consistency
      const normalizedData = parsedcomponentData.map((node) => ({
        ...node,
        componentid: node.componentid || node.componentId || node.id,
      }));

      console.log(
        "normalizedDatanormalizedDatanormalizedDatanormalizedDatanormalizedData",
        normalizedData
      );

      setImageNodeData(normalizedData);
      setDroppedImages(normalizedData.map((comp) => comp.id));
      setDraggedComponent(normalizedData);
    }
  }, [getScenarioFlowchart]);

  useEffect(() => {
    if (getScenarioDigListData && getScenarioDigListData.length > 0) {
      let temp = getScenarioDigListData.map((scenario) => ({
        value: scenario?.scenarioid || "",
        label: scenario?.scenariotitle,
        scenariodiagram: scenario?.scenariodiagram,
        digramcomponent: scenario?.components,
      }));
      setScenarioDropDownData(temp);
    }
  }, [getScenarioDigListData]);

  const handleCopyScenario = () => {
    handleOneClick(false);
    if (scenarioId && scenarioId != "") {
      setcopyModal(true);
    }
  };

  return (
    <div
      style={{
        padding: "10px",
        // backgroundColor: '#F4F4F4',
        height: "100%",
        maxHeight: "560px",
        overflowY: "auto",
      }}
    >
      {/* Row 1: Copy Button + First Select (single horizontal line) */}
      <div
        className="mb-2"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          maxWidth: "400px",
        }}
      >
        <Button
          variant="light"
          size="sm"
          title="Copy"
          onClick={handleCopyScenario}
          style={{
            padding: "6px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "38px",
            border: "1px solid #ced4da",
          }}
        >
          {/* <i className="fa  fa-github" aria-hidden="true"></i> */}
          <i className="fas fa-code-branch" aria-hidden="true"></i>
        </Button>
        <div style={{ flex: 1 }}>
          <Select
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary25: "var(--primary-bg-color)",
                primary: "var(--primary-bg-color)",
              },
            })}
            name="component_category"
            value={selectedCategory}
            options={catDropDownData}
            placeholder="Component Category"
            onChange={handleCategoryChange}
            styles={getSelectStyles("component_category")}
          />
        </div>
      </div>
      {/* Row 2: Second Select (full width) */}
      <div className="mb-3">
        <Select
          name="component"
          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary25: "var(--primary-bg-color)",
              primary: "var(--primary-bg-color)",
            },
          })}
          value={selectedComponent}
          options={componentDropDownData}
          placeholder="Component"
          onChange={(selectedOptions) => {
            setSelectedComponent(selectedOptions);
            if (selectedCategory) {
              setComponentCache((prev) => ({
                ...prev,
                [selectedCategory.value]: selectedOptions,
              }));
            }
          }}
          isMulti
          styles={customStyles()}
          // styles={{
          //   ...customStyles,
          //   multiValue: (base) => ({
          //     ...base,
          //     overflow: "hidden",
          //     textOverflow: "ellipsis",
          //     whiteSpace: "nowrap",
          //     borderRadius: "2px",
          //     fontSize: "85%",
          //     padding: "3px 3px 3px 6px",
          //     boxSizing: "border-box",
          //   }),
          // }}
        />
      </div>

      {/* Row 3+: Image Nodes Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          justifyItems: "center",
        }}
      >
        {imageNodeData?.map((node) => (
          <div
            key={node.id}
            className="sidebar-item"
            style={{
              width: "120px",
              height: "120px",
              //  backgroundColor: droppedImages.includes(node.id) ? '#e0e0e0' : '#e9e9e9',
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              cursor: "pointer",
            }}
            draggable={true}
            onDragStart={(e) => handleDragStart(e, node)}
          >
            <img
              src={node.imageUrl}
              alt={node.label}
              style={{ width: "115px", height: "115px", borderRadius: "8px" }}
            />
            <span
              style={{
                fontSize: "10px",
                color: "#a1a1a1ff",
                fontWeight: "bold",
                marginTop: "6px",
                textAlign: "center",
              }}
            >
              {node.label}
            </span>
          </div>
        ))}
      </div>
      <CopyScenarioModal
        openFlag={copyModal}
        setcopyModal={setcopyModal}
        scenarioId={scenarioId}
        oneClick={oneClick}
        selectedScenario={selectedScenario}
        scenarioDropDownData={scenarioDropDownData}
        handleOneClick={handleOneClick}
        setSelectedScenario={setSelectedScenario}
      />
    </div>
  );
};
export default sidebarFlow;

//  const customStyles = {
//         control: (styles, { isFocused, isDisabled }) => ({
//             ...styles,
//             borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
//             boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
//             "&:hover": {
//                 borderColor: isDisabled
//                     ? "#e8e8f7"
//                     : isFocused
//                         ? "#00d683"
//                         : styles.borderColor,
//             },
//         }),
//     };

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
