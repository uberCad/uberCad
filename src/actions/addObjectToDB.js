import Api from '../services/apiService';
import GeometryUtils from '../services/GeometryUtils';
// import sceneService from '../services/sceneService'

import { spinnerShow, spinnerHide } from './spinner';
import { modalShow } from './modal';

export const ADD_ELEMENT_TO_DB = 'ADD_ELEMENT_TO_DB';

// export const calculate = scene => {
//   const objects = scene.getObjectByName('Objects').children;
//   const infoPrice = [];
//   const polyamideObjects = [];
//   let error = null;
//   objects.forEach(item => {
//     if (!item.userData.material) {
//       error = !error ? { objName: [] } : error;
//       error.objName.push(item.name);
//     }
//   });
//
//   if (!error) {
//     objects.forEach(object => {
//       const geometry = GeometryUtils.getObjectInfo(object);
//       let data = {
//         area: geometry[0].region.area,
//         height: geometry[0].region.height,
//         width: geometry[0].region.width,
//         weight:
//           (object.userData.material.density * geometry[0].region.area) /
//           1000000,
//         type: geometry.length > 1 ? 2 : 1
//       };
//       object.userData.info = data;
//
//       if (object.userData.material.material === 'polyamide') {
//         infoPrice.push(data);
//         polyamideObjects.push(object);
//       } else {
//         // nothing
//       }
//     });
//     return dispatch => {
//       dispatch(spinnerShow());
//       Api.post('/calculate', { data: infoPrice }).then(res => {
//         //done
//         res.forEach((item, i) => {
//           polyamideObjects[i].userData.price = item.price;
//           polyamideObjects[i].userData.minOrderQty = Number(
//             item.minOrderQty.replace(/\s+/g, '').replace(/,/g, '.')
//           );
//         });
//         dispatch(spinnerHide());
//         dispatch({
//           type: CALCULATE,
//           payload: {
//             error,
//             prices: res,
//             polyamideObjects,
//             info: infoPrice
//           }
//         });
//       });
//     };
//   } else {
//     return dispatch => {
//       dispatch({
//         type: CALCULATE,
//         payload: {
//           error: { ...error, msg: 'Not all objects are assigned materials' }
//         }
//       });
//     };
//   }
// };

export const addObjectToDB = scene => {
  const object = scene.getObjectByName('Objects').children;
  let error = null;
  if (!error) {
    return dispatch => {
      dispatch(spinnerShow());
      Api.post('/addObjectToDB', { data: object }).then(res => {
        //done

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
