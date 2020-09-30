export const SPINNER_SHOW = 'SPINNER_SHOW';
export const SPINNER_HIDE = 'SPINNER_HIDE';

export const spinnerShow = mode => {
  return dispatch => {
    // TODO: find better solution (use async action for example)
    if (mode) {
      return new Promise((resolve) => {
        dispatch({
          type: SPINNER_SHOW
        });
        setTimeout(() => resolve(), 100);
      });
    }
    dispatch({
      type: SPINNER_SHOW
    });
  }
};

export const spinnerHide = () => {
  return dispatch =>
    dispatch({
      type: SPINNER_HIDE
    });
};
