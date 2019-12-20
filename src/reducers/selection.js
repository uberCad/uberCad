// import update from 'immutability-helper'

import {
  SELECTION_BEGIN,
  SELECTION_UPDATE,
  SELECTION_END
} from '../actions/selection';

let initialState = {
  active: false,
  style: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    display: 'none'
  },
  selectionStartPos: {
    x: 0,
    y: 0
  },
  drawStartPos: {
    x: 0,
    y: 0
  },
  drawEndPos: {
    x: 0,
    y: 0
  }
};

const selection = (state = initialState, action) => {
  switch (action.type) {
    case SELECTION_BEGIN:
      return {
        ...state,
        active: action.payload.active,
        style: {
          left: action.payload.x,
          top: action.payload.y,
          width: 0,
          height: 0,
          display: action.payload.active ? 'block' : 'none'
        },
        selectionStartPos: {
          x: action.payload.x,
          y: action.payload.y
        },
        drawStartPos: action.payload.drawStartPos
      };
    case SELECTION_UPDATE:
      return {
        ...state,
        style: {
          left: Math.min(action.payload.x, state.selectionStartPos.x),
          top: Math.min(action.payload.y, state.selectionStartPos.y),
          width: Math.abs(state.selectionStartPos.x - action.payload.x),
          height: Math.abs(state.selectionStartPos.y - action.payload.y),
          display: state.style.display
        }
      };
    case SELECTION_END:
      return {
        ...state,
        active: action.payload.active,
        style: {
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          display: action.payload.active ? 'block' : 'none'
        },
        drawEndPos: action.payload.drawEndPos
      };
    default:
      return state;
  }
};

export default selection;
