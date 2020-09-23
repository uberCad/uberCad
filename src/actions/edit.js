import * as THREE from '../extend/THREE';
import {
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
  rotationPoint,
  changeArcGeometry
} from '../services/editObject';
import { activePoint, disablePoint, movePointInfo } from './pointInfo';
import sceneService from '../services/sceneService';
import GeometryUtils from '../services/GeometryUtils';
import helpLayerService from '../services/helpLayerService';

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
export const CREATE_CLONE_OBJECT = 'CREATE_CLONE_OBJECT';
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
export const EDIT_SCALE = 'EDIT_SCALE';
export const EDIT_SCALE_SAVE = 'EDIT_SCALE_SAVE';
export const EDIT_SCALE_CHANGE = 'EDIT_SCALE_CHANGE';

export const selectPoint = (lines, event, editor) => {
  const { scene, camera } = editor;
  const clickResult = sceneService.onClick(event, scene, camera);
  const selectPointIndex = startPointIndex(
    lines,
    {
      x: clickResult.point.x,
      y: clickResult.point.y
    },
    editor
  );

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
  console.log('____________ selectPoint _________');
  return dispatch => {
    activePoint()(dispatch);
    dispatch({
      type: EDIT_SELECT_POINT,
      payload: {
        selectPointIndex
      }
    });
  };
};

export const movePoint = (lines, index, event, editor) => {
  const { scene, camera, renderer } = editor;
  const clickResult = sceneService.onClick(event, scene, camera);
  const point = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  let closestLine = null;
  const activeEntities = clickResult.activeEntities;
  if (activeEntities.length > 0) {
    let distanceToClosestLine;
    // distanceToClosestLine = GeometryUtils.distanceToEntity(point,activeEntities[0]);
    lines.forEach(line => {
      line.name = 'NewObjectLine';
    });
    activeEntities.forEach(entity => {
      const distance = GeometryUtils.distanceToEntity(point, activeEntities[0]);
      // пошук прямих поручі і точки на них на базі crossingPoint і helpLayerService.positionInLine
      if (
        (!distanceToClosestLine || distanceToClosestLine > distance) &&
        entity.name !== 'ActiveLine' &&
        entity.name !== 'NewObjectLine' &&
        entity.name !== 'point1' &&
        entity.name !== 'point2' &&
        entity.name !== 'pointCenter' &&
        entity.name !== 'pointGeometryCenter' &&
        entity.name !== 'Center' &&
        entity.name !== 'Start' &&
        entity.name !== 'End' &&
        entity.name !== 'Radius' &&
        entity.name !== 'newLine' &&
        entity.name !== 'helpLine'
      ) {
        distanceToClosestLine = distance;
        closestLine = entity;
      }
    });
    // пошук прямих поручі і точки на них на базі crossingPoint і helpLayerService.positionInLine
  }

  let crossing = false;

  if (index === 'MOVE_NEW_OBJECT') {
    if (closestLine) {
      const newPointInLine = {
        position: {}
      };
      helpLayerService.positionInLine(
        editor,
        closestLine.geometry.vertices,
        point,
        newPointInLine
      );
      if (newPointInLine.position.x) {
        // перевірка на перетин обєкту який я таскаю і батьківського обєкту closestLine з перевіркою відстані між point і crossing
        crossing = newPointInLine.position;
      }
    }
  } else {
    crossing = crossingPoint(
      point,
      closestLine,
      activeEntities,
      camera.top / 70
    );
  }
  const pointCnange = crossing ? crossing : point;
  changeGeometry(lines, index, pointCnange, scene, editor);
  // cadCanvas.render();
  renderer.render(scene, camera);
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

export const savePoint = ({ scene, activeEntities }) => {
  console.log('____________ savePoint _________', activeEntities);
  const previousScene = scene.clone();
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_SAVE_POINT,
      payload: {
        index: null,
        undoData: {
          mode: 'lineMove',
          ids: [
            ...activeEntities.map(el => ({
              nameObject: el.parent.parent.name,
              nameGroup: el.parent.name,
              id: el.userData.id
            }))
          ]
        },
        previousScene,
        scene
      }
    });
  };
};

//* Create new line
export const newLine = () => {
  console.log('_________ newLine ________');
  return dispatch => {
    dispatch({
      type: EDIT_NEW_LINE,
      payload: { isNewLine: true }
    });
  };
};

export const cancelNewLine = editor => {
  const { scene, camera, renderer } = editor;
  const line = scene.getObjectByName('newLine');
  console.log('____________cancelNewLine_________');
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
  const { scene, camera } = editor;
  const previousScene = scene.clone();
  const clickResult = sceneService.onClick(event, scene, camera);
  const mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const firstPoint = crossing ? crossing : mousePoint;

  console.log('_________firstPoint________');
  return dispatch => {
    dispatch({
      type: EDIT_LINE_FIRST_POINT,
      payload: {
        firstPoint,
        previousScene,
        scene
      }
    });
  };
};

