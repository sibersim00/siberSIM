

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
    BASE_PATH: `http://sibersim.cloud/`,
    VNC_PROXY_URL: `ws://sibersim.cloud:4007`,
    API_URL_LOGIN :  `http://sibersim.cloud/authapi`,
    API_URL_LEARNER : 'http://sibersim.cloud/learnerapi',
    API_URL_FILEMANAGER:`http://sibersim.cloud/jobapi`,
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
      { source: '/invitescenarios', destination: '/components/invitescenarios' },
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
      { source: '/invitescenarios', destination: '/components/invitescenarios' },
      { source: "/custom_component_view/:slug*", destination: "/components/customcomponent/view/:slug*", },
      { source: '/event-dashboard', destination: '/components/events/dashboard' },
      { source: '/invite_scenarios/:slug*', destination: '/components/invitescenarios/view/:slug*' },

    ]
  },
})

module.exports = nextConfig
