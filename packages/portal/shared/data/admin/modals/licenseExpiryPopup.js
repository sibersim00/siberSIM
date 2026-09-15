import React, { useState, useEffect } from "react";
import { Modal, Button, Card } from "react-bootstrap";

const LicenseExpiryPopup = ({ show, onClose, licenseInfo }) => {
  const [localLicenseInfo, setLocalLicenseInfo] = useState({
    daysLeft: null,
    expiryDate: "",
    companyName: ""
  });

  // Use passed props or fall back to localStorage check
  useEffect(() => {
    if (licenseInfo) {
      setLocalLicenseInfo(licenseInfo);
    } else {
      // Fallback to localStorage check (for backward compatibility)
      const storedSettings = localStorage.getItem("company_settings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          let licenseData;
          
          if (parsedSettings?.data?.licenseStatus) {
            licenseData = parsedSettings.data;
          } else if (parsedSettings?.licenseStatus) {
            licenseData = parsedSettings;
          } else if (parsedSettings?.statusCode === 200 && parsedSettings?.data) {
            licenseData = parsedSettings.data;
          }

          if (licenseData && licenseData.licenseStatus?.expiry_date) {
            // Parse the date string properly
            const expiryDate = new Date(licenseData.licenseStatus.expiry_date);
            
            // Calculate days left with proper timezone handling
            const currentDate = new Date();
            
            // Use UTC dates to avoid timezone issues
            const expiryUTC = Date.UTC(
              expiryDate.getUTCFullYear(),
              expiryDate.getUTCMonth(),
              expiryDate.getUTCDate()
            );
            
            const currentUTC = Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate()
            );
            
            const timeDiff = expiryUTC - currentUTC;
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            // Format date to show only date part (not time)
            // Use UTC methods to avoid timezone conversion
            const formatDateDDMMYYYY = (dateObj) => {
              const day = String(dateObj.getUTCDate()).padStart(2, "0");
              const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
              const year = dateObj.getUTCFullYear();
              return `${day}-${month}-${year}`;
            };

            setLocalLicenseInfo({
              daysLeft,
              expiryDate: formatDateDDMMYYYY(expiryDate),
              companyName: licenseData.name || "SiberSIM"
            });
          }
        } catch (err) {
          console.error("Error parsing company settings:", err);
        }
      }
    }
  }, [licenseInfo]);

  const handleClose = () => {
    // Call parent onClose (which will set the flag to false)
    if (onClose) onClose();
  };

  const handleUpgrade = () => {
    handleClose();
    window.open("/activate-account?mode=upgrade", "_blank");
  };

  // Don't show if days left is not between 1 and 30
  if (!show || localLicenseInfo.daysLeft === null || localLicenseInfo.daysLeft > 30) {
    return null;
  }
  return (
    <Modal
      show={show}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
      centered
      size="lg"
    >
      <Modal.Header closeButton className="border-bottom-0">
        <Modal.Title className="text-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          License Expiry Warning
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4">
        <Card className="border-warning">
          <Card.Body className="text-center py-4">
            <div className="mb-3">
              <i className="fas fa-calendar-times fa-4x text-warning mb-3"></i>
              <h4 className="text-danger mb-3">
                License expires in {localLicenseInfo.daysLeft} {localLicenseInfo.daysLeft === 1 ? "day" : "days"}
              </h4>
              <p className="mb-2">
                {/* <strong>{localLicenseInfo.companyName}</strong> */}
              </p>
              <p className="text-muted mb-2">Expiry Date: {localLicenseInfo.expiryDate}</p>
              <p className="mb-4">
                Please renew your license to continue using all features without
                interruption.
              </p>
            </div>

            {/* Progress bar showing days left */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-1">
                <small>Days left: {localLicenseInfo.daysLeft}</small>
                <small>Threshold: 30 days</small>
              </div>
              <div className="progress" style={{ height: "10px" }}>
                <div
                  className={`progress-bar ${
                    localLicenseInfo.daysLeft <= 5
                      ? "bg-danger"
                      : localLicenseInfo.daysLeft <= 15
                      ? "bg-warning"
                      : "bg-info"
                  }`}
                  role="progressbar"
                  style={{
                    width: `${Math.min(100, (localLicenseInfo.daysLeft * 100) / 30)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Countdown message based on days left */}
            <div className="alert alert-light border" role="alert">
              {localLicenseInfo.daysLeft <= 5 ? (
                <strong className="text-danger">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  Urgent! Renew your license immediately to avoid service
                  disruption.
                </strong>
              ) : localLicenseInfo.daysLeft <= 15 ? (
                <strong className="text-warning">
                  <i className="fas fa-clock me-2"></i>
                  Your license will expire soon. Please renew at your earliest
                  convenience.
                </strong>
              ) : (
                <strong className="text-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Your license will expire in the near future. Plan ahead for
                  renewal.
                </strong>
              )}
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer className="border-top-0">
        <Button variant="outline-secondary" onClick={handleClose}>
          Okay
        </Button>
        {localLicenseInfo.daysLeft <= 5 && (
  <Button variant="success" onClick={handleUpgrade}>
    <i className="fas fa-sync-alt me-2"></i>
    Renew License Now
  </Button>
  )}
  </Modal.Footer>
    </Modal>
  );
};

export default LicenseExpiryPopup;