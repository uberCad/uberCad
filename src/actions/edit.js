import * as THREE from '../extend/THREE';
import {
  setColor,
  setOriginalColor,
  startPointIndex,
  changeGeometry,
  crossingPoint,
  createLine,
  helpArc,
  newArc,
  circleIntersectionAngle,
  editThetaLenght,
  clone,
  fixPosition,
  mirrorObject,
  getScale,
  addHelpPoints,
  rotationPoint,
  changeArcGeometry
} from '../services/editObject';
import sceneService from '../services/sceneService';
import { activePoint, disablePoint, movePointInfo } from './pointInfo';
import GeometryUtils from '../services/GeometryUtils';

export const EDIT_IS_EDIT = 'EDIT_IS_EDIT';
export const EDIT_CANCEL = 'EDIT_CANCEL';
export const EDIT_SAVE = 'EDIT_SAVE';
export const EDIT_SELECT_POINT = 'EDIT_SELECT_POINT';
export const EDIT_MOVE_POINT = 'EDIT_MOVE_POINT';
export const EDIT_SAVE_POINT = 'EDIT_SAVE_POINT';

export const EDIT_NEW_LINE = 'EDIT_NEW_LINE';
export const EDIT_CANCEL_NEW_LINE = 'EDIT_CANCEL_NEW_LINE';
export const EDIT_LINE_FIRST_POINT = 'EDIT_LINE_FIRST_POINT';
export const EDIT_NEW_LINE_SAVE = 'EDIT_NEW_LINE_SAVE';

export const EDIT_NEW_CURVE = 'EDIT_NEW_CURVE';
export const EDIT_CANCEL_NEW_CURVE = 'EDIT_CANCEL_NEW_CURVE';
export const EDIT_CURVE_CENTER_POINT = 'EDIT_CURVE_CENTER_POINT';
export const EDIT_CURVE_RADIUS = 'EDIT_CURVE_RADIUS';
export const EDIT_THETA_START = 'EDIT_THETA_START';
export const EDIT_THETA_LENGTH = 'EDIT_THETA_LENGTH';
export const EDIT_NEW_CURVE_SAVE = 'EDIT_NEW_CURVE_SAVE';

export const EDIT_DELETE_LINE = 'EDIT_DELETE_LINE';

export const EDIT_CLONE_ACTIVE = 'EDIT_CLONE_ACTIVE';
export const EDIT_CLONE_POINT = 'EDIT_CLONE_POINT';
export const EDIT_CLONE_OBJECT = 'EDIT_CLONE_OBJECT';
export const EDIT_CLONE_SAVE = 'EDIT_CLONE_SAVE';
export const EDIT_CLONE_CANCEL = 'EDIT_CLONE_CANCEL';

export const EDIT_MIRROR = 'EDIT_MIRROR';

export const EDIT_MOVE_OBJECT_ACTIVE = 'EDIT_MOVE_OBJECT_ACTIVE';
export const EDIT_MOVE_OBJECT_CANCEL = 'EDIT_MOVE_OBJECT_CANCEL';
export const EDIT_MOVE_OBJECT_POINT = 'EDIT_MOVE_OBJECT_POINT';
export const EDIT_MOVE_DISABLE_POINT = 'EDIT_MOVE_DISABLE_POINT';

export const EDIT_UNGROUP = 'EDIT_UNGROUP';

export const EDIT_ROTATION_AVTIVE = 'EDIT_ROTATION_AVTIVE';
export const EDIT_ROTATION_ANGLE = 'EDIT_ROTATION_ANGLE';
export const EDIT_ROTATION_SAVE = 'EDIT_ROTATION_SAVE';

export const EDIT_SCALE_AVTIVE = 'EDIT_SCALE_AVTIVE';
export const EDIT_SCALE_SAVE = 'EDIT_SCALE_SAVE';
export const EDIT_SCALE_CHANGE = 'EDIT_SCALE_CHANGE';

