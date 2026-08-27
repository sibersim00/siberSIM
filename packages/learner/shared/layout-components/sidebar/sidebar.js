import React, { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import PerfectScrollbar from "react-perfect-scrollbar";
import { useRouter } from "next/router";
import { horizontalmenusticky } from "../../../shared/layout-components/switcher/switcherdata";
let history = [];
import logo_lms from '../../../public/assets/img/brand/logo_lms.png'
import favicon from '../../../public/assets/img/brand/icon.png'

//Images
import logolight from "../../../public//assets/img/brand/logo-light.png";
import iconlight from "../../../public//assets/img/brand/icon-light.png";
import logo from "../../../public//assets/img/brand/logo.png";
import icon from "../../../public//assets/img/brand/icon.png";
import defaultLogo from "../../../public/assets/img/brand/logo-light.png";
import defaultLightLogo from "../../../public/assets/img/brand/logo-light.png";
import defaultFavicon from "../../../public/assets/img/brand/favicon.png";

const SideBar = () => {
  let location = useRouter();
  const router = useRouter();

  const [menuitems, setMenuitems] = useState([]);
  const [menuitems1, setMenuitems1] = useState([]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const menus = localStorage.getItem("menusLearner") != "undefined" ? JSON.parse(localStorage.getItem("menusLearner")) : []
      setMenuitems(menus);
      setMenuitems1(menus);
      if (menus === null) {
        window.location.href = "/";
      }
    }
  }, []);

  useEffect(() => {
    history.push(location.pathname);
    if (history.length > 2) {
      history.shift();
    }
    if (history[0] !== history[1]) {
      setSidemenu();
    }
    let mainContent = document.querySelector(".main-content");
    //when we click on the body to remove
    mainContent.addEventListener("click", mainContentClickFn);
    return () => {
      mainContent.removeEventListener("click", mainContentClickFn);
    };
  }, [location.pathname, mainContentClickFn, setSidemenu]);

  // location
  useEffect(() => {
    setSidemenu();
    if (
      document.body.classList.contains("horizontalmenu") &&
      window.innerWidth >= 992
    ) {
      clearMenuActive();
    }
  }, [menuitems1]);
  // every chnage this effect calls
  let menuIcontype;
  if (document.querySelector("body").classList.contains("horizontalmenu")) {
    menuIcontype = "hor-icon";
  } else {
    menuIcontype = "sidemenu-icon";
  }
  //  In Horizontal When we click the body it should we Closed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  function mainContentClickFn() {
    if (
      document.body.classList.contains("horizontalmenu") &&
      window.innerWidth >= 992
    ) {
      // clearMenuActive();
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps

  function setSidemenu() {
    if (menuitems) {
      menuitems.filter((mainlevel) => {
        if (mainlevel.Items) {
          mainlevel.Items.filter((items) => {
            items.active = false;
            items.selected = false;
            if (
              location.pathname === "/spruha/preview/" ||
              location.pathname === "/spruha/preview"
            ) {
              location.pathname = "/spruha/preview/dashboard/";
            }
            if (
              location.pathname.indexOf("Masters") > 0 &&
              items.path == "/components/Masters/masters"
            ) {
              items.active = true;
              items.selected = true;
            } else if (location.pathname === items.path) {
              items.active = true;
              items.selected = true;
            }
            if (items.children) {
              items.children.filter((submenu) => {
                submenu.active = false;
                submenu.selected = false;
                if (location.pathname === submenu.path) {
                  items.active = true;
                  items.selected = true;
                  submenu.active = true;
                  submenu.selected = true;
                }
                if (submenu.children) {
                  submenu.children.filter((submenu1) => {
                    submenu1.active = false;
                    submenu1.selected = false;
                    if (location.pathname === submenu1.path) {
                      items.active = true;
                      items.selected = true;
                      submenu.active = true;
                      submenu.selected = true;
                      submenu1.active = true;
                      submenu1.selected = true;
                    }
                    return submenu1;
                  });
                }
                if (
                  location.pathname ==
                  "/components/ecommerce/product-detail/[id]" &&
                  submenu.path == "/components/ecommerce/product-details"
                ) {
                  items.active = true;
                  items.selected = true;
                  submenu.active = true;
                  submenu.selected = true;
                }
                return submenu;
              });
            }
            return items;
          });
        }
        setMenuitems((arr) => [...arr]);
        return mainlevel;
      });
    }
  }

  function selectedMenu(item) {
    localStorage.setItem("selectedmenu", JSON.stringify(item));
  }

  function toggleSidemenu(item) {
    if (
      !document.body.classList.contains("horizontalmenu-hover") ||
      window.innerWidth < 992
    ) {
      // To show/hide the menu
      if (!item.active) {
        menuitems.filter((mainlevel) => {
          if (mainlevel.Items) {
            mainlevel.Items.filter((sublevel) => {
              sublevel.active = false;
              if (item === sublevel) {
                sublevel.active = true;
              }
              if (sublevel.children) {
                sublevel.children.filter((sublevel1) => {
                  sublevel1.active = false;
                  if (item === sublevel1) {
                    sublevel.active = true;
                    sublevel1.active = true;
                  }
                  if (sublevel1.children) {
                    sublevel1.children.filter((sublevel2) => {
                      sublevel2.active = false;
                      if (item === sublevel2) {
                        sublevel.active = true;
                        sublevel1.active = true;
                        sublevel2.active = true;
                      }
                      return sublevel2;
                    });
                  }
                  return sublevel1;
                });
              }
              return sublevel;
            });
          }
          return mainlevel;
        });
      } else {
        item.active = !item.active;
      }
      setMenuitems((arr) => [...arr]);
    }
  }

  function clearMenuActive() {
    menuitems.filter((mainlevel) => {
      if (mainlevel.Items) {
        mainlevel.Items.filter((sublevel) => {
          sublevel.active = false;
          if (sublevel.children) {
            sublevel.children.filter((sublevel1) => {
              sublevel1.active = false;
              if (sublevel1.children) {
                sublevel1.children.filter((sublevel2) => {
                  sublevel2.active = false;
                  return sublevel2;
                });
              }
              return sublevel1;
            });
          }
          return sublevel;
        });
      }
      return mainlevel;
    });
    setMenuitems((arr) => [...arr]);
  }
  // //Hover effect
  function Onhover() {
    if (document.querySelector(".main-body")) {
      if (
        document
          .querySelector(".main-body")
          .classList.contains("main-sidebar-hide")
      )
        document.querySelector(".main-body").classList.add("main-sidebar-open");
    }
  }

  function Outhover() {
    if (document.querySelector(".main-body")) {
      document
        .querySelector(".main-body")
        .classList.remove("main-sidebar-open");
    }
  }
  const headerToggleButton = () => {
    let body = document.querySelector("body")
    let innerWidth = window.innerWidth
    if (body) {
      // if (body !== !body) {
      if (innerWidth >= 992) {
        // document.querySelector('body')?.classList.toggle('main-sidebar-hide');
        document.querySelector('body')?.classList.remove('main-sidebar-show');
      }
      else if (document.body.classList.contains('horizontalmenu')) {
        document.querySelector('body')?.classList.toggle('main-navbar-show');
        document.querySelector('body')?.classList.remove('main-sidebar-show');
        document.querySelector('body')?.classList.remove('main-sidebar-hide');
      }
      else {
        document.querySelector('body')?.classList.toggle('main-sidebar-show');
        document.querySelector('body')?.classList.remove('main-sidebar-hide');
      }
    }
  }


  const [companySettings, setCompanySettings] = useState(null);


  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem("company_settings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setCompanySettings(parsedSettings); // Set to state
        } catch (err) {
          console.error("Error parsing company_settings from localStorage", err);
        }
      }
    }
  }, []);

  const logoUrl = companySettings?.web_panel_logo
    ? `${baseUrl}${companySettings.web_panel_logo}`
    : defaultLogo.src;

  const adminLogoUrl = companySettings?.admin_panel_logo
    ? `${baseUrl}${companySettings.admin_panel_logo}`
    : defaultLightLogo.src
    ;
  const faviconUrl = companySettings?.favicon
    ? `${baseUrl}${companySettings.favicon}`
    : defaultFavicon.src
    ;
  useEffect(() => {
    if (companySettings?.favicon) {
      const baseUrl = process.env.API_URL_FILEMANAGER;
      const faviconLink = document.querySelector("link[rel~='icon']") || document.createElement("link");
      faviconLink.rel = "icon";
      faviconLink.href = `${baseUrl}${companySettings.favicon}`;
      document.getElementsByTagName("head")[0].appendChild(faviconLink);
    }
  }, [companySettings]);






  return (
    <Fragment>
      <div
        className="sticky "
        style={{ marginBottom: "-64px" }}
        onScroll={horizontalmenusticky()}
      >
        <div className="main-menu main-sidebar main-sidebar-sticky side-menu">
          <PerfectScrollbar
            options={{ suppressScrollX: true, useBothWheelAxes: false }}
          >
            <div className="main-container-1 active main-sidebar-header">
              <div className="sidemenu-logo">
                <Link
                  className="main-logo"
                  href={`/dashboard`}
                >
                 <img
                    src={logoUrl}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultLightLogo.src }}
                    className="header-brand-img desktop-logo"
                    alt="logo-1"
                  />
                  <img
                    src={faviconUrl}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultFavicon.src }}
                    className="header-brand-img icon-logo wd-40"
                    alt="logo-2"
                  />
                  <img
                    src={adminLogoUrl}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultLightLogo.src }}
                    className="header-brand-img desktop-logo theme-logo"
                    alt="logo-3"
                  />
                  <img
                    src={adminLogoUrl}
                    onError={(e) => { e.target.onerror = null; e.target.src = defaultLightLogo.src }}
                    className="header-brand-img icon-logo theme-logo"
                    alt="logo-4"
                  />
              </Link>
              </div>
              <div
                className="main-body-1 main-sidebar-body"
                onMouseOver={() => Onhover()}
                onMouseOut={() => Outhover()}
              >
                <div className="slide-left " id="slide-left">
                  <i className="fe fe-chevron-left"></i>
                </div>

                <ul className="menu-nav nav" style={{ marginLeft: "0px" }}>
                  {menuitems && menuitems.length > 0 &&
                    menuitems.map((Item, itemi) => {
                      const childRoles = Item.children || [];
                      return (
                        <Fragment key={itemi + Math.random() * 100}>
                          {Item.Items &&
                            Item.Items.map((menuItem, i) => (
                              <li
                                key={menuItem.id || i}
                                className={`nav-item ${menuItem.type === "sub"
                                  ? menuItem?.children?.[0]?.path?.split("/")[2] === location.pathname.split("/")[2]
                                    ? "active"
                                    : ""
                                  : menuItem.selected
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <span>

                                </span>
                                {menuItem.type === "sub" ? (
                                  <a
                                    href="#!"
                                    className={`nav-link with-sub`}
                                    onClick={(event) => {
                                      event.preventDefault();
                                      toggleSidemenu(menuItem);
                                    }}
                                  >
                                    <span className="shape1"></span>
                                    <span className="shape2"></span>
                                    <i
                                      className={`${menuItem.icon} ${menuIcontype} menu-icon`}
                                    ></i>
                                    <span className="sidemenu-label">
                                      {menuItem.title}
                                      {menuItem.active}
                                    </span>
                                    {menuItem.badge ? (
                                      <label className={menuItem.badge}>
                                        {menuItem.badgetxt}
                                      </label>
                                    ) : (
                                      ""
                                    )}
                                    <div className="according-menu">
                                      {menuItem.active ? (
                                        <i
                                          className={`${menuItem.background} fa angle fa-angle-down `}
                                        ></i>
                                      ) : (
                                        <i
                                          className={`${menuItem.background} fa angle fa-angle-right `}
                                        ></i>
                                      )}
                                    </div>
                                  </a>
                                ) : (
                                  ""
                                )}

                                {menuItem.type === "link" ? (
                                  <Link
                                    shallow
                                    href={`${menuItem.path}`}
                                    as={`${menuItem.source
                                      ? menuItem.source
                                      : menuItem.path
                                      }`}
                                    onClick={() => { selectedMenu(menuItem); headerToggleButton() }}
                                    className={`nav-link ${menuItem.selected ? " active" : ""
                                      }`}
                                  >
                                    <span className="shape1"></span>
                                    <span className="shape2"></span>
                                    <i
                                      className={`${menuItem.icon} ${menuIcontype} menu-icon`}
                                    ></i>
                                    <span className="sidemenu-label">
                                      {menuItem.title}
                                    </span>
                                    {menuItem.badge ? (
                                      <label className={menuItem.badge}>
                                        {menuItem.badgetxt}
                                      </label>
                                    ) : (
                                      ""
                                    )}
                                  </Link>
                                ) : (
                                  ""
                                )}
                                {menuItem.type === "sub" && menuItem.children ? (
                                  <ul
                                    className={`nav-sub ${menuItem.active ? "open" : menuItem?.children?.[0]?.path?.split("/")[2] !== '' && menuItem?.children?.[0]?.path?.split("/")[2] === location.pathname.split("/")[2]
                                      ? "open"
                                      : ""
                                      }`}

                                    // className={`nav-sub ${
                                    //   menuItem.type === "sub"
                                    //   ? menuItem?.children?.[0]?.path?.split("/")[2] !== ''&& menuItem?.children?.[0]?.path?.split("/")[2] === location.pathname.split("/")[2]
                                    //     ? "open"
                                    //     : ""
                                    //   : menuItem.active ? "open" : ""
                                    // }`}

                                    style={
                                      menuItem.active
                                        ? { display: "block" }
                                        : { display: "none" }
                                    }
                                  >
                                    {menuItem.children.map(
                                      (childrenItem, index) => {
                                        return (
                                          <li
                                            key={index}
                                            className={`nav-sub-item ${childrenItem.type === "link"
                                              ? childrenItem?.path?.split("/")[2] === location.pathname.split("/")[2]
                                                ? "active show"
                                                : ""
                                              : childrenItem.selected
                                                ? "active show"
                                                : ""
                                              }`}

                                          // className={`nav-sub-item ${
                                          //   childrenItem.selected
                                          //     ? "active show"
                                          //     : ""
                                          // }`}
                                          >
                                            {childrenItem.type === "sub" ? (
                                              <a
                                                href="javascript"
                                                className="nav-sub-link sub-with-sub"
                                                onClick={(event) => {
                                                  event.preventDefault();
                                                  toggleSidemenu(childrenItem);
                                                  headerToggleButton()
                                                }}
                                              >
                                                <span className="sidemenu-label">
                                                  {childrenItem.title}
                                                  {childrenItem.active}
                                                </span>
                                                {childrenItem.type === "link"
                                                  ? childrenItem?.path?.split("/")[3] === location.pathname.split("/")[3]
                                                    ? <i className="angle fa fa-angle-down"> </i>
                                                    : ""
                                                  : childrenItem.active ? (
                                                    <i className="angle fa fa-angle-down"></i>
                                                  ) : (
                                                    <i
                                                      className={`${menuItem.background} fa angle fa-angle-right `}
                                                    ></i>
                                                  )}

                                                {/* {childrenItem.active ? (
                                              <i className="angle fa fa-angle-down"></i>
                                            ) : (
                                              <i
                                                className={`${menuItem.background} fa angle fa-angle-right `}
                                              ></i>
                                            )} */}


                                              </a>
                                            ) : (
                                              ""
                                            )}

                                            {childrenItem.type === "link" ? (
                                              <Link
                                                passHref
                                                href={`${childrenItem.source}`}
                                                as={`${childrenItem.source}`}
                                                onClick={() => {
                                                  selectedMenu(childrenItem)
                                                  headerToggleButton()
                                                }}

                                                className={`nav-sub-link ${childrenItem.type === "link"
                                                  ? childrenItem?.path?.split("/")[3] === location.pathname.split("/")[3]
                                                    ? "active"
                                                    : childrenItem?.path?.split("/")[2] === location.pathname.split("/")[2] && childrenItem.title === 'All Programs' && location.pathname.split("/")[3] === 'view'
                                                      ? "active"
                                                      : ""
                                                  : childrenItem.active
                                                    ? "active"
                                                    : ""
                                                  }`}


                                              // className={`nav-sub-link ${
                                              //   childrenItem.active
                                              //     ? " active"
                                              //     : ""
                                              // }`}
                                              >
                                                {childrenItem.title}
                                              </Link>
                                            ) : (
                                              ""
                                            )}

                                            {childrenItem.type === "sub" &&
                                              childrenItem.children ? (
                                              <ul
                                                className="sub-nav-sub"
                                                style={
                                                  childrenItem.active
                                                    ? { display: "block" }
                                                    : { display: "none" }
                                                }
                                              >
                                                {childrenItem.children.map(
                                                  (childrenSubItem, key) => (
                                                    <li
                                                      className={`nav-sub-item ${childrenSubItem.selected
                                                        ? " active"
                                                        : ""
                                                        }`}
                                                      key={key}
                                                    >
                                                      {childrenSubItem.type ===
                                                        "link" ? (
                                                        <Link
                                                          href={`${childrenSubItem.path}`}
                                                          as={`${childrenSubItem.source
                                                            ? childrenSubItem.source
                                                            : childrenSubItem.path
                                                            }`}
                                                          onClick={() => {
                                                            selectedMenu(
                                                              childrenSubItem
                                                            )
                                                            headerToggleButton()
                                                          }
                                                          } className={`nav-sub-link ${location.pathname ==
                                                            childrenSubItem.path
                                                            ? " active"
                                                            : ""
                                                            }`}
                                                        >
                                                          {childrenSubItem.title}
                                                        </Link>
                                                      ) : (
                                                        ""
                                                      )}

                                                      {childrenSubItem.type ===
                                                        "sub" ? (
                                                        <a
                                                          href="javascript"
                                                          className="nav-sub-link sub-with-sub"
                                                          onClick={(event) => {
                                                            event.preventDefault();
                                                            headerToggleButton()
                                                            toggleSidemenu(
                                                              childrenSubItem
                                                            );
                                                          }}
                                                        >
                                                          <span className="sidemenu-label">
                                                            {
                                                              childrenSubItem.title
                                                            }
                                                            {
                                                              childrenSubItem.active
                                                            }
                                                          </span>
                                                          {childrenSubItem.active ? (
                                                            <i className="angle fa fa-angle-down"></i>
                                                          ) : (
                                                            <i
                                                              className={`${childrenItem.background} fa angle fa-angle-right `}
                                                            ></i>
                                                          )}
                                                        </a>
                                                      ) : (
                                                        ""
                                                      )}
                                                      {childrenSubItem.type ===
                                                        "sub" &&
                                                        childrenSubItem.children ? (
                                                        <ul
                                                          className="sub-nav-sub"
                                                          style={
                                                            childrenSubItem.active
                                                              ? {
                                                                display:
                                                                  "block",
                                                              }
                                                              : {
                                                                display: "none",
                                                              }
                                                          }
                                                        >
                                                          {childrenSubItem.children.map(
                                                            (
                                                              children3Item,
                                                              key
                                                            ) => (
                                                              <li
                                                                className={`nav-sub-item ${children3Item.selected
                                                                  ? " active"
                                                                  : ""
                                                                  }`}
                                                                key={key}
                                                              >
                                                                {children3Item.type ===
                                                                  "link" ? (
                                                                  <Link
                                                                    href={`${children3Item.path}`}
                                                                    as={`${children3Item.source
                                                                      ? children3Item.source
                                                                      : children3Item.path
                                                                      }`}
                                                                    onClick={() => {
                                                                      selectedMenu(
                                                                        children3Item
                                                                      )
                                                                      headerToggleButton()
                                                                    }
                                                                    }
                                                                    className={`nav-sub-link ${location.pathname ==
                                                                      children3Item.path
                                                                      ? " active"
                                                                      : ""
                                                                      }`}
                                                                  >
                                                                    {
                                                                      children3Item.title
                                                                    }
                                                                  </Link>
                                                                ) : (
                                                                  ""
                                                                )}

                                                                {children3Item.type ===
                                                                  "sub" ? (
                                                                  <a
                                                                    href="javascript"
                                                                    className="nav-sub-link sub-with-sub"
                                                                    onClick={(
                                                                      event
                                                                    ) => {
                                                                      event.preventDefault();
                                                                      toggleSidemenu(
                                                                        children3Item
                                                                      );
                                                                      headerToggleButton()
                                                                    }}
                                                                  >
                                                                    <span className="sidemenu-label">
                                                                      {
                                                                        children3Item.title
                                                                      }
                                                                    </span>
                                                                    {children3Item.active ? (
                                                                      <i className="angle fa fa-angle-down"></i>
                                                                    ) : (
                                                                      <i
                                                                        className={`${childrenSubItem.background} fa angle fa-angle-right `}
                                                                      ></i>
                                                                    )}
                                                                  </a>
                                                                ) : (
                                                                  ""
                                                                )}
                                                                {/* {children3Item.children ? (
                                                          <ul
                                                            className="sub-nav-sub"
                                                            style={
                                                              children3Item.active
                                                                ? { display: "block" }
                                                                : { display: "none" }
                                                            }
                                                          >
                                                            {children3Item.children.map(
                                                              (children4Item, key) => (
                                                                <li
                                                                  className={`nav-sub-item ${children4Item.selected
                                                                      ? " active"
                                                                      : ""
                                                                    }`}
                                                                  key={key}
                                                                >
                                                                  {children4Item.type ===
                                                                    "link" ? (
                                                                    <Link
                                                                      href={`${children4Item.path}`}  as={`${children4Item.source ? children4Item.source : children4Item.path}`}
                                                                      onClick={() => selectedMenu(children4Item)} className={`nav-sub-link ${location.pathname == children4Item.path ? " active" : "" }`}
                                                                    >
                                                                      {children4Item.title}
                                                                    </Link>
                                                                  ) : (
                                                                    ""
                                                                  )}
                                                                </li>
                                                              )
                                                            )}
                                                          </ul>
                                                        ) : (
                                                          ""
                                                        )} */}
                                                              </li>
                                                            )
                                                          )}
                                                        </ul>
                                                      ) : (
                                                        ""
                                                      )}
                                                    </li>
                                                  )
                                                )}
                                              </ul>
                                            ) : (
                                              ""
                                            )}
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                ) : (
                                  ""
                                )}
                              </li>
                            ))}
                        </Fragment>
                      );
                    })
                  }

                </ul>
                <div className="slide-right" id="slide-right">
                  <i className="fe fe-chevron-right"></i>
                </div>
              </div>
            </div>
          </PerfectScrollbar>
        </div>
      </div>
      <div className="jumps-prevent" style={{ paddingTop: "64px" }}></div>
    </Fragment>
  );
};

export default SideBar;
