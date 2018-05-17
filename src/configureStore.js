import { createStore, applyMiddleware, combineReducers } from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import thunk from 'redux-thunk'
import reducers from './reducers'

const rootPersistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['cad', 'options', 'selection']
}

const cadPersistConfig = {
  key: 'cad',
  storage: storage,
  blacklist: ['scene', 'camera', 'renderer', 'cadCanvas', 'activeEntities']
}

// https://github.com/reactjs/redux/issues/749

const persistedReducer = persistReducer(rootPersistConfig, combineReducers({
  ...reducers,
  cad: persistReducer(cadPersistConfig, reducers.cad)
}))

export default () => {
  let store = createStore(persistedReducer, applyMiddleware(thunk))
  let persistor = persistStore(store)
  return { store, persistor }
}