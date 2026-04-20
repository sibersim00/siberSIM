import React, { useState, useEffect, useMemo,useRef,useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Seo from "../../../shared/layout-components/seo/seo";
import {
  Row,
  Col,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Nav,
  Tab,
} from "react-bootstrap";
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
     const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders
  

  useEffect(() => {
    dispatch(getScenariosList());
  }, [dispatch]);

  useEffect(() => {
    if (scenariosListData) {
      setFilteredData(scenariosListData);
    }
  }, [scenariosListData]);

  const Breadcrumb = ({
    selectedCategory,
    selectedSubcategory,
    onCategoryClick,
    onSubcategoryClick,
  }) => {
    return (
      <div className="d-flex align-items-center">
        <span
          className="breadcrumb-item text-primary"
          style={{ cursor: "pointer" }}
          onClick={() => {
            onCategoryClick(null);
            onSubcategoryClick(null);
          }}
        >
          Home
        </span>

        {selectedCategory && (
          <>
            <span className="mx-2">/</span>
            <span
              className="breadcrumb-item text-primary"
              style={{ cursor: "pointer" }}
              onClick={() => onSubcategoryClick(null)}
            >
              {selectedCategory.scenariocategory_name}
            </span>
          </>
        )}

        {selectedSubcategory && (
          <>
            <span className="mx-2">/</span>
            <span className="text-primary">
              {selectedSubcategory.scenariosubcategory_name}
            </span>
          </>
        )}
      </div>
    );
  };
  const uniqueCategories = Array.from(
    new Map(
      scenariosListData?.map((item) => [item.scenariocategoryid, item])
    ).values()
  ).sort((a, b) =>
    a.scenariocategory_name.localeCompare(b.scenariocategory_name)
  );
  const uniqueSubcategories = selectedCategory
    ? Array.from(
      new Map(
        scenariosListData
          .filter(
            (item) =>
              item.scenariocategoryid === selectedCategory.scenariocategoryid
          )
          .map((item) => [item.scenariosubcategory_name, item])
      ).values()
    ).sort((a, b) =>
      a.scenariosubcategory_name?.localeCompare(b.scenariosubcategory_name)
    )
    : [];

  useEffect(() => {
    if (!selectedCategory) {
      setFilteredData([]);
      setSelectedSubcategory(null);
      return;
    }
    let filtered = scenariosListData.filter(
      (item) => item.scenariocategoryid === selectedCategory.scenariocategoryid
    );
    if (selectedSubcategory) {
      filtered = filtered.filter(
        (item) =>
          item.scenariosubcategory_name ===
          selectedSubcategory.scenariosubcategory_name
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
            item.scenariocategoryid === selectedCategory.scenariocategoryid
        );
      }
      if (selectedSubcategory) {
        filtered = filtered.filter(
          (item) =>
            item.scenariosubcategory_name ===
            selectedSubcategory.scenariosubcategory_name
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
        (item) => item.scenariocategoryid === Number(router.query.categoryId)
      );
      if (category) setSelectedCategory(category);
    }

    // Restore subcategory
    if (router.query.subcategoryName) {
      const subcategory = scenariosListData.find(
        (item) => item.scenariosubcategory_name === router.query.subcategoryName
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

  // const gridOptions = {
  //   pagination: true,
  //   paginationPageSize: 10,
  // };
      const gridOptions = {
    headerHeight: HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    suppressScrollOnNewData: true,
  };

  // const onGridReady = (params) => {
  //   setGridApi(params.api);
  // };
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
      const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data
  
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
            item.scenariocategoryid === selectedCategory.scenariocategoryid
        );
        setFilteredSubcategories(filtered);
        setFilteredData([]);
      } else if (selectedCategory && selectedSubcategory) {
        const filtered = scenariosListData.filter(
          (item) =>
            item.scenariocategoryid === selectedCategory.scenariocategoryid &&
            item.scenariosubcategory_name ===
            selectedSubcategory.scenariosubcategory_name
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
            item.scenariocategoryid === selectedCategory.scenariocategoryid
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
            selectedSubcategory.scenariosubcategory_name
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
                            <Breadcrumb
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
                          ).map((item) => (
                            <Col
                              md={columnsPerRow}
                              className="p-2"
                              key={item.scenariocategoryid}
                            >
                              <Card
                                className="card custom-card h-100 our-team pointer"
                                onClick={() => handleCategoryClick(item)}
                              >
                                <Card.Body className="p-3">
                                  <div className="text-center mb-2">
                                    <div
                                      className=" mx-auto d-flex justify-content-center align-items-center "
                                      style={{
                                        width: "100px",
                                        height: "100px",
                                      }}
                                    >
                                      <img
                                        alt="avatar"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = dummy_network.src;
                                        }}
                                        style={{
                                          width: "100px",
                                          height: "100px",
                                        }}
                                        src={
                                          item?.category_image
                                            ? `${process.env.API_URL_FILEMANAGER}${item?.category_image}`
                                            : dummy_network.src
                                        }
                                      />
                                    </div>

                                    <h5 className="pro-user-username text-dark mt-2 mb-0">
                                      {item?.scenariocategory_name || ""}
                                    </h5>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}

                        {selectedCategory &&
                          !selectedSubcategory &&
                          (filteredSubcategories.length > 0
                            ? filteredSubcategories
                            : uniqueSubcategories
                          ).map((item, idx) => (
                            <Col md={columnsPerRow} className="pb-4" key={idx}>
                              <Card
                                className="card custom-card h-100 our-team pointer"
                                onClick={() => handleSubcategoryClick(item)}
                              >
                                <Card.Body className="p-3">
                                  <div className="text-center mb-2">
                                    <div
                                      className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                                      style={{
                                        width: "100px",
                                        height: "100px",
                                      }}
                                    >
                                      <img
                                        alt="avatar"
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = dummy_network.src;
                                        }}
                                        style={{
                                          width: "100px",
                                          height: "100px",
                                        }}
                                        src={
                                          item?.subcategory_image
                                            ? `${process.env.API_URL_FILEMANAGER}${item?.subcategory_image}`
                                            : dummy_network.src
                                        }
                                      />
                                    </div>

                                    <h5 className="pro-user-username text-dark mt-2 mb-0 ">
                                      {item?.scenariosubcategory_name || ""}
                                    </h5>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}

                        {selectedCategory &&
                          selectedSubcategory &&
                          filteredData.length > 0 &&
                          ["Easy", "Medium", "Hard"].map((level) => {
                   
                            const levelData = filteredData
                              .filter((item) => item.scenariolevel === level)
                              .sort((a, b) => {
                             
                                const titleCompare =
                                  a.scenariotitle.localeCompare(
                                    b.scenariotitle
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
                                        className={`fa ${i <
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
                                        className="h-100 shadow-sm rounded-4 pointer"
                                        style={{
                                          // backgroundColor: "#f8f9fc",
                                          transition:
                                            "transform 0.2s ease, box-shadow 0.2s ease",
                                          border:
                                            item.isnotitermination === "Yes"
                                              ? "2px solid rgba(240, 151, 151, 0.7)"
                                              : "none",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.transform =
                                            "translateY(-4px)";
                                          e.currentTarget.style.boxShadow =
                                            "0 10px 20px rgba(0,0,0,0.08)";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.transform =
                                            "translateY(0)";
                                          e.currentTarget.style.boxShadow =
                                            "0 4px 12px rgba(0,0,0,0.04)";
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleReturnView(item);
                                        }}
                                      >
                                        <Card.Body className="p-3">
                                          <div className="text-center mb-2">
                                            <div
                                              className="rounded-circle mx-auto d-flex justify-content-center align-items-center "
                                              style={{
                                                width: "100px",
                                                height: "100px",
                                              }}
                                            >
                                              <img
                                                alt="avatar"
                                                onError={(e) => {
                                                  e.target.onerror = null;
                                                  e.target.src =
                                                    dummy_network.src;
                                                }}
                                                style={{
                                                  width: "100px",
                                                  height: "100px",
                                                }}
                                                src={
                                                  item?.scenarioimage
                                                    ? `${process.env.API_URL_FILEMANAGER}${item?.scenarioimage}`
                                                    : dummy_network.src
                                                }
                                              />
                                            </div>
                                            <h5 className="pro-user-username text-dark mt-2 mb-0 pointer">
                                              <OverlayTrigger
                                                placement="bottom"
                                                overlay={
                                                  <Tooltip>
                                                    {item.scenariotitle}
                                                  </Tooltip>
                                                }
                                              >
                                                <a>
                                                  {item.scenariotitle?.length >
                                                    30
                                                    ? `${item.scenariotitle.substring(
                                                      0,
                                                      27
                                                    )}...`
                                                    : item.scenariotitle}
                                                </a>
                                              </OverlayTrigger>
                                            </h5>
                                          </div>
                                          <div className="contact-info mb-0 text-center">
                                            <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                                              <div className="btn btn-sm ripple bg-secondary-transparent text-secondary rounded-pill d-flex align-items-center gap-1 px-2">
                                                <i className="fe fe-clock"></i>
                                                <span className="tx-13">
                                                  {item.duration ?? 0} Mins
                                                </span>
                                              </div>

                                              <div
                                                className="btn btn-sm ripple bg-success-transparent text-success rounded-circle"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setShowTabs(false);
                                                  handleReturnView(item);
                                                }}
                                              >
                                                <OverlayTrigger
                                                  placement="bottom"
                                                  overlay={
                                                    <Tooltip>
                                                      View
                                                    </Tooltip>
                                                  }
                                                >
                                                  <i className="fe fe-eye"></i>
                                                </OverlayTrigger>
                                              </div>
                                            </div>
                                          </div>
                                        </Card.Body>
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
