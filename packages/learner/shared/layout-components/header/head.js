import React, { useState, useEffect } from "react";
import { Dropdown, Nav } from "react-bootstrap";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { toast, ToastContainer } from "react-toastify";
import { getLocalStorageData } from "../../redux/slices/localstorage/LocalStorage";
import {
  getNotification,
  markReadNotification,
} from "../../redux/slices/noticonfigs/noticonfigs";
import { getOrSetTheme } from "../../redux/slices/commons/commons";

import { logOutData, clearlogOutData } from "../../redux/slices/auth/auth";
import dummy_profile from "../../../public/assets/img/dummy_profile.png";
import Swal from "sweetalert2";

const HeadDropDown = () => {
  const dispatch = useDispatch();
  let navigate = useRouter();
  let { push } = useRouter();

  let [user, setUser] = useState("");
  const [showLessNotifications, setShowLessNotifications] = useState([]);
  const getUserDataFromLocal = useSelector(
    (state) => state?.localData?.getLocalData
  );
console.log("getUserDataFromLocal",getUserDataFromLocal)
  const { notificationData, logoutData, markReadNotiResp, theme, errorData } =
    useSelector((state) => {
      return {
        notificationData:
          state &&
          state.noticonfigs &&
          state.noticonfigs.notificationData &&
          state.noticonfigs.notificationData.data,
        logoutData: state && state.authData && state.authData.logout,
        markReadNotiResp:
          state &&
          state.noticonfigs &&
          state.noticonfigs.markReadNotiResp &&
          state.noticonfigs.markReadNotiResp,
        theme: state.commonsdata?.theme,
        errorData: state && state.searchemployee && state.searchemployee.error,
      };
    });
  useEffect(() => {
    dispatch(getOrSetTheme()); // fetch theme on load
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      dispatch(getLocalStorageData("userLearner"));
      dispatch(getOrSetTheme()); // fetch theme on load
    }
  }, []);

