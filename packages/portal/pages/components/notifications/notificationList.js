import React, { useState, useEffect, useMemo, useRef,useCallback } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";
import {
  Row,
  Col,
  Card
} from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import Seo from '../../../shared/layout-components/seo/seo';
import "../../../shared/utils/i18n";
import { useTranslation } from 'react-i18next';
import { getNotification, getNotificationAll, markReadNotification } from '../../../shared/redux/slices/noticonfigs/noticonfigs';
import ActionButtonRenderer from '../../../shared/data/masterButtons/action-button';
import { useRouter } from "next/router";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 35;
const PAGINATION_BAR_HEIGHT = 48;

const NotificationList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  // let navigate = useRouter();
  const { push } = useRouter();
      const [pageSize, setPageSize] = useState(20);
      const gridRef = useRef(null);
       const gridHeight = HEADER_HEIGHT + ROW_HEIGHT * pageSize + PAGINATION_BAR_HEIGHT + 4; // +4 for borders


  const {
    getUserDataFromLocal,
    notificationData,
    notificationAllData,
    markReadNotiResp,
    errorData,
  } = useSelector((state) => {
    return {
      getUserDataFromLocal:
        state &&
        state.localData &&
        state.localData.getLocalData,
      notificationData:
        state &&
        state.noticonfigs &&
        state.noticonfigs.notificationData &&
        state.noticonfigs.notificationData.data,
      notificationAllData:
        state &&
        state.noticonfigs &&
        state.noticonfigs.notificationAllData &&
        state.noticonfigs.notificationAllData.data,
      markReadNotiResp:
        state &&
        state.noticonfigs &&
        state.noticonfigs.markReadNotiResp &&
        state.noticonfigs.markReadNotiResp,
      errorData: state && state.noticonfigs && state.noticonfigs.error,
    };
  });

  console.log("getUserDataFromLocal-------------------", getUserDataFromLocal?.usertype)

  const columnDefs = [
    {
      headerName: "Notifications",
      field: "body",
      filter: true,
      floatingFilter: true,
      tooltipValueGetter: (params) => `${params.value}`,
      flex: 1
    },

    {
      headerName: "Date-Time",
      field: "date",
      filter: true,
      floatingFilter: true,
      tooltipValueGetter: (params) => `${params.value}`,
      width: 180
    },

  ];

  useEffect(() => {
    // dispatch(getNotification(getUserDataFromLocal?.usertype));
    dispatch(getNotificationAll(getUserDataFromLocal?.usertype));
  }, [])

  useEffect(() => {
    if (gridApi) {
      gridApi.sizeColumnsToFit();
    }
  }, [gridApi]);

  // useEffect(() => {
  //   if (notificationData) {
  //     setRowData(notificationData)
  //   }
  // }, [notificationData])

    useEffect(() => {
    if (notificationAllData) {
      setRowData(notificationAllData)
    }
  }, [notificationAllData])

  useEffect(() => {
    if (markReadNotiResp?.statusCode == 200) {
      // dispatch(getNotification(getUserDataFromLocal?.usertype))
      dispatch(getNotificationAll(getUserDataFromLocal?.usertype))
    }
  }, [markReadNotiResp])

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
    const totalRows = params.api.getDisplayedRowCount(); // ✅ actual rows in data

    // Use whichever is smaller — actual rows vs page size
    const effectiveRows = Math.min(newPageSize, totalRows);
    setPageSize(effectiveRows);
  }
}, []);

  const onFilterChanged = (data) => {
    gridApi.setQuickFilter(data);
    setQuickFilter(data);
  };

  const defaultColDef = useMemo(() => {
    return {
      sortable: true,
      suppressMovable: true,
      cellClass: "cell-wrap-text ag-grid-cell",
      // flex: 1,
    };
  }, []);

  const handleReadNoti = (data) => {
    if (data?.is_read == 0) {
      const payload = {
        flag: data.log_id.toString(),
        type: "User"
      }
      dispatch(markReadNotification(payload))
    }
    setTimeout(() => {
      push("/notifications")
    }, 1000)
  }

  const frameworkComponents = {
    actionButtonRenderer: function (props) {
      return (
        <div>
          <ActionButtonRenderer
            propsVal={props}
            handleEditView={handleReadNoti}
            handleShowEditView={true}
          />
        </div>
      );
    }
  }


  return (
    <div>
      <Seo title="Notifications" />
      <ToastContainer />
      <Row className="row-sm">
        <Col md={12}>
          <Card className="custom-card overflow-hidden">
            <Card.Body>
              <div className="mg-b-10">
                <div className="d-flex">
                  <div className="d-flex flex-grow-1 mg-r-5">
                    <h5>Notifications</h5>
                  </div>
                  <div>
                    <input
                      className="form-control bd bd-2"
                      value={quickFilter}
                      placeholder={t("common.search")}
                      type="text"
                      onChange={(e) => onFilterChanged(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                   className="ag-theme-alpine mt-2"
                       style={{
                          height: `${gridHeight}px`, //  dynamic, grows with page size
                          width: "100%",
                          overflow: "visible",        // no internal scrollbar
                        }}
              >
                <AgGridReact
                  id="staff_grid"
                  headerHeight={35}
                  rowHeight={40}
                  gridOptions={gridOptions}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  pagination={true}
                  paginationPageSize={20}
                  onGridReady={onGridReady}
                  defaultColDef={defaultColDef}
                  frameworkComponents={frameworkComponents}
                  onPaginationChanged={onPaginationChanged} //  track page size changes
                ></AgGridReact>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

NotificationList.layout = "Contentlayout";
export default NotificationList