export const isEdit = (option, editor, object = {}) => {
  let activeLine = {};
  let { scene, camera, renderer } = editor;
  object.userData.parentName = object.parent.name;
  const beforeEdit = JSON.stringify(object);
  if (option) {
    scene.getObjectByName('HelpLayer').children = [];
    let bgColor = new THREE.Color(0xaaaaaa);
    let objColor = new THREE.Color(0x00ff00);
    setColor(scene, bgColor, object.id, objColor);
  } else {
    setOriginalColor(scene);
  }
  if (object instanceof THREE.Line) {
    activeLine = object;
    const rPoint = getScale(camera);
    object.name = 'ActiveLine';
    addHelpPoints(object, scene, rPoint);
  }
  renderer.render(scene, camera);
  return dispatch =>
    dispatch({
      type: EDIT_IS_EDIT,
      payload: {
        isEdit: option,
        beforeEdit: beforeEdit,
        editObject: object,
        scene: editor.scene,
        isChanged: true,
        activeLine
      }
    });
};

export const cancelEdit = (editor, editObject, backUp) => {
  if (backUp && !editObject.metadata) {
    //for developer after save/restart, editObject = json object
    let loader = new THREE.ObjectLoader();
    const object = loader.parse(JSON.parse(backUp));
    editObject.parent.remove(editObject);
    editor.scene.getObjectByName(object.userData.parentName).add(object);
  }
  editor.scene.getObjectByName('HelpLayer').children = [];
  sceneService.fixSceneAfterImport(editor.scene);
  GeometryUtils.fixObjectsPaths(editor.scene);
  setOriginalColor(editor.scene);
  editor.renderer.render(editor.scene, editor.camera);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_CANCEL,
      payload: {
        editMode: {
          isEdit: false,
          beforeEdit: {},
          editObject: {},
          activeLine: {},
          selectPointIndex: null,
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
        }
      }
    });
  };
};

export const saveEdit = editor => {
  editor.scene.getObjectByName('HelpLayer').children = [];
  setOriginalColor(editor.scene);
  editor.renderer.render(editor.scene, editor.camera);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_SAVE,
      payload: {
        editMode: {
          isEdit: false,
          beforeEdit: {},
          editObject: {},
          activeLine: {},
          selectPointIndex: null,
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
        }
      }
    });
  };
};

export const selectPoint = (lines, event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const selectPointIndex = startPointIndex(lines, mousePoint, editor);

  // todo це тимчаасове рішення з змінною ліній в editor.editMode.activeLine
  lines.forEach(line => {
    if (line.geometry.type === 'CircleGeometry') {
      if (!line.userData.helpGeometry) {
        line.userData.helpGeometry = {};
      }
      line.userData.helpGeometry.helpLength =
        line.geometry.parameters.thetaLength;
      line.userData.helpGeometry.helpStart =
        line.geometry.parameters.thetaStart;
    }
  });
  return dispatch => {
    activePoint()(dispatch);
    dispatch({
      type: EDIT_SELECT_POINT,
      payload: { selectPointIndex }
    });
  };
};

export const movePoint = (lines, index, event, editor) => {
  let { scene, camera, cadCanvas } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let point = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(point, clickResult.activeEntities);
  const pointCnange = crossing ? crossing : point;
  changeGeometry(lines, index, pointCnange, scene, editor);

  cadCanvas.render();
  // renderer.render(scene, camera);

  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing point')(dispatch)
      : disablePoint()(dispatch);
    dispatch({
      type: EDIT_MOVE_POINT,
      payload: {}
    });
  };
};

export const savePoint = () => {
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_SAVE_POINT,
      payload: { index: null }
    });
  };
};

//* Create new line
export const newLine = () => {
  return dispatch => {
    dispatch({
      type: EDIT_NEW_LINE,
      payload: { isNewLine: true }
    });
  };
};

export const cancelNewLine = editor => {
  let { scene, camera, renderer } = editor;
  const line = scene.getObjectByName('newLine');
  if (line) {
    line.parent.remove(line);
    renderer.render(scene, camera);
  }
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_CANCEL_NEW_LINE,
      payload: {
        isNewLine: false,
        newLineFirst: null
      }
    });
  };
};

