// todo все що нижче перековиряти для обєктів з БД
import { spinnerShow, spinnerHide } from './spinner';
import Api from '../services/apiService';

export const GET_OBJECT_FROM_DB = 'PROJECTS_SORT_FIELD';

export const getObjectFromDB = () => dispatch => {
  spinnerShow()(dispatch);
  return Api.get(`/store/category/0`) //done
    .then(ObjectFromDB => {
      spinnerHide()(dispatch);
      // todo через діспач не працює..... хз чого
      dispatch({
        type: GET_OBJECT_FROM_DB,
        payload: { ObjectFromDB }
      });
      return ObjectFromDB;
    });
};
