export enum OptionsTypes {
  SET_THRESHOLD = '@options/SET_THRESHOLD',
  SINGLE_LAYER_SELECT = '@options/SINGLE_LAYER_SELECT',
  SELECT_MODE = '@options/SELECT_MODE'
}

export enum SelectNewTypes {
  NEW = '@options/@select_mode/NEW',
  ADD = '@options/@select_mode/ADD',
  SUB = '@options/@select_mode/SUB',
  INTERSECT = '@options/@select_mode/INTERSECT'
}

export const DEFAULT_THRESHOLD = 0.0001;

export interface OptionsState {
  selectMode?: string;
  singleLayerSelect?: boolean;
  threshold?: number;
}
