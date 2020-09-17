import update from 'immutability-helper';

import {
  CAD_DRAW_DXF,
  CAD_DO_SELECTION,
  CAD_UNDO,
  CAD_REDO,
  CAD_TOGGLE_VISIBLE,
  CAD_TOGGLE_VISIBLE_LAYER,
  CAD_SHOW_ALL,
  CAD_GROUP_ENTITIES,
  CAD_EDITMODE_SET_ACTIVE_LINE,
  CAD_EDITMODE_UNSELECT_ACTIVE_LINE,
  CAD_IS_CHANGED,
  CAD_SELECT_LINE
} from '../actions/cad';

import { setGeometryForObjectWithHelpOfHelpPoints } from '../services/editObject';

import { MATERIAL_SET } from '../actions/materials';

import { SNAPSHOT_ADD, SNAPSHOT_LOAD_SCENE } from '../actions/panelSnapshots';

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
  CREATE_CLONE_OBJECT,
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
  EDIT_ROTATION_SAVE,
  EDIT_SCALE_AVTIVE,
  EDIT_SCALE,
  EDIT_SCALE_SAVE,
  EDIT_SCALE_CHANGE
} from '../actions/edit';

import {
  POINT_INFO_ACTIVE,
  POINT_INFO_MOVE,
  POINT_INFO_DISABLE
} from '../actions/pointInfo';
import { SNAPSHOT_LOAD_OBJECT } from '../actions/panelObjects';

let initialState = {
  scene: null,
  sceneChildrenHistory: [],
  currentScene: null,
  activeSceneChildren: {
    canRedo: false,
    counter: 0,
    canUndo: false
  },
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
    },
    scale: {
      active: false,
      scaleObject: null,
      scale: 1
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
};

