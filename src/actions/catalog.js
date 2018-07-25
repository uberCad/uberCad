export const CATALOG_HIDE = 'CATALOG_HIDE'
export const CATALOG_SHOW = 'CATALOG_SHOW'

export const catalogHide = () => {
  return dispatch => dispatch({
    type: CATALOG_HIDE,
    payload: {
      show: false
    }
  })
}

export const catalogShow = () => {
  console.log('catalogShow')
  return dispatch => dispatch({
    type: CATALOG_SHOW,
    payload: {
      show: true
    }
  })
}
