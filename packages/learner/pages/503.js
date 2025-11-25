import React, { Fragment } from 'react'
import Seo from '../shared/layout-components/seo/seo'
import { Col, Container, } from "react-bootstrap";
import Link from 'next/link';
import defaultLogo from "../public/assets/img/brand/logo-dark.png";
const Custom503 = () => {
    return (
    <div>
      <Seo title="Website Under Construction" />

      <Fragment>
        <div
          className="ltr main-body leftmenu main-signin-wrapper"
          style={{
            margin: 0,
            padding: 0,
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <Container>
            <div className='background-black'
              style={{
                padding: "40px 40px",
                borderRadius: "20px",
                maxWidth: "500px",
                margin: "0 auto",
                boxShadow: "0 8px 20px #fff",
              }}
            >
               <Col lg={12} className="text-center mb-2" >
                  <div>
                    <img
                      src={defaultLogo.src}
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultLogo.src }}
                      alt="user"
                    />
                  </div>
                </Col>
              <Col lg={12}>
                <h1 style={{ fontSize: "2.3rem", fontWeight: "700" }}>
                  🚧 Website Under Construction 🚧
                </h1>
              </Col>

              <Col lg={12}>
                <p style={{ opacity: 0.9 }}>
                  We are currently working hard to bring you a better
                  experience.
                </p>
                <p style={{ opacity: 0.9 }}>Please wait while we finalize updates.</p>

                {/* Loader */}
                <div
                  style={{
                    margin: "25px auto",
                    border: "6px solid rgba(255,255,255,0.3)",
                    borderTop: "6px solid #fff",
                    borderRadius: "50%",
                    width: "60px",
                    height: "60px",
                    animation: "spin 1s linear infinite",
                  }}
                  className="loader"
                ></div>

                <div style={{ marginTop: "20px", lineHeight: "1.6rem" }}>
                  <p>✨ New features and improvements are coming soon.</p>
                  <p>📅 Estimated Launch: Very Soon</p>
                  <p>🔧 Thank you for your patience and support.</p>
                </div>

                <div style={{ marginTop: "25px", opacity: 0.9 }}>
                  For any urgent inquiries, contact:<br />
                  <strong>sales_enquiries@ofisgate.com</strong>
                </div>
              </Col>
            </div>
          </Container>
        </div>

        {/* Loader keyframes */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Fragment>
    </div>
  );
}

export default Custom503
