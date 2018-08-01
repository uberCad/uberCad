import update from 'immutability-helper'

import {
  CAD_DRAW_DXF,
  CAD_DO_SELECTION,
  CAD_TOGGLE_VISIBLE,
  CAD_TOGGLE_VISIBLE_LAYER,
  CAD_SHOW_ALL,
  CAD_GROUP_ENTITIES,
  CAD_EDITMODE_SET_ACTIVE_LINE,
  CAD_EDITMODE_UNSELECT_ACTIVE_LINE,
  CAD_IS_CHANGED,
  CAD_SELECT_LINE
} from '../actions/cad'

import {
  SNAPSHOT_ADD,
  SNAPSHOT_LOAD_SCENE
} from '../actions/panelSnapshots'

import {
  EDIT_IS_EDIT,
  EDIT_SELECT_POINT,
  EDIT_CANCEL,
  EDIT_SAVE_POINT,
  EDIT_NEW_LINE,
  EDIT_CANCEL_NEW_LINE,
  EDIT_LINE_FIRST_POINT,
  EDIT_NEW_LINE_SAVE,
  EDIT_SAVE,
  EDIT_NEW_CURVE,
  EDIT_CANCEL_NEW_CURVE,
  EDIT_CURVE_CENTER_POINT,
  EDIT_CURVE_RADIUS,
  EDIT_THETA_START,
  EDIT_NEW_CURVE_SAVE,
  EDIT_DELETE_LINE,
  EDIT_CLONE_OBJECT,
  EDIT_CLONE_ACTIVE,
  EDIT_CLONE_POINT,
  EDIT_CLONE_SAVE,
  EDIT_CLONE_CANCEL,
  EDIT_MIRROR,
  EDIT_MOVE_OBJECT_ACTIVE,
  EDIT_MOVE_OBJECT_CANCEL,
  EDIT_MOVE_OBJECT_POINT,
  EDIT_MOVE_DISABLE_POINT,
  EDIT_UNGROUP,
  EDIT_ROTATION_AVTIVE,
  EDIT_ROTATION_ANGLE,
  EDIT_ROTATION_SAVE
} from '../actions/edit'

import {
  POINT_INFO_ACTIVE,
  POINT_INFO_MOVE,
  POINT_INFO_DISABLE
} from '../actions/pointInfo'
import { SNAPSHOT_LOAD_OBJECT } from '../actions/panelObjects'

let initialState = {
  scene: null,
  camera: null,
  renderer: null,
  cadCanvas: null,
  activeEntities: [],
  activeLine: null,
  editMode: {
    isEdit: false,
    beforeEdit: {},
    editObject: {},
    activeLine: {},
    selectPointIndex: null,
    isNewLine: false,
    newLineFirst: null,
    isNewCurve: false,
    newCurveCenter: null,
    radius: null,
    start: null,
    thetaStart: null,
    thetaLength: null,
    clone: {
      active: false,
      point: null,
      cloneObject: null
    },
    move: {
      active: false,
      point: null,
      moveObject: null
    },
    rotation: {
      active: false,
      rotationObject: null,
      angle: 0
    }
  },
  pointInfo: {
    style: {
      display: 'none'
    },
    message: ''
  },

  loading: false,
  didInvalidate: false,
  items: [],
  error: null,
  lastUpdated: null,
  isChanged: false,
  objectsIds: []
}

