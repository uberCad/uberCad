import { createReducer } from 'typesafe-actions';
import { OptionsState, OptionsTypes } from './types';

const initialState: OptionsState = {
  selectMode: 'wadawd',
  singleLayerSelect: true,
  threshold: 0.0001
};

export const optionsReducer = createReducer<OptionsState>(initialState)
  .handleAction(OptionsTypes.OPTIONS_SELECT_MODE, (state, action) => ({
    ...state,
    selectMode: action.payload.mode
  }))
  .handleAction(OptionsTypes.OPTIONS_SINGLE_LAYER_SELECT, (state, action) => ({
    ...state,
    singleLayerSelect: action.payload.value
  }))
  .handleAction(OptionsTypes.OPTIONS_SET_THRESHOLD, (state, action) => ({
    ...state,
    threshold: action.payload.value
  }));
