import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Form,
  Modal,
  OverlayTrigger,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import Seo from "../../../shared/layout-components/seo/seo";
import styles from "./thirdPartyIntegrations.module.scss";
import {
  changeIntegrationStatus,
  clearError,
  deleteIntegration,
  getIntegrations,
  saveIntegration,
  updateIntegration,
} from "../../../shared/redux/slices/thirdPartyIntegrations/thirdPartyIntegrations";

const emptyForm = {
  integration_name: "",
  integration_url: "",
  description: "",
  order: 0,
};

const normalizeUrl = (value) => {
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

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

const ThirdPartyIntegrations = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector(
    (state) => state.thirdPartyIntegrations || { items: [], isLoading: false, error: null }
  );
  const [filter, setFilter] = useState("Active");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    dispatch(getIntegrations()).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (error?.message) {
      toast.error(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {error.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(clearError());
    }
  }, [dispatch, error]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = filter === "All" || item.status === filter;
      const matchesSearch =
        !term ||
        item.integration_name?.toLowerCase().includes(term) ||
        item.integration_url?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [filter, items, search]);

  const counts = useMemo(
    () => ({
      total: items.length,
      active: items.filter((item) => item.status === "Active").length,
      inactive: items.filter((item) => item.status === "Inactive").length,
    }),
    [items]
  );

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.integration_id);
    setForm({
      integration_name: item.integration_name || "",
      integration_url: item.integration_url || "",
      description: item.description || "",
      order: item.order ?? 0,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.integration_name.trim()) errors.integration_name = "Application name is required.";
    if (!form.integration_url.trim()) {
      errors.integration_url = "Application URL is required.";
    } else {
      try {
        const parsed = new URL(normalizeUrl(form.integration_url));
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch (_) {
        errors.integration_url = "Enter a valid HTTP or HTTPS URL.";
      }
    }
    if (form.description.length > 500) errors.description = "Description cannot exceed 500 characters.";
    if (!Number.isInteger(Number(form.order)) || Number(form.order) < 0) {
      errors.order = "Order must be a non-negative integer.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const refresh = () => dispatch(getIntegrations()).catch(() => {});

  const submitForm = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    const payload = {
      integration_name: form.integration_name.trim(),
      integration_url: normalizeUrl(form.integration_url),
      description: form.description.trim(),
      order: Number(form.order),
    };
    try {
      const result = editingId
        ? await dispatch(updateIntegration({ integration_id: editingId, ...payload }))
        : await dispatch(saveIntegration(payload));
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {result.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      closeForm();
      refresh();
    } catch (_) {}
  };

  const toggleStatus = async (item) => {
    const nextStatus = item.status === "Active" ? "Inactive" : "Active";
    const confirmation = await Swal.fire({
      title: `${nextStatus} integration?`,
      text: `${item.integration_name} will be marked ${nextStatus.toLowerCase()}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "var(--primary-bg-color)",
      confirmButtonText: "Yes, continue",
    });
    if (!confirmation.isConfirmed) return;
    try {
      const result = await dispatch(
        changeIntegrationStatus({ integration_id: item.integration_id, status: nextStatus })
      );
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {result.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      refresh();
    } catch (_) {}
  };

  const removeIntegration = async (item) => {
    const confirmation = await Swal.fire({
      title: "Delete integration?",
      text: `${item.integration_name} will be removed from your integrations.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it",
    });
    if (!confirmation.isConfirmed) return;
    try {
      const result = await dispatch(deleteIntegration({ integration_id: item.integration_id }));
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {result.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      refresh();
    } catch (_) {}
  };

  return (
    <>
      <Seo title="Third Party Integration" />
      <ToastContainer />
      <main className={styles.pageShell}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <i className="fa fa-plug" /> Integrations
              </span>
              <h1>Third Party Integrations</h1>
              <p>Manage and launch your external applications from one place.</p>
            </div>
            <button type="button" className={styles.addButton} onClick={openAdd}>
              <span className={styles.addIcon}><i className="fe fe-plus" /></span>
              Add integration
            </button>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}><i className="fe fe-grid" /></span>
              <div><strong>{counts.total}</strong><span>Total apps</span></div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statIcon} ${styles.statIconActive}`}><i className="fe fe-check" /></span>
              <div><strong>{counts.active}</strong><span>Active</span></div>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statIcon} ${styles.statIconInactive}`}><i className="fe fe-pause" /></span>
              <div><strong>{counts.inactive}</strong><span>Inactive</span></div>
            </div>
          </div>
        </section>

        <section className={styles.workspace}>
          <div className={styles.sectionHeading}>
            <div>
              <h2>Application library</h2>
              <p>{visibleItems.length} {visibleItems.length === 1 ? "application" : "applications"} shown</p>
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
                {search && (
                  <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>
                    <i className="fe fe-x" />
                  </button>
                )}
              </label>
              <div className={styles.filterTabs} aria-label="Filter integrations">
                {["All", "Active", "Inactive"].map((status) => (
                  <button
                    type="button"
                    key={status}
                    className={filter === status ? styles.filterActive : ""}
                    onClick={() => setFilter(status)}
                  >
                    {status}
                    <span>{status === "All" ? counts.total : status === "Active" ? counts.active : counts.inactive}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading && items.length === 0 ? (
            <div className={styles.cardGrid} aria-label="Loading integrations">
              {[0, 1, 2].map((item) => <div key={item} className={styles.skeletonCard} />)}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><i className={search ? "fe fe-search" : "fa fa-plug"} /></div>
              <h3>{search ? "No matching integrations" : "Build your application library"}</h3>
              <p>{search ? "Try another search or change the status filter." : "Add your first external application and access it from one place."}</p>
              {!search && <button type="button" onClick={openAdd}><i className="fe fe-plus" /> Add your first integration</button>}
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {visibleItems.map((item) => {
                const isActive = item.status === "Active";
                return (
                  <article
                    key={item.integration_id}
                    className={`${styles.integrationCard} ${!isActive ? styles.inactiveCard : ""}`}
                  >
                    <div className={styles.cardAccent} />
                    <div className={styles.cardTop}>
                      <div className={styles.appAvatar}>{getInitials(item.integration_name)}</div>
                      <span className={`${styles.statusPill} ${isActive ? styles.activePill : styles.inactivePill}`}>
                        <span /> {item.status}
                      </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3 title={item.integration_name}>{item.integration_name}</h3>
                      <a href={item.integration_url} target="_blank" rel="noopener noreferrer" className={styles.hostLink}>
                        <i className="fe fe-link" /> {getHostName(item.integration_url)}
                      </a>
                      {(() => {
                        const descriptionText =
                          item.description || "Launch this connected application directly from your workspace.";
                        const isTruncated = descriptionText.length > 90;
                        const descriptionNode = <p className={styles.cardDescription}>{descriptionText}</p>;

                        return isTruncated ? (
                          <OverlayTrigger
                            placement="top"
                            delay={{ show: 250, hide: 100 }}
                            overlay={<Tooltip id={`desc-tooltip-${item.integration_id}`}>{descriptionText}</Tooltip>}
                          >
                            {descriptionNode}
                          </OverlayTrigger>
                        ) : (
                          descriptionNode
                        );
                      })()}
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.orderBadge}><i className="fe fe-list" /> Order {item.order}</span>
                      <div className={styles.cardActions}>
                        <button type="button" onClick={() => openEdit(item)} title="Edit integration" aria-label={`Edit ${item.integration_name}`}>
                          <i className="fe fe-edit-2" />
                        </button>
                        <button type="button" onClick={() => toggleStatus(item)} title={isActive ? "Deactivate integration" : "Activate integration"} aria-label={`${isActive ? "Deactivate" : "Activate"} ${item.integration_name}`}>
                          <i className={isActive ? "fe fe-pause" : "fe fe-play"} />
                        </button>
                        <button type="button" className={styles.deleteAction} onClick={() => removeIntegration(item)} title="Delete integration" aria-label={`Delete ${item.integration_name}`}>
                          <i className="fe fe-trash-2" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.launchButton}
                      disabled={!isActive}
                      onClick={() => isActive && setPreview(item)}
                    >
                      <span>{isActive ? "Launch application" : "Application inactive"}</span>
                      <i className={isActive ? "fe fe-external-link" : "fe fe-lock"} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Modal show={showForm} onHide={closeForm} centered backdrop="static" contentClassName={styles.modalContent}>
        <Form onSubmit={submitForm} noValidate>
          <Modal.Header closeButton className={styles.modalHeader}>
            <div className={styles.modalTitleIcon}><i className="fa fa-plug" /></div>
            <div>
              <Modal.Title>{editingId ? "Update integration" : "Add integration"}</Modal.Title>
              <span>{editingId ? "Keep your application details up to date." : "Connect a new application to your workspace."}</span>
            </div>
          </Modal.Header>
          <Modal.Body className={styles.modalBody}>
            <Form.Group className="mb-3">
              <Form.Label>Application Name <span className="text-danger">*</span></Form.Label>
              <Form.Control
                maxLength={150}
                value={form.integration_name}
                isInvalid={Boolean(formErrors.integration_name)}
                onChange={(event) => setForm({ ...form, integration_name: event.target.value })}
              />
              <Form.Control.Feedback type="invalid">{formErrors.integration_name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Application URL <span className="text-danger">*</span></Form.Label>
              <Form.Control
                placeholder="https://application.example.com"
                value={form.integration_url}
                isInvalid={Boolean(formErrors.integration_url)}
                onChange={(event) => setForm({ ...form, integration_url: event.target.value })}
              />
              <Form.Control.Feedback type="invalid">{formErrors.integration_url}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                maxLength={500}
                value={form.description}
                isInvalid={Boolean(formErrors.description)}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
              <div className="d-flex justify-content-between">
                <Form.Control.Feedback type="invalid">{formErrors.description}</Form.Control.Feedback>
                <Form.Text className="ms-auto">{form.description.length}/500</Form.Text>
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label>Display Order</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={form.order}
                isInvalid={Boolean(formErrors.order)}
                onChange={(event) => setForm({ ...form, order: event.target.value })}
              />
              <Form.Control.Feedback type="invalid">{formErrors.order}</Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className={styles.modalFooter}>
            <Button variant="light" onClick={closeForm} disabled={isLoading}>Cancel</Button>
            <Button type="submit" className={styles.modalSaveButton} disabled={isLoading}>
              {isLoading && <Spinner animation="border" size="sm" className="me-1" />}
              {editingId ? "Update" : "Save"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={Boolean(preview)} onHide={() => setPreview(null)} size="xl" centered contentClassName={styles.previewModal}>
        <Modal.Header closeButton className={styles.previewHeader}>
          <div className={styles.previewIdentity}>
            <div className={styles.previewAvatar}>{getInitials(preview?.integration_name)}</div>
            <div><Modal.Title>{preview?.integration_name}</Modal.Title><span>{preview && getHostName(preview.integration_url)}</span></div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-0">
          {preview && (
            <iframe
              src={preview.integration_url}
              title={preview.integration_name}
              style={{ width: "100%", height: "70vh", border: 0 }}
              sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          )}
        </Modal.Body>
        <Modal.Footer className={styles.previewFooter}>
          <span className="text-muted me-auto">If the application blocks previews, open it in a new tab.</span>
          <Button as="a" href={preview?.integration_url} target="_blank" rel="noopener noreferrer">
            Open in New Tab
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

ThirdPartyIntegrations.layout = "Contentlayout";
export default ThirdPartyIntegrations;
