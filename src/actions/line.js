import { createLine, crossingPoint, helpArc } from '../services/editObject';
import sceneService from '../services/sceneService';
import { movePointInfo } from './pointInfo';
import { CAD_DO_SELECTION } from './cad';
import GeometryUtils from '../services/GeometryUtils';
import * as THREE from 'three';

export const LINE_TWO_POINT = 'LINE_TWO_POINT';

export const LINE_PARALLEL = 'LINE_PARALLEL';
export const LINE_PARALLEL_CLEAR = 'LINE_PARALLEL_CLEAR';
export const LINE_PARALLEL_BASE = 'LINE_PARALLEL_BASE';
export const LINE_PARALLEL_FIRST_POINT = 'LINE_PARALLEL_FIRST_POINT';

export const LINE_PERPENDICULAR = 'LINE_PERPENDICULAR';
export const LINE_PERPENDICULAR_CLEAR = 'LINE_PERPENDICULAR_CLEAR';
export const LINE_PERPENDICULAR_BASE = 'LINE_PERPENDICULAR_BASE';
export const LINE_PERPENDICULAR_FIRST_POINT = 'LINE_PERPENDICULAR_FIRST_POINT';

export const LINE_TANGENT_TO_ARC = 'LINE_TANGENT_TO_ARC';
export const LINE_TANGENT_TO_ARC_CLEAR = 'LINE_TANGENT_TO_ARC_CLEAR';
export const LINE_TANGENT_TO_ARC_BASE = 'LINE_TANGENT_TO_ARC_BASE';

const tangentName = 'tangentLine';

export const parallelLine = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  // console.log('clickResult =', clickResult)
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  let activeEntities = sceneService.doSelection(
    clickResult.activeEntities,
    editor
  );
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing')(dispatch)
      : movePointInfo(event, 'Click to select base line')(dispatch);
    dispatch({
      type: CAD_DO_SELECTION,
      payload: { activeEntities }
    });
  };
};

export const parallelLineSelect = baseLine => {
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_BASE,
      payload: { baseLine }
    });
  };
};

export const parallelLineFirstPoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing')(dispatch)
      : movePointInfo(event, 'Click to select first point')(dispatch);
  };
};

export const parallelLineSecondPoint = (
  event,
  editor,
  baseLine,
  firstPoint,
  distance,
  parent
  //distance = 0
) => {
  let { scene, camera, renderer } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);

  // let newLayer = scene.getObjectByName('newLayer');
  // if (!newLayer) {
  //   newLayer = new THREE.Object3D();
  //   newLayer.name = 'newLayer';
  //   scene.getObjectByName('Layers').add(newLayer);
  // }

  const parallelLine = scene.getObjectByName('parallelLine');
  const perpendicular = scene.getObjectByName('linePerpendicular');

  if (parallelLine) {
    parallelLine.parent.remove(parallelLine);
  }
  if (perpendicular) {
    perpendicular.parent.remove(perpendicular);
  }

  let parallelPoint;
  if (baseLine.geometry.vertices[0].y === baseLine.geometry.vertices[1].y) {
    // console.log('|| Ox')
    parallelPoint = {
      x: mousePoint.x,
      y: firstPoint.y
    };
  } else if (
    baseLine.geometry.vertices[0].x === baseLine.geometry.vertices[1].x
  ) {
    // console.log('|| Oy')
    parallelPoint = {
      x: firstPoint.x,
      y: mousePoint.y
    };
  } else {
    /**
     * Ах + Ву + С = 0.
     * y = kx + b
     * k = (y2 - y1) / (x2 - x1)
     * b = y - kx
     * k1 = -1/ k2 => Perpendicular
     * k1 = k2 => Parallel
     */
    const k1 =
      (baseLine.geometry.vertices[1].y - baseLine.geometry.vertices[0].y) /
      (baseLine.geometry.vertices[1].x - baseLine.geometry.vertices[0].x);
    const b1 =
      baseLine.geometry.vertices[0].y - k1 * baseLine.geometry.vertices[0].x;
    const b1Parallel = firstPoint.y - k1 * firstPoint.x;

    const k2Perpendicular = -(1 / k1);
    const b2Perpendicular = mousePoint.y - k2Perpendicular * mousePoint.x;

    const perpendicularPoint = {
      x: (b2Perpendicular - b1) / (k1 - k2Perpendicular),
      y: k1 * ((b2Perpendicular - b1) / (k1 - k2Perpendicular)) + b1
    };
    const linePerpendicular = createLine(mousePoint, perpendicularPoint);
    linePerpendicular.name = 'linePerpendicular';
    // newLayer.add(linePerpendicular)

    parallelPoint = {
      x: (b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular),
      y:
        k1 * ((b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular)) +
        b1Parallel
    };
  }

  const lineParallel = createLine(firstPoint, parallelPoint);
  lineParallel.name = 'parallelLine';
  // newLayer.add(lineParallel); // todo це треба?
  // debugger;
  parent.add(lineParallel);

  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing')(dispatch)
      : movePointInfo(event, 'Click to select second point')(dispatch);
  };
};

