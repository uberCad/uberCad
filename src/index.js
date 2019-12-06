import React from 'react';
import { render } from 'react-dom';

import { addLocaleData } from 'react-intl';
import en from 'react-intl/locale-data/en';
import ru from 'react-intl/locale-data/ru';

import App from './AppContainer';
// import registerServiceWorker from './registerServiceWorker'
import { unregister } from './registerServiceWorker';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import configureStore from './configureStore';

import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

let { store, persistor } = configureStore();

addLocaleData([...en, ...ru]);

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>,
  document.getElementById('root')
);
// registerServiceWorker()
unregister();
