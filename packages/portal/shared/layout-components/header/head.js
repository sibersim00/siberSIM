import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  Dropdown,
  Container,
  Form,
  Nav,
  Navbar,
  InputGroup,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { getLocalStorageData } from "../../redux/slices/localstorage/LocalStorage";
import { getNotification, markReadNotification } from "../../redux/slices/noticonfigs/noticonfigs";
import { logOutData, clearlogOutData } from "../../redux/slices/authentication/Auth";
import { getOrSetTheme } from "../../redux/slices/common/masters";
import { setNestedObjectValues } from "formik";
import dummy_profile from '../../../public/assets/img/dummy_profile.png'

const HeadDropDown = () => {
  const dispatch = useDispatch();
  const [showLessNotifications, setShowLessNotifications] = useState([]);
  let [user, setUser] = useState("");
  const {
    getUserDataFromLocal,
    logoutData,
    notificationData,
    markReadNotiResp,
    theme,
    errorData,
  } = useSelector((state) => {
    return {
      getUserDataFromLocal:
        state &&
        state.localData &&
        state.localData.getLocalData,
      logoutData: state && state.authData && state.authData.logout,
      notificationData:
        state &&
        state.noticonfigs &&
        state.noticonfigs.notificationData &&
        state.noticonfigs.notificationData.data,
      markReadNotiResp:
        state &&
        state.noticonfigs &&
        state.noticonfigs.markReadNotiResp &&
        state.noticonfigs.markReadNotiResp,
      theme: state.commonMaster?.theme,


      errorData: state && state.searchemployee && state.searchemployee.error,
    };
  });

console.log("themetheme",theme)
  useEffect(() => {
    dispatch(getOrSetTheme()); // fetch theme on load
  }, []);




  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("user"))
      dispatch(getOrSetTheme()); // fetch theme on load 
    }
  }, [])


  useEffect(() => {
    if (getUserDataFromLocal && getUserDataFromLocal != undefined) {
      setUser(getUserDataFromLocal);
      dispatch(getNotification(getUserDataFromLocal?.usertype))
    }
  }, [getUserDataFromLocal])



  useEffect(() => {
    if (notificationData && notificationData.length > 0) {
      let date = new Date();
      date.setDate(date.getDate() - 2);
      var list = notificationData.filter((obj) => new Date(obj.createdon) >= date)
      setShowLessNotifications(list)
    }
  }, [notificationData])

  const handleReadNoti = (data) => {
    if (data?.is_read == 0) {
      const payload = {
        flag: data.log_id.toString(),
        type: "User"
      }
      dispatch(markReadNotification(payload))
    }
    setTimeout(() => {
      navigate.push("/components/noticonfigs/notificationList");
    }, 1000)
  }

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme_preference", "dark");
    } else { document.body.classList.remove("dark-theme"); 
      localStorage.setItem("theme_preference", "light"); }
  }, [theme]);