export const firstPoint = (event, editor) => {
  editor.editMode.isNewLine = true;
  // debugger;
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const firstPoint = crossing ? crossing : mousePoint;

  return dispatch => {
    dispatch({
      type: EDIT_LINE_FIRST_POINT,
      payload: { firstPoint }
    });
  };
};

export const startNewLine = (event, editor, copyPoint) => {
  let { scene, camera } = editor;
  let mousePoint;
  let clickResult = sceneService.onClick(event, scene, camera);
  if (!copyPoint) {
    mousePoint = {
      x: clickResult.point.x,
      y: clickResult.point.y
    };
  } else {
    mousePoint = {
      x: copyPoint.x,
      y: copyPoint.y
    };
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing first')(dispatch)
      : movePointInfo(event, 'Select first')(dispatch);
  };
};

export const drawLine = (event, editor, parent, copyPoint) => {
  // debugger;
  //16.03.20 що в радиелю зараз робота з созданием линии
  // console.log(parent);
  // debugger;

  let { scene, camera, renderer, editMode, cadCanvas } = editor;

  if (!parent.uuid) {
    parent = cadCanvas.getNewLineLayer();
  }
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint;
  if (!copyPoint) {
    mousePoint = {
      x: clickResult.point.x,
      y: clickResult.point.y
    };
  } else {
    mousePoint = {
      x: copyPoint[1].x,
      y: copyPoint[1].y
    };
    editMode.newLineFirst = {
      x: copyPoint[0].x,
      y: copyPoint[0].y
    };
  }

  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const secondPoint = crossing ? crossing : mousePoint;

  let changeLine = scene.getObjectByName('newLine');
  if (changeLine) {
    changeGeometry([changeLine], [1], secondPoint, scene, editor);
  } else {
    const line = createLine(editMode.newLineFirst, secondPoint);
    if (parent.children.length) {
      line.userData.originalColor = parent.children[0].userData.originalColor;
    } else {
      line.userData.originalColor = 0x808000;
    }
    parent.add(line);
  }
  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing second')(dispatch)
      : movePointInfo(event, 'Select second')(dispatch);
  };
};

export const saveNewLine = editor => {
  // debugger;
  editor.editMode.isNewLine = false;
  const line = editor.scene.getObjectByName('newLine');
  if (line) {
    line.name = '';
  }
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_NEW_LINE_SAVE,
      payload: {
        isNewLine: false,
        newLineFirst: null
      }
    });
  };
};

//* Create new curve
export const newCurve = () => {
  return dispatch => {
    dispatch({
      type: EDIT_NEW_CURVE,
      payload: { isNewCurve: true }
    });
  };
};

export const cancelNewCurve = editor => {
  let { scene, camera, renderer } = editor;
  scene.getObjectByName('HelpLayer').children = [];
  const line = scene.getObjectByName('newLine');
  if (line) {
    line.parent.remove(line);
  }
  renderer.render(scene, camera);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_CANCEL_NEW_CURVE,
      payload: {
        isNewCurve: false,
        newCurveCenter: null,
        radius: null,
        start: null,
        thetaStart: null,
        thetaLength: null
      }
    });
  };
};

export const centerPoint = (event, editor, copyPoint) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint;
  if (!copyPoint) {
    mousePoint = {
      x: clickResult.point.x,
      y: clickResult.point.y
    };
  } else {
    mousePoint = {
      x: copyPoint.x,
      y: copyPoint.y
    };
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const firstPoint = crossing ? crossing : mousePoint;

  return dispatch => {
    dispatch({
      type: EDIT_CURVE_CENTER_POINT,
      payload: { firstPoint }
    });
  };
};

