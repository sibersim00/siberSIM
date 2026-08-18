import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Container, Nav, Tab } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import Seo from "../layout-components/seo/seo";
import {
  clearNormalusersInfo,
  getNormalusersInfo,
} from "../redux/slices/normalusers/normalUserManage";
import dummyProfile from "../../public/assets/img/dummy_profile.png";
import styles from "./user-view.module.scss";

ChartJS.register(ArcElement, Tooltip, Legend);
const EMPTY = "—";

const formatDate = (value, dateOnly = false) => {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return dateOnly
    ? date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : date.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const toneFor = (status = "") => {
  const value = status.toLowerCase();
  if (["completed", "active", "yes", "verified"].includes(value))
    return "success";
  if (
    ["failed", "terminated", "inactive", "no", "not verified"].includes(value)
  )
    return "danger";
  if (["running", "in progress", "pending"].includes(value)) return "warning";
  return "neutral";
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  animation: { duration: 900, easing: "easeOutQuart" },
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#111827", padding: 12, cornerRadius: 8 },
  },
};

const Pill = ({ children, tone }) => (
  <span className={`${styles.pill} ${styles[tone || toneFor(children)]}`}>
    <i className={styles.dot} />
    {children || EMPTY}
  </span>
);

const EmptyState = ({ icon, title, children }) => (
  <div className={styles.empty}>
    <span className={styles.emptyIcon}>
      <i className={`fe fe-${icon}`} />
    </span>
    <h4>{title}</h4>
    <p>{children}</p>
  </div>
);

const Heading = ({ eyebrow, title, children }) => (
  <div className={styles.heading}>
    <span>{eyebrow}</span>
    <h3>{title}</h3>
    <p>{children}</p>
  </div>
);

const Metric = ({ icon, label, value, helper, tone, delay }) => (
  <article
    className={`${styles.metric} ${styles[tone]}`}
    style={{ "--delay": `${delay}ms` }}
  >
    <div className={styles.metricIcon}>
      <i className={`fe fe-${icon}`} />
    </div>
    <div className={styles.metricCopy}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  </article>
);

const Info = ({ icon, label, value, status }) => (
  <div className={styles.info}>
    <span className={styles.infoIcon}>
      <i className={`fe fe-${icon}`} />
    </span>
    <div>
      <p className="fs-14">{label}</p>
      {status ? <Pill>{value}</Pill> : <strong>{value || EMPTY}</strong>}
    </div>
  </div>
);

const QuizCard = ({ quiz, index }) => {
  const questions = Number(quiz.total_questions) || 0;
  const correct = Math.min(Number(quiz.total_correct_answers) || 0, questions);
  const incorrect = Math.max(questions - correct, 0);
  const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
  const chartData = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: questions ? [correct, incorrect] : [1],
        backgroundColor: questions
          ? ["#22c55e", "rgba(244,63,94,.42)"]
          : ["rgba(148,163,184,.22)"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };
  return (
    <article
      className={styles.quiz}
      style={{ "--delay": `${Math.min(index * 70, 350)}ms` }}
    >
      <div className={styles.cardTop}>
        <span className={styles.index}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <Pill tone={accuracy >= 50 ? "success" : "danger"}>
          {accuracy >= 50 ? "Passed" : "Needs review"}
        </Pill>
      </div>
      <h4>{quiz.scenario_title || "Untitled scenario"}</h4>
      <div className={styles.quizBody}>
        <div className={styles.chart}>
          <Doughnut data={chartData} options={chartOptions} />
          <div className={styles.chartCenter}>
            <strong>{accuracy}%</strong>
            <small>accuracy</small>
          </div>
        </div>
        <div className={styles.quizStats}>
          <div>
            <i className={styles.correct} />
            <small>Correct</small>
            <strong>{correct}</strong>
          </div>
          <div>
            <i className={styles.incorrect} />
            <small>Incorrect</small>
            <strong>{incorrect}</strong>
          </div>
          <div>
            <i className={styles.total} />
            <small>Questions</small>
            <strong>{questions}</strong>
          </div>
        </div>
      </div>
      <div className={styles.timeline}>
        <span>
          <i className="fe fe-play-circle" />
          {formatDate(quiz.startedon)}
        </span>
        <i className="fe fe-arrow-right" />
        <span>
          <i className="fe fe-check-circle" />
          {formatDate(quiz.endedon)}
        </span>
      </div>
    </article>
  );
};