export const parallelLineFirstPointSelect = (event, editor, baseLine) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const first = crossing ? crossing : mousePoint;
  const distance = GeometryUtils.distanseToLinePoint(baseLine, first);
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_FIRST_POINT,
      payload: { first, distance }
    });
  };
};

export const parallelLineSecondPointSelect = (event, editor) => {
  let { scene, camera, renderer } = editor;
  const parallelLine = scene.getObjectByName('parallelLine');
  parallelLine.name = '';
  renderer.render(scene, camera);
  return dispatch => {
    dispatch({
      type: LINE_PARALLEL_CLEAR
    });
  };
};

export const perpendicularBaseLine = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let activeEntities = sceneService.doSelection(
    clickResult.activeEntities,
    editor
  );
  return dispatch => {
    movePointInfo(event, 'Click to select base line')(dispatch);
    dispatch({
      type: CAD_DO_SELECTION,
      payload: { activeEntities }
    });
  };
};

export const perpendicularLineSelect = baseLine => {
  return dispatch => {
    dispatch({
      type: LINE_PERPENDICULAR_BASE,
      payload: { baseLine }
    });
  };
};

export const perpendicularFirstPoint = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing')(dispatch)
      : movePointInfo(event, 'Click to select first point')(dispatch);
  };
};

export const perpendicularFirstPointSelect = (event, editor /*, baseLine*/) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  const first = crossing ? crossing : mousePoint;
  return dispatch => {
    dispatch({
      type: LINE_PERPENDICULAR_FIRST_POINT,
      payload: { first }
    });
  };
};

export const perpendicularDraw = (
  event,
  editor,
  baseLine,
  firstPoint,
  parent
) => {
  let secondPoint;
  let { scene, camera, renderer } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);

  // let newLayer = scene.getObjectByName('newLayer');
  // if (!newLayer) {
  //   newLayer = new THREE.Object3D();
  //   newLayer.name = 'newLayer';
  //   scene.getObjectByName('Layers').add(newLayer);
  // }

  const perpendicular = scene.getObjectByName('linePerpendicular');
  if (perpendicular) {
    perpendicular.parent.remove(perpendicular);
  }

  if (baseLine.geometry.vertices[0].y === baseLine.geometry.vertices[1].y) {
    // console.log('perpendicular Ox')
    secondPoint = {
      x: firstPoint.x,
      y: mousePoint.y
    };
  } else if (
    baseLine.geometry.vertices[0].x === baseLine.geometry.vertices[1].x
  ) {
    // console.log('perpendicular Oy')
    secondPoint = {
      x: mousePoint.x,
      y: firstPoint.y
    };
  } else {
    /**
     * y = kx + b
     * k = (y2 - y1) / (x2 - x1) => (x1, y1) first base line point, (x2, y2) second base line point,
     * b = y - kx
     * k1 = -1/ k2 => Perpendicular line
     * k1 = k2 => Parallel line
     * y1 = k1 * x1 + b1
     * y2 = k2 * x2 + b2
     * point intersects y1 & y2 :
     * pointX = (b2 - b1) / (k1 - k2)
     * pointY = k1 * ((b2 - b1) / (k1 - k2)) + b1
     */
    const k1 =
      (baseLine.geometry.vertices[1].y - baseLine.geometry.vertices[0].y) /
      (baseLine.geometry.vertices[1].x - baseLine.geometry.vertices[0].x);
    const b1Parallel = mousePoint.y - k1 * mousePoint.x;
    const k2Perpendicular = -(1 / k1);
    const b2Perpendicular = firstPoint.y - k2Perpendicular * firstPoint.x;
    secondPoint = {
      x: (b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular),
      y:
        k1 * ((b2Perpendicular - b1Parallel) / (k1 - k2Perpendicular)) +
        b1Parallel
    };
  }
  const linePerpendicular = createLine(firstPoint, secondPoint);
  linePerpendicular.name = 'linePerpendicular';
  // newLayer.add(linePerpendicular); // todo це треба?
  parent.add(linePerpendicular);
  renderer.render(scene, camera);
  return dispatch => {
    crossing
      ? movePointInfo(event, 'Crossing')(dispatch)
      : movePointInfo(event, 'Click to select point')(dispatch);
  };
};

