import React from 'react'
import {render} from 'react-dom'
import App from './App'
import registerServiceWorker from './registerServiceWorker'
import {Router} from 'react-router-dom'
import {Provider} from 'react-redux'
import {PersistGate} from 'redux-persist/lib/integration/react'
import history from './config/history'

import configureStore from './configureStore'
let { store, persistor } = configureStore()

render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <Router history={history}>
        <App />
      </Router>
    </PersistGate>
  </Provider>, document.getElementById('root'))
registerServiceWorker()
