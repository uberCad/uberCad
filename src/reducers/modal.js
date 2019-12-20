// import update from 'immutability-helper'

import { MODAL_HIDE, MODAL_SHOW } from '../actions/modal';

let initialState = {
  show: false,
  message: '',
  title: '',
  link: ''
};

const modal = (state = initialState, action) => {
  switch (action.type) {
    case MODAL_HIDE:
      return {
        ...state,
        show: action.payload.show,
        message: action.payload.message,
        title: action.payload.title,
        link: action.payload.link
      };

    case MODAL_SHOW:
      return {
        ...state,
        show: action.payload.show,
        message: action.payload.message,
        title: action.payload.title,
        link: action.payload.link
      };

    default:
      return state;
  }
};

export default modal;
