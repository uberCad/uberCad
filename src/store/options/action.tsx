import { action, Action } from 'typesafe-actions';
import { OptionsTypes } from './types';

export const setThreshold = (threshold: string): Action => {
  let value = parseFloat(threshold);
  if (isNaN(value)) {
    value = 0.0001;
  }

  return action(OptionsTypes.OPTIONS_SET_THRESHOLD, { value });
};

export const setSingleLayerSelect = (value: boolean): Action =>
  action(OptionsTypes.OPTIONS_SINGLE_LAYER_SELECT, { value });

export const setSelectMode = (value: string): Action =>
  action(OptionsTypes.OPTIONS_SELECT_MODE, { value });
