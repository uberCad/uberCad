import React from 'react'
import { render } from 'react-dom'

import { addLocaleData } from 'react-intl'
import en from 'react-intl/locale-data/en'
import ru from 'react-intl/locale-data/ru'

import App from './AppContainer'
import registerServiceWorker from './registerServiceWorker'
import { Router } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/lib/integration/react'
import history from './config/history'
import configureStore from './configureStore'

let {store, persistor} = configureStore()

addLocaleData([...en, ...ru])

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Router history={history}>
        <App />
      </Router>
    </PersistGate>
  </Provider>, document.getElementById('root')
)
registerServiceWorker()
