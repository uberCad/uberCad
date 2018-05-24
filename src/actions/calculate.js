import Api from '../services/apiService'
import GeometryUtils from '../services/GeometryUtils'

export const CALCULATE = 'CALCULATE'

export const calculate = (scene) => {
  const objects = scene.children[1].children
  const info = []
  objects.forEach(object => {
    const geometry = GeometryUtils.getObjectInfo(object)
    let data = {
      area: geometry[0].region.area,
      height: geometry[0].region.height,
      width: geometry[0].region.width
    }
    data.type = geometry.length > 1 ? 2 : 1
    info.push(data)
  })

  Api.post('/api/calculate',
    {
      data: info,
      headers: {
        authgapi: 'Bearer ya29.GlvFBd28AfEhvqoTasP1cvHR2mjdi7TQ9VzIH-rqfGmmUXo_D3P09K5rAt0JhwPq_ZeBJVJrX3cnALs4U_AKqm_NM-pEEpnq6slef6ltsOYj4bIXbgGKgCUyIS1B'
      }
    })
    .then(res => {
      console.log('calculate res = ', res)
    })
  return (dispatch) => {
    dispatch({
      type: CALCULATE,
      payload: {}
    })
  }
}
