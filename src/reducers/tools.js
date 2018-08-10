import update from 'immutability-helper'

import {
  MEASUREMENT_ANGLE_ERASE,
  MEASUREMENT_ANGLE_FIRST_LINE,
  MEASUREMENT_ANGLE_SECOND_LINE,
  MEASUREMENT_LINE_ERASE,
  MEASUREMENT_LINE_FIRST,
  MEASUREMENT_LINE_SECOND,
  MEASUREMENT_POINT
} from '../actions/measurement'

let initialState = {
  measurement: {
    point: null,
    line: {
      first: null,
      second: null,
      distance: null
    },
    angle: {
      firstLine: null,
      secondLine: null,
      angleValue: null
    }
  }
}

const tools = (state = initialState, action) => {
  switch (action.type) {

    case MEASUREMENT_POINT:
      return update(state, {
        measurement: {point: {$set: action.payload.point}}
      })

    case MEASUREMENT_LINE_FIRST:
      return update(state, {
        measurement: {line: {first: {$set: action.payload.first}}}
      })

    case MEASUREMENT_LINE_SECOND:
      return update(state, {
        measurement: {
          line: {
            second: {$set: action.payload.second},
            distance: {$set: action.payload.distance}
          }
        }
      })
    case MEASUREMENT_LINE_ERASE:
      return update(state, {
        measurement: {line: {$set: action.payload.line}}
      })

    case MEASUREMENT_ANGLE_ERASE:
      return update(state, {
        measurement: {angle: {$set: action.payload.angle}}
      })
    case MEASUREMENT_ANGLE_FIRST_LINE:
      return update(state, {
        measurement: {angle: {firstLine: {$set: action.payload.line}}}
      })
    case MEASUREMENT_ANGLE_SECOND_LINE:
      return update(state, {
        measurement: {
          angle: {
            secondLine: {$set: action.payload.secondLine},
            angleValue: {$set: action.payload.angleValue}
          }
        }
      })

    default:
      return state
  }
}

export default tools
