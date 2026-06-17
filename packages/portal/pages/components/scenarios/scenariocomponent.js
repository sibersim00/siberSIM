import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  OverlayTrigger,
  Tooltip,
  Button,
} from "react-bootstrap";
import dummy_network from "../../../public/assets/img/dummy.jpg";
import { getScenarioImport } from "../../../shared/redux/slices/scenario/scenarioManage";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

export default function ScenarioImportDragDrop() {
  const dispatch = useDispatch();
  const { query, push } = useRouter();
  // const [leftItems, setLeftItems] = useState([
  //   {
  //     id: 1,
  //     scenariotitle: "Scenario One",
  //     scenarioimage: "",
  //     scenarioidentification: "Basic Level",
  //     instructor_name: "Instructor A",
  //   },
  //   {
  //     id: 2,
  //     scenariotitle: "Scenario Two",
  //     scenarioimage: "",
  //     scenarioidentification: "Intermediate Level",
  //     instructor_name: "Instructor B",
  //   },
  //   {
  //     id: 3,
  //     scenariotitle: "Scenario three",
  //     scenarioimage: "",
  //     scenarioidentification: "Basic Level",
  //     instructor_name: "Instructor A",
  //   },
  //   {
  //     id: 4,
  //     scenariotitle: "Scenario four",
  //     scenarioimage: "",
  //     scenarioidentification: "Intermediate Level",
  //     instructor_name: "Instructor B",
  //   },

  // ]);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [draggingItem, setDraggingItem] = useState(null);

  const { scenarioComponents } = useSelector((state) => {
    return {
      scenarioComponents:
        state &&
        state.scenarioManage &&
        state.scenarioManage.scenarioImportData &&
        state.scenarioManage.scenarioImportData.data,
    };
  });
  const handleDragStart = (item) => setDraggingItem(item);

  const handleDrop = () => {
    if (!draggingItem) return;
    setRightItems((prev) => [...prev, draggingItem]);
    setLeftItems((prev) => prev.filter((i) => i.id !== draggingItem.id));
    setDraggingItem(null);
  };

  const allowDrop = (e) => e.preventDefault();

  useEffect(() => {
    if (scenarioComponents?.componentDetails) {
      const formatted = scenarioComponents.componentDetails.map((comp) => ({
        id: comp.componentid,
        scenariotitle: comp.componentname,
        subtitle: comp.vmid_name,
        type: comp.componenttype,
        vmid: comp.vmid,
        scenarioimage: comp.componentimage,
        specs: `${comp.cores} Cores • ${comp.memory}MB RAM • ${comp.storage}GB`,
        status: comp.status,
      }));

      setLeftItems(formatted);
    }
  }, [scenarioComponents]);

  // useEffect(() => {
  //   const id = query.slug?.[0] || "a78c117d-7382-11f0-b696-bc241155fec6";
  //   setRowId(id);
  //   dispatch(getScenarioImport(id));
  // }, [query.slug]);

  return (
    <>
      <Row className="row-sm">
        <Row className="g-3" style={{ height: "80vh" }}>
          {/* LEFT SIDE */}
          <Col md={5} className="h-100 overflow-auto pe-3">
            <h5 className="mb-3">Available Components</h5>

            {leftItems.map((item) => (
              <Card
                key={item.id}
                className="p-3 mb-3 shadow-sm d-flex flex-row align-items-center pointer"
                draggable
                onDragStart={() => handleDragStart(item)}
              >
                <div
                  className="d-flex justify-content-center align-items-center me-3"
                  style={{ width: "70px", height: "70px", overflow: "hidden" }}
                >
                  <img
                    alt="avatar"
                    src={
                      item?.scenarioimage
                        ? `${process.env.API_URL_FILEMANAGER}${item.scenarioimage}`
                        : dummy_network.src
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = dummy_network.src;
                    }}
                    width="70"
                    height="70"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                <div>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>{item.scenariotitle}</Tooltip>}
                  >
                    <h6
                      className="mb-1 text-dark text-truncate"
                      style={{ maxWidth: "200px" }}
                    >
                      {item.scenariotitle}
                    </h6>
                  </OverlayTrigger>

                  <p className="mb-0 text-primary small">{item.subtitle}</p>

                  <p className="mb-0 text-success small">
                    {item.type} (VMID: {item.vmid})
                  </p>

                  <p className="mb-0 text-muted small">{item.specs}</p>
                </div>
              </Card>
            ))}
          </Col>

          {/* SEPARATOR */}
          <Col
            md={1}
            className="d-flex justify-content-center align-items-center"
          >
            <div
              style={{
                width: "3px",
                height: "90%",
                backgroundColor: "#e3e3e3",
                borderRadius: "10px",
              }}
            ></div>
          </Col>

          {/* RIGHT */}
          <Col md={6}>
            <h5 className="mb-3">Import Components</h5>

            <div
              className="p-3 h-100 bg-light text-center"
              onDragOver={allowDrop}
              onDrop={handleDrop}
            >
              {rightItems.length === 0 ? (
                <p className="text-muted mt-5">
                  Drag & Drop a scenario here to import
                </p>
              ) : (
                rightItems.map((item) => (
                  <Card
                    key={item.id}
                    className="p-3 mb-3 shadow-sm d-flex flex-row align-items-center position-relative"
                  >
                    {/* REMOVE BUTTON */}
                    <button
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                      onClick={() => {
                        setRightItems((prev) =>
                          prev.filter((i) => i.id !== item.id)
                        );
                        setLeftItems((prev) => [...prev, item]);
                      }}
                    >
                      ✕
                    </button>

                    <div
                      className="d-flex justify-content-center align-items-center me-3"
                      style={{
                        width: "70px",
                        height: "70px",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        alt="avatar"
                        src={
                          item?.scenarioimage
                            ? `${process.env.API_URL_FILEMANAGER}${item.scenarioimage}`
                            : dummy_network.src
                        }
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = dummy_network.src;
                        }}
                        width="70"
                        height="70"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    <div>
                      <h6 className="mb-1 text-dark">{item.scenariotitle}</h6>
                      <p className="mb-0 text-primary small">{item.subtitle}</p>
                      <p className="mb-0 text-success small">
                        {item.type} (VMID: {item.vmid})
                      </p>
                      <p className="mb-0 text-muted small">{item.specs}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </Col>
        </Row>
        <Row className="mb-2">
          <Col className="d-flex justify-content-end">
            <Button type="submit">Submit</Button>
          </Col>
        </Row>
      </Row>
    </>
  );
}
