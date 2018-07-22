export const MODAL_HIDE = 'MODAL_HIDE'
export const MODAL_SHOW = 'MODAL_SHOW'

export const modalHide = () => {
  return dispatch => dispatch({
    type: MODAL_HIDE,
    payload: {
      show: false,
      message: '',
      title: ''
    }
  })
}

export const modalShow = (title = 'Title', message) => {
  return dispatch => dispatch({
    type: MODAL_SHOW,
    payload: {
      show: true,
      message,
      title
    }
  })
}
