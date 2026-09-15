import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import Seo from "../../../shared/layout-components/seo/seo";
import styles from "./thirdPartyIntegrations.module.scss";
import { getThirdPartyIntegrations } from "../../../shared/redux/slices/thirdPartyIntegrations/thirdPartyIntegrations";

const getHostName = (value) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch (_) {
    return value;
  }
};

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AP";

const Integrations = () => {
  const dispatch = useDispatch();
  const { items, isLoading } = useSelector((state) => ({
    items:
      state.thirdPartyIntegrations?.getThirdPartyIntegrationData?.data || [],
    isLoading: state.thirdPartyIntegrations?.isLoading || false,
  }));
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  const targetPanel = useMemo(() => {
    if (typeof window === "undefined") return "SIMMaster";
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.usertype === "Instructor" ? "SIMInstructor" : "SIMMaster";
  }, []);

  useEffect(() => {
    dispatch(getThirdPartyIntegrations(targetPanel));
  }, [dispatch, targetPanel]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        !term ||
        item.integration_name?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term),
    );
  }, [items, search]);
  return (
    <>
      <Seo title="Third Party Integration" />
      <main className={styles.pageShell}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <i className="fa fa-plug" /> Integrations
              </span>
              <h1>Third Party Integrations</h1>
              <p>Launch the applications made available by your administrator.</p>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Application library</h2>
              <p>{visibleItems.length} applications available</p>
            </div>
            <div className={styles.toolbar}>
              <label className={styles.searchBox}>
                <i className="fe fe-search" />
                <input
                  value={search}
                  aria-label="Search integrations"
                  placeholder="Search integrations"
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
            </div>
          </div>

          {isLoading && items.length === 0 ? (
            <div className={styles.cardGrid}>
              {[0, 1, 2].map((item) => (
                <div key={item} className={styles.skeletonCard} />
              ))}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <i className="fa fa-plug" />
              </div>
              <h3>No applications available</h3>
              <p>Your administrator has not assigned any applications yet.</p>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {visibleItems.map((item) => (
                <article
                  key={item.integration_id}
                  className={styles.integrationCard}
                >
                  <div className={styles.cardAccent} />
                  <div className={styles.cardTop}>
                    <div className={styles.appAvatar}>
                      {getInitials(item.integration_name)}
                    </div>
                    <span className={`${styles.statusPill} ${styles.activePill}`}>
                      <span /> Active
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <h3 title={item.integration_name}>{item.integration_name}</h3>
                    <a
                      href={item.integration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.hostLink}
                    >
                      <i className="fe fe-link" />
                      {getHostName(item.integration_url)}
                    </a>
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip id={`description-${item.integration_id}`}>
                          {item.description || "Launch this connected application."}
                        </Tooltip>
                      }
                    >
                      <p className={styles.cardDescription}>
                        {item.description || "Launch this connected application."}
                      </p>
                    </OverlayTrigger>
                  </div>
                  <button
                    type="button"
                    className={styles.launchButton}
                    onClick={() => setPreview(item)}
                  >
                    <span>Open application</span>
                    <i className="fe fe-external-link" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Modal
        show={Boolean(preview)}
        onHide={() => setPreview(null)}
        size="xl"
        centered
        contentClassName={styles.previewModal}
      >
        <Modal.Header closeButton className={styles.previewHeader}>
          <div className={styles.previewIdentity}>
            <div className={styles.previewAvatar}>
              {getInitials(preview?.integration_name)}
            </div>
            <div>
              <Modal.Title>{preview?.integration_name}</Modal.Title>
              <span>{preview && getHostName(preview.integration_url)}</span>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-0">
          {preview && (
            <iframe
              src={preview.integration_url}
              title={preview.integration_name}
              className={styles.previewFrame}
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          )}
        </Modal.Body>
        <Modal.Footer className={styles.previewFooter}>
          <span className="text-muted me-auto">
            If preview is blocked, open it in a new tab.
          </span>
          <Button
            as="a"
            href={preview?.integration_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in New Tab
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

Integrations.layout = "Contentlayout";
export default Integrations;