const cad = (state = initialState, action) => {
  switch (action.type) {
    case EDIT_SCALE_AVTIVE:
      return update(state, {
        editMode: {
          scale: {
            active: {
              $set: action.payload.active
            },
            scaleObject: {
              $set: action.payload.scaleObject
            }
          }
        }
      });

    case EDIT_SCALE_SAVE:
      return update(state, {
        editMode: {
          scale: {
            active: {
              $set: action.payload.active
            },
            scaleObject: {
              $set: action.payload.scaleObject
            },
            scale: {
              $set: action.payload.scale
            }
          }
        }
      });
    case EDIT_SCALE_CHANGE:
      return update(state, {
        editMode: {
          scale: {
            scale: {
              $set: action.payload.scale
            }
          }
        }
      });

    case EDIT_ROTATION_AVTIVE:
      return update(state, {
        editMode: {
          rotation: {
            active: {
              $set: action.payload.active
            },
            rotationObject: {
              $set: action.payload.rotationObject
            }
          }
        }
      });

    case EDIT_ROTATION_ANGLE:
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        editMode: update(state.editMode, {
          rotation: {
            angle: {
              $set: action.payload.angle
            }
          }
        })
      };
    case EDIT_ROTATION_SAVE:
      return update(state, {
        editMode: {
          rotation: {
            active: {
              $set: action.payload.active
            },
            angle: {
              $set: action.payload.angle
            }
          }
        }
      });

    case EDIT_UNGROUP:
      console.log(5);
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, { $set: action.payload.scene })
      };
    case MATERIAL_SET:
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, { $set: action.payload.scene })
      };
    case EDIT_SCALE:
      // set current version of state and increase counter
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, {
          $set: action.payload.scene
        })
      };

    case CAD_SELECT_LINE:
      return {
        ...state,
        activeLine: action.payload.activeLine
      };

    case EDIT_MOVE_OBJECT_ACTIVE:
      console.log(1);
      return update(state, {
        editMode: {
          move: {
            active: {
              $set: action.payload.active
            },
            moveObject: {
              $set: action.payload.moveObject
            }
          }
        }
      });
    case EDIT_MOVE_OBJECT_CANCEL:
      console.log(2);
      return update(state, {
        editMode: {
          move: {
            $set: action.payload.move
          }
        }
      });
    case EDIT_MOVE_OBJECT_POINT:
      console.log(3, state.sceneChildrenHistory);
      return {
        ...state,
        editMode: update(state.editMode, {
          move: {
            point: {
              $set: action.payload.point
            }
          }
        })
      };
    case EDIT_MOVE_DISABLE_POINT:
      console.log(4);
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        editMode: update(state.editMode, {
          move: {
            point: {
              $set: action.payload.point
            }
          }
        })
      };
    case EDIT_MIRROR:
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        editMode: update(state.editMode, {
          editObject: {
            $set: action.payload.editObject
          }
        })
      };
    case EDIT_CLONE_CANCEL:
      return update(state, {
        editMode: {
          clone: {
            $set: action.payload.clone
          }
        }
      });
    case EDIT_CLONE_SAVE:
      return update(state, {
        editMode: {
          clone: {
            $set: action.payload.clone
          }
        }
      });
    case EDIT_CLONE_ACTIVE:
      return update(state, {
        editMode: {
          clone: {
            active: {
              $set: action.payload.active
            }
          }
        }
      });
    case EDIT_CLONE_POINT:
      return update(state, {
        editMode: {
          clone: {
            point: {
              $set: action.payload.point
            }
          }
        }
      });
    case CREATE_CLONE_OBJECT:
      return {
        ...state,
        // sceneChildrenHistory: [
        //   ...state.sceneChildrenHistory.slice(
        //   0,
        //   state.activeSceneChildren.counter
        // ),
        //   {
        //     scene: action.payload.previousScene
        //   }
        // ],
        // currentScene: action.payload.scene,
        // activeSceneChildren: {
        //   canUndo: true,
        //   counter: state.activeSceneChildren.counter + 1,
        //   canRedo: false
        // },
        editMode: update(state.editMode, {
          clone: {
            cloneObject: {
              $set: action.payload.cloneObject
            }
          }
        })
      };
    case EDIT_CLONE_OBJECT:
      return update(state, {
        editMode: {
          clone: {
            cloneObject: {
              $set: action.payload.cloneObject
            }
          }
        }
      });

    case EDIT_DELETE_LINE:
      return update(state, {
        editMode: {
          activeLine: {
            $set: action.payload.activeLine
          }
        }
      });

    case EDIT_NEW_CURVE:
      return update(state, {
        editMode: {
          isNewCurve: {
            $set: action.payload.isNewCurve
          }
        }
      });
    case EDIT_CANCEL_NEW_CURVE:
      return update(state, {
        editMode: {
          isNewCurve: {
            $set: action.payload.isNewCurve
          },
          newCurveCenter: {
            $set: action.payload.newCurveCenter
          },
          radius: {
            $set: action.payload.radius
          },
          start: {
            $set: action.payload.start
          },
          thetaStart: {
            $set: action.payload.thetaStart
          },
          thetaLength: {
            $set: action.payload.thetaLength
          }
        }
      });
    case EDIT_CURVE_CENTER_POINT:
      return update(state, {
        editMode: {
          newCurveCenter: {
            $set: action.payload.firstPoint
          }
        }
      });
    case EDIT_CURVE_RADIUS:
      return update(state, {
        editMode: {
          radius: {
            $set: action.payload.radius
          },
          start: {
            $set: action.payload.start
          }
        }
      });
    case EDIT_THETA_START:
      return update(state, {
        editMode: {
          thetaStart: {
            $set: action.payload.thetaStart
          }
        }
      });
    case EDIT_NEW_CURVE_SAVE:
      return update(state, {
        editMode: {
          isNewCurve: {
            $set: action.payload.isNewCurve
          },
          newCurveCenter: {
            $set: action.payload.newCurveCenter
          },
          radius: {
            $set: action.payload.radius
          },
          start: {
            $set: action.payload.start
          },
          thetaStart: {
            $set: action.payload.thetaStart
          },
          thetaLength: {
            $set: action.payload.thetaLength
          }
        }
      });

    case EDIT_NEW_LINE_SAVE:
      return update(state, {
        editMode: {
          isNewLine: {
            $set: action.payload.isNewLine
          },
          newLineFirst: {
            $set: action.payload.firstPoint
          }
        }
      });
    case EDIT_LINE_FIRST_POINT:
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        editMode: update(state.editMode, {
          newLineFirst: {
            $set: action.payload.firstPoint
          }
        })
      };
    case EDIT_CANCEL_NEW_LINE:
      return update(state, {
        editMode: {
          isNewLine: {
            $set: action.payload.isNewLine
          },
          newLineFirst: {
            $set: action.payload.newLineFirst
          }
        }
      });
    case EDIT_NEW_LINE:
      return update(state, {
        editMode: {
          isNewLine: {
            $set: action.payload.isNewLine
          }
        }
      });

    case POINT_INFO_ACTIVE:
      return update(state, {
        pointInfo: {
          style: {
            $set: action.payload.style
          }
        }
      });
    case POINT_INFO_MOVE:
      return update(state, {
        pointInfo: {
          style: {
            $set: action.payload.style
          },
          message: {
            $set: action.payload.message
          }
        }
      });
    case POINT_INFO_DISABLE:
      return update(state, {
        pointInfo: {
          style: {
            $set: action.payload.style
          },
          message: {
            $set: action.payload.message
          }
        }
      });

    case EDIT_SAVE_POINT:
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene,
            ...action.payload.undoData
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        editMode: update(state.editMode, {
          selectPointIndex: {
            $set: action.payload.index
          }
        })
      };
    case EDIT_CANCEL:
      return update(state, {
        editMode: {
          $set: action.payload.editMode
        }
      });
    case EDIT_SAVE:
      return update(state, {
        editMode: {
          $set: action.payload.editMode
        }
      });
    case EDIT_SELECT_POINT:
      return {
        ...state,
        editMode: update(state.editMode, {
          selectPointIndex: {
            $set: action.payload.selectPointIndex
          }
        })
      };
    case CAD_EDITMODE_SET_ACTIVE_LINE:
      return update(state, {
        editMode: {
          activeLine: {
            $set: action.payload.activeLine
          }
        }
      });
    case CAD_EDITMODE_UNSELECT_ACTIVE_LINE:
      return update(state, {
        editMode: {
          activeLine: {
            $set: action.payload.activeLine
          }
        }
      });

    case EDIT_IS_EDIT:
      console.log(4, '_________EDIT_IS_EDIT________');
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, {
          $set: action.payload.scene
        }),
        editMode: update(state.editMode, {
          isEdit: {
            $set: action.payload.isEdit
          },
          beforeEdit: {
            $set: action.payload.beforeEdit
          },
          editObject: {
            $set: action.payload.editObject
          },
          activeLine: {
            $set: action.payload.activeLine
          }
        }),
        isChanged: update(state.isChanged, {
          $set: action.payload.isChanged
        })
      };
    case SNAPSHOT_LOAD_SCENE:
      console.log(3);
      return {
        ...state,
        scene: action.payload.scene,
        isChanged: action.payload.isChanged
      };
    case SNAPSHOT_LOAD_OBJECT:
      console.log(2);
      return {
        ...state,
        scene: action.payload.scene,
        objectsIds: action.payload.objectsIds,
        isChanged: action.payload.isChanged
      };
    case CAD_DRAW_DXF:
      console.log(1);
      return {
        ...state,
        scene: action.payload.scene,
        currentScene: action.payload.scene,
        sceneChildrenHistory: [action.payload.scene.clone()],
        sceneElementBeforeRotation: action.payload.scene,
        activeSceneChildren: {
          canRedo: false,
          counter: 0,
          canUndo: false
        },
        camera: action.payload.camera,
        renderer: action.payload.renderer,
        cadCanvas: action.payload.cadCanvas
      };
    case CAD_DO_SELECTION:
      return update(state, {
        activeEntities: {
          $set: [...action.payload.activeEntities]
        },
        activeLine: {
          $set: action.payload.activeLine
        }
      });
    case CAD_TOGGLE_VISIBLE:
      return update(state, {
        activeEntities: {
          $set: [...state.activeEntities]
        }
      });
    case CAD_TOGGLE_VISIBLE_LAYER:
      // set current version of state and increase counter
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, {
          children: {
            $set: [...state.scene.children]
          }
        })
      };
    case CAD_UNDO:
      console.log(
        '___________UNDO____________',
        state.activeSceneChildren.counter,
        state.sceneChildrenHistory
      );
      if (
        state.sceneChildrenHistory.length &&
        state.sceneChildrenHistory.length > 1 &&
        state.sceneChildrenHistory[state.activeSceneChildren.counter - 1]
      ) {
        // set previous version of state and decrease counter
        if (
          state.sceneChildrenHistory[state.activeSceneChildren.counter - 1].mode
        ) {
          setGeometryForObjectWithHelpOfHelpPoints(
            state.sceneChildrenHistory[state.activeSceneChildren.counter - 1],
            state.scene
          );
        }
        const renderer = action.payload.renderer
          ? action.payload.renderer
          : state.cadCanvas.renderer;
        renderer.render(
          state.sceneChildrenHistory[state.activeSceneChildren.counter - 1]
            .scene,
          action.payload.camera ? action.payload.camera : state.camera
        );
        return {
          ...state,
          activeSceneChildren: {
            canUndo: state.activeSceneChildren.counter - 1 !== 0,
            counter: state.activeSceneChildren.counter - 1,
            canRedo: true
          }
          // TODO: check if we don't need to save scene in this position
          // scene:
          //   state.sceneChildrenHistory[state.activeSceneChildren.counter - 1]
          //     .scene
        };
      }
      return state;
    case CAD_REDO:
      console.log(
        '___________REDO____________',
        state.activeSceneChildren.counter,
        state.sceneChildrenHistory
      );
      if (
        state.sceneChildrenHistory.length &&
        state.sceneChildrenHistory.length > 1 &&
        state.sceneChildrenHistory[state.activeSceneChildren.counter + 1]
      ) {
        // set next version of state and increase counter
        if (
          state.sceneChildrenHistory[state.activeSceneChildren.counter + 1].mode
        ) {
          setGeometryForObjectWithHelpOfHelpPoints(
            state.sceneChildrenHistory[state.activeSceneChildren.counter + 1],
            state.scene
          );
        }
        const renderer = action.payload.renderer
          ? action.payload.renderer
          : state.cadCanvas.renderer;
        renderer.render(
          state.sceneChildrenHistory[state.activeSceneChildren.counter + 1]
            .scene,
          action.payload.camera ? action.payload.camera : state.camera
        );
        return {
          ...state,
          activeSceneChildren: {
            canUndo: true,
            counter: state.activeSceneChildren.counter + 1,
            canRedo:
              state.activeSceneChildren.counter + 1 <
              state.sceneChildrenHistory.length + 1
          }
          // TODO: check if we don't need to save scene in this position
          // scene:
          //   state.sceneChildrenHistory[state.activeSceneChildren.counter + 1]
          //     .scene
        };
      } else if (state.activeSceneChildren.canRedo) {
        // make redo to current scene
        const renderer = action.payload.renderer
          ? action.payload.renderer
          : state.cadCanvas.renderer;
        renderer.render(
          state.currentScene,
          action.payload.camera ? action.payload.camera : state.camera
        );
        return {
          ...state,
          activeSceneChildren: {
            canUndo: true,
            counter: state.sceneChildrenHistory.length,
            canRedo: false
          }
          // scene: state.currentScene
        };
      }
      return state;
    case CAD_SHOW_ALL:
      // set current version of state and increase counter
      return {
        ...state,
        sceneChildrenHistory: [
          ...state.sceneChildrenHistory.slice(
            0,
            state.activeSceneChildren.counter > 0
              ? state.activeSceneChildren.counter
              : 1
          ),
          {
            scene: action.payload.previousScene
          }
        ],
        currentScene: action.payload.scene,
        activeSceneChildren: {
          canUndo: true,
          counter: state.activeSceneChildren.counter + 1,
          canRedo: false
        },
        scene: update(state.scene, {
          children: {
            $set: [...state.scene.children]
          }
        }),
        activeEntities: update(state.activeEntities, {
          $set: [...state.activeEntities]
        })
      };
    case CAD_GROUP_ENTITIES:
      console.log(6);
      return update(state, {
        scene: {
          children: {
            $set: [...state.scene.children]
          }
        },
        isChanged: {
          $set: action.payload.isChanged
        }
      });

    case SNAPSHOT_ADD:
      return {
        ...state,
        isChanged: action.payload.isChanged
      };
    case CAD_IS_CHANGED:
      return {
        ...state,
        isChanged: action.payload.isChanged
      };
    default:
      return state;
  }
};

export default cad;
