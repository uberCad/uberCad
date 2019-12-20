import { DEFAULT_THRESHOLD } from '../components/Options/optionsComponent';
import { disablePoint } from './pointInfo';

export const OPTIONS_SELECT_MODE = 'OPTIONS_SELECT_MODE';
export const OPTIONS_SINGLE_LAYER_SELECT = 'OPTIONS_SINGLE_LAYER_SELECT';
export const OPTIONS_SET_THRESHOLD = 'OPTIONS_SET_THRESHOLD';

export const setSelectMode = mode => {
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: OPTIONS_SELECT_MODE,
      payload: {
        mode
      }
    });
    dispatch({
      type: `${mode}_CLEAR`
    });
  };
};

export const setSingleLayerSelect = value => {
  return dispatch =>
    dispatch({
      type: OPTIONS_SINGLE_LAYER_SELECT,
      payload: {
        value
      }
    });
};
export const setThreshold = value => {
  value = parseFloat(value);
  if (isNaN(value)) {
    value = DEFAULT_THRESHOLD;
  }

  return dispatch =>
    dispatch({
      type: OPTIONS_SET_THRESHOLD,
      payload: {
        value
      }
    });
};