const handleThemeToggle = () => {
  const isNowDark = document.body.classList.toggle("dark-theme");
  const newTheme = isNowDark ? "dark" : "light";

  localStorage.setItem("theme_preference", newTheme);

  dispatch(getOrSetTheme(newTheme));
};



  function Fullscreen() {
    if (
      (document.fullScreenElement && document.fullScreenElement === null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)
    ) {
      if (document.documentElement.requestFullScreen) {
        document.documentElement.requestFullScreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen(
          Element.ALLOW_KEYBOARD_INPUT
        );
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  }

  // const Darkmode = () => {
  //   document.querySelector("body").classList.toggle("dark-theme");
  //   document.querySelector("#myonoffswitch2").checked = true;
  //   if (document.body.classList.contains("dark-theme")) {
  //     localStorage.setItem("DSPdark", true);
  //   } else {
  //     localStorage.removeItem("DSPdark");
  //   }
  // };




  let navigate = useRouter();


  const handleStatusSwitch = (data) => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to Sign Out ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: " var(--primary-bg-color)",
      cancelButtonColor: "var(--secondary)",
      confirmButtonText: "Sign Out",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(logOutData());
      }
    });
  };


  console.log("logoutDatalogoutData", logoutData)
  useEffect(() => {
    if (logoutData?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {logoutData?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      const signOut = () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const usertype = user?.usertype;
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("menus");
        localStorage.clear();
        if (usertype == "Admin") {
          navigate.replace("/admin-login", "", { shallow: true });
        } else {
          navigate.replace("/", "", { shallow: true });
        }
      };

      dispatch(clearlogOutData());
      signOut();


    }
  }, [logoutData]);

  console.log("getUserDataFromLocal============", getUserDataFromLocal);

  // const userData = localStorage.getItem("user");
  const handleDelete = (props, flag) => {
    if (flag == true) {
      const payload = {
        scenarioid: props?.scenarioid,
      };
      dispatch(deleteScenarios(payload));
    }
  };


  const openCloseSidebar1 = () => {
    document.querySelector(".header-settings").classList.toggle("show");
    document.querySelector(".sidebar-right").classList.toggle("sidebar-open");
  };

  const handleToProfile = () => {
    navigate.push("/profile/", '', { shallow: true });
  };

  const profileImageUrl = getUserDataFromLocal?.profile ? `${process.env.API_URL_FILEMANAGER}${getUserDataFromLocal.profile}` : dummy_profile.src;


  return (
    <>
      {/* <div className="input-group pd-l-20 pd-r-20 pd-b-5 pd-t-5 customsearch">
        <input
          type="text"
          className="form-control"
          placeholder="Search"
          style={{ borderRadius: '50px' }}
        />
        <span className="pos-absolute tx-16 r-35"
          style={{ top: '0.8em', zIndex: "3", opacity: "0.5" }}>
          <i className="ion-search"></i>
        </span>
      </div> */}
      <div className="d-flex order-lg-2 align-items-center ms-auto">
        <Dropdown className="dropdown d-flex main-header-theme">
          <Nav.Link
            className="nav-link icon layout-setting"
            onClick={() => handleThemeToggle()}
          >
            <span className="dark-layout">
              <i className="fe fe-sun header-icons"></i>
            </span>
            <span className="light-layout">
              <i className="fe fe-moon header-icons"></i>
            </span>
          </Nav.Link>
        </Dropdown>
        <div className="d-md-flex">
          {/* <div className="nav-link icon full-screen-link" onClick={Fullscreen}>
            <i className="fe fe-maximize fullscreen-button fullscreen header-icons"></i>
            <i className="fe fe-minimize fullscreen-button exit-fullscreen header-icons"></i>
          </div> */}
        </div>
        <Dropdown className="main-header-notification">
          <Dropdown.Toggle
            className="nav-link icon"

            variant="default"
          >
            <i className="fe fe-bell header-icons"></i>
            {notificationData && notificationData.length > 0 && notificationData.filter(obj => obj.is_read == 0)?.length > 0 &&
              <span className="badge bg-danger nav-link-badge">{notificationData && notificationData.length > 0 && notificationData.filter(obj => obj.is_read == 0)?.length}</span>}
          </Dropdown.Toggle>
          <Dropdown.Menu
            style={{ margin: 0 }}
          >
            <div className="header-navheading">
              {notificationData && notificationData.length > 0 && notificationData.filter(obj => obj.is_read == 0)?.length > 0 &&
                <p className="main-notification-text">
                  You have {notificationData && notificationData.length > 0 && notificationData.filter(obj => obj.is_read == 0)?.length} unread notification
                  {/* <span className="badge bg-pill bg-primary ms-1" onClick={() => dispatch(markReadNotification({ flag: "All", type: "User" }))}>
                    Read all
                  </span> */}
                </p>}
            </div>
            <div className="main-notification-list ht-400 overflow-auto">
              {showLessNotifications && showLessNotifications.length > 0 && showLessNotifications.map((item, index) => {
                return (
                  <div className={`media new ${item.is_read == 0 && ""}`} key={index} onClick={() => handleReadNoti(item)}>
                    {/* <div className="main-img-user online">
                      <img
                        className="rounded-circle"
                        alt="avatar"
                        src={dummy_profile.src}

                      />
                    </div> */}
                    <div className="media-body">
                      <p>
                        {item.body}
                      </p>
                      <span>{item.date}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="dropdown-footer">
              <span onClick={() => navigate.push("/components/notifications/notificationList")} className="text-primary pointer">
                View All Notifications
              </span>
            </div>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown className="main-profile-menu">
          <Dropdown.Toggle className="d-flex p-0" variant="default">
            <span className="main-img-user mx-1">
              <img
                alt="avatar"
                src={profileImageUrl}
                onError={(e) => { e.target.onerror = null; e.target.src = dummy_profile.src; }} // Fallback on error
                style={{ width: '40px', height: '40px', borderRadius: '50%' }} // Add styles for the image
              />
            </span>
          </Dropdown.Toggle>
          <Dropdown.Menu style={{ margin: "0px" }}>
            <div className="header-navheading">
              <h6 className="main-notification-title">
                {user && user.firstname ? user.firstname : ""}{" "}
                {user && user.lastname ? user.lastname : ""}
              </h6>
              <p className="main-notification-text">
                {user && user.grade_name ? user.grade_name : ""}
              </p>
            </div>
            <Dropdown.Item
              onClick={() => handleToProfile()}
              className="border-top text-primary"
            >
              <i className="fe fe-user"></i> My Profile
            </Dropdown.Item>
            <Dropdown.Item onClick={() => handleStatusSwitch()}>
              <i className="fe fe-power"></i> Sign Out
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </>
  );
};

export default HeadDropDown;
