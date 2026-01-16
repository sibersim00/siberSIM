import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoriesList,
  getScenarioComponentListbyCategory,
} from "../../../shared/redux/slices/commons/commons";

import {
  getSenarioDigramList,
  getSinglecustomScenarios,
  clearSingleScenarios,
} from "../../../shared/redux/slices/customScenarios/customscenarioManage";

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${process.env.API_URL_FILEMANAGER}${url}`;
};
const SidebarFlow = ({
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
    return {
      getMasterCatListData:
        state &&
        state.commonsdata &&
        state.commonsdata.getMasterCatListData &&
        state.commonsdata.getMasterCatListData.data,
      getComponentByCatData:
        state &&
        state.commonsdata &&
        state.commonsdata.getScnarioComponentByCatData &&
        state.commonsdata.getScnarioComponentByCatData.data,
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
      errorData: state && state.commonsdata && state.commonsdata.error,
    };
  });
    const [isDark, setIsDark] = useState(false);
  // const theme = localStorage.getItem("theme_preference") || "light";
  // const isDark = theme === "dark";
    useEffect(() => {
    const theme = localStorage.getItem("theme_preference") || "light";
    setIsDark(theme === "dark");
  }, []);
  useEffect(() => {
    dispatch(getCategoriesList());
    dispatch(getSenarioDigramList());
  }, []);
  useEffect(() => {
    if (scenarioId) {
      const payload = { scenarioid: scenarioId };
      // dispatch(getScenarioFlow(payload));
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
  console.log("rowValues", rowValues)
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
        setEdges(parsedData.edges);
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

      setImageNodeData(normalizedData); // 👈 update sidebar immediately
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
  if (!getScenarioFlowchart?.components) {
    setImageNodeData([]);
    return;
  }
  let parsedComponents = [];
  try {
    const parsed = JSON.parse(getScenarioFlowchart.components);
    parsedComponents = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Invalid components JSON", err);
    parsedComponents = [];
  }
  const normalizedComponents = parsedComponents.map((node) => ({
    ...node,
    componentid: node.componentid || node.componentId || node.id,
    imageUrl: normalizeImageUrl(
      node.imageUrl || node.subcategoryimage
    ),
  }));
  setImageNodeData(normalizedComponents);
}, [getScenarioFlowchart]);



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
               styles={{
              control: (provided) => ({
                ...provided,
                backgroundColor: isDark ? "var(--dark-bg-color)" : "#fff",
                color: isDark ? "#fff" : "#000",
                borderColor: "#ced4da",
              }),
              menu: (provided) => ({
                ...provided,
                backgroundColor: isDark ? "#0e0e23" : "#fff",
                color: isDark ? "#fff" : "#000",
                zIndex: 9999,
              }),
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isSelected
                  ? "var(--primary-bg-color)"
                  : state.isFocused
                  ? "#04973C"
                  : isDark
                  ? "var(--dark-bg-color)"
                  : "#fff",
                color: isDark ? "#fff" : "#000",
                cursor: "pointer",
              }),
              singleValue: (provided) => ({
                ...provided,
                color: isDark ? "#fff" : "#000",
              }),
              placeholder: (provided) => ({
                ...provided,
                color: isDark ? "#aaa" : "#555",
              }),
              input: (provided) => ({
                ...provided,
                color: isDark ? "#fff" : "#000",
              }),
            }}
            name="component_category"
            value={selectedCategory}
            options={catDropDownData}
            placeholder="Component Category"
            onChange={handleCategoryChange}
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
           styles={{
            control: (provided) => ({
              ...provided,
              backgroundColor: isDark ? "var(--dark-bg-color)" : "#fff",
              color: isDark ? "#fff" : "#000",
              borderColor: "#ced4da",
            }),
            menu: (provided) => ({
              ...provided,
              backgroundColor: isDark ? "#0e0e23" : "#fff",
              color: isDark ? "#fff" : "#000",
              zIndex: 9999,
            }),
            option: (provided, state) => ({
              ...provided,
              backgroundColor: state.isSelected
                ? "var(--primary-bg-color)"
                : state.isFocused
                ? "#04973C"
                : isDark
                ? "var(--dark-bg-color)"
                : "#fff",
              color: isDark ? "#fff" : "#000",
              cursor: "pointer",
            }),
            singleValue: (provided) => ({
              ...provided,
              color: isDark ? "#fff" : "#000",
            }),
            placeholder: (provided) => ({
              ...provided,
              color: isDark ? "#aaa" : "#555",
            }),
            input: (provided) => ({
              ...provided,
              color: isDark ? "#fff" : "#000",
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
          }}
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
export default SidebarFlow;

