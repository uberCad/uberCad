import Api from '../services/apiService'
import GeometryUtils from '../services/GeometryUtils'

import { spinnerShow, spinnerHide } from './spinner'
import { modalShow } from './modal'

export const CALCULATE = 'CALCULATE'
export const CALCULATE_HIDE = 'CALCULATE_HIDE'
export const CALCULATE_ORDER = 'CALCULATE_ORDER'

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
          res.forEach((item, i) => {
            polyamideObjects[i].userData.price = item.price
            polyamideObjects[i].userData.minOrderQty = Number(item.minOrderQty.replace(/\s+/g, '').replace(/,/g, '.'))
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

export const order = (orderObjects, contactInformation) => {
  const order = []
  orderObjects.forEach(object => {
    let data = {
      material: object.userData.material,
      options: object.userData.options
    }
    order.push(data)
  })
  return (dispatch) => {
    dispatch(spinnerShow())
    Api.post('/api/order', {data: {order, orderObjects, contactInformation}})
      .then(res => {
          dispatch(spinnerHide())
          dispatch(calculateHide())
          dispatch(modalShow('Order', res.message, res.link))
          dispatch({
            type: CALCULATE_ORDER
          })
        }
      )
  }
}