import '../styles/globals.scss'
import Contentlayout from '../shared/layout-components/layout/content-layout'
import Authenticationlayout from '../shared/layout-components/layout/authentication-layout'
import Eventlayout from '../shared/layout-components/layout/event-layout'
import { Provider } from "react-redux";
import { useStore } from "../shared/redux/store";
import PropTypes from 'prop-types';

const layouts = {
  Contentlayout: Contentlayout,
  Authenticationlayout: Authenticationlayout,
  Eventlayout: Eventlayout,
};
function MyApp({ Component, pageProps }) {
  const store = useStore(pageProps?.initialReduxState);
  const Layout = layouts[Component.layout] || ((pageProps) => <Component>{pageProps}</Component>);
  return (
    <Provider store={store}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Provider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType,
  pageProps: PropTypes.object,
};
export default MyApp;