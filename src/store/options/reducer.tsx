import { createReducer } from 'typesafe-actions';
import {
  OptionsState,
  OptionsTypes,
  SelectNewTypes,
  DEFAULT_THRESHOLD
} from './types';

const initialState: OptionsState = {
  selectMode: SelectNewTypes.NEW,
  singleLayerSelect: true,
  threshold: DEFAULT_THRESHOLD
};

export const optionsReducer = createReducer<OptionsState>(initialState)
  .handleAction(OptionsTypes.SELECT_MODE, (state, action) => ({
    ...state,
    selectMode: action.payload.value
  }))
  .handleAction(OptionsTypes.SINGLE_LAYER_SELECT, (state, action) => ({
    ...state,
    singleLayerSelect: action.payload.value
  }))
  .handleAction(OptionsTypes.SET_THRESHOLD, (state, action) => ({
    ...state,
    threshold: action.payload.value
  }));