export const startNewLine = (event, editor, copyPoint) => {
  const { scene, camera } = editor;
  const clickResult = sceneService.onClick(event, scene, camera);
  const crossing = crossingPoint(
    {
      x: !copyPoint ? clickResult.point.x : copyPoint.x,
      y: !copyPoint ? clickResult.point.y : copyPoint.y
    },
    clickResult.activeEntities
  );
  console.log('_________startNewLine________');
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing first')(dispatch)
      : movePointInfo(event, 'Select first')(dispatch);
  };
};

export const drawLine = (event, editor, parent, copyPoint) => {
  // debugger;
  //16.03.20 що в радиелю зараз робота з созданием линии
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
      line.userData.originalColor = parent.children[0].userData.originalColor.clone();
    } else {
      line.userData.originalColor.set(new THREE.Color(0x808000));
    }
    parent.add(line);
  }
  console.log('_________drawLine________');
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
  console.log('___________  saveNewLine  _________');
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
  console.log('_________newCurve________');
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
  console.log('___________  cancelNewCurve  _________');
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

  console.log('___________  centerPoint  _________');
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
  console.log('___________  centerCurve  _________');
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
  console.log('______________radius_____________');
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
  console.log('___________  thetaStart  _________');
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
  const thetaStart = curveParam
    ? curveParam.thetaStart
    : circleIntersectionAngle(editMode.thetaStart, editMode.newCurveCenter);
  const oldLine =
    scene.getObjectByName('newLine') ||
    newArc(curveParam ? curveParam.radius : editMode.radius, thetaStart, 0.1); // editMode.radius =>   curveParam.radius
  // debugger;

  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = curveParam
    ? {
        x: curveParam.thetaLength.x,
        y: curveParam.thetaLength.y
      }
    : {
        x: clickResult.point.x,
        y: clickResult.point.y
      };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const length = !crossing ? mousePoint : crossing;
  const t = editThetaLenght(length, oldLine);

  let line = newArc(editMode.radius, t.thetaStart, t.thetaLength);
  line.userData.helpGeometry = t;

  line.position.x = curveParam
    ? curveParam.newCurveCenter.x
    : editMode.newCurveCenter.x;
  line.position.y = curveParam
    ? curveParam.newCurveCenter.y
    : editMode.newCurveCenter.y;

  if (oldLine && oldLine.parent) oldLine.parent.remove(oldLine);
  line.userData.originalColor = parent.children[0].userData.originalColor.clone();
  parent.add(line);

  console.log('______________thetaLength_____________');
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
  console.log('______________ saveNewCurve _____________');
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
  console.log('______________deleteLine_____________');
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
  const { scene, camera, renderer } = editor;
  const previousScene = scene.clone();
  const cloneObject = clone(object);
  const objects = scene.getObjectByName('Objects');
  objects.add(cloneObject);
  console.log('______________cloneObject_____________');
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: CREATE_CLONE_OBJECT,
      payload: {
        cloneObject,
        previousScene,
        scene
      }
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
  console.log('______________setClone_____________');
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
  console.log('______________selectClonePoint_____________');
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
  console.log('___________  clonePoint  _________');
  return dispatch => {
    dispatch({
      type: EDIT_CLONE_POINT,
      payload: { point }
    });
  };
};

export const cloneActive = active => {
  console.log('___________  cloneActive  _________');
  return dispatch => {
    dispatch({
      type: EDIT_CLONE_ACTIVE,
      payload: { active }
    });
  };
};

export const saveClone = object => {
  fixPosition(object);
  console.log('___________  saveClone  _________');
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
  console.log('___________  cancelClone  _________');
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
  const { scene, camera, renderer } = editor;
  const previousScene = scene.clone();
  const editObject = mirrorObject(object, option);
  renderer.render(scene, camera);
  console.log('___________  mirror  _________');
  return dispatch => {
    dispatch({
      type: EDIT_MIRROR,
      payload: {
        editObject,
        scene,
        previousScene
      }
    });
  };
};

export const moveActive = object => {
  console.log('___________  moveActive  _________');
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
  console.log('___________  cancelMove  _________');
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
  const { scene, camera } = editor;
  const clickResult = sceneService.onClick(event, scene, camera);
  const crossing = crossingPoint(
    {
      x: clickResult.point.x,
      y: clickResult.point.y
    },
    clickResult.activeEntities
  );
  console.log('___________  selectMovePoint  _________');
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
  console.log('___________  moveObjectPoint  _________');
  return dispatch => {
    dispatch({
      type: EDIT_MOVE_OBJECT_POINT,
      payload: {
        point
      }
    });
  };
};

