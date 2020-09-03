export enum OptionsTypes {
  OPTIONS_SET_THRESHOLD = '@options/OPTIONS_SET_THRESHOLD',
  OPTIONS_SINGLE_LAYER_SELECT = '@options/OPTIONS_SINGLE_LAYER_SELECT',
  OPTIONS_SELECT_MODE = '@options/OPTIONS_SELECT_MODE'
}

export interface OptionsState {
  selectMode?: string;
  singleLayerSelect?: boolean;
  threshold?: number;
}