export const perpendicularSecondPointSelect = (event, editor) => {
  let { scene, camera, renderer } = editor;
  const perpendicular = scene.getObjectByName('linePerpendicular');
  if (perpendicular) {
    perpendicular.name = '';
    renderer.render(scene, camera);
  }
  return dispatch => {
    dispatch({
      type: LINE_PERPENDICULAR_CLEAR
    });
  };
};

export const tangentBaseArc = (event, editor) => {
  let { scene, camera } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  const circle = clickResult.activeEntities.filter(item => {
    return item.geometry instanceof THREE.CircleGeometry;
  });
  let activeEntities = sceneService.doSelection(circle, editor);
  return dispatch => {
    movePointInfo(event, 'Click to select base arc')(dispatch);
    dispatch({
      type: CAD_DO_SELECTION,
      payload: { activeEntities }
    });
  };
};

export const tangentBaseArcSelect = baseArc => {
  return dispatch => {
    dispatch({
      type: LINE_TANGENT_TO_ARC_BASE,
      payload: { baseArc }
    });
  };
};

export const tangentLineDraw = (event, editor, baseArc, parent) => {
  let { scene, camera, renderer } = editor;
  sceneService.removeLineByName(tangentName, scene);
  let clickResult = sceneService.onClick(event, scene, camera);
  let mousePoint = {
    x: clickResult.point.x,
    y: clickResult.point.y
  };
  const crossing = crossingPoint(mousePoint, clickResult.activeEntities);
  // let newLayer = scene.getObjectByName('newLayer');
  // if (!newLayer) {
  //   newLayer = new THREE.Object3D();
  //   newLayer.name = 'newLayer';
  //   scene.getObjectByName('Layers').add(newLayer);
  // }
  const distance = GeometryUtils.getDistance(mousePoint, baseArc.position);
  const radius = baseArc.geometry.parameters.radius;
  const helpRadius = Math.sqrt(distance * distance - radius * radius);
  const helpArc1 = helpArc(helpRadius);
  helpArc1.position.x = mousePoint.x;
  helpArc1.position.y = mousePoint.y;
  const intersect = GeometryUtils.arcsIntersect(baseArc, helpArc1);
  if (intersect) {
    const tangentLine = createLine(mousePoint, intersect.intersectPoint);
    tangentLine.name = tangentName;
    // newLayer.add(tangentLine); //todo це треба?
    parent.add(tangentLine);
  }
  renderer.render(scene, camera);
  return dispatch => {
    if (crossing) {
      movePointInfo(event, 'Crossing')(dispatch);
    } else if (!intersect) {
      movePointInfo(event, 'It is impossible to construct a tangent')(dispatch);
    } else {
      movePointInfo(event, 'Click to select point')(dispatch);
    }
  };
};

export const tangentLineEnd = (event, editor) => {
  let { scene, camera, renderer } = editor;
  const tangent = scene.getObjectByName(tangentName);
  if (tangent) {
    tangent.name = '';
    renderer.render(scene, camera);
  }
  return dispatch => {
    dispatch({
      type: LINE_TANGENT_TO_ARC_CLEAR
    });
  };
};
