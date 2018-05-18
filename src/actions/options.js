import {
  DEFAULT_THRESHOLD
} from '../components/Options/optionsComponent'
import { CAD_IS_EDIT } from './cad'

export const OPTIONS_SELECT_MODE = 'OPTIONS_SELECT_MODE'
export const OPTIONS_SINGLE_LAYER_SELECT = 'OPTIONS_SINGLE_LAYER_SELECT'
export const OPTIONS_SET_THRESHOLD = 'OPTIONS_SET_THRESHOLD'
export const OPTIONS_IS_EDIT = 'OPTIONS_IS_EDIT'

export const setSelectMode = mode => {
  return dispatch => dispatch({
    type: OPTIONS_SELECT_MODE,
    payload: {
      mode
    }
  })
}

export const setSingleLayerSelect = value => {
  return dispatch => dispatch({
    type: OPTIONS_SINGLE_LAYER_SELECT,
    payload: {
      value
    }
  })
}
export const setThreshold = value => {
  value = parseFloat(value)
  if (isNaN(value)) {
    value = DEFAULT_THRESHOLD
  }

  return dispatch => dispatch({
    type: OPTIONS_SET_THRESHOLD,
    payload: {
      value
    }
  })
}

export const isEdit = (option, object = {}) => {
  const beforeEdit = JSON.stringify(object)
  return dispatch => dispatch({
    type: OPTIONS_IS_EDIT,
    payload: {
      isEdit: option,
      beforeEdit: beforeEdit,
      editObject: object
    }
  })
}
