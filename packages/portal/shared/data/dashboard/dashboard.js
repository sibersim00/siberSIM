import React, {useEffect, useState} from "react";
const Dashboardshare = () => {
  return (
    <div className="row row-sm">
      <div className="col-sm-12 col-lg-12 col-xl-12">
        {/* <!--Row--> */}
        <div className="row row-sm  mt-lg-4">
          <div className="col-sm-12 col-lg-12 col-xl-12">
            <div className="card bg-primary custom-card card-box">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-xl-8 col-sm-6 col-12">

                    <h4 className="d-flex  mb-3">
                      <span className="font-weight-bold text-white ">Welcome To siberSIM Admin Portal</span>
                    </h4>
                    <p className="tx-white-7 mb-1">You have two programs to finish, you had
                      completed <b className="text-warning">57%</b> from your montly
                      level,
                      Keep going to your level</p>
                  </div>
                </div>
              </div> 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboardshare;
