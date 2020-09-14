import { action, Action } from 'typesafe-actions';
import { OptionsTypes, DEFAULT_THRESHOLD } from './types';

export const setThreshold = (threshold: string): Action => {
  let value = parseFloat(threshold);
  if (isNaN(value)) {
    value = DEFAULT_THRESHOLD;
  }

  return action(OptionsTypes.SET_THRESHOLD, { value });
};

export const setSingleLayerSelect = (value: boolean): Action =>
  action(OptionsTypes.SINGLE_LAYER_SELECT, { value });

export const setSelectMode = (value: string): Action =>
  action(OptionsTypes.SELECT_MODE, { value });