const cad = (state = initialState, action) => {
  switch (action.type) {

    case EDIT_ROTATION_AVTIVE:
      return update(state, {
        editMode: {
          rotation: {
            active: {$set: action.payload.active},
            rotationObject: {$set: action.payload.rotationObject}
          }
        }
      })

    case EDIT_ROTATION_ANGLE:
      return update(state, {
        editMode: {
          rotation: {
            angle: {$set: action.payload.angle}
          }
        }
      })
    case EDIT_ROTATION_SAVE:
      return update(state, {
        editMode: {
          rotation: {
            active: {$set: action.payload.active},
            angle: {$set: action.payload.angle}
          }
        }
      })

    case EDIT_UNGROUP:
      return {
        ...state,
        scene: action.payload.scene
      }

    case CAD_SELECT_LINE:
      return {
        ...state,
        activeLine: action.payload.activeLine
      }

    case EDIT_MOVE_OBJECT_ACTIVE:
      return update(state, {
        editMode: {
          move: {
            active: {$set: action.payload.active},
            moveObject: {$set: action.payload.moveObject}
          }
        }
      })
    case EDIT_MOVE_OBJECT_CANCEL:
      return update(state, {
        editMode: {move: {$set: action.payload.move}}
      })
    case EDIT_MOVE_OBJECT_POINT:
      return update(state, {
        editMode: {move: {point: {$set: action.payload.point}}}
      })
    case EDIT_MOVE_DISABLE_POINT:
      return update(state, {
        editMode: {move: {point: {$set: action.payload.point}}}
      })

    case EDIT_MIRROR:
      return update(state, {
        editMode: {editObject: {$set: action.payload.editObject}}
      })
    case EDIT_CLONE_CANCEL:
      return update(state, {
        editMode: {clone: {$set: action.payload.clone}}
      })
    case EDIT_CLONE_SAVE:
      return update(state, {
        editMode: {clone: {$set: action.payload.clone}}
      })
    case EDIT_CLONE_ACTIVE:
      return update(state, {
        editMode: {clone: {active: {$set: action.payload.active}}}
      })
    case EDIT_CLONE_POINT:
      return update(state, {
        editMode: {clone: {point: {$set: action.payload.point}}}
      })
    case EDIT_CLONE_OBJECT:
      return update(state, {
        editMode: {clone: {cloneObject: {$set: action.payload.cloneObject}}}
      })

    case EDIT_DELETE_LINE:
      return update(state, {
        editMode: {activeLine: {$set: action.payload.activeLine}}
      })

    case EDIT_NEW_CURVE:
      return update(state, {
        editMode: {isNewCurve: {$set: action.payload.isNewCurve}}
      })
    case EDIT_CANCEL_NEW_CURVE:
      return update(state, {
        editMode: {
          isNewCurve: {$set: action.payload.isNewCurve},
          newCurveCenter: {$set: action.payload.newCurveCenter},
          radius: {$set: action.payload.radius},
          start: {$set: action.payload.start},
          thetaStart: {$set: action.payload.thetaStart},
          thetaLength: {$set: action.payload.thetaLength}
        }
      })
    case EDIT_CURVE_CENTER_POINT:
      return update(state, {
        editMode: {newCurveCenter: {$set: action.payload.firstPoint}}
      })
    case EDIT_CURVE_RADIUS:
      return update(state, {
        editMode: {
          radius: {$set: action.payload.radius},
          start: {$set: action.payload.start}
        }
      })
    case EDIT_THETA_START:
      return update(state, {
        editMode: {thetaStart: {$set: action.payload.thetaStart}}
      })
    case EDIT_NEW_CURVE_SAVE:
      return update(state, {
        editMode: {
          isNewCurve: {$set: action.payload.isNewCurve},
          newCurveCenter: {$set: action.payload.newCurveCenter},
          radius: {$set: action.payload.radius},
          start: {$set: action.payload.start},
          thetaStart: {$set: action.payload.thetaStart},
          thetaLength: {$set: action.payload.thetaLength}
        }
      })

    case EDIT_NEW_LINE_SAVE:
      return update(state, {
        editMode: {
          isNewLine: {$set: action.payload.isNewLine},
          newLineFirst: {$set: action.payload.firstPoint}
        }
      })
    case EDIT_LINE_FIRST_POINT:
      return update(state, {
        editMode: {newLineFirst: {$set: action.payload.firstPoint}}
      })
    case EDIT_CANCEL_NEW_LINE:
      return update(state, {
        editMode: {
          isNewLine: {$set: action.payload.isNewLine},
          newLineFirst: {$set: action.payload.newLineFirst}
        }
      })
    case EDIT_NEW_LINE:
      return update(state, {
        editMode: {isNewLine: {$set: action.payload.isNewLine}}
      })

    case POINT_INFO_ACTIVE:
      return update(state, {
        pointInfo: {style: {$set: action.payload.style}}
      })
    case POINT_INFO_MOVE:
      return update(state, {
        pointInfo: {
          style: {$set: action.payload.style},
          message: {$set: action.payload.message}
        }
      })
    case POINT_INFO_DISABLE:
      return update(state, {
        pointInfo: {
          style: {$set: action.payload.style},
          message: {$set: action.payload.message}
        }
      })

    case EDIT_SAVE_POINT:
      return update(state, {
        editMode: {selectPointIndex: {$set: action.payload.index}}
      })
    case EDIT_CANCEL:
      return update(state, {
        editMode: {$set: action.payload.editMode}
      })
    case EDIT_SAVE:
      return update(state, {
        editMode: {$set: action.payload.editMode}
      })
    case EDIT_SELECT_POINT:
      return update(state, {
        editMode: {
          selectPointIndex: {$set: action.payload.selectPointIndex}
        }
      })

    case CAD_EDITMODE_SET_ACTIVE_LINE:
      return update(state, {
        editMode: {
          activeLine: {$set: action.payload.activeLine}
        }
      })
    case CAD_EDITMODE_UNSELECT_ACTIVE_LINE:
      return update(state, {
        editMode: {
          activeLine: {$set: action.payload.activeLine}
        }
      })

    case EDIT_IS_EDIT:
      return update(state, {
        editMode: {
          isEdit: {$set: action.payload.isEdit},
          beforeEdit: {$set: action.payload.beforeEdit},
          editObject: {$set: action.payload.editObject},
          activeLine: {$set: action.payload.activeLine}
        },
        scene: {$set: action.payload.scene},
        isChanged: {$set: action.payload.isChanged}
      })
    case SNAPSHOT_LOAD_SCENE:
      return {
        ...state,
        scene: action.payload.scene,
        isChanged: action.payload.isChanged
      }
    case SNAPSHOT_LOAD_OBJECT:
      return {
        ...state,
        scene: action.payload.scene,
        objectsIds: action.payload.objectsIds,
        isChanged: action.payload.isChanged
      }
    case CAD_DRAW_DXF:
      return {
        ...state,
        scene: action.payload.scene,
        camera: action.payload.camera,
        renderer: action.payload.renderer,
        cadCanvas: action.payload.cadCanvas
      }
    case CAD_DO_SELECTION:
      return update(state, {
        activeEntities: {$set: [...action.payload.activeEntities]},
        activeLine: {$set: action.payload.activeLine}
      })
    case CAD_TOGGLE_VISIBLE:
      return update(state, {activeEntities: {$set: [...state.activeEntities]}})
    case CAD_TOGGLE_VISIBLE_LAYER:
      return update(state, {scene: {children: {$set: [...state.scene.children]}}})
    case CAD_SHOW_ALL:
      return update(state, {
        scene: {children: {$set: [...state.scene.children]}},
        activeEntities: {$set: [...state.activeEntities]}
      })
    case CAD_GROUP_ENTITIES:
      return update(state, {
        scene: {children: {$set: [...state.scene.children]}},
        isChanged: {$set: action.payload.isChanged}
      })

    case SNAPSHOT_ADD:
      return {
        ...state,
        isChanged: action.payload.isChanged
      }
    case CAD_IS_CHANGED:
      return {
        ...state,
        isChanged: action.payload.isChanged
      }
    default:
      return state
  }
}

export default cad
