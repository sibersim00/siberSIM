import React,{useState,useEffect,useMemo} from "react";
import { AgGridReact } from "ag-grid-react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import TB from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { getPlaceholderList } from "../../redux/slices/mailconfig/mailPlaceholder";
import "../../utils/i18n";
import { useTranslation } from "react-i18next";

const MailPlaceholder = () => {
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState("Active");
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  const { PlaceholderListResp,errorData } =
  useSelector((state) => {
    return {
      PlaceholderListResp:
        state &&
        state.mailPlaceholderData &&
        state.mailPlaceholderData.placeholderData &&
        state.mailPlaceholderData.placeholderData.data
        ,

      errorData:
        state && state.mailPlaceholderData && state.mailPlaceholderData.error,
    };
  });
  useEffect(()=>{
    dispatch(getPlaceholderList());
  },[])
  useEffect(()=>{
    if(PlaceholderListResp && PlaceholderListResp != undefined){
      setStatus("Active");
      setRowData(PlaceholderListResp);
    }
  },[PlaceholderListResp])
  
  useEffect(() => {
    if (PlaceholderListResp && PlaceholderListResp !== undefined && PlaceholderListResp.length > 0) {
      if (status === "") {
        setRowData(PlaceholderListResp);
      } else if (status == "Active") {
        const filteredData = PlaceholderListResp.filter(
          (location) => location?.status == 'Active'
        );
        setRowData(filteredData);
      } else if (status == "Inactive") {
        const filteredData = PlaceholderListResp.filter(
          (location) => location?.isactive == 'Inactive'
        );
        setRowData(filteredData);
      }
    }
  }, [PlaceholderListResp, status]);

  const columnDefs = [
    {
      headerName: t("mail_config.shortcodes.columns.display_name"),
      field: "display_name",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width : 250,
      resizable: true,
      
    },
    {
      headerName: t("mail_config.shortcodes.columns.selector_name"),
      field: "selector_name",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width : 250,
      resizable: true,
    },
    {
      headerName: t("mail_config.shortcodes.columns.description"),
      field: "description",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width : 250,
      resizable: true,  
      cellRenderer: "descriptionRenderer",
      
    },
    
    {
      headerName: t("mail_config.shortcodes.columns.status"),
      field: "status",
      filter: true,
      floatingFilter: true,
      minWidth: 150,
      width : 150,
      resizable: true,
     
    }
  ];
  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  const frameworkComponents = {
    
    descriptionRenderer : function (props) {
      return (
        <>
          <OverlayTrigger
            placement="bottom"
            overlay={<Tooltip>{props?.data?.description}</Tooltip>}
          >
            <span>{props?.data?.description}</span>
          </OverlayTrigger>
        </>
      );
    },
   
  };
  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
  };
  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };
  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      flex: 1,
    };
  }, []);
  return (
    <Row className="row-sm mg-t-10">
      <Col md={12}>
        <Card className="custom-card overflow-hidden">
          <Card.Body>
            <Col md={12} className="mg-b-10">

              <div className="">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex flex-grow-1 mg-r-5">
                    <h5>{t("mail_config.shortcodes.title")}</h5>
                  </div>
                  <div className="mg-r-2">
                    <ToggleButtonGroup
                      className="mg-r-10"
                      value={status}
                      size="small"
                      exclusive
                      onChange={(e) => {
                        setStatus(e.target.value);
                      }}
                      aria-label="Platform"
                    >
                      <TB value="">{t("common.all")}</TB>
                      <TB value="Active">{t("common.active")}</TB>
                      <TB value="Inactive">{t("common.inactive")}</TB>
                    </ToggleButtonGroup>{" "}
                  </div>
               
                  <div>
                  <input
                      className="form-control bd bd-2 wd-250"
                      value={quickFilter}
                      placeholder={t("common.search")}
                      type="text"
                      onChange={(e) => onFilterChanged(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Col>

            <Col md={12}>
              <div
                className="ag-theme-alpine"
                style={{ height: "38em", width: "100%" }}
              >
                <AgGridReact
                  id="staff_grid"
                  headerHeight={35}
                  rowHeight={40}
                  gridOptions={gridOptions}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  onGridReady={onGridReady}
                  frameworkComponents={frameworkComponents}
                  defaultColDef={defaultColDef}
                ></AgGridReact>
              </div>
            </Col>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default MailPlaceholder;
