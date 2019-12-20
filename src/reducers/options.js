// import update from 'immutability-helper'

import {
  OPTIONS_SELECT_MODE,
  OPTIONS_SINGLE_LAYER_SELECT,
  OPTIONS_SET_THRESHOLD
} from '../actions/options';
import {
  SELECT_MODE_NEW,
  DEFAULT_THRESHOLD
} from '../components/Options/optionsComponent';

let initialState = {
  selectMode: SELECT_MODE_NEW,
  singleLayerSelect: true,
  threshold: DEFAULT_THRESHOLD
};

const options = (state = initialState, action) => {
  switch (action.type) {
    case OPTIONS_SELECT_MODE:
      return {
        ...state,
        selectMode: action.payload.mode
      };
    case OPTIONS_SINGLE_LAYER_SELECT:
      return {
        ...state,
        singleLayerSelect: action.payload.value
      };
    case OPTIONS_SET_THRESHOLD:
      return {
        ...state,
        threshold: action.payload.value
      };
    default:
      return state;
  }
};

export default options;
