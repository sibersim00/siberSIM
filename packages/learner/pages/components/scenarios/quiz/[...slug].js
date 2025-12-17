import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, Button, Col, Badge, Row, ProgressBar } from "react-bootstrap";
import Seo from "../../../../shared/layout-components/seo/seo";
import {
  getQuizDetails,
  saveScenarioQuiz,
  clearSaveScenarioQuiz,
} from "../../../../shared/redux/slices/scenarios/quiz";
import { toast, ToastContainer } from "react-toastify";

const QuizDetails = () => {
  const dispatch = useDispatch();
  const { query } = useRouter();
  const [showResult, setShowResult] = useState(false);
  const [learnerId, setLearnerid] = useState("");
  const [questionAns, setQuestionAns] = useState([]);
  const [resultData, setResultData] = useState([]);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const { quizDetailsData, saveScenariosQuiz } = useSelector((state) => ({
    quizDetailsData: state?.quiz?.quizDetailsData,
    saveScenariosQuiz: state?.quiz?.saveScenariosQuiz,
  }));

  useEffect(() => {
    if (query.slug && query.slug[0]) {
      const payload = {
        scenariouuid: query.slug[0],
      };

      dispatch(getQuizDetails(payload));
    }
  }, [query.slug, dispatch]);
  useEffect(() => {
    if (
      quizDetailsData?.statusCode === 200 &&
      quizDetailsData.data?.learnerid
    ) {
      setLearnerid(quizDetailsData.data.learnerid);
      setQuestionAns(quizDetailsData.data.questions);
      setTimerActive(true);
    }
  }, [quizDetailsData]);

  useEffect(() => {
    let timer;
    if (timerActive) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive]);

  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
      2,
      "0"
    );
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const initialValues = questionAns.reduce((acc, question) => {
    acc[question.question_id] = [];
    return acc;
  }, {});

  const validationSchema = Yup.object(
    questionAns.reduce((acc, question) => {
      acc[question.question_id] = Yup.array()
        .min(1, "Please select at least one answer.")
        .required("Required");
      return acc;
    }, {})
  );

  const handleSubmit = (values) => {
    setTimerActive(false);

    const updatedAnswers = questionAns.map((question) => {
      const selectedAnswerIds = values[question.question_id].map(String);

      const updatedQuestion = {
        ...question,
        answers: question.answers.map((answer) => ({
          ...answer,
          is_correct_user: selectedAnswerIds.includes(
            answer.answer_id.toString()
          ),
        })),
      };

      updatedQuestion.learneranswerids = updatedQuestion.answers
        .filter((a) => a.is_correct_user)
        .map((a) => parseInt(a.answer_id));

      return updatedQuestion;
    });

    const correctCount = updatedAnswers.reduce((total, question) => {
      const correctAnswers = question.answers
        .filter((a) => a.is_correct === "Yes")
        .map((a) => a.answer_id.toString());
      const userAnswers = question.answers
        .filter((a) => a.is_correct_user)
        .map((a) => a.answer_id.toString());
      const isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((id) => userAnswers.includes(id));
      return total + (isCorrect ? 1 : 0);
    }, 0);

    const resultPayload = updatedAnswers.map((question) => {
      const correctAnswers = question.answers
        .filter((a) => a.is_correct === "Yes")
        .map((a) => a.answer_id.toString());
      const userAnswers = question.answers
        .filter((a) => a.is_correct_user)
        .map((a) => a.answer_id.toString());
      const isCorrect =
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((id) => userAnswers.includes(id));
      return {
        ...question,
        isCorrect,
      };
    });
    setResultData(resultPayload);
    setShowResult(true);
    const payload = {
      scenariolearnarquizid: query.slug[2],
      learner_id: learnerId,
      scenariolearnerid: query.slug[1],
      scenarioid: quizDetailsData.data.scenarioid,
      isencrypt: true,
      questionAnsData: updatedAnswers,
      total_questions: updatedAnswers.length,
      total_answers: updatedAnswers.reduce((total, question) => {
        return total + (question.learneranswerids.length > 0 ? 1 : 0);
      }, 0),
      timer: formatTime(secondsElapsed),
      total_correct_answers: correctCount,
      status: "Completed",
    };

    dispatch(saveScenarioQuiz(payload));
  };

  useEffect(() => {
    if (saveScenariosQuiz?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {saveScenariosQuiz?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        }
      );
      dispatch(clearSaveScenarioQuiz());
    }
  }, [saveScenariosQuiz, dispatch]);

  return (
    <>
      <Seo title="Quiz" />
      <ToastContainer />
      <Col md={12}>
        <Card className="custom-card overflow-hidden shadow-sm">
          <Card.Body className="p-4">
            <h2 className="mb-4 text-primary d-flex justify-content-between align-items-center">
              <span>
                {showResult
                  ? "📊 Scenario Result"
                  : `📝 ${
                      quizDetailsData?.data?.scenariotitle || "Scenario Quiz"
                    } `}
              </span>

              {!showResult && questionAns.length > 0 && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "#e0f7fa",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    color: "#006064",
                  }}
                >
                  <i
                    className="fas fa-clock"
                    style={{ marginRight: "8px" }}
                  ></i>
                  <span>{formatTime(secondsElapsed)}</span>
                </div>
              )}
            </h2>

            {!showResult ? (
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ errors, touched }) =>
                  questionAns.length === 0 ? (
                    <div className="text-center py-5">
                      <h4 className="text-danger mb-3">
                        <i className="fas fa-ban me-2"></i>
                        No questions found for this quiz.
                      </h4>

                      <p>{"The quiz you're trying to access..."}</p>

                      <Button
                        variant="secondary"
                        onClick={() => window.close()}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Close
                      </Button>
                    </div>
                  ) : (
                    <Form>
                      {questionAns.map((question, qIndex) => (
                        <Card key={question.question_id} className="mb-4">
                          <Card.Body>
                            <h5 className="fw-semibold mb-3">
                              {qIndex + 1}. {question.question_text}
                            </h5>
                            <Row>
                              {question.answers.map((answer) => {
                                const fieldName = `${question.question_id}`;
                                const answerId = answer.answer_id.toString();
                                return (
                                  <Col md={4} key={answer.answer_id}>
                                    <Field name={fieldName}>
                                      {({ field, form }) => {
                                        const currentValue = field.value || [];
                                        const isSCQ =
                                          question.question_type === "SCQ";

                                        const handleChange = () => {
                                          if (isSCQ) {
                                            form.setFieldValue(fieldName, [
                                              answerId,
                                            ]);
                                          } else {
                                            const newValue = new Set(
                                              currentValue.map(String)
                                            );
                                            if (newValue.has(answerId)) {
                                              newValue.delete(answerId);
                                            } else {
                                              newValue.add(answerId);
                                            }
                                            form.setFieldValue(
                                              fieldName,
                                              Array.from(newValue)
                                            );
                                          }
                                        };

                                        const isChecked = isSCQ
                                          ? currentValue[0] === answerId
                                          : currentValue.includes(answerId);

                                        return (
                                          <div className="form-check">
                                            <input
                                              type={
                                                isSCQ ? "radio" : "checkbox"
                                              }
                                              className="form-check-input"
                                              id={`q-${fieldName}-a-${answerId}`}
                                              name={fieldName}
                                              checked={isChecked}
                                              onChange={handleChange}
                                            />
                                            <label
                                              className="form-check-label"
                                              htmlFor={`q-${fieldName}-a-${answerId}`}
                                            >
                                              {answer.answer_text}
                                            </label>
                                          </div>
                                        );
                                      }}
                                    </Field>
                                  </Col>
                                );
                              })}
                            </Row>
                            <ErrorMessage
                              name={question.question_id.toString()}
                              component="div"
                              className="text-danger mt-2"
                            />
                          </Card.Body>
                        </Card>
                      ))}
                      <div className="text-end">
                        <Button variant="primary" type="submit">
                          Submit
                        </Button>
                      </div>
                    </Form>
                  )
                }
              </Formik>
            ) : (
              <>
                <div className="text-center p-4">
                  <div className="mb-3">
                    <i
                      className="bi bi-trophy"
                      style={{ fontSize: 48, color: "#28a745" }}
                    ></i>
                  </div>

                  {(() => {
                    const totalQuestions = resultData.length;
                    const correctCount = resultData.filter(
                      (r) => r.isCorrect
                    ).length;
                    const scorePercent =
                      totalQuestions === 0
                        ? 0
                        : (correctCount / totalQuestions) * 100;
                    const isPass = scorePercent === 100;

                    return (
                      <>
                        <h2 className="fw-bold mb-2">
                          {isPass
                            ? "Excellent Work!"
                            : "Better Luck Next Time!"}
                        </h2>

                        <p
                          className={`mb-4 ${
                            isPass ? "text-success" : "text-danger"
                          }`}
                          style={{ fontSize: "1.1rem", fontWeight: "500" }}
                        >
                          {isPass ? (
                            <>
                              You nailed it with a perfect score! Keep up the
                              great learning streak.{" "}
                              <i className="fas fa-rocket text-success"></i>
                            </>
                          ) : (
                            <>
                              You scored {correctCount} out of {totalQuestions}.
                              Don&apos;t worry, practice makes perfect! Try
                              again and you&apos;ll get there!{" "}
                              <i className="fas fa-thumbs-up text-warning"></i>
                            </>
                          )}
                        </p>
                      </>
                    );
                  })()}

                  <Row className="justify-content-center mb-4">
                    <Col xs={12} md={4} className="mb-3">
                      <Card className="text-center shadow-sm">
                        <Card.Body>
                          <p className="text-muted mb-1">Total Questions</p>
                          <h3 className="fw-bold mb-0">{resultData.length}</h3>
                        </Card.Body>
                      </Card>
                    </Col>

                    <Col xs={12} md={4} className="mb-3">
                      <Card className="text-center shadow-sm">
                        <Card.Body>
                          <p className="text-muted mb-1">Correct Answers</p>
                          <h3 className="fw-bold text-success mb-0">
                            {resultData.filter((r) => r.isCorrect).length}
                          </h3>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <div className="mb-3">
                    <h5 className="mb-2">Your Score</h5>
                    <div
                      style={{
                        width: "80%",
                        maxWidth: "600px",
                        margin: "0 auto",
                      }}
                    >
                      <ProgressBar
                        now={
                          (resultData.filter((r) => r.isCorrect).length /
                            resultData.length) *
                          100
                        }
                        label={`${(
                          (resultData.filter((r) => r.isCorrect).length /
                            resultData.length) *
                          100
                        ).toFixed(0)}%`}
                        variant={
                          resultData.filter((r) => r.isCorrect).length ===
                          resultData.length
                            ? "success"
                            : "danger"
                        }
                        style={{
                          height: "24px",
                          fontSize: "16px",
                          borderRadius: "10px",
                        }}
                        className="mb-2 custom-progress-bar"
                      />
                    </div>
                    <p
                      className={`text-muted ${
                        resultData.filter((r) => r.isCorrect).length ===
                        resultData.length
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {resultData.filter((r) => r.isCorrect).length ===
                      resultData.length ? (
                        <>
                          You&apos;ve shown excellent understanding!{" "}
                          <i className="fas fa-bullseye text-primary"></i>
                        </>
                      ) : (
                        "Keep practicing to improve your score!"
                      )}
                    </p>
                  </div>

                  <div className="d-flex justify-content-center gap-3 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.href = `/scenario_quiz/${query.slug[0]}`;
                      }}
                    >
                      Retake Quiz
                    </Button>

                    <Button
                      variant="outline-danger"
                      onClick={() => window.close()}
                    >
                      <i className="fas fa-arrow-left me-2"></i> Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};
QuizDetails.layout = "Eventlayout";
export default QuizDetails;
