import Api from '../services/apiService';
import GeometryUtils from '../services/GeometryUtils';
// import sceneService from '../services/sceneService'

import { spinnerShow, spinnerHide } from './spinner';
import { modalShow } from './modal';

export const ADD_ELEMENT_TO_DB = 'ADD_ELEMENT_TO_DB';

export const addObjectToDB = (target,boundingBox) => {
  // todo тут відправка об'єктав БД
  // const object = scene.getObjectByName('Objects').children;
  let error = null;
  if (!error) {
    return dispatch => {
      dispatch(spinnerShow());

      let sendingObj = {
        title: target.userData.title,
        categoryKey: target.userData.type? target.userData.type:0,
        width: boundingBox.width,
        height: boundingBox.height,
        materialKey: +target.userData.material._key,
        object: target

      };
      Api.post('/store/part', {data:sendingObj}).then(res => {
        console.log(res);
        dispatch(spinnerHide());
        dispatch({
          type: ADD_ELEMENT_TO_DB,
          payload: {}
        });
      });
    };
  } else {
    return dispatch => {
      dispatch({
        type: ADD_ELEMENT_TO_DB,
        payload: {
          error: { ...error, msg: 'Not all objects are assigned materials' }
        }
      });
    };
  }
};
