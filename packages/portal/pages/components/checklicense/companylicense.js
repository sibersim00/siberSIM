import CompanySettingsCommon from "../../../shared/data/common/company_settings";

const CompanyLicense = () => {

  return (
    <div className="p-4">
    <CompanySettingsCommon isSL = {true}/>
    </div>
  );
};

CompanyLicense.layout = "Authenticationlayout";
export default CompanyLicense;
