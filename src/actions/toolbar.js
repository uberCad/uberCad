import { disablePoint } from './pointInfo';

export const TOOLBAR_CHOOSE_TOOL = 'TOOLBAR_CHOOSE_TOOL';

export const chooseTool = tool => {
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: TOOLBAR_CHOOSE_TOOL,
      payload: {
        tool
      }
    });
  };
};
