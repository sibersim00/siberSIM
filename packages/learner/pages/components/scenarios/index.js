import React, { useState, useEffect, useMemo, useRef, useCallback} from "react";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import { Row, Col, Card, Button, OverlayTrigger, Tooltip, Nav, Tab} from "react-bootstrap";
import { getScenariosList } from "../../../shared/redux/slices/scenarios/scenarios";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";
import { AgGridReact } from "ag-grid-react";
import ActionButtonRenderer from "../../../shared/data/masterbuttons/action-button";
import { useRouter } from "next/router";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import PauseScenarios from "../../../../learner/pages/components/pausescenarios";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const Scenarios = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { scenariosListData } = useSelector((state) => ({
    scenariosListData: state?.scenarios?.getScenariosListData?.data ?? null,
  }));

  const [view, setView] = useState("card");
  const [quickFilter, setQuickFilter] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);

  const [gridApi, setGridApi] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const [showCategoryCard, setShowCategoryCard] = useState(false);
  const [showSubcategoryCard, setShowSubcategoryCard] = useState(false);
  const [indexId, setIndexId] = useState("tab1");
  const [showTabs, setShowTabs] = useState(true);
  const [pageSize, setPageSize] = useState(20);
  const gridRef = useRef(null);
  const gridHeight =
    HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders

  useEffect(() => {
    dispatch(getScenariosList());
  }, [dispatch]);

  useEffect(() => {
    if (scenariosListData) {
      setFilteredData(scenariosListData);
    }
  }, [scenariosListData]);
  
  const StepBreadcrumb = ({
    selectedCategory,
    selectedSubcategory,
    onCategoryClick,
    onSubcategoryClick,
  }) => {
    const steps = [
      {
        label: "Categories",
        active: !selectedCategory,
        done: !!selectedCategory,
        onClick: () => {
          onCategoryClick(null);
          onSubcategoryClick(null);
        },
      },
      {
        label: selectedCategory?.scenariocategory_name || "Sub-category",
        active: selectedCategory && !selectedSubcategory,
        done: !!selectedSubcategory,
        onClick: () => selectedCategory && onSubcategoryClick(null),
      },
      {
        label: selectedSubcategory?.scenariosubcategory_name || "Scenario",
        active: !!selectedSubcategory,
        done: false,
        onClick: null,
      },
    ];

    return (
      <div
        className="d-flex align-items-center gap-2 px-2 py-2 rounded-3 bg-light border"
        style={{ fontSize: "13px" }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <div
              className="d-flex align-items-center gap-1"
              onClick={step.onClick}
              style={{ cursor: step.onClick ? "pointer" : "default" }}
            >
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: 24,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 500,
                  background: step.done
                    ? "#185FA5"
                    : step.active
                      ? "#185FA5"
                      : "#e9ecef",
                  color: step.done || step.active ? "white" : "#6c757d",
                  flexShrink: 0,
                }}
              >
                {step.done ? (
                  <i className="fe fe-check" style={{ fontSize: 11 }} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  color: step.done
                    ? "#185FA5"
                    : step.active
                      ? "#afc1d3"
                      : "#6c757d",
                  fontWeight: step.active ? 600 : 400,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <i
                className="fe fe-chevron-right text-muted"
                style={{ fontSize: 12 }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const uniqueCategories = Array.from(
    new Map(
      scenariosListData?.map((item) => [item.scenariocategoryid, item]),
    ).values(),
  ).sort((a, b) =>
    a.scenariocategory_name.localeCompare(b.scenariocategory_name),
  );
  const uniqueSubcategories = selectedCategory
    ? Array.from(
        new Map(
          scenariosListData
            .filter(
              (item) =>
                item.scenariocategoryid === selectedCategory.scenariocategoryid,
            )
            .map((item) => [item.scenariosubcategory_name, item]),
        ).values(),
      ).sort((a, b) =>
        a.scenariosubcategory_name?.localeCompare(b.scenariosubcategory_name),
      )
    : [];

  useEffect(() => {
    if (!selectedCategory) {
      setFilteredData([]);
      setSelectedSubcategory(null);
      return;
    }
    let filtered = scenariosListData.filter(
      (item) => item.scenariocategoryid === selectedCategory.scenariocategoryid,
    );
    if (selectedSubcategory) {
      filtered = filtered.filter(
        (item) =>
          item.scenariosubcategory_name ===
          selectedSubcategory.scenariosubcategory_name,
      );
    }
    setFilteredData(filtered);
  }, [selectedCategory, selectedSubcategory, scenariosListData]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setShowCategoryCard(true);
    setShowSubcategoryCard(false);
  };
  const handleSubcategoryClick = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setShowSubcategoryCard(true);
    setShowCategoryCard(false);
  };
  useEffect(() => {
    if (scenariosListData) {
      let filtered = scenariosListData;
      if (selectedCategory) {
        filtered = filtered.filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid,
        );
      }
      if (selectedSubcategory) {
        filtered = filtered.filter(
          (item) =>
            item.scenariosubcategory_name ===
            selectedSubcategory.scenariosubcategory_name,
        );
      }
      setFilteredData(filtered);
    }
  }, [scenariosListData, selectedCategory, selectedSubcategory]);
  useEffect(() => {
    if (!scenariosListData) return;

    // Restore category
    if (router.query.categoryId) {
      const category = scenariosListData.find(
        (item) => item.scenariocategoryid === Number(router.query.categoryId),
      );
      if (category) setSelectedCategory(category);
    }

    // Restore subcategory
    if (router.query.subcategoryName) {
      const subcategory = scenariosListData.find(
        (item) =>
          item.scenariosubcategory_name === router.query.subcategoryName,
      );
      if (subcategory) setSelectedSubcategory(subcategory);
    }

    // Restore view type (card / list)
    if (router.query.view) {
      setView(router.query.view);
    }
  }, [router.query, scenariosListData]);

  const columnDefs = [
    {
      headerName: "Sr No.",
      field: "",
      cellRenderer: "srNoRender",
      floatingFilter: false,
      filter: false,
      headerClass: "ag-header-cell",
      minWidth: 80,
      sortable: false,
    },

    {
      headerName: "Identification No",
      field: "scenarioidentification",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Title",
      field: "scenariotitle",
      filter: true,
      floatingFilter: true,
      minWidth: 240,
    },
    {
      headerName: "Level",
      field: "scenariolevel",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Scenario Category",
      field: "scenariocategory_name",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Scenario Sub-Category",
      field: "scenariosubcategory_name",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
    },
    {
      headerName: "Duration",
      field: "duration",
      filter: true,
      floatingFilter: true,
      minWidth: 180,
      valueGetter: (params) => {
        const value = params.data?.duration;
        return value != null ? `${value} Mins` : "0 Mins";
      },
    },
    {
      headerName: "Action",
      field: "status",
      pinned: "right",
      minWidth: 80,
      cellRenderer: "actionButtonRenderer",
    },
  ];
  const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };
  const onGridReady = useCallback((params) => {
    gridRef.current = params.api;

    // Set correct height on first load as well
    const initialPageSize = params.api.paginationGetPageSize();
    const totalRows = params.api.getDisplayedRowCount();
    const effectiveRows = Math.min(initialPageSize, totalRows);
    setPageSize(effectiveRows);
  }, []);

  // Fires when page size changes via the built-in dropdown
  const onPaginationChanged = useCallback((params) => {
    if (params.api) {
      const newPageSize = params.api.paginationGetPageSize();
      const totalRows = params.api.getDisplayedRowCount();

      // Use whichever is smaller — actual rows vs page size
      const effectiveRows = Math.min(newPageSize, totalRows);
      setPageSize(effectiveRows);
    }
  }, []);

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);

  const categoryCounts = useMemo(() => {
    if (!scenariosListData) return {};
    return scenariosListData.reduce((acc, item) => {
      acc[item.scenariocategoryid] = (acc[item.scenariocategoryid] || 0) + 1;
      return acc;
    }, {});
  }, [scenariosListData]);

  const handleChangeView = (thisView) => {
    setView(thisView);
  };

  const onFilterChanged = (data) => {
    setQuickFilter(data);
    const val = data.toLowerCase().trim();

    if (!val) {
      if (!selectedCategory) {
        setFilteredCategories([]);
        setFilteredSubcategories([]);
        setFilteredData([]);
      } else if (selectedCategory && !selectedSubcategory) {
        const filtered = scenariosListData.filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid,
        );
        setFilteredSubcategories(filtered);
        setFilteredData([]);
      } else if (selectedCategory && selectedSubcategory) {
        const filtered = scenariosListData.filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid &&
            item.scenariosubcategory_name ===
              selectedSubcategory.scenariosubcategory_name,
        );
        setFilteredData(filtered);
      }
      return;
    }

    if (!selectedCategory) {
      const seenIds = new Set();
      const filtered = scenariosListData.filter((item) => {
        const match = item.scenariocategory_name?.toLowerCase().includes(val);
        if (match && !seenIds.has(item.scenariocategoryid)) {
          seenIds.add(item.scenariocategoryid);
          return true;
        }
        return false;
      });
      setFilteredCategories(filtered);
    } else if (selectedCategory && !selectedSubcategory) {
      const seenSubcats = new Set();
      const filtered = scenariosListData
        .filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid,
        )
        .filter((item) => {
          const match = item.scenariosubcategory_name
            ?.toLowerCase()
            .includes(val);
          if (match && !seenSubcats.has(item.scenariosubcategory_name)) {
            seenSubcats.add(item.scenariosubcategory_name);
            return true;
          }
          return false;
        });
      setFilteredSubcategories(filtered);
    } else if (selectedCategory && selectedSubcategory) {
      const filtered = scenariosListData
        .filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid &&
            item.scenariosubcategory_name ===
              selectedSubcategory.scenariosubcategory_name,
        )
        .filter((item) => {
          const titleMatch = item.scenariotitle?.toLowerCase().includes(val);
          const levelMatch = item.scenariolevel?.toLowerCase().includes(val);
          const durationMatch = String(item.duration ?? "").includes(val);
          const categoryMatch = item.scenariocategory_name
            ?.toLowerCase()
            .includes(val);
          const subcategoryMatch = item.scenariosubcategory_name
            ?.toLowerCase()
            .includes(val);

          return (
            titleMatch ||
            levelMatch ||
            durationMatch ||
            categoryMatch ||
            subcategoryMatch
          );
        });

      setFilteredData(filtered);
    }
  };

  const [columnsPerRow, setColumnsPerRow] = useState(3);
  const colarray = [6, 4, 3, 2];
  const zoomIn = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex > 0) {
      setColumnsPerRow(colarray[currentIndex - 1]);
    }
  };
  const zoomOut = () => {
    const currentIndex = colarray.indexOf(columnsPerRow);
    if (currentIndex < colarray.length - 1) {
      setColumnsPerRow(colarray[currentIndex + 1]);
    }
  };

  const handleReturnView = (props) => {
    const categoryId = selectedCategory?.scenariocategoryid || "";
    const subcategoryName = selectedSubcategory?.scenariosubcategory_name || "";

    router.push({
      pathname: `/scenarios_view/${props?.scenariouuid}`,
      query: {
        backView: view,
        categoryId,
        subcategoryName,
      },
    });
  };

  const frameworkComponents = {
    srNoRender: function (props) {
      return props.node.rowIndex + 1;
    },

    actionButtonRenderer: function (props) {
      return (
        <ActionButtonRenderer
          handleEditView={handleReturnView}
          handleShowEditView={true}
          propsVal={props}
        />
      );
    },
  };

  return (
    <>
      <Seo title="Scenarios" />
      <Row className="mg-b-10 text-wrap">
        <div className="panel panel-primary tabs-style-2">
          <div className="tab-menu-heading">
            <div className="tabs-menu">
              <Tab.Container
                activeKey={indexId}
                onSelect={(k) => setIndexId(k)}
              >
                {showTabs && (
                  <Row id="tabs-style-2" className="pd-l-30 pd-r-30">
                    <Nav className="d-flex align-items-center panel-body tabs-menu-body pills bd-b pb-0 pt-1 bg-white">
                      <Nav.Item className="mastermenu">
                        <Nav.Link
                          eventKey="tab1"
                          className="masterlist"
                          style={{
                            color: indexId === "tab1" ? "#007bff" : "gray",
                            fontWeight: indexId === "tab1" ? "bold" : "normal",
                          }}
                        >
                          Scenarios
                        </Nav.Link>
                      </Nav.Item>

                      <Nav.Item className="mastermenu">
                        <Nav.Link
                          eventKey="tab2"
                          className="masterlist"
                          style={{
                            color: indexId === "tab2" ? "#007bff" : "gray",
                            fontWeight: indexId === "tab2" ? "bold" : "normal",
                          }}
                        >
                          {" "}
                          Pause Scenarios
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>

                    {/* ------------------ */}
                  </Row>
                )}

                <Tab.Content>
                  <Tab.Pane eventKey="tab1">
                    <Card className="custom-card overflow-hidden">
                      <Card.Body className="p-3 ">
                        <Col md={12}>
                          <div className="d-flex justify-content-between align-items-center">
                            <StepBreadcrumb
                              selectedCategory={selectedCategory}
                              selectedSubcategory={selectedSubcategory}
                              onCategoryClick={(cat) => {
                                setSelectedCategory(cat);
                                setSelectedSubcategory(null);
                                setShowTabs(true);
                              }}
                              onSubcategoryClick={(sub) => {
                                setSelectedSubcategory(sub);
                                setShowTabs(true);
                              }}
                            />

                            <div className="d-flex align-items-center">
                              {view === "card" && (
                                <>
                                  <button
                                    onClick={zoomIn}
                                    className="btn bd bd-success text-success mx-1"
                                    title="Zoom In"
                                  >
                                    <i className="fas fa-search-plus"></i>
                                  </button>
                                  <button
                                    onClick={zoomOut}
                                    className="btn bd bd-success text-success"
                                    title="Zoom Out"
                                  >
                                    <i className="fas fa-search-minus"></i>
                                  </button>
                                  &nbsp;
                                </>
                              )}
                              <Button
                                type="button"
                                title="Card View"
                                variant="outline-success"
                                onClick={() => handleChangeView("card")}
                                className={
                                  view === "card"
                                    ? "mx-1 active text-white"
                                    : "mx-1"
                                }
                              >
                                <i className="fe fe-grid"></i>
                              </Button>
                              <Button
                                type="button"
                                title="List View"
                                variant="outline-success"
                                onClick={() => handleChangeView("list")}
                                className={
                                  view === "list" ? "active text-white" : ""
                                }
                              >
                                <i className="fe fe-list"></i>
                              </Button>
                              &nbsp;&nbsp;
                              <input
                                className="form-control bd bd-2 ms-2 w-auto"
                                value={quickFilter}
                                placeholder="Search..."
                                type="text"
                                onChange={(e) =>
                                  onFilterChanged(e.target.value)
                                }
                              />
                            </div>
                          </div>
                        </Col>

                        <Col md={12}>
                          {view == "list" ? (
                            <div
                              className="ag-theme-alpine mt-2"
                              style={{
                                height: `${gridHeight}px`,
                                width: "100%",
                                overflow: "visible",
                              }}
                            >
                              <AgGridReact
                                id="cat_grid"
                                headerHeight={35}
                                rowHeight={40}
                                gridOptions={gridOptions}
                                rowData={filteredData}
                                columnDefs={columnDefs}
                                pagination={true}
                                paginationPageSize={20}
                                onGridReady={onGridReady}
                                components={frameworkComponents}
                                onPaginationChanged={onPaginationChanged}
                                defaultColDef={defaultColDef}
                              />
                            </div>
                          ) : (
                            ""
                          )}
                        </Col>
                      </Card.Body>
                    </Card>

                    {view === "card" && (
                      <Row className="row-sm">
                        {!selectedCategory &&
                          (filteredCategories.length > 0
                            ? filteredCategories
                            : uniqueCategories
                          ).map((item, idx) => {
                            // Each category gets a color pair: [accentColor, bgColor, textColor]
                            const COLOR_PAIRS = [
                              ["#185FA5", "#E6F1FB", "#0C447C"],
                              ["#3B6D11", "#EAF3DE", "#27500A"],
                              ["#854F0B", "#FAEEDA", "#633806"],
                              ["#A32D2D", "#FCEBEB", "#791F1F"],
                              ["#534AB7", "#EEEDFE", "#3C3489"],
                              ["#0F6E56", "#E1F5EE", "#085041"],
                              ["#993556", "#FBEAF0", "#72243E"],
                              ["#5F5E5A", "#F1EFE8", "#444441"],
                            ];
                            const [accent, iconBg, iconText] =
                              COLOR_PAIRS[idx % COLOR_PAIRS.length];

                            return (
                              <Col
                                md={columnsPerRow}
                                className="p-2"
                                key={item.scenariocategoryid}
                              >
                                <Card
                                  className="h-100 pointer"
                                  style={{
                                    borderLeft: `3px solid ${accent}`,
                                    borderRadius: 16,
                                    overflow: "hidden",
                                    cursor: "pointer",
                                    transition: "transform .15s",
                                  }}
                                  onClick={() => handleCategoryClick(item)}
                                >
                                  <Card.Body
                                    className="p-3"
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 10,
                                    }}
                                  >
                                    {/* Icon box */}
                                    <div className="text-center mb-2">
                                      <div
                                        style={{
                                          width: 90,
                                          height: 90,
                                          borderRadius: "50%",
                                          background: iconBg,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          margin: "0 auto",
                                        }}
                                      >
                                        <img
                                          alt="category"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = dummy_network.src;
                                          }}
                                          style={{
                                            width: 70,
                                            height: 70,
                                            objectFit: "contain",
                                            borderRadius: "50%",
                                          }}
                                          src={
                                            item?.category_image
                                              ? `${process.env.API_URL_FILEMANAGER}${item?.category_image}`
                                              : dummy_network.src
                                          }
                                        />
                                      </div>
                                    </div>

                                    {/* Name + count */}
                                    <div className="text-center">
                                      <div
                                        style={{
                                          fontSize: 16,
                                          fontWeight: 600,
                                          color: "#8d969e",
                                          lineHeight: 1.35,
                                        }}
                                      >
                                        {item?.scenariocategory_name || ""}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#6c757d",
                                          marginTop: 2,
                                        }}
                                      >
                                        {categoryCounts[
                                          item.scenariocategoryid
                                        ] ?? 0}{" "}
                                        scenarios
                                      </div>
                                    </div>
                                  </Card.Body>

                                  {/* Footer */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "8px 14px",
                                      // borderTop: "0.5px solid #dee2e6",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: iconBg,
                                        color: iconText,
                                      }}
                                    >
                                      <i className="fe fe-book-open" />
                                      {categoryCounts[
                                        item.scenariocategoryid
                                      ] ?? 0}
                                    </span>
                                    <div
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        border: "0.5px solid #dee2e6",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#6c757d",
                                        fontSize: 14,
                                      }}
                                    >
                                      <i className="fe fe-arrow-right" />
                                    </div>
                                  </div>
                                </Card>
                              </Col>
                            );
                          })}
                          {selectedCategory &&
                              !selectedSubcategory &&
                              (filteredSubcategories.length > 0 ? filteredSubcategories : uniqueSubcategories).map((item, idx) => {
                                const COLOR_PAIRS = [
                                  ["#185FA5", "#E6F1FB", "#0C447C"],
                                  ["#3B6D11", "#EAF3DE", "#27500A"],
                                  ["#854F0B", "#FAEEDA", "#633806"],
                                  ["#A32D2D", "#FCEBEB", "#791F1F"],
                                  ["#534AB7", "#EEEDFE", "#3C3489"],
                                  ["#0F6E56", "#E1F5EE", "#085041"],
                                  ["#993556", "#FBEAF0", "#72243E"],
                                  ["#5F5E5A", "#F1EFE8", "#444441"],
                                ];
                                const [accent, iconBg, iconText] = COLOR_PAIRS[idx % COLOR_PAIRS.length];

                                return (
                                  <Col md={columnsPerRow} className="p-2" key={idx}>
                                    <Card
                                      className="h-100 pointer"
                                      style={{
                                        borderLeft: `3px solid ${accent}`,
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: "transform .15s",
                                      }}
                                      onClick={() => handleSubcategoryClick(item)}
                                    >
                                      <Card.Body className="p-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        <div className="text-center mb-2">
                                          <div
                                            style={{
                                              width: 90, height: 90, borderRadius: "50%",
                                              background: iconBg,
                                              display: "flex", alignItems: "center", justifyContent: "center",
                                              margin: "0 auto",
                                            }}
                                          >
                                            <img
                                              alt="subcategory"
                                              onError={e => { e.target.onerror = null; e.target.src = dummy_network.src; }}
                                              style={{ width: 70, height: 70, objectFit: "contain", borderRadius: "50%" }}
                                              src={item?.subcategory_image
                                                ? `${process.env.API_URL_FILEMANAGER}${item?.subcategory_image}`
                                                : dummy_network.src}
                                            />
                                          </div>
                                        </div>
                                        <div className="text-center">
                                          <div style={{ fontSize: 14, fontWeight: 600, color: "#8d969e", lineHeight: 1.35 }}>
                                            {item?.scenariosubcategory_name || ""}
                                          </div>
                                        </div>
                                      </Card.Body>

                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                                        <span style={{
                                          display: "inline-flex", alignItems: "center", gap: 5,
                                          fontSize: 11, fontWeight: 500, padding: "3px 10px",
                                          borderRadius: 20, background: iconBg, color: iconText,
                                        }}>
                                          <i className="fe fe-layers" />
                                          {scenariosListData?.filter(s => s.scenariosubcategory_name === item.scenariosubcategory_name).length ?? 0} scenarios
                                        </span>
                                        <div style={{
                                          width: 26, height: 26, borderRadius: "50%",
                                          border: "0.5px solid #dee2e6",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          color: "#6c757d", fontSize: 14,
                                        }}>
                                          <i className="fe fe-arrow-right" />
                                        </div>
                                      </div>
                                    </Card>
                                  </Col>
                                );
                              })}

                        {selectedCategory &&
                          selectedSubcategory &&
                          filteredData.length > 0 &&
                          ["Easy", "Medium", "Hard"].map((level) => {
                            const levelData = filteredData
                              .filter((item) => item.scenariolevel === level)
                              .sort((a, b) => {
                                const titleCompare =
                                  a.scenariotitle.localeCompare(
                                    b.scenariotitle,
                                  );
                                if (titleCompare !== 0) {
                                  return titleCompare;
                                }

                                return (a.duration ?? 0) - (b.duration ?? 0);
                              });

                            return levelData.length > 0 ? (
                              <div key={level} className="mb-3">
                                <h5 className="mb-2 d-flex align-items-center gap-2">
                                  <span className="d-flex align-items-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                      <i
                                        key={i}
                                        className={`fa ${
                                          i <
                                          (level === "Hard"
                                            ? 3
                                            : level === "Medium"
                                              ? 2
                                              : 1)
                                            ? "fa-star"
                                            : "fa-star-o"
                                        }`}
                                        style={{
                                          color:
                                            level === "Hard"
                                              ? "#dc3545"
                                              : level === "Medium"
                                                ? "#ffc107"
                                                : "#28a745",
                                        }}
                                      ></i>
                                    ))}
                                  </span>
                                  <span>{level}</span>
                                </h5>

                                <hr />

                                <Row className="row-sm">
                                  {levelData.map((item, index) => (
                                    <Col
                                      md={columnsPerRow}
                                      className="p-2 pb-3"
                                      key={index}
                                    >
                                     <Card
                                      className="h-100 pointer"
                                      style={{
                                        border: item.isnotitermination === "Yes" ? "0.1px solid #f0997b" : "0.1px solid #424242",
                                        borderLeft: `3px solid ${
                                          level === "Hard" ? "#A32D2D" : level === "Medium" ? "#854F0B" : "#3B6D11"
                                        }`,
                                        borderRadius: 16,
                                        overflow: "hidden",
                                        cursor: "pointer",
                                        transition: "transform .15s",
                                      }}
                                      onClick={e => { e.stopPropagation(); handleReturnView(item); }}
                                    >
                                      <Card.Body className="p-3" style={{ display: "flex", flexDirection: "column", gap: 10 }}>

                                        {/* Image */}
                                        <div className="text-center mb-1">
                                          <div style={{
                                            width: 90, height: 90, borderRadius: "50%",
                                            background: level === "Hard" ? "#FCEBEB" : level === "Medium" ? "#FAEEDA" : "#EAF3DE",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            margin: "0 auto",
                                          }}>
                                            <img
                                              alt="scenario"
                                              onError={e => { e.target.onerror = null; e.target.src = dummy_network.src; }}
                                              style={{ width: 70, height: 70, objectFit: "contain", borderRadius: "50%" }}
                                              src={item?.scenarioimage
                                                ? `${process.env.API_URL_FILEMANAGER}${item?.scenarioimage}`
                                                : dummy_network.src}
                                            />
                                          </div>
                                        </div>

                                        {/* Title */}
                                        <div className="text-center">
                                          <OverlayTrigger placement="bottom" overlay={<Tooltip>{item.scenariotitle}</Tooltip>}>
                                            <div style={{
                                              fontSize: 14, fontWeight: 600, color: "#8d969e", lineHeight: 1.35,
                                              display: "-webkit-box", WebkitLineClamp: 2,
                                              WebkitBoxOrient: "vertical", overflow: "hidden",
                                            }}>
                                              {item.scenariotitle}
                                            </div>
                                          </OverlayTrigger>
                                        </div>

                                      </Card.Body>

                                      {/* Footer */}
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px" }}>
                                        <span style={{
                                          display: "inline-flex", alignItems: "center", gap: 5,
                                          fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                                          background: level === "Hard" ? "#FCEBEB" : level === "Medium" ? "#FAEEDA" : "#EAF3DE",
                                          color: level === "Hard" ? "#791F1F" : level === "Medium" ? "#633806" : "#27500A",
                                        }}>
                                          <i className="fe fe-clock" /> {item.duration ?? 0} Mins
                                        </span>
                                        <div
                                          style={{
                                            width: 26, height: 26, borderRadius: "50%",
                                            border: "0.5px solid #dee2e6",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#6c757d", fontSize: 14,
                                          }}
                                          onClick={e => { e.stopPropagation(); setShowTabs(false); handleReturnView(item); }}
                                        >
                                          <i className="fe fe-eye" />
                                        </div>
                                      </div>
                                    </Card>
                                    </Col>
                                  ))}
                                </Row>
                              </div>
                            ) : null;
                          })}

                        {selectedCategory &&
                          selectedSubcategory &&
                          filteredData.length === 0 && (
                            <Col sm={12}>
                              <Card className="custom-card">
                                <Card.Body className="overflow-auto pd-t-10">
                                  <Row className="text-center">
                                    <Col md={10} className="mx-auto">
                                      <Card
                                        style={{
                                          width: "100px",
                                          height: "100px",
                                        }}
                                      >
                                        <Card.Body>
                                          <div className="text-center mt-5">
                                            <img
                                              src={crossEvalicon.src}
                                              alt="No data"
                                              className="wd-150 mt-5"
                                            />
                                            <h5 className="mt-4">
                                              No data found.
                                            </h5>
                                          </div>
                                        </Card.Body>
                                      </Card>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              </Card>
                            </Col>
                          )}
                      </Row>
                    )}
                  </Tab.Pane>

                  <Tab.Pane eventKey="tab2">
                    <PauseScenarios />
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          </div>
        </div>
      </Row>

      {/* ================================================================================ */}
    </>
  );
};

Scenarios.layout = "Contentlayout";
export default Scenarios;
