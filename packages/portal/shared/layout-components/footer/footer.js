import React, { useEffect, useState } from "react";

const Footer = () => {
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem("company_settings");
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          setCompanySettings(parsedSettings); // Set to state
        } catch (err) {
          console.error("Error parsing company_settings from localStorage", err);
        }
      }
    }
  }, []);

  const systemFooter = companySettings?.system_footer;
  const website = companySettings?.website || "https://technobase.in";
  const companyName = companySettings?.name || "Technobase";

  return (
    <div className="main-footer text-center">
      <div className="container">
        <div className="row row-sm">
          <div className="col-md-12">
            <span>
              {systemFooter ? (
                <span dangerouslySetInnerHTML={{ __html: systemFooter }} />
              ) : (
                <>
                  Copyright © {new Date().getFullYear()}{" "}
                  <a href={website} target="_blank" rel="noreferrer">
                    {companyName}
                  </a>. All rights reserved.
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