export const disableMovePoint = (object, scene) => {
  console.log('___________  disableMovePoint  _________');
  const previousScene = scene.clone();
  fixPosition(object);
  return dispatch => {
    disablePoint()(dispatch);
    dispatch({
      type: EDIT_MOVE_DISABLE_POINT,
      payload: {
        point: null,
        scene,
        previousScene
      }
    });
  };
};

export const moveObject = (event, editor) => {
  console.log('___________  moveObject  _________');
  const { scene, camera, renderer } = editor;
  const clickResult = sceneService.onClick(event, scene, camera);
  const mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const p = !crossing ? mousePoint : crossing;
  editor.editMode.move.moveObject.position.set(
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

// Move object from objects to layers
export const ungroup = (editor, object) => {
  const { scene, camera, renderer } = editor;
  const previousScene = scene.clone();
  const layers = scene.getObjectByName('Layers');
  const parent = layers.children.find(item => item.name === object.name);
  if (!parent) {
    layers.add(object);
  } else {
    while (object.children.length) {
      parent.add(object.children.pop());
    }
    object.parent.remove(object);
  }
  setOriginalColor(scene);
  renderer.render(scene, camera);
  return dispatch =>
    dispatch({
      type: EDIT_UNGROUP,
      payload: {
        scene,
        previousScene
      }
    });
};

export const rotationActive = (active, rotationObject = null) => {
  console.log('___________  rotationActive  _________');
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
  const { scene, camera, renderer } = editor;
  const sceneOject = scene.getObjectByName(object.object.name);
  const box0 = new THREE.BoxHelper(sceneOject, 0x222222);
  sceneOject.children = [];
  const radian = angle === 0 ? 0 : (angle * Math.PI) / 180;

  const rotation = new THREE.ObjectLoader().parse(object);
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
  console.log('___________  rotationAngle  _________');
  const previousScene = scene.clone();
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: EDIT_ROTATION_ANGLE,
      payload: {
        angle,
        previousScene,
        scene
      }
    });
  };
};

export const rotationSave = () => {
  console.log('___________  rotationSave  _________');
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
  console.log('___________  scaleActive  _________');
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
  console.log('___________  scaleSave  _________');
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
  console.log('___________  scaleChange  _________');
  return dispatch => {
    dispatch({
      type: EDIT_SCALE_CHANGE,
      payload: { scale }
    });
  };
};

export const setScale = (scale, object, editor) => {
  let { scene, camera, renderer } = editor;
  const previousScene = scene.clone();
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
  console.log('___________  setScale  _________');
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: EDIT_SCALE,
      payload: {
        previousScene,
        scene
      }
    });
  };
};

