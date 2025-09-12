import React, { Fragment, useEffect } from "react";
import * as Switcherdata from "./switcherdata";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Button, Dropdown, Modal} from "react-bootstrap";
import Link from "next/link"
import {connect} from "react-redux"
import {useRouter} from "next/router"
import { SwitcherAction,changePrimaryColor,darkPrimaryColor } from "../../redux/slices/product/products";
import { useState } from "react";

function Switcher({SwitcherAction,changePrimaryColor,darkPrimaryColor}) {
  const router = useRouter()
  const [Basic, setShow1] = useState(false);
  useEffect(() => {
    Switcherdata.localStorageBackUp();
  }, [])
  return (
    <Fragment>
      <div className="switcher-wrapper">
        <div className="demo_changer"  >
          <PerfectScrollbar options={{ suppressScrollX: true }} className="form_holder sidebar-right1">
            <div className="row">
              <div className="predefined_styles">
                <div className="swichermainleft">
                  <h4>LTR and RTL Versions</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">LTR</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch7"
                            id="myonoffswitch19"
                            onClick={() => SwitcherAction("LTR")}
                            className="onoffswitch2-checkbox"
                            defaultChecked
                          />
                          <label
                            htmlFor="myonoffswitch19"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">RTL</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch7"
                            id="myonoffswitch20"
                            onClick={() => SwitcherAction("RTL")}
                            className="onoffswitch2-checkbox"
                          />
                          <label
                            htmlFor="myonoffswitch20"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft">
                  <h4>Navigation Style</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">Vertical Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch01"
                            id="myonoffswitch01"
                            className="onoffswitch2-checkbox"
                            onClick={() => {SwitcherAction("VerticalMenu"), router.push("#")}}
                            defaultChecked
                          />
                          <label
                            htmlFor="myonoffswitch01"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Horizontal Click Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch01"
                            id="myonoffswitch02"
                            onClick={() =>{ SwitcherAction("Horizontal"), router.push("#")}}
                            className="onoffswitch2-checkbox"
                          />
                          <label
                            htmlFor="myonoffswitch02"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Horizontal Hover Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch01"
                            id="myonoffswitch03"
                            className="onoffswitch2-checkbox"
                            onClick={() => {SwitcherAction("HorizontalHoverMenu"), router.push("#")}}
                          />
                          <label
                            htmlFor="myonoffswitch03"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft">
                  <h4>Light Theme Style</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">Light Theme</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch1"
                            id="myonoffswitch1"
                            onClick={() => SwitcherAction("LightTheme")}
                            className="onoffswitch2-checkbox"
                            defaultChecked
                          />
                          <label
                            htmlFor="myonoffswitch1"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Light Primary</span>
                        <div className="">
                          <input
                            className="wd-30 ht-30 input-dark-color-picker color-primary-light"
                            defaultValue="#6259ca"
                            id="lightPrimaryColorID"
                            onChange={(ele)=>{changePrimaryColor(ele.target.value)}}
                            // onInput={(e) => changePrimaryColor(e)}
                            type="color"
                            data-id="bg-color"
                            data-id1="bg-hover"
                            data-id2="bg-border"
                            data-id3="primary"
                            data-id8="transparentcolor"
                            name="darkPrimary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft">
                  <h4>Dark Theme Style</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">Dark Theme</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch1"
                            id="myonoffswitch2"
                            onClick={() => SwitcherAction("dark")}
                            className="onoffswitch2-checkbox"
                          />
                          <label
                            htmlFor="myonoffswitch2"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Dark Primary</span>
                        <div className="">
                          <input
                            className="wd-30 ht-30 input-dark-color-picker color-primary-dark"
                            defaultValue="#6259ca"
                            id="darkPrimaryColorID"
                            onChange={(ele)=>{darkPrimaryColor(ele.target.value)}}
                            type="color"
                            data-id="bg-color"
                            data-id1="bg-hover"
                            data-id2="bg-border"
                            data-id3="primary"
                            data-id8="transparentcolor"
                            name="darkPrimary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="swichermainleft">
                  <h4>Menu Styles</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle lightMenu d-flex">
                        <span className="me-auto">Light Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch2"
                            id="myonoffswitch3"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("LightMenu")}

                          />
                          <label
                            htmlFor="myonoffswitch3"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle colorMenu d-flex mt-2">
                        <span className="me-auto">Color Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch2"
                            id="myonoffswitch4"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("ColorMenu")}
                          />
                          <label
                            htmlFor="myonoffswitch4"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle darkMenu d-flex mt-2">
                        <span className="me-auto">Dark Menu</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch2"
                            id="myonoffswitch5"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("DarkMenu")}
                            defaultChecked
                          />
                          <label
                            htmlFor="myonoffswitch5"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft">
                  <h4>Header Styles</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle lightHeader d-flex">
                        <span className="me-auto">Light Header</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch3"
                            id="myonoffswitch6"
                            onClick={() => SwitcherAction("Lightheader")}
                            className="onoffswitch2-checkbox"
                            defaultChecked
                          />
                          <label
                            htmlFor="myonoffswitch6"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle  colorHeader d-flex mt-2">
                        <span className="me-auto">Color Header</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch3"
                            id="myonoffswitch7"
                            onClick={() => SwitcherAction("Colorheader")}
                            className="onoffswitch2-checkbox"
                          />
                          <label
                            htmlFor="myonoffswitch7"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle darkHeader d-flex mt-2">
                        <span className="me-auto">Dark Header</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch3"
                            id="myonoffswitch8"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("Darkheader")}
                          />
                          <label
                            htmlFor="myonoffswitch8"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft layout-width-style">
                  <h4>Layout Width Styles</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">Full Width</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch4"
                            id="myonoffswitch9"
                            className="onoffswitch2-checkbox"
                            defaultChecked
                            onClick={() => SwitcherAction("FullWidth")}
                          />
                          <label
                            htmlFor="myonoffswitch9"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Boxed</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch4"
                            id="myonoffswitch10"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("Boxed")}
                          />
                          <label
                            htmlFor="myonoffswitch10"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="swichermainleft">
                  <h4>Layout Positions</h4>
                  <div className="skin-body">
                    <div className="switch_section">
                      <div className="switch-toggle d-flex">
                        <span className="me-auto">Fixed</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch5"
                            id="myonoffswitch11"
                            className="onoffswitch2-checkbox"
                            defaultChecked
                            onClick={() => SwitcherAction("Fixed")}
                          />
                          <label
                            htmlFor="myonoffswitch11"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                      <div className="switch-toggle d-flex mt-2">
                        <span className="me-auto">Scrollable</span>
                        <p className="onoffswitch2">
                          <input
                            type="radio"
                            name="onoffswitch5"
                            id="myonoffswitch12"
                            className="onoffswitch2-checkbox"
                            onClick={() => SwitcherAction("Scrollable")}

                          />
                          <label
                            htmlFor="myonoffswitch12"
                            className="onoffswitch2-label"
                          ></label>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="swichermainleft">
                  <h4>Reset All Styles</h4>
                  <div className="skin-body">
                    <div className="switch_section my-4">
                    <Link href={"#"}>
                      <Button
                        variant=""
                        className="btn btn-danger btn-block"
                        onClick={() => {
                          SwitcherAction("resetAll")
                          // router.reload()
                        }}
                        type="button"
                      >
                        
                        Reset All
                      </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PerfectScrollbar>

        </div>
      </div>

      {/* <!-- End Switcher --> */}
    </Fragment>
  );
}

Switcher.propTypes = {};

Switcher.defaultProps = {};

const mapStateToProps = (state) => ({
  local_Products : state
})
export default connect(mapStateToProps,{SwitcherAction,changePrimaryColor,darkPrimaryColor})(Switcher);
