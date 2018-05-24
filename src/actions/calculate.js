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

  Api.post('/api/calculate', {data: info})
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
