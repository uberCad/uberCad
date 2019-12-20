// import update from 'immutability-helper'

import { SPINNER_SHOW, SPINNER_HIDE } from '../actions/spinner';

let initialState = {
  active: false
};

export default function spinner(state = initialState, action) {
  switch (action.type) {
    case SPINNER_SHOW:
      return {
        ...state,
        active: true
      };

    case SPINNER_HIDE:
      return {
        ...state,
        active: false
      };

    default:
      return state;
  }
}
