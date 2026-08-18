import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { Container, Nav, Tab } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import Seo from "../../../../shared/layout-components/seo/seo";
import { getInstructor } from "../../../../shared/redux/slices/instructor/instructor";
import styles from "./instructor-view.module.scss";

const EMPTY = "—";
const PAGE_SIZE = 6;

const formatDate = (value) => {
  if (!value) return EMPTY;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EMPTY;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const initialsFor = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "SM";

const isActiveStatus = (status) =>
  status === true ||
  String(status).toLowerCase() === "true" ||
  String(status).toLowerCase() === "active";

const StatusPill = ({ status }) => {
  const active = isActiveStatus(status);
  return (
    <span className={`${styles.statusPill} ${active ? styles.active : styles.inactive}`}>
      <i />{active ? "Active" : status || "Inactive"}
    </span>
  );
};

const EmptyState = ({ icon, title, children }) => (
  <div className={styles.emptyState}>
    <span><i className={`fe fe-${icon}`} /></span>
    <h4>{title}</h4>
    <p>{children}</p>
  </div>
);

const SectionHeading = ({ eyebrow, title, children, action }) => (
  <div className={styles.sectionHeading}>
    <div><span>{eyebrow}</span><h3>{title}</h3><p>{children}</p></div>
    {action}
  </div>
);

const MetricCard = ({ icon, label, value, helper, tone, delay }) => (
  <article className={`${styles.metricCard} ${styles[tone]}`} style={{ "--delay": `${delay}ms` }}>
    <div className={styles.metricIcon}><i className={`fe fe-${icon}`} /></div>
    <div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>
    <i className={`fe fe-arrow-up-right ${styles.metricArrow}`} />
  </article>
);

const DetailItem = ({ icon, label, value, wide, status }) => (
  <div className={`${styles.detailItem} ${wide ? styles.wide : ""}`}>
    <span className={styles.detailIcon}><i className={`fe fe-${icon}`} /></span>
    <div><small>{label}</small>{status ? <StatusPill status={value} /> : <strong>{value || EMPTY}</strong>}</div>
  </div>
);

const InstructorView = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("details");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const response = useSelector((state) => state?.InstructorData?.getInstructorData?.data);

  useEffect(() => {
    if (response) setData(response);
  }, [response]);

  useEffect(() => {
    if (router.query.slug?.[0]) dispatch(getInstructor(router.query.slug[0]));
  }, [dispatch, router.query.slug]);

  const students = data.instructor_student_map || [];
  const scenarios = data.scenarios || [];
  const activeStudents = students.filter((student) => isActiveStatus(student.status)).length;
  const activeScenarios = scenarios.filter(
    (scenario) => isActiveStatus(scenario.status) || isActiveStatus(scenario.scenariostatus)
  ).length;
  const displayName = data.Instructor_name?.trim() || "SIMManager profile";
  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();
    if (!search) return students;
    return students.filter((student) =>
      [student.learner_name, student.email, student.mobile, student.learner_id]
        .some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [studentSearch, students]);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const visibleStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const details = [
    ["user", "SIMManager name", displayName],
    ["at-sign", "Login ID", data.loginid],
    ["mail", "Email address", data.email],
    ["phone", "Mobile number", data.mobile],
    ["briefcase", "Organization", data.organization],
    ["activity", "Account status", data.status, false, true],
    ["map-pin", "Address", data.address, true],
    ["calendar", "Created on", formatDate(data.createdon)],
    ["refresh-cw", "Last updated", formatDate(data.modifiedon)],
  ];

  const tabs = [
    ["details", "user", "Overview", null],
    ["students", "users", "Learners", students.length],
    ["scenarios", "layers", "Scenarios", scenarios.length],
  ];

  return (
    <>
      <Seo title={`${displayName} | SIMManager`} />
      <ToastContainer />
      <main className={styles.page}>
        <Container fluid="xl" className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroPattern} />
            <button type="button" className={styles.backButton} onClick={() => router.push("/instructors")}>
              <i className="fe fe-arrow-left" /><span>Back to SIMManagers</span>
            </button>
            <div className={styles.heroContent}>
              <div className={styles.avatar}>
                {data.profile ? (
                  <img src={`${process.env.API_URL_FILEMANAGER}${data.profile}`} alt={`${displayName} profile`} />
                ) : (
                  <span>{initialsFor(displayName)}</span>
                )}
                <i />
              </div>
              <div className={styles.identity}>
                <span className={styles.eyebrow}>SIMManager profile</span>
                <h1>{displayName}</h1>
                <div className={styles.contactRow}>
                  <span><i className="fe fe-mail" />{data.email || EMPTY}</span>
                  <span><i className="fe fe-phone" />{data.mobile || EMPTY}</span>
                  {data.organization && <span><i className="fe fe-briefcase" />{data.organization}</span>}
                </div>
              </div>
              <div className={styles.heroStatus}>
                <StatusPill status={data.status} />
                <small>Account status</small>
              </div>
            </div>
            <span className={styles.watermark}>SIM</span>
          </section>

          <section className={styles.metrics} aria-label="SIMManager summary">
            <MetricCard icon="users" label="Mapped learners" value={data.mapped_student_count ?? students.length} helper="Total assigned learners" tone="green" delay={80} />
            <MetricCard icon="user-check" label="Active learners" value={activeStudents} helper={`${Math.max(students.length - activeStudents, 0)} currently inactive`} tone="cyan" delay={140} />
            <MetricCard icon="layers" label="Created scenarios" value={data.totalscenariocount ?? scenarios.length} helper="Total authored scenarios" tone="violet" delay={200} />
            <MetricCard icon="check-circle" label="Active scenarios" value={activeScenarios} helper={`${Math.max(scenarios.length - activeScenarios, 0)} not active`} tone="amber" delay={260} />
          </section>

          <section className={styles.workspace}>
            <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
              <Nav className={styles.tabNav}>
                {tabs.map(([key, icon, label, count]) => (
                  <Nav.Item key={key}>
                    <Nav.Link eventKey={key} className={styles.tabLink}>
                      <i className={`fe fe-${icon}`} /><span>{label}</span>
                      {count !== null && <small>{count}</small>}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>

              <Tab.Content className={styles.tabContent}>
                <Tab.Pane eventKey="details">
                  <SectionHeading eyebrow="Account information" title="SIMManager overview">
                    Contact, organization and account information in one place.
                  </SectionHeading>
                  <div className={styles.detailGrid}>
                    {details.map(([icon, label, value, wide, status]) => (
                      <DetailItem key={label} icon={icon} label={label} value={value} wide={wide} status={status} />
                    ))}
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="students">
                  <SectionHeading
                    eyebrow="Assigned users"
                    title="Mapped learners"
                    action={
                      <label className={styles.searchBox}>
                        <i className="fe fe-search" />
                        <input
                          value={studentSearch}
                          onChange={(event) => setStudentSearch(event.target.value)}
                          placeholder="Search learners..."
                        />
                        {studentSearch && <button type="button" onClick={() => setStudentSearch("")} aria-label="Clear search"><i className="fe fe-x" /></button>}
                      </label>
                    }
                  >
                    Browse learners assigned to this SIMManager and review their status.
                  </SectionHeading>
                  {visibleStudents.length ? (
                    <>
                      <div className={styles.studentGrid}>
                        {visibleStudents.map((student, index) => {
                          const active = isActiveStatus(student.status);
                          return (
                            <article className={styles.studentCard} key={student.learner_id || index} style={{ "--delay": `${index * 55}ms` }}>
                              <div className={styles.studentTop}>
                                <div className={styles.studentAvatar}>{initialsFor(student.learner_name)}</div>
                                <StatusPill status={student.status} />
                              </div>
                              <h4>{student.learner_name || "Unnamed learner"}</h4>
                              <span className={styles.studentEmail}><i className="fe fe-mail" />{student.email || EMPTY}</span>
                              <div className={styles.studentFacts}>
                                <div><small>Mobile</small><strong>{student.mobile || EMPTY}</strong></div>
                                <div><small>Learner ID</small><strong>#{student.learner_id || EMPTY}</strong></div>
                              </div>
                              <div className={`${styles.statusLine} ${active ? styles.activeLine : styles.inactiveLine}`} />
                            </article>
                          );
                        })}
                      </div>
                      <div className={styles.paginationBar}>
                        <span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of {filteredStudents.length}</span>
                        <div>
                          <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}><i className="fe fe-chevron-left" /></button>
                          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                            <button type="button" key={page} className={page === currentPage ? styles.currentPage : ""} onClick={() => setCurrentPage(page)}>{page}</button>
                          ))}
                          <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}><i className="fe fe-chevron-right" /></button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <EmptyState icon={studentSearch ? "search" : "users"} title={studentSearch ? "No learners found" : "No mapped learners"}>
                      {studentSearch ? "Try a different name, email, mobile number or learner ID." : "Learners assigned to this SIMManager will appear here."}
                    </EmptyState>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="scenarios">
                  <SectionHeading eyebrow="Authored content" title="Created scenarios">
                    Scenarios created by this SIMManager, with their publication status and date.
                  </SectionHeading>
                  {scenarios.length ? (
                    <div className={styles.scenarioGrid}>
                      {scenarios.map((scenario, index) => (
                        <article className={styles.scenarioCard} key={scenario.scenarioid || index} style={{ "--delay": `${Math.min(index * 60, 360)}ms` }}>
                          <div className={styles.scenarioTop}>
                            <span className={styles.scenarioIcon}><i className="fe fe-layers" /></span>
                            <StatusPill status={scenario.status || scenario.scenariostatus} />
                          </div>
                          <span className={styles.scenarioNumber}>SCENARIO {String(index + 1).padStart(2, "0")}</span>
                          <h4>{scenario.scenariotitle || "Untitled scenario"}</h4>
                          <div className={styles.scenarioFooter}>
                            <span><i className="fe fe-calendar" />Created {formatDate(scenario.createdon)}</span>
                            <span><i className="fe fe-hash" />{scenario.scenarioid || EMPTY}</span>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon="layers" title="No scenarios created">
                      Scenarios authored by this SIMManager will appear here.
                    </EmptyState>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </section>
        </Container>
      </main>
    </>
  );
};

InstructorView.layout = "Contentlayout";
export default InstructorView;