export const centerCurve = (event, editor, copyPoint) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint;
  if (!copyPoint) {
    mousePoint = {
      x: clickResult.point.x,
      y: clickResult.point.y
    };
  } else {
    mousePoint = {
      x: copyPoint.x,
      y: copyPoint.y
    };
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing center')(dispatch)
      : movePointInfo(event, 'Click to add center')(dispatch);
  };
};

export const radius = (event, editor, copyPoint) => {
  let { scene, camera, renderer, editMode } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint;
  if (!copyPoint) {
    mousePoint = {
      x: clickResult.point.x,
      y: clickResult.point.y
    };
  } else {
    mousePoint = {
      x: copyPoint.x,
      y: copyPoint.y
    };
  }
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const start = !crossing ? mousePoint : crossing;
  let radius = Math.sqrt(
    (editMode.newCurveCenter.x - start.x) *
      (editMode.newCurveCenter.x - start.x) +
      (editMode.newCurveCenter.y - start.y) *
        (editMode.newCurveCenter.y - start.y)
  );
  let helpLine = helpArc(radius);
  helpLine.position.x = editMode.newCurveCenter.x;
  helpLine.position.y = editMode.newCurveCenter.y;
  const oldHelpLine = scene.getObjectByName('helpLine');
  if (oldHelpLine) oldHelpLine.parent.remove(oldHelpLine);
  scene.getObjectByName('HelpLayer').add(helpLine);
  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing thetaStart')(dispatch)
      : movePointInfo(event, 'Click to add thetaStart')(dispatch);
    dispatch({
      type: EDIT_CURVE_RADIUS,
      payload: { radius, start }
    });
  };
};

export const thetaStart = editor => {
  return dispatch => {
    dispatch({
      type: EDIT_THETA_START,
      payload: { thetaStart: editor.editMode.start }
    });
  };
};

export const thetaLength = (event, editor, parent, curveParam) => {
  let { scene, camera, renderer, editMode } = editor;

  // todo curveParam - параметри для круга по координатам
  const thetaStart = curveParam ?
     curveParam.thetaStart
     : circleIntersectionAngle(
    editMode.thetaStart,
    editMode.newCurveCenter
  );
  const oldLine =
    scene.getObjectByName('newLine') ||
    newArc(curveParam ? curveParam.radius : editMode.radius, thetaStart, 0.1); // editMode.radius =>   curveParam.radius
// debugger;

  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = curveParam ? {
    x: curveParam.thetaLength.x,
    y: curveParam.thetaLength.y
  } : {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const length = !crossing ? mousePoint : crossing;
  const t = editThetaLenght(length, oldLine);

  let line = newArc(editMode.radius, t.thetaStart, t.thetaLength);
  line.userData.helpGeometry = t;

  line.position.x = curveParam ? curveParam.newCurveCenter.x : editMode.newCurveCenter.x;
  line.position.y = curveParam ? curveParam.newCurveCenter.y : editMode.newCurveCenter.y;

  if (oldLine && oldLine.parent) oldLine.parent.remove(oldLine);
  line.userData.originalColor = parent.children[0].userData.originalColor;
  parent.add(line);

  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing thetaLength')(dispatch)
      : movePointInfo(event, 'Click to add thetaLength')(dispatch);
    dispatch({
      type: EDIT_THETA_LENGTH,
      payload: {}
    });
  };
};

export const saveNewCurve = editor => {
  let { scene, camera, renderer } = editor;
  let line = scene.getObjectByName('newLine');
  if (line) {
    line.name = '';
  }
  scene.getObjectByName('HelpLayer').children = [];
  renderer.render(scene, camera);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_NEW_CURVE_SAVE,
      payload: {
        isNewCurve: false,
        newCurveCenter: null,
        radius: null,
        start: null,
        thetaStart: null,
        thetaLength: null
      }
    });
  };
};

export const deleteLine = (editor, line) => {
  let { scene, camera, renderer } = editor;
  line.parent.remove(line);
  scene.getObjectByName('HelpLayer').children = [];
  renderer.render(scene, camera);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_DELETE_LINE,
      payload: { activeLine: {} }
    });
  };
};

