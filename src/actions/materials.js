import Api from '../services/apiService';

export const MATERIALS_LOAD = 'MATERIALS_LOAD';
export const MATERIAL_SET = 'MATERIAL_SET';

export const loadMaterials = () => {
  return dispatch => {
    Api.get('/materials').then(materials => { //done
      dispatch({
        type: MATERIALS_LOAD,
        payload: { materials }
      });
    });
  };
};

export const setMaterial = (material, object) => {
  object.userData.material = material;
  return dispatch => {
    dispatch({
      type: MATERIAL_SET,
      payload: { object }
    });
  };
};
