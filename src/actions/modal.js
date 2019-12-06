export const MODAL_HIDE = 'MODAL_HIDE';
export const MODAL_SHOW = 'MODAL_SHOW';

export const modalHide = () => {
  return dispatch =>
    dispatch({
      type: MODAL_HIDE,
      payload: {
        show: false,
        message: '',
        title: '',
        link: ''
      }
    });
};

export const modalShow = (title = 'Title', message, link = '') => {
  return dispatch =>
    dispatch({
      type: MODAL_SHOW,
      payload: {
        show: true,
        message,
        title,
        link
      }
    });
};
