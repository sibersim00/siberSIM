import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoriesList,
  getScenarioComponentListbyCategory,
} from "../../../../shared/redux/slices/common/masters";
import {
  getSenarioDigramList,
  getSinglecustomScenarios,
  clearSingleScenarios,
} from "../../../../shared/redux/slices/customScenarios/customscenarioManage";
const sidebarFlow = ({
  setDraggedNode,
  scenarioId,
  setNodes,
  setEdges,
  setEdgeRouting,
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
        state.customScenario &&
        state.customScenario.getScenarioDigListData &&
        state.customScenario.getScenarioDigListData.data,
      getScenarioFlowchart:
        state &&
        state.customScenario &&
        state.customScenario.singleScenarios &&
        state.customScenario.singleScenarios.data,
      errorData: state && state.commonMaster && state.commonMaster.error,
    };
  });

  const getSelectStyles = (fieldName) => {
    return {
      ...customStyles,
      control: (styles, state) => ({
        ...styles,
        backgroundColor: "var(--dark-bg-color)", 
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "var(--light-text-color)", 
      }),
      input: (provided) => ({
        ...provided,
        color: "var(--light-text-color)", 
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
      dispatch(getSinglecustomScenarios(scenarioId));
    }
  }, [scenarioId]);
  const handleDragStart = (e, node) => {
    const normalizedNode = {
      ...node,
      componentid: node.componentid || node.componentId || node.id,
      vmid:
        node.vmid ||
        (() => {
          try {
            return (node.label || "").split(" - ")[0].trim();
          } catch (err) {
            return "";
          }
        })(),
    };
    setDraggedNode(normalizedNode);
  };
  const [oneClick, setOneClick] = useState(false);
  const [copyModal, setcopyModal] = useState(false);
  const [catDropDownData, setCatDropDown] = useState([]);
  const [scenarioDropDownData, setScenarioDropDownData] = useState([]);
  const [componentDropDownData, setComponentDropDown] = useState([]);
  const [componentCache, setComponentCache] = useState({});
  const [imageNodeData, setImageNodeData] = useState([]); 
  const [droppedImages, setDroppedImages] = useState([]); 
  const [toBeDragComponent, setToBeDragComponent] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [rowValues, setRowValues] = useState(null);

  useEffect(() => {
    if (getScenarioFlowchart) {
      setRowValues(getScenarioFlowchart);
    }
  }, [getScenarioFlowchart])
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
    dispatch(
      getScenarioComponentListbyCategory({
        componentcategoryid: selectedOption.value,
      })
    );
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

  useEffect(() => {
    if (selectedComponent && selectedComponent.length > 0) {
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
  useEffect(() => {
    if (
      getScenarioFlowchart &&
      getScenarioFlowchart.scenariodiagram &&
      getScenarioFlowchart.scenariodiagram.trim()
    ) {
      const data = getScenarioFlowchart.scenariodiagram;
      const parsedData = JSON.parse(data.replace("flowchartData ", ""));
      if (parsedData?.nodes && parsedData?.edges) {
        setNodes(parsedData.nodes);
        const routing = parsedData.edgeRouting === "smooth" ? "smooth" : "bezier";
        setEdges(parsedData.edges.map((edge) => ({
          ...edge,
          type: "custom",
          data: { ...edge.data, edgeRouting: routing },
        })));
        setEdgeRouting?.(parsedData.edgeRouting === "smooth" ? "smooth" : "bezier");
      }
    }
    if (getScenarioFlowchart && getScenarioFlowchart.components) {
      const componentsdata = getScenarioFlowchart.components;
      const parsedcomponentData = JSON.parse(componentsdata);
      const normalizedData = parsedcomponentData.map((node) => ({
        ...node,
        componentid: node.componentid || node.componentId || node.id,
        imageUrl: `${process.env.API_URL_FILEMANAGER}${node.imageUrl || node.subcategoryimage || ""}`, // 👈 ensure full URL
      }));

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
  useEffect(() => {
  if (imageNodeData && imageNodeData.length > 0) {
    const updated = imageNodeData.map((node) => {
      if (node.imageUrl && !node.imageUrl.startsWith("http")) {
        return {
          ...node,
          imageUrl: `${process.env.API_URL_FILEMANAGER}${node.imageUrl}`,
        };
      }
      return node;
    });
    const changed = JSON.stringify(updated) !== JSON.stringify(imageNodeData);
    if (changed) {
      setImageNodeData(updated);
    }
  }
}, [imageNodeData]);

useEffect(() => {
  if (!imageNodeData || imageNodeData.length === 0) return;

  setNodes((prevNodes) => {
    const updated = prevNodes.map((node) => {
      const match = imageNodeData.find(
        (imgNode) =>
          imgNode.componentid === node.data?.componentId ||
          imgNode.label === node.data?.label
      );

      if (match && match.imageUrl && node.data?.image !== match.imageUrl) {
        return {
          ...node,
          data: {
            ...node.data,
            image: match.imageUrl,
          },
        };
      }
      return node;
    });

    return updated;
  });
}, [imageNodeData]);



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
      <div
        className="mb-2"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          maxWidth: "400px",
        }}
      >


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
          />
      </div>
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
    </div>
  );
};
export default sidebarFlow;
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