export const cloneObject = (editor, object) => {
  let { scene, camera, renderer } = editor;
  const cloneObject = clone(object);
  let objects = scene.getObjectByName('Objects');
  objects.add(cloneObject);
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: EDIT_CLONE_OBJECT,
      payload: { cloneObject }
    });
  };
};

export const setClone = (event, editor) => {
  let { scene, camera, renderer } = editor;
  let cloneObject = editor.editMode.clone.cloneObject;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const p = !crossing ? mousePoint : crossing;
  cloneObject.position.set(
    p.x - editor.editMode.clone.point.x,
    p.y - editor.editMode.clone.point.y,
    0
  );
  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing point')(dispatch)
      : movePointInfo(event, 'Click to select paste point')(dispatch);
    dispatch({
      type: EDIT_CLONE_OBJECT,
      payload: { cloneObject }
    });
  };
};

export const selectClonePoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing point')(dispatch)
      : movePointInfo(event, 'Click to select clone point')(dispatch);
  };
};

export const clonePoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  const point = {
    x: clickResult.point.x,
    y: clickResult.point.y,
    z: 0
  };
  return dispatch => {
    dispatch({
      type: EDIT_CLONE_POINT,
      payload: { point }
    });
  };
};

export const cloneActive = active => {
  return dispatch => {
    dispatch({
      type: EDIT_CLONE_ACTIVE,
      payload: { active }
    });
  };
};

export const saveClone = object => {
  fixPosition(object);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_CLONE_SAVE,
      payload: {
        clone: {
          active: false,
          point: null,
          cloneObject: null
        }
      }
    });
  };
};

export const cancelClone = (editor, cloneObject) => {
  if (cloneObject) {
    let { scene, camera, renderer } = editor;
    cloneObject.parent.remove(cloneObject);
    renderer.render(scene, camera);
  }
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_CLONE_CANCEL,
      payload: {
        clone: {
          active: false,
          point: null,
          cloneObject: null
        }
      }
    });
  };
};

export const mirror = (object, editor, option) => {
  let { scene, camera, renderer } = editor;
  const editObject = mirrorObject(object, option);
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: EDIT_MIRROR,
      payload: {
        editObject
      }
    });
  };
};

export const moveActive = object => {
  return dispatch => {
    dispatch({
      type: EDIT_MOVE_OBJECT_ACTIVE,
      payload: {
        active: true,
        moveObject: object
      }
    });
  };
};

export const cancelMove = () => {
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_MOVE_OBJECT_CANCEL,
      payload: {
        move: {
          active: false,
          point: null,
          moveObject: null
        }
      }
    });
  };
};

export const selectMovePoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing point')(dispatch)
      : movePointInfo(event, 'Click to select move point')(dispatch);
  };
};

export const moveObjectPoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  const point = {
    x: clickResult.point.x,
    y: clickResult.point.y,
    z: 0
  };
  return dispatch => {
    dispatch({
      type: EDIT_MOVE_OBJECT_POINT,
      payload: { point }
    });
  };
};

export const disableMovePoint = object => {
  fixPosition(object);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_MOVE_DISABLE_POINT,
      payload: { point: null }
    });
  };
};

export const moveObject = (event, editor) => {
  let { scene, camera, renderer } = editor;
  let moveObject = editor.editMode.move.moveObject;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const p = !crossing ? mousePoint : crossing;
  moveObject.position.set(
    p.x - editor.editMode.move.point.x,
    p.y - editor.editMode.move.point.y,
    0
  );
  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing point')(dispatch)
      : movePointInfo(event, 'Select paste point')(dispatch);
  };
};

export const ungroup = (editor, object) => {
  let { scene, camera, renderer } = editor;
  let layers = scene.getObjectByName('Layers');
  let parent;
  layers.children.forEach(item => {
    if (item.name === object.name) {
      parent = item;
    }
  });
  if (!parent) {
    layers.add(object);
  } else {
    while (object.children.length) {
      const line = object.children.pop();
      parent.add(line);
    }
    object.parent.remove(object);
  }
  setOriginalColor(scene);
  renderer.render(scene, camera);
  return dispatch =>
    dispatch({
      type: EDIT_UNGROUP,
      payload: {
        scene
      }
    });
};

