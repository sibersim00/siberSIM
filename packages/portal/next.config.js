/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";
const withTM = require("next-transpile-modules")([
  "@fullcalendar/common",
  "@babel/preset-react",
  "@fullcalendar/common",
  "@fullcalendar/daygrid",
  "@fullcalendar/interaction",
  "@fullcalendar/react",
  "@fullcalendar/timegrid",
]);
const nextConfig = withTM({
  // reactStrictMode: true,
  reactStrictMode: false,
  trailingSlash: true,
  swcMinify: true,
  basePath: "/app",
  assetPrefix : "/app/",
  images: {
    loader: "akamai",
    path: "",
  },
  env: {
    CRYPTO_SECURITY_KEY: "techno5202jarus",
    BASE_PATH: `/app/`,
    VNC_PROXY_URL: `ws://sibersim.battlerangers.com:4007`,
    API_URL_LOGIN : `http://sibersim.battlerangers.com/authapi`,
    API_URL_MASTERS : `http://sibersim.battlerangers.com/masterapi`,
    API_URL_FILEMANAGER:`http://sibersim.battlerangers.com/jobapi`,
    LEARNER_BASE_PATH: "http://sibersim.battlerangers.com",
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.module.rules.push({
      test: /\.(pdf||docx||doc)$/,
      use: [
        {
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            outputPath: "static/media/",
            publicPath: `/_next/static/media/`,
          },
        },
      ],
    });

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "Permissions-Policy",
            value:
              "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/admin-login", destination: "/admin-login" },
      { source: "/instructor-login", destination: "/" },
      { source: "/dashboard", destination: "/components/dashboard" },
      { source: "/components", destination: "/components/components" },
      { source: "/scenarios", destination: "/components/scenarios" },
      { source: "/user-sessions", destination: "/components/usersessions" },
      {
        source: "/usersession_view/:slug*",
        destination: "/components/usersessions/view/:slug*",
      },
      { source: "/scenarios_edit/:slug*",
        destination: "/components/usersessions/edit/:slug*",},
      { source: "/students", destination: "/components/learners" },
      { source: "/batches", destination: "/components/batches" },
      { source: "/instructors", destination: "/components/instructors" },
      { source: "/masters", destination: "/components/masters" },
      {
        source: "/component_categories",
        destination: "/components/masters/masters/componentcategories",
      },
      {
        source: "/component_sub_categories",
        destination: "/components/masters/masters/componentsubcategory",
      },
      {
        source: "/scenario_categories",
        destination: "/components/masters/masters/scenariocategories",
      },
      {
        source: "/widgets",
        destination: "/components/masters/masters/widgets",
      },
      {
        source: "/scenariotabs",
        destination: "/components/masters/masters/scenariotabs",
      },
      { source: "/admin", destination: "/components/admin" },
      { source: "/menus", destination: "/components/admin/menus" },
      { source: "/roles", destination: "/components/admin/roles" },
      { source: "/users", destination: "/components/admin/users" },
      {
        source: "/userrolepermission",
        destination: "/components/admin/userrolepermission",
      },
      { source: "/mail_configuration", destination: "/components/mailconfigs" },
      {
        source: "/system_configuration",
        destination: "/components/systemconfigs",
      },
      {
        source: "//company_setting",
        destination: "/components/companysetting",
      },
      { source: "/profile", destination: "/components/profile" },
      {
        source: "/component_view/:slug*",
        destination: "/components/components/view/:slug*",
      },
      {
        source: "/scenarios_view/:slug*",
        destination: "/components/scenarios/view/:slug*",
      },
      {
        source: "/scenarios_view_start/:slug*",
        destination: "/components/scenarios/startview/:slug*",
      },
      {
        source: "/scenarios/flowchart",
        destination: "/components/scenarios/flowchart",
      },
      { source: "/users-management", destination: "/components/users" },
      { source: "/adminusers", destination: "/components/users/adminusers" },
      { source: "/instructors", destination: "/components/users/instructors" },
      { source: "/webhookuser", destination: "/components/users/webhookuser" },
      { source: "/normalusers", destination: "/components/users/normalusers" },
      {
        source: "/batches_view/:slug*",
        destination: "/components/batches/view/:slug*",
      },
      {
        source: "/component_view/:slug*",
        destination: "/components/components/view/:slug*",
      },
      {
        source: "/instructor-verification/:slug*",
        destination: "/account-verification/instructor/:slug*",
      },
      {
        source: "/users-verification/:slug*",
        destination: "/account-verification/normalusers/:slug*",
      },
      {
        source: "/scenarios/create_scenario",
        destination: "/components/scenarios/createscenario",
      },
      { source: "/network", destination: "/components/network" },
      { source: "/events", destination: "/components/events" },
      { source: "/event-dashboard", destination: "/components/events/eventdashboard" },
      { source: "/manage-events", destination: "/components/events/manageevents" },
      {
        source: "/scenario_quiz/:slug*",
        destination: "/components/scenarios/quiz/:slug*",
      },
      { source: "/proxmoxlogs", destination: "/components/proxmoxlogs" },
      { source: "/app_config", destination: "/components/companysetting" },
      { source: "/faqs", destination: "/components/faqs" },
      {
        source: "/normalusers_view/:slug*",
        destination: "/components/users/view/:slug*",
      },
      {
        source: "/instructors_view/:slug*",
        destination: "/components/instructors/view/:slug*",
      },
      {
        source: "/scenariotermination",
        destination: "/components/scenariotermination",
      },
      {
        source: "/notifications",
        destination: "/components/notifications/notificationList",
      },
      { source: "/userreport", destination: "/components/userreport" },
      {
        source: "/userprofile",
        destination: "/components/userreport/report/userprofile",
      },
      {
        source: "/userperformance",
        destination: "/components/userreport/report/userperformance",
      },
      {
        source: "/instructorreport",
        destination: "/components/instructorreport",
      },
      {
        source: "/instructorprofile",
        destination: "/components/instructorreport/report/instructorprofile",
      },
      {
        source: "/instructorperformance",
        destination:
          "/components/instructorreport/report/instructorperformance",
      },
      { source: "/loginlogs", destination: "/components/loginlogs" },
      {
        source: "/adminuserlogs",
        destination: "/components/loginlogs/report/adminuserlogs",
      },
      {
        source: "/instructorlogs",
        destination: "/components/loginlogs/report/instructorlogs",
      },
      {
        source: "/normaluserlogs",
        destination: "/components/loginlogs/report/normaluserlogs",
      },
      {
        source: "/vnc_view/:slug*",
        destination: "/components/usersessions/view/vnc/:slug*",
      },
      {
        source: "/customers",
        destination: "/components/customers",
      },
      {
        source: "/company-configuration",
        destination: "/components/activateaccount/companyconfiguration",
      },
      {
        source: "/activate-account",
        destination: "/components/activateaccount",
      },
      {
        source: "/upgrade-account",
        destination: "/components/activateaccount",
      },
      {
        source: "/customer-dashboard",
        destination: "/components/customers/customerDashboard",
      },
      {
        source: "/scenario-import",
        destination: "/components/scenarios/scenarioimport",
      },
      {
        source: "/labs",
        destination: "/components/labs",
      },
      {
        source: "/license-dashboard",
        destination: "/components/licensedashboard",
      },
      {
        source: "/scenarioexport",
        destination: "/components/scenarioexport",
      },
      {
        source: "/custom-request",
        destination: "/components/customrequest",
      },
      { source: "/customcomponent", destination: "/components/customrequest/customcomponent" },
      { source: "/customscenarios", destination: "/components/customrequest/customscenarios" },
      {
        source: "/custom_scenarios_view/:slug*",
        destination: "/components/customrequest/customscenarios/view/:slug*",
      },
      {
        source: "/custom_component_view/:slug*",
        destination: "/components/customrequest/customcomponent/view/:slug*",
      },
      {
        source: "/running_components",
        destination: "/components/running_components",
      },
    ];
  },
});

module.exports = nextConfig;