export const dovetailPointSearch = (editor, dovetail, newObjectLines) => {
  // 1 шукаємо найдовшу лінію, як правило це бічна сторона яка являється одним слошним елементом
  let longestLine = null;
  let longestLineLength = null;

  // модуль пошуку найдовшої лінії з масиву ліній
  newObjectLines.forEach(line => {
    // debugger;
    if (line.geometry.type === 'Geometry') {
      // debugger;
      if (!longestLine) {
        longestLine = line;
        longestLineLength = GeometryUtils.getDistance(
          line.geometry.vertices[0],
          line.geometry.vertices[line.geometry.vertices.length - 1]
        );
      }
      let thisLineLength = GeometryUtils.getDistance(
        line.geometry.vertices[0],
        line.geometry.vertices[line.geometry.vertices.length - 1]
      );
      if (thisLineLength > longestLineLength) {
        longestLine = line;
        longestLineLength = thisLineLength;
      }
    }
  });

  //todo вирівнювання кута обєкту за біччною стороною (найдовша лінія має статити вертикальною
  // TODO: delete it if no needed
  // let info = GeometryUtils.getObjectInfo(newObjectLines[0].parent);
  // console.log (info);

  let { camera, scene, renderer } = editor;
  let res = GeometryUtils.getRegionClusters(
    newObjectLines[0].parent.userData.edgeModel.regions[0].path,
    5
  );

  let maxDistance = 0;
  let points = [];
  // debugger;
  for (let i = 0; i < res.centroids.length; i++) {
    for (let j = i + 1; j < res.centroids.length; j++) {
      let thisDistance = GeometryUtils.getDistance(
        { x: res.centroids[i][0], y: res.centroids[i][1] },
        { x: res.centroids[j][0], y: res.centroids[j][1] }
      );
      if (thisDistance > maxDistance) {
        maxDistance = thisDistance;
        points[0] = { x: res.centroids[i][0], y: res.centroids[i][1] };
        points[1] = { x: res.centroids[j][0], y: res.centroids[j][1] };
      }
    }
  }

  let helpLayer = scene.getObjectByName('HelpLayer');
  let pointGeometry = new THREE.CircleGeometry(
    camera.top / 100,
    32,
    0,
    2 * Math.PI
  );
  pointGeometry.vertices.shift();
  let centralLineColor = 0xff00ff;
  let pointMaterial = new THREE.LineBasicMaterial({
    color: centralLineColor,
    opacity: 0.8,
    transparent: true
  });
  let point = new THREE.Line(pointGeometry, pointMaterial);
  let point2 = new THREE.Line(pointGeometry, pointMaterial);
  point.name = 'mas';
  point.position.x = points[0].x;
  point.position.y = points[0].y;
  point2.position.x = points[1].x;
  point2.position.y = points[1].y;
  helpLayer.add(point);
  helpLayer.add(point2);
  console.log('___________  dovetailPointSearch  _________');
  renderer.render(scene, camera);

  // знаходимо кут повороту
  // використовуючи rotationAngle повертаємо так щоб лінія з точок points була вертикальною.
  // на  контурі знаходимо точку яка торкається верхнього або нижнього кордону
  // знаходимо праяму яка має невеликий горизонтальний кут і знаходиться недалеко від кордону
  // вирівнємо фігуру так щоб верхня лінія була горизонтальною
  // шукаємо паралельну лінію і приблизно такої ж дліни на нижньому контурі

  // GeometryUtils.getDistance

  // пошук точок і ліній на верхній горизонтальній стороні
  let boundingBox = GeometryUtils.getBoundingBox(newObjectLines[0].parent);

  let linesInBoxSideMin = {};
  let linesInBoxSideMax = {};
  // if (boundingBox.height> boundingBox.width) {
  newObjectLines.forEach(line => {
    // if  (Math.abs(line.geometry.vertices[0].y - boundingBox.min.y) < 0.001
    // || Math.abs(line.geometry.vertices[line.geometry.vertices.length-1].y - boundingBox.min.y) < 0.001
    // ){
    //   let index = null;
    //   line.geometry.vertices.forEach( point => {
    let point = line.geometry.vertices[0];
    if (Math.abs(point.y - boundingBox.max.y) < 0.01) {
      // debugger;
      if (!linesInBoxSideMin.x) {
        linesInBoxSideMin.x = point.x;
        linesInBoxSideMin.y = point.y;
      }
      if (!linesInBoxSideMax.x) {
        linesInBoxSideMax.x = point.x;
        linesInBoxSideMax.y = point.y;
      }
      if (linesInBoxSideMin.x > point.x) {
        linesInBoxSideMin.x = point.x;
        linesInBoxSideMin.y = point.y;
      }
      if (linesInBoxSideMax.x < point.x) {
        linesInBoxSideMax.x = point.x;
        linesInBoxSideMax.y = point.y;
      }
      // debugger;
    }
    // debugger
    point = line.geometry.vertices[line.geometry.vertices.length - 1];
    if (Math.abs(point.y - boundingBox.max.y) < 0.01) {
      // debugger;
      if (!linesInBoxSideMin.x) {
        linesInBoxSideMin.x = point.x;
        linesInBoxSideMin.y = point.y;
      }
      if (!linesInBoxSideMax.x) {
        linesInBoxSideMax.x = point.x;
        linesInBoxSideMax.y = point.y;
      }
      if (linesInBoxSideMin.x > point.x) {
        linesInBoxSideMin.x = point.x;
        linesInBoxSideMin.y = point.y;
      }
      if (linesInBoxSideMax.x < point.x) {
        linesInBoxSideMax.x = point.x;
        linesInBoxSideMax.y = point.y;
      }
    }
  });

  // добавить проверку направления центра мас (от крайньой точке к крайньой точке)

  //порівняння лінії яка утворюється між крайними точками які лежать на горизонтальній стороні баундін бокса з бічною стороною

  // фіксація як точку привязки центр лінії яку знайшли вище
  // debugger;
  if (
    !linesInBoxSideMin.x ||
    !linesInBoxSideMax.x ||
    !linesInBoxSideMin.y ||
    !linesInBoxSideMax.y ||
    boundingBox.width > boundingBox.height
  ) {
    dovetail.x = boundingBox.center.x;
    dovetail.y = boundingBox.center.y;
  } else {
    dovetail.x = (linesInBoxSideMin.x + linesInBoxSideMax.x) / 2;
    dovetail.y = (linesInBoxSideMin.y + linesInBoxSideMax.y) / 2;
  }
};
