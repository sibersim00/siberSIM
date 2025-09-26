import { Row, Col, Card, Button } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import "../../../../shared/utils/i18n";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  getAllLearnerQuiz,
  clearGetAllLearnerQuiz,
  
} from "../../../../shared/redux/slices/scenarios/quiz";
import crossEvalicon from "../../../../public/assets/img/svgs/crosseval.svg";
const Quiz = () => {
  const dispatch = useDispatch();
  const { query } = useRouter();


  useEffect(() => {
    if (query.slug && query.slug[0]) {
      dispatch(getAllLearnerQuiz(query.slug[0]));
    }
  }, [query.slug]);

  const { getQuizData } = useSelector((state) => ({
    getQuizData: state?.quiz?.getQuizData?.data,
    
  }));
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    if (getQuizData && getQuizData.length > 0) {
      setQuizzes(getQuizData);
    }
    dispatch(clearGetAllLearnerQuiz())
  }, [getQuizData]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0"); 
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();

    return `${month}/${day}/${year}`;
  };

  const handleStartQuiz = async () => {
    try {
      window.open(`${process.env.BASE_PATH}scenario_quiz/${query.slug[0]}`, "_blank");
    } catch (error) {
      console.error("Failed to start quiz:", error);
    }
  };

  return (
    <div className="bg-body-secondary min-vh-100 p-3">
      <Row className="row-sm">
        <Row className="mb-4">
          <Col className="d-flex justify-content-end">
            <Button
              type="button"
              variant="outline-primary"
              onClick={handleStartQuiz}
            >
              <i className="fe fe-plus me-2"></i>Quiz Start
            </Button>

        
          </Col>
        </Row>

        {quizzes.length === 0 ? (
          <Row>
            <Col sm={12}>
              <Card className="custom-card">
                <Card.Body className="overflow-auto pd-t-10">
                  <Row className="text-center">
                    <Col md={10} className="mx-auto">
                      <Card
                        style={{ border: "none"}}
                      >
                        <Card.Body>
                          <div className="text-center mt-5">
                            <img
                              src={crossEvalicon.src}
                              alt="No data"
                              className="wd-150 mt-5"
                            />
                            <h5 className="mt-4">No data found.</h5>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row className="row-sm">
            {quizzes.map((quiz, index) => (
              <Col md={3} className="mb-4" key={index}>
                <Card
                  className="quiz-result-card text-white position-relative shadow-lg p-4"
                 
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">
                      <i className="si si-book-open me-2"></i> Quiz
                    </h5>
                    
                  </div>

                  <div className="mt-3">
                    <h2 className="fw-bold">
                      <i className="fe fe-star text-warning me-1"></i>
                      {quiz.total_correct_answers} / {quiz.total_questions}
                    </h2>
                    <div className="text-white-50">
                      {Math.round(
                        (quiz.total_correct_answers / quiz.total_questions) *
                          100
                      )}
                      % Correct
                    </div>
                    <div
                      className="progress mt-2"
                      style={{ height: "6px", backgroundColor: "#ffffff55" }}
                    >
                      <div
                        className="progress-bar bg-warning"
                        style={{
                          width: `${
                            (quiz.total_correct_answers /
                              quiz.total_questions) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-3">
                      <i className="fe fe-calendar me-2"></i>
                      <strong>Started On:</strong> {formatDate(quiz.startedon)}
                    </div>
                    <div className="mb-3">
                      <i className="fe fe-clock me-2"></i>
                      <strong>Time Spent:</strong>{" "}
                      {quiz.timer || "-"}
                    </div>
                    <div className="">
                      <i className="fe fe-award me-2"></i>
                      <strong>Your Rank:</strong> #{quiz.rank || "12"} out of{" "}
                      {quiz.total_participants || "50"} participants
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

   
        )}
      </Row>
    </div>
  );
};

export default Quiz;
