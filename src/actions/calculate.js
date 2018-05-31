import Api from '../services/apiService'
import GeometryUtils from '../services/GeometryUtils'

export const CALCULATE = 'CALCULATE'

export const calculate = (scene) => {
  const objects = scene.children[1].children
  const info = []
  objects.forEach(object => {
    const geometry = GeometryUtils.getObjectInfo(object)
    let data = {
      size: {
        area: geometry[0].region.area,
        height: geometry[0].region.height,
        width: geometry[0].region.width,
        type: geometry.length > 1 ? 2 : 1
      },
      geometry,
      material: object.userData.material,
      object
    }
    info.push(data)
  })

  Api.post('/api/calculate',
    {
      data: info.map(data => data.size),
      headers: {
        authgapi: 'Bearer ya29.GlzGBfQDXqABrGtL_1eREp_fvWmJ8FwBdEtqpaS0rXciW6pezWOhiFZhnuNaiIg49_tvdH0pAzfCnOif6vgMlVN69CiZJZ2IocLu_JuobZG5-bVZRWjd-aurrwR2Gg'
      }
    })
    .then(prices => {
      let totalWeight = 0
      let totalPrice = 0
      info.forEach((data, idx) => {
        data.price = parseFloat(prices[idx].replace(',', '.'))
        data.size.weight = data.material.density * (data.size.area / 1000000)
        console.log(`
Object: ${data.object.name}
Material: ${data.material.name}
  Area: ${data.size.area.toFixed(4)} mm² 
  Width: ${data.size.width.toFixed(4)} mm
  Height: ${data.size.height.toFixed(4)} mm
  Weight ${data.size.weight.toFixed(4)} kg/m
Price: ${data.price} €`)

        totalWeight += data.size.weight
        totalPrice += data.price
      })

      console.log(`
System weight ${totalWeight.toFixed(4)} kg/m
System price ${totalPrice} €/m
      `)
    })
  return (dispatch) => {
    dispatch({
      type: CALCULATE,
      payload: {}
    })
  }
}