useEffect(() => {
  if (getUserDataFromLocal) {
    setUser(getUserDataFromLocal);

    if (getUserDataFromLocal?.type) {
      dispatch(getNotification(getUserDataFromLocal.type));
    }
  }
}, [getUserDataFromLocal, dispatch]);

  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme_preference", "dark");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme_preference", "light");
    }
  }, [theme]);

  useEffect(() => {
    console.log("notificationData: ", notificationData);

    if (notificationData && notificationData.length > 0) {
      let date = new Date();
      date.setDate(date.getDate() - 2);

      const list = notificationData.filter((obj) => {
        if (!obj.createdon) return false;
        return new Date(obj.createdon) >= date;
      });

      setShowLessNotifications(list);
    }
  }, [notificationData]);

  useEffect(() => {
    if (notificationData && notificationData.length > 0) {
      const enhanced = notificationData.map((item) => ({
        ...item,
        is_read: item.is_read ?? 0,
        date: item.date ?? new Date().toLocaleString(), // fallback for missing
      }));

      setShowLessNotifications(enhanced);
    }
  }, [notificationData]);

  console.log("notificationData", notificationData);
  const handleReadNoti = (data) => {
    if (data?.is_read == 0) {
      const payload = {
        flag: data.log_id.toString(),
        type: "Learner",
      };
      dispatch(markReadNotification(payload));
    }
    setTimeout(() => {
      navigate.push("/notifications");
    }, 1000);
  };

  useEffect(() => {
    if (getUserDataFromLocal && getUserDataFromLocal != undefined) {
      setUser(getUserDataFromLocal);
    }
  }, [getUserDataFromLocal]);

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
        document.body.classList.remove("dark-theme");
        localStorage.removeItem("userLearner");
        localStorage.removeItem("accessTokenLearner");
        localStorage.removeItem("menusLearner");
        localStorage.clear();
        dispatch({ type: "LOGOUT" });
        //window.location.href = '/';
        // navigate.replace("/", "", { shallow: true });
        setTimeout(() => {
          navigate.replace("/", "", { shallow: true });
        }, 2000);
      };

      dispatch(clearlogOutData());
      signOut();
    }
  }, [logoutData]);

  const handleProfileView = () => {
    push(`/profile`);
  };

  const profileImageUrl = user?.profile
    ? `${process.env.API_URL_FILEMANAGER}${user.profile}`
    : dummy_profile.src;

  const Darkmode = () => {
    document.querySelector("body").classList.toggle("dark-theme");
    const switchEl = document.querySelector("#myonoffswitch2");
    if (switchEl) {
      switchEl.checked = true;
    }
    if (document.body.classList.contains("dark-theme")) {
      localStorage.setItem("DSPdark", true);
    } else {
      localStorage.removeItem("DSPdark");
    }
  };

  const handleThemeToggle = () => {
    const isNowDark = document.body.classList.toggle("dark-theme");
    const newTheme = isNowDark ? "dark" : "light";

    localStorage.setItem("theme_preference", newTheme);

    dispatch(getOrSetTheme(newTheme));
  };

  return (
    <div className="d-flex order-lg-2 align-items-center ms-auto">
      <ToastContainer />
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
      <Dropdown className="main-header-notification">
        <Dropdown.Toggle className="nav-link icon" variant="default">
          <i className="fe fe-bell header-icons"></i>
          {notificationData &&
            notificationData.length > 0 &&
            notificationData.filter((obj) => obj.is_read == 0)?.length > 0 && (
              <span className="badge bg-danger nav-link-badge">
                {notificationData &&
                  notificationData.length > 0 &&
                  notificationData.filter((obj) => obj.is_read == 0)?.length}
              </span>
            )}
        </Dropdown.Toggle>

        <Dropdown.Menu style={{ margin: 0 }}>
          <div className="header-navheading">
            {notificationData &&
              notificationData.length > 0 &&
              notificationData.filter((obj) => obj.is_read == 0)?.length >
              0 && (
                <p className="main-notification-text">
                  You have{" "}
                  {notificationData &&
                    notificationData.length > 0 &&
                    notificationData.filter((obj) => obj.is_read == 0)
                      ?.length}{" "}
                  unread notification
                  {/* <span
                    className="badge bg-pill bg-primary ms-3"
                    onClick={() =>
                      dispatch(
                        markReadNotification({ flag: "All", type: "Learner" })
                      )
                    }
                  >
                    Read all
                  </span> */}
                </p>
              )}
          </div>
          <div className="main-notification-list ht-400 overflow-auto">
            {showLessNotifications && showLessNotifications.length > 0 ? (
              showLessNotifications.map((item, index) => (
                <div
                  className={`media new ${item.is_read == 0 ? "" : ""}`}
                  key={index}
                  // onClick={() => handleReadNoti(item)}
                >
                  {/* <div className="main-img-user online">
                    <img alt="avatar"  className="rounded-circle" src={dummy_profile.src} />
                  </div> */}
                  <div className="media-body">
                    <p>{item.body || "No message"}</p>
                    <span>{item.date || "No date"}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted p-3">
                No notifications to show
              </p>
            )}
          </div>
          {/*  <div className="dropdown-footer">
            <span
              // onClick={() =>
              //   navigate.push("/components/notifications/notificationList")
              // }
              className="text-primary pointer"
            >
              View All Notifications
            </span>
          </div>*/}
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown className="main-profile-menu">
        <Dropdown.Toggle className="d-flex p-0" variant="default">
          <span className="main-img-user mx-1">
            <img
              alt="avatar"
              src={profileImageUrl} // Use the constructed URL
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = dummy_profile.src;
              }} // Fallback on error
              style={{ width: "40px", height: "40px", borderRadius: "50%" }} // Add styles for the image
            />
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu style={{ margin: "0px" }}>
          <div className="header-navheading">
            <h6 className="main-notification-title">
              {user?.firstname || ""} {user?.lastname || ""}
            </h6>
            <p className="main-notification-text">{user?.grade_name || ""}</p>
          </div>
          <Dropdown.Item
            className="border-top text-primary"
            onClick={handleProfileView}
          >
            <i className="fe fe-user"></i> My Profile
          </Dropdown.Item>
          <Dropdown.Item onClick={handleStatusSwitch}>
            <i className="fe fe-power"></i> Sign Out
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default HeadDropDown;
