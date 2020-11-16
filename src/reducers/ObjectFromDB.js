import { GET_OBJECT_FROM_DB } from '../actions/getObjectFromDB';

let initialState = [];

const ObjectFromDB = (state = initialState, action) => {
  switch (action.type) {
    case GET_OBJECT_FROM_DB:
      return action.payload.ObjectFromDB;
    default:
      return state;
  }
};

export default ObjectFromDB;
