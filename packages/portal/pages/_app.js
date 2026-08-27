import React, { useEffect } from 'react'
import '../styles/globals.scss'
import Head from 'next/head';
import Contentlayout from '../shared/layout-components/layout/content-layout'
import Authenticationlayout from '../shared/layout-components/layout/authentication-layout'
import {wrapper} from "../shared/redux/store";
import Script from 'next/script'
import {
  applyStoredScenarioShadowConfig,
  SCENARIO_SHADOW_EVENT,
} from '../shared/utils/scenarioShadowConfig';

const layouts = {
  Contentlayout: Contentlayout,
  Authenticationlayout: Authenticationlayout,
};
function MyApp({ Component, pageProps }) {
  const Layout = layouts[Component.layout] || ((pageProps) => <Component>{pageProps}</Component>);
  useEffect(() => {
    const applyStored = () => applyStoredScenarioShadowConfig();
    applyStored();
    window.addEventListener("storage", applyStored);
    window.addEventListener(SCENARIO_SHADOW_EVENT, applyStored);
    return () => {
      window.removeEventListener("storage", applyStored);
      window.removeEventListener(SCENARIO_SHADOW_EVENT, applyStored);
    };
  }, [Component]);
  return (
    
   <>
    <Layout>
    <Head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet"></link>
      </Head>
      <Component {...pageProps} />
    </Layout>
     {/* <Script src="https://checkout.razorpay.com/v1/checkout.js"
     /> */}
    </>
   
  )
}

export default wrapper.withRedux(MyApp);
