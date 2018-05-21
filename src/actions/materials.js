import Api from '../services/apiService'

export const MATERIALS_LOAD = 'MATERIALS_LOAD'

export const loadMaterials = () => {
  return (dispatch) => {
    Api.get('/api/materials')
      .then((materials) => {
        dispatch({
          type: MATERIALS_LOAD,
          payload: {materials}
        })
      })
  }
}
