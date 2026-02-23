

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const withTM = require("next-transpile-modules")([
  "@fullcalendar/common",
  "@babel/preset-react",
  "@fullcalendar/common",
  "@fullcalendar/daygrid",
  "@fullcalendar/interaction",
  "@fullcalendar/react",
  "@fullcalendar/timegrid"
]);
const nextConfig = withTM({
  reactStrictMode: false,
  trailingSlash: true,
  swcMinify: true,
  basePath: "",
  assetPrefix: "",
  images: {
    loader: "default",
    path: "../../../assets"
  },


  env: {
    CRYPTO_SECURITY_KEY: 'techno5202jarus',
    BASE_PATH: `http://sibersim.battlerangers.com/`,
    VNC_PROXY_URL: `ws://sibersim.battlerangers.com:4007`,
    API_URL_LOGIN :  `http://sibersim.battlerangers.com/authapi`,
    API_URL_LEARNER : 'http://sibersim.battlerangers.com/learnerapi',
    API_URL_FILEMANAGER:`http://sibersim.battlerangers.com/jobapi`,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors \'self\'',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'no-referrer',
          },
          {
            key: 'Permissions-Policy',
            value: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
          }
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/dashboard', destination: '/components/dashboard/dashboard' },
      { source: '/profile', destination: '/components/profile' },
      { source: '/scenarios', destination: '/components/scenarios' },
      { source: '/customscenarios', destination: '/components/customscenarios' },
      { source: '/pausescenarios', destination: '/components/pausescenarios' },
      { source: '/scenarios_view/:slug*', destination: '/components/scenarios/view/:slug*' },
      { source: "/scenarios_edit/:slug*",destination: "/components/scenarios/edit/:slug*",},
      { source: "/custom_scenarios_view/:slug*", destination: "/components/customscenarios/view/:slug*", },
      { source: '/users-verification/:slug*', destination: '/components/normalusers/:slug*' },
      { source: '/scenario_quiz/:slug*', destination: '/components/scenarios/quiz/:slug*' },
      { source: '/faqs', destination: '/components/faqs' },
      { source: '/event-login', destination: '/components/event_learner' },
      { source: '/vnc_view/:slug*', destination: '/components/scenarios/view/vnc/:slug*' },
      { source: '/vnc_event_view/:slug*', destination: '/components/events/view/vnc_event_view/:slug*' },
      { source: '/customcomponent', destination: '/components/customcomponent' },
      { source: "/custom_component_view/:slug*", destination: "/components/customcomponent/view/:slug*", },
      { source: '/event-dashboard', destination: '/components/events/dashboard' },

    ]
  },
})

module.exports = nextConfig
