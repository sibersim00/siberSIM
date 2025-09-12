import React, { Fragment, useEffect, useState } from "react";
import { Col, Card, Row } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import Seo from "../../../shared/layout-components/seo/seo";
import { verifylearnerData } from "../../../shared/redux/slices/auth/auth";
import { useDispatch, useSelector } from "react-redux";

const VerifyPage = () => {
  const router = useRouter();
  const { push } = useRouter();
  const dispatch = useDispatch();
  const [timer, setTimer] = useState(30);
  const [respflag, setTRespFlag] = useState(false);

  const {  hasverifylearnerDatamessage } =
    useSelector((state) => {
      return {
        
        hasverifylearnerDatamessage: state?.InstructorData?.verifylearnerData,
      };
    });

  useEffect(() => {
    if (router.isReady && router.query.slug) {
      const learner_uuid = router.query.slug[0];
      console.log("learner_uuidlearner_uuid", learner_uuid);

      dispatch(verifylearnerData({ learner_uuid }));
      setTimeout(() => {
        setTRespFlag(true);
      }, 3000); 
    }
  }, [router.isReady, router.query.slug]);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else {
      push("/");
    }
  }, [timer]);

  return (
    <Fragment>
      <Seo title="Success Message" />
      <div className="page main-signin-wrapper bg-primary br-0-f">
        <Row className="signpages ext-center">
          <Col md={7} className=" mx-auto">
            <Card className="alert-message">
              <Card.Body>
                {!respflag ? (
                  <div className="text-center text-white">
                    <svg
                      className="alert-icons"
                      enableBackground="new 0 0 512.044 512.044"
                      viewBox="0 0 512.044 512.044"
                      width="512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g>
                        <g>
                          <path d="m502.026 376.697-52.051-90.685c-2.75-4.79-8.862-6.445-13.651-3.695-4.79 2.749-6.444 8.861-3.695 13.651l52.058 90.696c9.784 16.992 9.766 37.271-.048 54.246s-27.379 27.109-46.987 27.109h-363.261c-19.608 0-37.173-10.134-46.987-27.109-9.813-16.975-9.831-37.253-.048-54.246l181.63-315.448c9.804-17.027 27.387-27.192 47.035-27.192s37.231 10.166 47.05 27.219l84.792 146.239c2.77 4.778 8.889 6.405 13.667 3.635s6.405-8.889 3.635-13.667l-84.777-146.213c-13.417-23.301-37.479-37.213-64.367-37.213s-50.95 13.912-64.367 37.213l-181.629 315.448c-13.389 23.253-13.365 51.005.066 74.235 13.43 23.23 37.468 37.099 64.301 37.099h363.261c26.833 0 50.871-13.869 64.301-37.099 13.429-23.229 13.454-50.981.072-74.223z" />
                          <path d="m409.761 255.712c1.601 3.843 5.556 6.383 9.729 6.165 4.119-.215 7.757-3.004 9.021-6.93 1.242-3.859-.02-8.222-3.166-10.793-3.285-2.684-8.015-2.983-11.62-.758-4.106 2.534-5.819 7.862-3.964 12.316z" />
                          <path d="m256.022 81.531c-12.106 0-22.939 6.264-28.98 16.755l-167.217 290.414c-6.028 10.47-6.018 22.965.029 33.424s16.87 16.704 28.951 16.704h334.433c12.082 0 22.904-6.244 28.951-16.704 6.047-10.459 6.058-22.954.029-33.424l-167.216-290.414c-6.041-10.491-16.874-16.755-28.98-16.755zm178.853 330.583c-2.467 4.267-6.709 6.714-11.637 6.714h-334.433c-4.928 0-9.17-2.447-11.637-6.714-2.466-4.267-2.471-9.163-.012-13.434l167.216-290.414c2.428-4.217 6.783-6.734 11.648-6.734s9.22 2.518 11.648 6.734l167.216 290.414c2.461 4.27 2.457 9.167-.009 13.434z" />
                          <path d="m222.219 229.104-32.592 62.531c-4.19 8.039-3.885 17.467.816 25.219s12.92 12.38 21.986 12.38h18.548l-1.229 59.605c-.09 4.357 2.653 8.271 6.779 9.674 1.058.36 2.143.533 3.217.533 3.116 0 6.131-1.46 8.054-4.07l56.463-76.669c5.784-7.854 6.644-18.142 2.244-26.848-4.4-8.705-13.194-14.114-22.948-14.114h-4.557l28.788-46.833c1.897-3.086 1.977-6.955.21-10.117-1.768-3.161-5.107-5.12-8.729-5.12h-54.248c-9.618 0-18.356 5.299-22.802 13.829zm30.379 53.004c-1.897 3.086-1.977 6.956-.21 10.117 1.768 3.161 5.106 5.12 8.729 5.12h22.441c3.171 0 4.622 2.193 5.099 3.136s1.382 3.412-.499 5.965l-37.763 51.278.789-38.284c.055-2.688-.974-5.284-2.854-7.204-1.881-1.92-4.456-3.002-7.144-3.002h-28.757c-2.904 0-4.384-1.924-4.886-2.751s-1.523-3.029-.181-5.603l32.592-62.531c.988-1.895 2.929-3.073 5.067-3.073h36.363z" />
                        </g>
                      </g>
                    </svg>
                    <h3 className="mt-4 mb-3">
                      Please wait, we’re processing your account activation...
                    </h3>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <svg
                      className="alert-icons"
                      enableBackground="new 0 0 512 512"
                      version="1.1"
                      viewBox="0 0 512 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Success Checkmark SVG Path */}
                      <path d="m491.38 157.66c-13.15-30.297-31.856-57.697-55.598-81.439s-51.142-42.448-81.439-55.598c-31.529-13.686-64.615-20.625-98.338-20.625s-66.809 6.939-98.338 20.625c-30.297 13.15-57.697 31.856-81.439 55.598s-42.448 51.142-55.598 81.439c-13.686 31.529-20.625 64.615-20.625 98.338s6.939 66.809 20.625 98.338c13.149 30.297 31.855 57.697 55.598 81.439 23.742 23.742 51.142 42.448 81.439 55.598 31.529 13.686 64.615 20.625 98.338 20.625s66.809-6.939 98.338-20.625c30.297-13.15 57.697-31.856 81.439-55.598s42.448-51.142 55.598-81.439c13.686-31.529 20.625-64.615 20.625-98.338s-6.939-66.809-20.625-98.338zm-235.38 334.34c-127.92 0-236-108.08-236-236s108.08-236 236-236 236 108.08 236 236-108.08 236-236 236z" />
                      <path d="m374.28 177.72c-7.557-7.557-17.6-11.719-28.281-11.719s-20.724 4.162-28.281 11.719l-91.719 91.719-31.719-31.719c-7.557-7.557-17.6-11.719-28.281-11.719s-20.724 4.162-28.278 11.716c-7.559 7.553-11.722 17.597-11.722 28.284s4.163 20.731 11.719 28.281l60 60c7.557 7.557 17.601 11.719 28.281 11.719s20.724-4.162 28.281-11.719l120-120c7.559-7.553 11.722-17.597 11.722-28.284s-4.163-20.731-11.719-28.281z" />
                    </svg>

                    <h3 className="mt-4 mb-3">
                      {hasverifylearnerDatamessage?.message ||
                        "Account verified successfully!"}
                    </h3>

                    <p className="tx-18 text-white-50">
                      You will be redirected to Login ...
                    </p>

                    <div className="timer-container">
                      <span className="timer">{timer}</span>
                    </div>

                    <Link href={`/`} className="btn btn-success mt-4">
                      Go to Login
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      <style jsx>{`
        .timer-container {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
          margin-top: 20px;
          animation: fadeIn 1s ease-out;
        }

        .timer {
          font-size: 30px;
          font-weight: 700;
          color: #ffcc00;
          animation: countdown 1s ease-out forwards;
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes countdown {
          0% {
            transform: scale(1.2);
          }
          50% {
            transform: scale(1.4);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Fragment>
  );
};

export default VerifyPage;
