import React, { useEffect, useState } from "react";
import Footer from "../footer/footer";
// import { Helmet } from 'react-helmet';
// import { Provider } from "react-redux";
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
// import store from "../../redux/store";
import { store,persistor } from '../../redux/store';
import {wrapper} from "../../redux/store";
import dynamic from "next/dynamic";
import Rightside from "../right-sidebar/right-sidebar";
import TabToTop from "../tab-to-top/tab-to-top";
import { useRouter } from "next/router";
import Header from "../header/header";
const Switcher = dynamic(() => import("../switcher/switcher"), { ssr: false });
const Sidebar = dynamic(() => import("../sidebar/sidebar"), { ssr: false });
import Script from 'next/script'

const Contentlayout = ({ children }) => {
  let Router = useRouter();
  // const Add = () => {
  //   document.querySelector("body").classList.remove("error-1");
  //   document
  //     .querySelector("body")
  //     .classList.remove(
  //       "app",
  //       "sidebar-mini",
  //       "ltr",
  //       "landing-page",
  //       "horizontalmenu"
  //     );
  //   document.querySelector("body").classList.add("main-body", "leftmenu");
  //   document.body.classList.add("ltr", "main-body", "leftmenu","main-sidebar-hide");
  // };
  const Add = () => {
  const body = document.body;

  // Remove unwanted classes
  body.classList.remove(
    "error-1",
    "app",
    "sidebar-mini",
    "ltr",
    "landing-page",
    "horizontalmenu"
  );

  // Add default layout classes
  body.classList.add("main-body", "leftmenu", "ltr", "main-sidebar-hide");

  // Apply theme based on localStorage
  const storedTheme = localStorage.getItem("theme_preference"); // "dark" or "light"
  if (storedTheme === "dark") {
    body.classList.add("dark-theme");
  } else {
    body.classList.remove("dark-theme");
  }
};

  useEffect(() => {
    Add();

    if (localStorage.getItem("DSPhorizontal")) {
      document.querySelector("body").classList.add("horizontalmenu");
      document.querySelector(".main-content").classList.add("hor-content");
      if (document.querySelector("main-container-1") != null) {
        document.querySelector(".main-container-1").classList.add("container");
        document
          .querySelector(".main-menu")
          .classList.add("main-navbar", "hor-menu");
        document
          .querySelector(".main-container-1")
          .classList.remove("main-sidebar-header");
        document
          .querySelector(".main-menu")
          .classList.remove("main-sidebar", "main-sidebar-sticky", "side-menu");
        document
          .querySelector(".main-body-1")
          .classList.remove("main-sidebar-body");
      }
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.add("container"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.add("hor-icon"));
      document
        .querySelector("body")
        .classList.remove(
          "horizontalmenu-hover",
          "leftmenu",
          "main-body",
          "default-menu"
        );
      document.querySelector(".main-content").classList.remove("side-content");
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.remove("container-fluid"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.remove("sidemenu-icon"));
    }

    if (localStorage.getItem("DSPhorizontalhover")) {
      document
        .querySelector("body")
        .classList.add("horizontalmenu", "horizontalmenu-hover");
      document.querySelector(".main-content").classList.add("hor-content");
      if(document.querySelector(".main-menu")!=null){
          document.querySelector(".main-menu").classList.add("main-navbar", "hor-menu");
          document.querySelector(".main-container-1").classList.add("container");
          document
            .querySelector(".main-menu")
            .classList.remove("main-sidebar", "main-sidebar-sticky", "side-menu");
            document
              .querySelector(".main-container-1")
              .classList.remove("main-sidebar-header");
              document
                .querySelector(".main-body-1")
                .classList.remove("main-sidebar-body");
      }
      document.querySelectorAll(".main-container").forEach((e) => e.classList.add("container"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.add("hor-icon"));
      document.querySelector("body").classList.remove("leftmenu", "main-body");
      // document.querySelector('.main-header').classList.remove('sticky');
      document.querySelector(".main-content").classList.remove("side-content");
      document.querySelector("body").classList.remove("default-menu");
      document
        .querySelectorAll(".main-container")
        .forEach((e) => e.classList.remove("container-fluid"));
      document
        .querySelectorAll(".menu-icon")
        .forEach((e) => e.classList.remove("sidemenu-icon"));
    //    
    }
  });


  const remove = () => {
    document.querySelector(".sidebar-right").classList.remove("sidebar-open");
    document.querySelector("body").classList.remove("main-sidebar-show");
    document.querySelector(".demo_changer").classList.remove("active");
    document.querySelector(".demo_changer").style.right = "-270px";
    if (document.querySelector(".card.search-result") != null) {
      document.querySelector(".card.search-result").classList.add("d-none");
    }
    if (document.body.classList.contains("horizontalmenu")){
      document.querySelectorAll(".nav-sub").forEach((res)=>{
        res.classList = "nav-sub"
        res.style.display = "none"
      })
    }
  };
  return (
    <>
      {/* <Head>
        <body className="ltr main-body leftmenu"></body>
        </Head> */}
      <ReduxProvider store={store}>
        {/* <PersistGate loading={null} persistor={persistor}> */}
        <div className="horizontalMenucontainer">
          <div className="page">
            <Header />
            <Sidebar />
            <div className="main-content side-content pt-0">
              <div
                className="main-container container-fluid"
                onClick={() => remove()}
              >
                <div className="inner-body mg-t-25">{children}</div>
              </div>
            </div>
            <Rightside />
          </div>
          <Switcher />
          <TabToTop />
          <Footer />
        </div>
        {/* </PersistGate> */}
      </ReduxProvider>
    </>
  );
};

export default Contentlayout;