const NormalUsersView = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("profile");
  const response = useSelector(
    (state) => state?.normalUSerData?.normaluserInfoResp?.data,
  );

  useEffect(() => {
    if (response && response !== "") setData(response);
  }, [response]);
  useEffect(() => {
    if (router.query.slug?.[0])
      dispatch(getNormalusersInfo(router.query.slug[0]));
  }, [dispatch, router.query.slug]);

  const sessions = data.sessions || [];
  const quizzes = data.quizzes || [];
  const events = data.events || [];
  const summaries = data.eventScenarioSummary || [];
  const completed = sessions.filter(
    (item) => item.status === "Completed",
  ).length;
  const terminated = sessions.filter(
    (item) => item.status === "Terminated",
  ).length;
  const displayName =
    [data.firstname, data.lastname].filter(Boolean).join(" ") ||
    "Learner profile";
  const completionData = useMemo(
    () => ({
      labels: ["Completed", "Terminated"],
      datasets: [
        {
          data: completed + terminated ? [completed, terminated] : [1],
          backgroundColor:
            completed + terminated
              ? ["#22c55e", "rgba(244,63,94,.55)"]
              : ["rgba(148,163,184,.22)"],
          borderWidth: 0,
          hoverOffset: 5,
        },
      ],
    }),
    [completed, terminated],
  );

  const profile = [
    ["user", "First name", data.firstname],
    ["user-plus", "Last name", data.lastname],
    ["mail", "Email address", data.email],
    ["phone", "Mobile number", data.mobile],
    ["at-sign", "Username", data.username || data.loginid],
    ["check-circle", "Account status", data.status, true],
    [
      "shield",
      "Verification",
      data.isverified === "Yes" ? "Verified" : "Not verified",
      true,
    ],
    ["user-check", "SIMManager", data.instructor_name],
    ["calendar", "Enrollment date", formatDate(data.enrollmentDate, true)],
  ];
  const tabs = [
    ["profile", "user", "Profile", null],
    ["quiz", "edit-3", "Quiz stats", quizzes.length],
    ["session", "monitor", "Sessions", sessions.length],
    ["logs", "bar-chart-2", "Event stats", events.length],
  ];

  return (
    <>
      <Seo title={`${displayName} | Learners`} />
      <ToastContainer />
      <main className={styles.page}>
        <Container fluid="xl" className={styles.container}>
          <section className={styles.hero}>
            <button
              type="button"
              className={styles.back}
              onClick={() => {
                router.push(
                  `/users-management/?view=${router.query?.backView || "list"}`,
                );
                dispatch(clearNormalusersInfo());
              }}
            >
              <i className="fe fe-arrow-left" />
              <span>Back to learners</span>
            </button>
            <div className={styles.heroContent}>
              <div className={styles.avatarWrap}>
                <img
                  className={styles.avatar}
                  src={
                    data.profile
                      ? `${process.env.API_URL_FILEMANAGER}${data.profile}`
                      : dummyProfile.src
                  }
                  alt={`${displayName} profile`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = dummyProfile.src;
                  }}
                />
                <span className={styles.online} />
              </div>
              <div className={styles.identity}>
                <span className={styles.eyebrow}>Learner overview</span>
                <h1>{displayName}</h1>
                <div className={styles.contacts}>
                  <span>
                    <i className="fe fe-mail" />
                    {data.email || EMPTY}
                  </span>
                  <span>
                    <i className="fe fe-phone" />
                    {data.mobile || EMPTY}
                  </span>
                </div>
              </div>
              <div className={styles.heroStatus}>
                <Pill>{data.status || "Unknown"}</Pill>
                <small>Account status</small>
              </div>
            </div>
          </section>

          <section className={styles.metrics}>
            <Metric
              icon="calendar"
              label="Events attended"
              value={data.totalEvents ?? 0}
              helper="Total participations"
              tone="cyan"
              delay={80}
            />
            <Metric
              icon="target"
              label="Scenarios"
              value={data.totalScenarios ?? 0}
              helper="Unique scenarios"
              tone="green"
              delay={140}
            />
            <Metric
              icon="trending-up"
              label="Quiz accuracy"
              value={`${data.quizStats?.accuracy ?? 0}%`}
              helper={`${data.quizStats?.totalCorrect ?? 0} correct answers`}
              tone="violet"
              delay={200}
            />
            <Metric
              icon="award"
              label="Completion rate"
              value={`${data.eventStats?.completionRate ?? 0}%`}
              helper={`${data.eventStats?.completed ?? 0} events completed`}
              tone="amber"
              delay={260}
            />
          </section>

          <section className={styles.workspace}>
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
              <Nav className={styles.tabs}>
                {tabs.map(([key, icon, label, count]) => (
                  <Nav.Item key={key}>
                    <Nav.Link eventKey={key} className={styles.tab}>
                      <i className={`fe fe-${icon}`} />
                      <span>{label}</span>
                      {count !== null && <small>{count}</small>}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
              <Tab.Content className={styles.content}>
                <Tab.Pane eventKey="profile">
                  <Heading
                    eyebrow="Personal information"
                    title="Profile details"
                  >
                    Identity, contact and account information for this learner.
                  </Heading>
                  <div className={styles.infoGrid}>
                    {profile.map(([icon, label, value, status]) => (
                      <Info
                        key={label}
                        icon={icon}
                        label={label}
                        value={value}
                        status={status}
                      />
                    ))}
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="quiz">
                  <Heading eyebrow="Knowledge checks" title="Quiz performance">
                    Question accuracy across every attempted scenario.
                  </Heading>
                  {quizzes.length ? (
                    <div className={styles.grid}>
                      {quizzes.map((quiz, index) => (
                        <QuizCard
                          key={`${quiz.scenario_title}-${index}`}
                          quiz={quiz}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon="edit-3" title="No quiz attempts yet">
                      Quiz performance will appear after the learner completes a
                      knowledge check.
                    </EmptyState>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="session">
                  <Heading eyebrow="Hands-on activity" title="Session details">
                    Current activity and previous scenario sessions at a glance.
                  </Heading>
                  <div className={styles.overviewGrid}>
                    <article className={`${styles.overview} ${styles.outcome}`}>
                      <div>
                        <span className={styles.eyebrow}>Session outcome</span>
                        <h4>Completion status</h4>
                        <div className={styles.legend}>
                          <span>
                            <i className={styles.correct} />
                            {completed} completed
                          </span>
                          <span>
                            <i className={styles.incorrect} />
                            {terminated} terminated
                          </span>
                        </div>
                      </div>
                      <div className={styles.outcomeChart}>
                        <Doughnut
                          data={completionData}
                          options={chartOptions}
                        />
                        <div className={styles.chartCenter}>
                          <strong>{sessions.length}</strong>
                          <small>sessions</small>
                        </div>
                      </div>
                    </article>
                    <article className={`${styles.overview} ${styles.current}`}>
                      <span className={styles.live}>
                        <i />
                        Current activity
                      </span>
                      {data.currentScenario ? (
                        <>
                          <h4>
                            {data.currentScenario.title || "Current scenario"}
                          </h4>
                          <div className={styles.currentStats}>
                            <div>
                              <small>VM steps</small>
                              <p>
                                {data.currentScenario.vm_steps ?? 0}
                              </p>
                            </div>
                            <div>
                              <small>Started</small>
                              <p>
                                {formatDate(data.currentScenario.startedon)}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className={styles.compact}>
                          <i className="fe fe-coffee" />
                          <div>
                            <strong>No active session</strong>
                            <span className="fs-6">
                              The learner is not in a scenario right now.
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  </div>
                  <h4 className={styles.subheading}>Session history</h4>
                  {sessions.length ? (
                    <div className={styles.grid}>
                      {sessions.map((session, index) => (
                        <article
                          className={styles.session}
                          key={session.scenariolearnersessionid || index}
                          style={{
                            "--delay": `${Math.min(index * 60, 300)}ms`,
                          }}
                        >
                          <div className={styles.cardTop}>
                            <span className={styles.sessionIcon}>
                              <i className="fe fe-monitor" />
                            </span>
                            <Pill>{session.status}</Pill>
                          </div>
                          <h4>
                            {session.scenario_title || "Untitled scenario"}
                          </h4>
                          <div className={styles.facts}>
                            <span>
                              <small>VM steps</small>
                              <p>{session.vm_steps ?? 0}</p>
                            </span>
                            <span>
                              <small>Time spent</small>
                              <p>{session.timer || EMPTY}</p>
                            </span>
                          </div>
                          <div className={styles.dates}>
                            <span>
                              <small>Started</small>
                              {formatDate(session.startedon)}
                            </span>
                            <span>
                              <small>
                                {session.completedon
                                  ? "Completed"
                                  : "Terminated"}
                              </small>
                              {formatDate(
                                session.completedon || session.terminatedon,
                              )}
                            </span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon="monitor" title="No session history">
                      Completed and terminated sessions will be collected here.
                    </EmptyState>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="logs">
                  <Heading eyebrow="Participation" title="Event statistics">
                    Completion health and participation, broken down by
                    scenario.
                  </Heading>
                  <div className={styles.eventMetrics}>
                    <div>
                      <p>Total events</p>
                      <strong>{data.eventStats?.total ?? 0}</strong>
                      <i className="fe fe-calendar" />
                    </div>
                    <div>
                      <p>Completed</p>
                      <strong>{data.eventStats?.completed ?? 0}</strong>
                      <i className="fe fe-check-circle" />
                    </div>
                    <div>
                      <p>Average time</p>
                      <strong>
                        {data.eventStats?.avgTimeMinutes ?? 0}
                        <small> min</small>
                      </strong>
                      <i className="fe fe-clock" />
                    </div>
                    <div>
                      <p>Completion</p>
                      <strong>
                        {data.eventStats?.completionRate ?? 0}
                        <small>%</small>
                      </strong>
                      <i className="fe fe-trending-up" />
                    </div>
                  </div>
                  <div className={styles.tableSection}>
                    <div className={styles.tableTitle}>
                      <div>
                        <span>Scenario breakdown</span>
                        <h4>Event scenarios</h4>
                      </div>
                      <small>{summaries.length} scenarios</small>
                    </div>
                    {summaries.length ? (
                      <div className={styles.tableWrap}>
                        <table>
                          <thead>
                            <tr>
                              <th>Scenario title</th>
                              <th>Total events</th>
                              <th>Completed</th>
                              <th>Progress</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaries.map((item, index) => {
                              const total = Number(item.total_events) || 0;
                              const done = Number(item.completed_events) || 0;
                              const progress = total
                                ? Math.round((done / total) * 100)
                                : 0;
                              return (
                                <tr key={`${item.scenario}-${index}`}>
                                  <td>
                                    <span className={styles.scenarioIcon}>
                                      <i className="fe fe-target" />
                                    </span>
                                    <strong>{item.scenario || EMPTY}</strong>
                                  </td>
                                  <td>{total}</td>
                                  <td>{done}</td>
                                  <td>
                                    <div className={styles.progress}>
                                      <span>
                                        <i style={{ width: `${progress}%` }} />
                                      </span>
                                      <small>{progress}%</small>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState icon="target" title="No scenario statistics">
                        Scenario event totals will appear here once data is
                        available.
                      </EmptyState>
                    )}
                  </div>
                  <div className={styles.tableSection}>
                    <div className={styles.tableTitle}>
                      <div>
                        <span>Activity log</span>
                        <h4>Event records</h4>
                      </div>
                      <small>{events.length} records</small>
                    </div>
                    {events.length ? (
                      <div className={styles.tableWrap}>
                        <table>
                          <thead>
                            <tr>
                              <th>Event</th>
                              <th>Team</th>
                              <th>Scenario</th>
                              <th>Status</th>
                              <th>Timer</th>
                              <th>Started</th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.map((event, index) => (
                              <tr key={`${event.eventname}-${index}`}>
                                <td>
                                  <strong>{event.eventname || EMPTY}</strong>
                                </td>
                                <td>{event.team_name || EMPTY}</td>
                                <td>{event.scenariotitle || EMPTY}</td>
                                <td>
                                  <Pill>{event.learner_status}</Pill>
                                </td>
                                <td>{event.timer || EMPTY}</td>
                                <td>{formatDate(event.startedon)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptyState icon="calendar" title="No event records">
                        The learner has not participated in any recorded events
                        yet.
                      </EmptyState>
                    )}
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </section>
        </Container>
      </main>
    </>
  );
};

NormalUsersView.layout = "Contentlayout";
export default NormalUsersView;
