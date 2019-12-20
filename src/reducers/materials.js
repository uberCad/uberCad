import { MATERIALS_LOAD } from '../actions/materials';

let initialState = [];

const materials = (state = initialState, action) => {
  switch (action.type) {
    case MATERIALS_LOAD:
      return action.payload.materials;
    default:
      return state;
  }
};

export default materials;
