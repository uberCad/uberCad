import { createStore, applyMiddleware, combineReducers, compose } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import thunk from 'redux-thunk'
import reducers from './reducers'

const rootPersistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['cad', 'options', 'selection', 'price']
}

const cadPersistConfig = {
  key: 'cad',
  storage: storage,
  blacklist: ['scene', 'camera', 'renderer', 'cadCanvas', 'activeEntities', 'pointInfo']
}

// https://github.com/reactjs/redux/issues/749

const persistedReducer = persistReducer(rootPersistConfig, combineReducers({
  ...reducers,
  cad: persistReducer(cadPersistConfig, reducers.cad)
}))

export default () => {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  let store = createStore(persistedReducer, composeEnhancers(
    applyMiddleware(thunk)))
  let persistor = persistStore(store)
  return { store, persistor }
}
