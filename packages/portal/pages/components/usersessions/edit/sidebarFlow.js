import React, { useEffect, useState } from "react";
import { Row, Col, Card, Button, Form } from "react-bootstrap";
import Select from "react-select";
import Router, { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import {
  getCategoriesList,
  getScenarioComponentListbyCategory,
} from "../../../../shared/redux/slices/common/masters";
// import {
//   getSenarioDigramList,
// } from "../../../../shared/redux/slices/customScenarios/customscenarioManage";
import {
  getSingleScenarios,
     getSingleUserSession
  
} from "../../../../shared/redux/slices/usersession/usersessionManage";

const FILE_URL = process.env.API_URL_FILEMANAGER || "";

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${FILE_URL}${url}`;
};

// const normalizeImageUrl = (url) => {
//   if (!url) return "";
//   if (url.startsWith("http")) return url;
//   return `${process.env.API_URL_FILEMANAGER}${url}`;
// };
const SidebarFlow = ({
  setDraggedNode,
  scenarioId,
  setNodes,
  setEdges,
  setDraggedComponent,
}) => {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  const handleOneClick = (flag) => {
    setOneClick(flag);
  };
  const {
    getMasterCatListData,
    getComponentByCatData,
    getScenarioDigListData,
    getScenarioFlowchart,
    getSingleScenariosSucc,
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
      getSingleScenariosSucc:
        state &&
        state.usersessionManage &&
        state.usersessionManage.singleUserSession &&
        state.usersessionManage.singleUserSession.data,

      errorData: state && state.commonMaster && state.commonMaster.error,
    };
  });
  console.log("getComponentByCatDatagetComponentByCatData", getComponentByCatData)

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const theme = localStorage.getItem("theme_preference") || "light";
    setIsDark(theme === "dark");
  }, []);
  useEffect(() => {
    dispatch(getCategoriesList());
    // dispatch(getSenarioDigramList());
  }, []);
  // useEffect(() => {
  //   if (scenarioId) {
  //     console.log("scenarioIdscenarioIdscenarioId", scenarioId)
  //     const payload = { scenarioid: scenarioId };
  //     dispatch(getSingleScenarios(scenarioId));
  //   }
  // }, [scenarioId]);

  useEffect(() => {
    if (query.slug) {
      // setRowId(query.slug[0]);
      // dispatch(getSingleScenarios(query.slug[0]));
      dispatch(getSingleUserSession(query.slug[0]));

    }
  }, [query.slug]);
  const handleDragStart = (e, node) => {
    console.log("nodeeeeeeeeeeeeee", node)
    const normalizedNode = {
      ...node,
      componentid: node.componentid || node.componentId || node.id,
      vmType: node.vmType,
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
  const [catDropDownData, setCatDropDown] = useState([]);
  const [scenarioDropDownData, setScenarioDropDownData] = useState([]);
  const [componentDropDownData, setComponentDropDown] = useState([]);
  const [componentCache, setComponentCache] = useState({});
  const [imageNodeData, setImageNodeData] = useState([]);
  const [droppedImages, setDroppedImages] = useState([]);
  const [toBeDragComponent, setToBeDragComponent] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState([]);
  const [rowValues, setRowValues] = useState(null);
  useEffect(() => {
    if (getSingleScenariosSucc) {
      setRowValues(getSingleScenariosSucc);
    }
  }, [getSingleScenariosSucc])
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
  console.log("getComponentByCatDatagetComponentByCatDatagetComponentByCatData", getComponentByCatData);

  useEffect(() => {
    if (getComponentByCatData && getComponentByCatData.length > 0) {
      let filteredData = getComponentByCatData.map((cat) => ({
        value: cat?.vmid || "",
        vmType: cat?.componenttype,
        label: cat?.vmid + " - " + cat?.vmname,
        networkport: cat?.networkport || "",
        subcategoryimage: cat?.imageurl || "",
        duration: cat?.duration || "",
        componentid: cat?.componentid || "",
      }));
      setComponentDropDown(filteredData);
    }
  }, [getComponentByCatData]);
  console.log("selectedComponentselectedComponent", selectedComponent);

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
      console.log("toBeDragComponenttoBeDragComponent", toBeDragComponent)

      const newNodes = toBeDragComponent.map((cat) => ({
        id: cat?.value,
        imageUrl: cat?.subcategoryimage
          ? `${process.env.API_URL_FILEMANAGER}${cat?.subcategoryimage}`
          : "",
        // imageUrl: normalizeImageUrl(cat.subcategoryimage),
        vmType: cat?.vmType,
        label: cat?.label,
        networkport: cat?.networkport,
        duration: cat?.duration,
        componentid: cat?.componentid,
      }));
      console.log("newNodesnewNodes", newNodes)
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
    if (!Array.isArray(getSingleScenariosSucc) || !getSingleScenariosSucc.length)
      return;
    const scenario = getSingleScenariosSucc[0];
    console.log("scenarioscenario", scenario);
    if (!scenario) return;
    /* ---------- restore diagram ---------- */
    if (scenario.scenariodiagram?.trim()) {
      const parsed = JSON.parse(
        scenario.scenariodiagram.replace("flowchartData ", "")
      );
      if (parsed?.nodes && parsed?.edges) {
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      }
    }
    /* ---------- restore components ---------- */
    if (!scenario.components) return;
    let parsedComponents = [];
    console.log("componentssssssssssss", scenario.components)
    try {
      parsedComponents = JSON.parse(scenario.components);
      console.log("parsedComponentsparsedComponents", parsedComponents)
    } catch (e) {
      console.error("Invalid components JSON", e);
      return;
    }
    const normalized = parsedComponents.map((node) => ({
      ...node,
      id: node.id || node.nodeid,
      componentid: node.componentid || node.componentId || node.id,
      imageUrl: normalizeImageUrl(
        node.imageUrl || node.subcategoryimage
      ),
      networkport: node.networkport || [],
    }
    ));
    console.log("normalizednormalized", normalized)

    setImageNodeData(normalized);
    setDraggedComponent(normalized);
    setDroppedImages(normalized.map((n) => n.id));
  }, [getSingleScenariosSucc]);

  //-new component dragged 
  // useEffect(() => {
  //   if (!Array.isArray(getSingleScenariosSucc) || !getSingleScenariosSucc.length)
  //     return;
  //   const scenario = getSingleScenariosSucc[0];
  //   console.log("scenarioscenario", scenario);
  //   if (!scenario) return;

  //   /* ---------- restore diagram ---------- */
  //   let parsedDiagram = null;

  //   if (scenario.scenariodiagram?.trim()) {
  //     try {
  //       parsedDiagram = JSON.parse(
  //         scenario.scenariodiagram.replace("flowchartData ", "")
  //       );

  //       if (parsedDiagram?.nodes && parsedDiagram?.edges) {
  //         setNodes(parsedDiagram.nodes);
  //         setEdges(parsedDiagram.edges);
  //       }
  //     } catch (e) {
  //       console.error("Invalid scenariodiagram JSON", e);
  //       return;
  //     }
  //   }

  //   /* ---------- restore components FROM DIAGRAM (source of truth) ---------- */
  //   if (!parsedDiagram?.nodes) return;

  //   const diagramComponents = parsedDiagram.nodes
  //     .filter((n) => n.type === "imageNode" && n.data)
  //     .map((node) => ({
  //       id: node.id,
  //       nodeid: node.id,

  //       // IMPORTANT: keep compatibility with old code
  //       componentid: node.data.componentId || node.data.componentid || node.id,

  //       label: node.data.label || "",
  //       duration: node.data.duration ?? "",
  //       vmid: node.data.vmid,
  //       vmType: node.data.vmType,

  //       imageUrl: normalizeImageUrl(node.data.image),
  //       networkport: node.data.networkport || [],
  //     }));

  //   console.log("diagramComponents ", diagramComponents);

  //   // sidebar data
  //   setImageNodeData(diagramComponents);

  //   // drag state
  //   setDraggedComponent(diagramComponents);

  //   // track dropped images (for preventing duplicate drop)
  //   setDroppedImages(diagramComponents.map((n) => n.id));

  // }, [getSingleScenariosSucc]);

  useEffect(() => {
    if (!imageNodeData?.length) return;

    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const match = imageNodeData.find(
          (img) => String(img.id) === String(node.id)
        );

        if (!match) return node;

        return {
          ...node,
          data: {
            ...node.data,
            image: match.imageUrl,          //  image visible
            networkport: match.networkport, //  ports visible
            componentId: match.componentid,
            label: match.label || node.data?.label,
          },
        };
      })
    );
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

