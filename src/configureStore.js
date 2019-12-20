import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';
import reducers from './reducers';
import { reducer as formReduser } from 'redux-form';

const rootPersistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['cad', 'options', 'selection', 'price', 'sidebar']
};

const cadPersistConfig = {
  key: 'cad',
  storage: storage,
  blacklist: [
    'scene',
    'camera',
    'renderer',
    'cadCanvas',
    'activeEntities',
    'pointInfo',
    'editMode'
  ]
};
const sidebarPersistConfig = {
  key: 'sidebar',
  storage: storage,
  blacklist: ['activeObject']
};

// https://github.com/reactjs/redux/issues/749

const persistedReducer = persistReducer(
  rootPersistConfig,
  combineReducers({
    ...reducers,
    form: formReduser,
    cad: persistReducer(cadPersistConfig, reducers.cad),
    sidebar: persistReducer(sidebarPersistConfig, reducers.sidebar)
  })
);

export default () => {
  const composeEnhancers =
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  let store = createStore(
    persistedReducer,
    composeEnhancers(applyMiddleware(thunk))
  );
  let persistor = persistStore(store);
  return { store, persistor };
};
