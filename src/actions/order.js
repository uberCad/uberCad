import Api from '../services/apiService'

import { spinnerShow, spinnerHide } from './spinner'

export const ORDER_GET = 'ORDER_GET'

export const getOrder = (key, hash) => {
  return (dispatch) => {
    dispatch(spinnerShow())
    Api.get(`/api/order/${key}/${hash}`)
      .then(res => {
          dispatch(spinnerHide())
          dispatch({
            type: ORDER_GET,
            payload: {
              contactInformation: res.contactInformation,
              order: res.order,
              orderObjects: res.orderObjects,
              createdAt: res.createdAt
            }
          })
        }
      )
  }
}