import Api from '../services/apiService';
import { addMaterialBackgroundShape } from '../services/editObject';

export const MATERIALS_LOAD = 'MATERIALS_LOAD';
export const MATERIAL_SET = 'MATERIAL_SET';

export const loadMaterials = () => {
  return dispatch => {
    Api.get('/materials').then(materials => {
      //done
      dispatch({
        type: MATERIALS_LOAD,
        payload: { materials }
      });
    });
  };
};

export const setMaterial = (material, object, editor) => {
  object.userData.material = material;

  addMaterialBackgroundShape(object, editor);
  let { scene, camera, renderer } = editor;
  renderer.render(scene, camera);

  return dispatch => {
    dispatch({
      type: MATERIAL_SET,
      payload: { object }
    });
  };
};
