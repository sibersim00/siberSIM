import { useState, useEffect } from "react";
import CompanySettingsCommon from "../../../shared/data/common/company_settings";
import { useRouter } from "next/router";
const CompanyConfiguration = () => {
    const [isSessionCheck, setSessionCheck] = useState(false);
    const router = useRouter();
    useEffect(() => {
      // Apply dark theme when this page loads
      document.body.classList.add("dark-theme");

    }, []);
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        const usertype = user?.usertype;
        if(usertype!='Admin'){
          router.replace("/", "", { shallow: true });
        }else{
          setSessionCheck(true)
        }
      }, []);

  return (
    <div className="p-4">
    {isSessionCheck && <><CompanySettingsCommon className="dark-theme" isSL = {true}/></>}
    </div>
  );
};

CompanyConfiguration.layout = "Authenticationlayout";
export default CompanyConfiguration;
