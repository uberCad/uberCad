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
import {
  CHAMFER_TWO_LENGTH_CLEAR,
  CHAMFER_TWO_LENGTH_LINE_ONE,
  CHAMFER_TWO_LENGTH_INPUT_CHANGE,
  CHAMFER_LENGTH_ANGLE_INPUT_CHANGE,
  CHAMFER_LENGTH_ANGLE_CLEAR,
  CHAMFER_LENGTH_ANGLE_LINE_ONE,
  ROUNDING_RADIUS_INPUT,
  ROUNDING_RADIUS_CLEAR,
  ROUNDING_RADIUS_LINE_ONE,
  ROUNDING_LENGTH_CLEAR,
  ROUNDING_LENGTH_INPUT,
  ROUNDING_LENGTH_LINE_ONE
} from '../actions/chamfer'
import {
  ARC_CENTER_TWO_POINT_CENTER_SELECT,
  ARC_CENTER_TWO_POINT_CLEAR,
  ARC_CENTER_TWO_POINT_ONE_SELECT,
  ARC_RADIUS_TWO_POINT_CLEAR,
  ARC_RADIUS_TWO_POINT_INPUT,
  ARC_RADIUS_TWO_POINT_ONE_SELECT,
  ARC_RADIUS_TWO_POINT_STOP_DRAW,
  ARC_TANGENT_LINE_CLEAR,
  ARC_TANGENT_LINE_FIRST_POINT
} from '../actions/arc'
import { GRID_STEP, GRID_VIEW } from '../actions/grid'

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
  arc: {
    centerTwoPoint: {
      center: null,
      pointOne: null
    },
    radiusTwoPoint: {
      radius: '1',
      pointOne: null,
      drawing: false
    },
    tangentLine: {
      line: null,
      pointOne: null
    }
  },
  rectangle: {
    firstPoint: null
  },
  chamfer: {
    twoLength: {
      lineOne: null,
      lengthOne: '1',
      lineTwo: null,
      lengthTwo: '1'
    },
    lengthAngle: {
      lineOne: null,
      lineTwo: null,
      length: '1',
      angle: '0',
    },
    rounding: {
      lineOne: null,
      lineTwo: null,
      radius: '1'
    },
    roundingLength: {
      lineOne: null,
      lineTwo: null,
      length: '1'
    }
  },
  grid: {
    view: false,
    style: 'point',
    step: 5
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
      return update(state, {
        rectangle: {firstPoint: {$set: null}}
      })
    case RECTANGLE_TWO_POINT_FIRST_POINT:
      return update(state, {
        rectangle: {firstPoint: {$set: action.payload.firstPoint}}
      })

    case CHAMFER_TWO_LENGTH_CLEAR:
      return update(state, {
        chamfer: {
          twoLength: {
            lineOne: {$set: null},
            lengthOne: {$set: '1'},
            lineTwo: {$set: null},
            lengthTwo: {$set: '1'}
          }
        }
      })
    case CHAMFER_TWO_LENGTH_INPUT_CHANGE:
      switch (action.payload.name) {
        case 'lengthOne' : {
          return update(state, {
            chamfer: {twoLength: {lengthOne: {$set: action.payload.lengthOne}}}
          })
        }
        case 'lengthTwo' : {
          return update(state, {
            chamfer: {twoLength: {lengthTwo: {$set: action.payload.lengthTwo}}}
          })
        }
        default:
          return state
      }
    case CHAMFER_TWO_LENGTH_LINE_ONE:
      return update(state, {
        chamfer: {twoLength: {lineOne: {$set: action.payload.lineOne}}}
      })

    case CHAMFER_LENGTH_ANGLE_CLEAR:
      return update(state, {
        chamfer: {
          lengthAngle: {
            lineOne: {$set: null},
            lineTwo: {$set: null},
            length: {$set: '1'},
            angle: {$set: '45'}
          }
        }
      })
    case CHAMFER_LENGTH_ANGLE_INPUT_CHANGE:
      switch (action.payload.name) {
        case 'length' : {
          return update(state, {
            chamfer: {lengthAngle: {length: {$set: action.payload.length}}}
          })
        }
        case 'angle' : {
          return update(state, {
            chamfer: {lengthAngle: {angle: {$set: action.payload.angle}}}
          })
        }
        default:
          return state
      }

    case CHAMFER_LENGTH_ANGLE_LINE_ONE:
      return update(state, {
        chamfer: {lengthAngle: {lineOne: {$set: action.payload.lineOne}}}
      })

    case ROUNDING_RADIUS_CLEAR:
      return update(state, {
        chamfer: {
          rounding: {
            lineOne: {$set: null},
            lineTwo: {$set: null},
            radius: {$set: '1'}
          }
        }
      })
    case ROUNDING_RADIUS_INPUT:
      return update(state, {
        chamfer: {rounding: {radius: {$set: action.payload.radius}}}
      })

    case ROUNDING_RADIUS_LINE_ONE:
      return update(state, {
        chamfer: {rounding: {lineOne: {$set: action.payload.lineOne}}}
      })

    case ROUNDING_LENGTH_CLEAR:
      return update(state, {
        chamfer: {
          roundingLength: {
            lineOne: {$set: null},
            lineTwo: {$set: null},
            length: {$set: '1'}
          }
        }
      })
    case ROUNDING_LENGTH_INPUT:
      return update(state, {
        chamfer: {roundingLength: {length: {$set: action.payload.length}}}
      })

    case ROUNDING_LENGTH_LINE_ONE:
      return update(state, {
        chamfer: {roundingLength: {lineOne: {$set: action.payload.lineOne}}}
      })

    case ARC_CENTER_TWO_POINT_CLEAR:
      return update(state, {
        arc: {
          centerTwoPoint: {
            center: {$set: null},
            pointOne: {$set: null}
          }
        }
      })
    case ARC_CENTER_TWO_POINT_CENTER_SELECT:
      return update(state, {
        arc: {centerTwoPoint: {center: {$set: action.payload.center}}}
      })
    case ARC_CENTER_TWO_POINT_ONE_SELECT:
      return update(state, {
        arc: {centerTwoPoint: {pointOne: {$set: action.payload.pointOne}}}
      })

    case ARC_RADIUS_TWO_POINT_CLEAR:
      return update(state, {
        arc: {
          radiusTwoPoint: {
            radius: {$set: '1'},
            pointOne: {$set: null},
            drawing: {$set: false}
          }
        }
      })

    case ARC_RADIUS_TWO_POINT_INPUT:
      return update(state, {
        arc: {radiusTwoPoint: {radius: {$set: action.payload.radius}}}
      })

    case ARC_RADIUS_TWO_POINT_ONE_SELECT:
      return update(state, {
        arc: {
          radiusTwoPoint: {
            pointOne: {$set: action.payload.pointOne},
            drawing: {$set: action.payload.drawing}
          }
        }
      })
    case ARC_RADIUS_TWO_POINT_STOP_DRAW:
      return update(state, {
        arc: {radiusTwoPoint: {drawing: {$set: action.payload.drawing}}}
      })

    case ARC_TANGENT_LINE_CLEAR:
      return update(state, {
        arc: {
          tangentLine: {
            line: {$set: null},
            pointOne: {$set: null}
          }
        }
      })

    case ARC_TANGENT_LINE_FIRST_POINT:
      return update(state, {
        arc: {
          tangentLine: {
            line: {$set: action.payload.line},
            pointOne: {$set: action.payload.pointOne},
          }
        }
      })

    case GRID_VIEW:
      return update(state, {
        grid: {view: {$set: action.payload.view}}
      })

    case GRID_STEP:
      return update(state, {
        grid: {step: {$set: action.payload.step}}
      })

    default:
      return state
  }
}

export default tools