export const rotationActive = (active, rotationObject = null) => {
  return dispatch => {
    dispatch({
      type: EDIT_ROTATION_AVTIVE,
      payload: {
        active: !active,
        rotationObject: rotationObject.toJSON()
      }
    });
  };
};

export const rotationAngle = (angle, object, editor) => {
  let { scene, camera, renderer } = editor;
  let sceneOject = scene.getObjectByName(object.object.name);
  let box0 = new THREE.BoxHelper(sceneOject, 0x222222);
  sceneOject.children = [];
  const radian = angle === 0 ? 0 : (angle * Math.PI) / 180;

  let loader = new THREE.ObjectLoader();
  const rotation = loader.parse(object);
  sceneService.fixSceneAfterImport(rotation);
  while (rotation.children.length) {
    const line = rotation.children.pop();
    sceneOject.add(line);
  }

  sceneOject.children.forEach(children => {
    if (children.geometry instanceof THREE.CircleGeometry) {
      const newPoint = rotationPoint(
        children.position,
        box0.geometry.boundingSphere.center,
        radian
      );
      children.position.x = newPoint.x;
      children.position.y = newPoint.y;

      children.geometry.parameters.thetaStart += radian;
      children.geometry = changeArcGeometry(
        children.geometry,
        children.geometry.parameters
      );
    } else if (children.geometry instanceof THREE.Geometry) {
      children.geometry.vertices.forEach(vertex => {
        rotationPoint(vertex, box0.geometry.boundingSphere.center, radian);
      });
      children.geometry.verticesNeedUpdate = true;
      children.computeLineDistances();
      children.geometry.computeBoundingSphere();
    }
  });
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: EDIT_ROTATION_ANGLE,
      payload: {
        angle
      }
    });
  };
};

export const rotationSave = () => {
  return dispatch => {
    dispatch({
      type: EDIT_ROTATION_SAVE,
      payload: {
        active: false,
        angle: 0
      }
    });
  };
};

export const scaleActive = scaleObject => {
  return dispatch => {
    dispatch({
      type: EDIT_SCALE_AVTIVE,
      payload: {
        active: true,
        scaleObject: scaleObject.toJSON()
      }
    });
  };
};

export const scaleSave = () => {
  return dispatch => {
    dispatch({
      type: EDIT_SCALE_SAVE,
      payload: {
        active: false,
        scaleObject: null,
        scale: 1
      }
    });
  };
};

export const scaleChange = scale => {
  return dispatch => {
    dispatch({
      type: EDIT_SCALE_CHANGE,
      payload: { scale }
    });
  };
};

export const setScale = (scale, object, editor) => {
  let { scene, camera, renderer } = editor;
  let sceneOject = scene.getObjectByName(object.object.name);
  sceneOject.children = [];

  let loader = new THREE.ObjectLoader();
  const scaleObject = loader.parse(object);
  sceneService.fixSceneAfterImport(scaleObject);
  while (scaleObject.children.length) {
    const line = scaleObject.children.pop();
    sceneOject.add(line);
  }
  let box0 = new THREE.BoxHelper(sceneOject, 0x222222);
  GeometryUtils.scale(sceneOject, scale);
  let box1 = new THREE.BoxHelper(sceneOject, 0x222222);
  sceneOject.position.set(
    box0.geometry.boundingSphere.center.x -
      box1.geometry.boundingSphere.center.x,
    box0.geometry.boundingSphere.center.y -
      box1.geometry.boundingSphere.center.y,
    box0.geometry.boundingSphere.center.z -
      box1.geometry.boundingSphere.center.z
  );
  fixPosition(sceneOject);
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: 'SET_SCALE'
    });
  };
};
