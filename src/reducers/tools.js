import update from 'immutability-helper'

import {
  MEASUREMENT_ANGLE_ERASE,
  MEASUREMENT_ANGLE_FIRST_LINE,
  MEASUREMENT_ANGLE_SECOND_LINE,
  MEASUREMENT_LINE_ERASE,
  MEASUREMENT_LINE_FIRST,
  MEASUREMENT_LINE_SECOND,
  MEASUREMENT_POINT,
  MEASUREMENT_RADIAL_LINE
} from '../actions/measurement'
import {
  LINE_PARALLEL_BASE,
  LINE_PARALLEL_CLEAR,
  LINE_PARALLEL_FIRST_POINT,
  LINE_PERPENDICULAR_BASE,
  LINE_PERPENDICULAR_CLEAR,
  LINE_PERPENDICULAR_FIRST_POINT,
  LINE_TANGENT_TO_ARC_BASE,
  LINE_TANGENT_TO_ARC_CLEAR
} from '../actions/line'
import { RECTANGLE_TWO_POINT_CLEAR, RECTANGLE_TWO_POINT_FIRST_POINT } from '../actions/rectangle'

let initialState = {
  measurement: {
    point: null,
    line: {
      first: null,
      second: null,
      distance: null
    },
    radial: {
      line: null
    },
    angle: {
      firstLine: null,
      secondLine: null,
      angleValue: null
    }
  },
  line: {
    parallel: {
      baseLine: null,
      firstPoint: null,
      distance: null
    },
    perpendicular: {
      baseLine: null,
      firstPoint: null
    },
    tangent: {
      baseArc: null
    }
  },
  rectangle: {
    firstPoint: null
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

    case MEASUREMENT_RADIAL_LINE:
      return update(state, {
        measurement: {radial: {line: {$set: action.payload.line}}}
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

    case LINE_PARALLEL_CLEAR:
      return update(state, {
        line: {
          parallel: {
            baseLine: {$set: null},
            firstPoint: {$set: null},
            distance: {$set: null}

          }
        }
      })
    case LINE_PARALLEL_BASE:
      return update(state, {
        line: {parallel: {baseLine: {$set: action.payload.baseLine}}}
      })

    case LINE_PARALLEL_FIRST_POINT:
      return update(state, {
        line: {
          parallel: {
            firstPoint: {$set: action.payload.first},
            distance: {$set: action.payload.distance}
          }
        }
      })

    case LINE_PERPENDICULAR_CLEAR:
      return update(state, {
        line: {
          perpendicular: {
            baseLine: {$set: null},
            firstPoint: {$set: null}
          }
        }
      })
    case LINE_PERPENDICULAR_BASE:
      return update(state, {
        line: {perpendicular: {baseLine: {$set: action.payload.baseLine}}}
      })
    case LINE_PERPENDICULAR_FIRST_POINT:
      return update(state, {
        line: {perpendicular: {firstPoint: {$set: action.payload.first}}}
      })

    case LINE_TANGENT_TO_ARC_CLEAR:
      return update(state, {
        line: {tangent: {baseArc: {$set: null}}}
      })
    case LINE_TANGENT_TO_ARC_BASE:
      return update(state, {
        line: {tangent: {baseArc: {$set: action.payload.baseArc}}}
      })

    case RECTANGLE_TWO_POINT_CLEAR:
      console.log('RECTANGLE_TWO_POINT_CLEAR')
      return update(state, {
        rectangle: {firstPoint: {$set: null}}
      })
    case RECTANGLE_TWO_POINT_FIRST_POINT:
      console.log('action.payload.firstPoint = ', action.payload.firstPoint)
      return update(state, {
        rectangle: {firstPoint: {$set: action.payload.firstPoint}}
      })

    default:
      return state
  }
}

export default tools
