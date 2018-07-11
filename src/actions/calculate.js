import Api from '../services/apiService'
import GeometryUtils from '../services/GeometryUtils'

import { spinnerShow, spinnerHide } from './spinner'

export const CALCULATE = 'CALCULATE'
export const CALCULATE_HIDE = 'CALCULATE_HIDE'
export const CALCULATE_CHECK_OBJECT = 'CALCULATE_CHECK_OBJECT'

export const calculate = (scene) => {
  const objects = scene.children[1].children
  const infoPrice = []
  const polyamideObjects = []

  objects.forEach(object => {
    const geometry = GeometryUtils.getObjectInfo(object)
    let data = {
      area: geometry[0].region.area,
      height: geometry[0].region.height,
      width: geometry[0].region.width,
      weight: object.userData.material.density * geometry[0].region.area / 1000000,
      type: geometry.length > 1 ? 2 : 1
    }
    object.userData.info = data

    if (object.userData.material.material === 'polyamide') {
      infoPrice.push(data)
      polyamideObjects.push(object)
    } else {
      // nothing
    }
  })
  return (dispatch) => {
    dispatch(spinnerShow())
    Api.post('/api/calculate', {data: infoPrice})
      .then(res => {
          res.forEach((price, i) => {
            polyamideObjects[i].userData.price = price
          })
          dispatch(spinnerHide())
          dispatch({
            type: CALCULATE,
            payload: {
              prices: res,
              polyamideObjects,
              info: infoPrice
            }
          })
        }
      )
  }
}

export const calculateHide = () => {
  return dispatch => dispatch({
    type: CALCULATE_HIDE
  })
}

export const checkObject = (object) => {
  if (object.userData.options && object.userData.options.checked) {
    object.userData.options.checked = !object.userData.options.checked
  } else {
    object.userData.options = {
      checked: true,
      laser: {
        checked: false,
        type: null,
        color: null
      },
      length: ''
    }
  }
  return dispatch => dispatch({
    type: CALCULATE_CHECK_OBJECT
  })
}

export const checkLaser = (object) => {
  if (object.userData.options.laser && object.userData.options.laser.checked) {
    object.userData.options.laser.checked = !object.userData.options.laser.checked
  } else {
    object.userData.options = {
      checked: true,
      laser: {
        checked: true,
        type: 'standart',
        color: 'white'
      },
      length: ''
    }
  }
  return dispatch => dispatch({
    type: CALCULATE_CHECK_OBJECT
  })
}

export const changeLaserOptions = (object, event) => {
  if (event.target.name === 'type') {
    object.userData.options.laser.type = event.target.value
  } else if (event.target.name === 'color') {
    object.userData.options.laser.color = event.target.value
  }
  return dispatch => dispatch({
    type: CALCULATE_CHECK_OBJECT
  })
}

export const setLength = (object, length) => {
  object.userData.options.length = length
  return dispatch => dispatch({
    type: CALCULATE_CHECK_OBJECT
  })
}
