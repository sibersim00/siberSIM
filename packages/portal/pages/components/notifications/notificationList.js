import React, { useState, useEffect, useMemo } from 'react'
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

const NotificationList = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [rowData, setRowData] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [quickFilter, setQuickFilter] = useState("");
  // let navigate = useRouter();
  const { push } = useRouter();


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
      flex: 1
    },

    {
      headerName: "Date-Time",
      field: "date",
      filter: true,
      floatingFilter: true,
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
    pagination: true,
    paginationPageSize: 10, // use state variable for page size
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
      push("/components/noticonfigs/notificationList")
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
                className="ag-theme-alpine"
                style={{ height: "40em", width: "100%" }}
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
                  defaultColDef={defaultColDef}
                  frameworkComponents={frameworkComponents}
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