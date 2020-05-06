import * as THREE from '../extend/THREE';
import { changeGeometry/*, createLine*/ } from './editObject';
import sceneService from './sceneService';

let highlightVertex = (vertices, editor, timeout = 0, radius = 10) => {
  let { cadCanvas } = editor;

  let helpLayer = cadCanvas.getHelpLayer();
  let vertexHighlighters = [];

  let pointGeometry = new THREE.CircleGeometry(radius, 20);
  pointGeometry.vertices.shift();

  pointGeometry.vertices.push(pointGeometry.vertices[0]);

  let pointMaterial = new THREE.LineBasicMaterial({
    color: 0xff4444
  });

  vertices.forEach((vertex, idx) => {
    let point = new THREE.Line(pointGeometry, pointMaterial);
    point.position.x = vertex.x;
    point.position.y = vertex.y;
    point.name = `vertexHighlighter${idx}`;
    vertexHighlighters.push(point);
  });

  helpLayer.add(...vertexHighlighters);

  if (timeout) {
    setTimeout(() => {
      helpLayer.remove(...vertexHighlighters);
      cadCanvas.render();
    }, timeout);
  }
};

let checkGroupMove = editor => {
  let { cadCanvas } = editor;
  let helpLayer = cadCanvas.getHelpLayer();

  helpLayer.children.forEach(point => {
    point.userData.groupMove = false;
  });
  let groupMove = false;
  let radius = 1e-3;
  helpLayer.children.forEach((point, i) => {
    if (point.name === 'pointCenter') {
      point.userData.groupMove = true;
    } else {
      helpLayer.children.forEach((checkPoint, j) => {
        let checkerX =
          (checkPoint.position.x - point.position.x) *
          (checkPoint.position.x - point.position.x);
        let checkerY =
          (checkPoint.position.y - point.position.y) *
          (checkPoint.position.y - point.position.y);
        if (
          checkPoint.userData.groupMove === false &&
          radius > checkerX &&
          radius > checkerY &&
          i !== j
        ) {
          checkPoint.userData.groupMove = true;
          groupMove = true;
        }
      });
      if (point.name === 'pointGeometryCenter' && groupMove === true) {
        point.userData.groupMove = true;
      }
    }
  });
  helpLayer.children.forEach(point => {
    if (
      (point.name === 'End' || point.name === 'Start') &&
      point.userData.groupMove === false &&
      helpLayer.children[helpLayer.children.length - 1].name ===
        'pointGeometryCenter'
    ) {
      helpLayer.children.pop();
    }
  });
  if (
    !groupMove &&
    helpLayer.children[helpLayer.children.length - 1].name ===
      'pointGeometryCenter'
  ) {
    helpLayer.children.pop();
  }
};

let foundNewPoint = (startPoint, endPoint, lengthNewLine) => {
  let xLength = endPoint.x - startPoint.x;
  let yLength = endPoint.y - startPoint.y;
  let lenthOldLine = Math.sqrt(xLength * xLength + yLength * yLength);
  let newPoint = {
    x: startPoint.x + (xLength * lengthNewLine) / lenthOldLine,
    y: startPoint.y + (yLength * lengthNewLine) / lenthOldLine
  };
  return newPoint;
};

let lengthNewLine = (editor, event) => {
  let { camera, scene } = editor;
  let clickResult = sceneService.onClick(event, scene, camera);
  // debugger;
  let newLineLength;
  // if (!points) {
  let lines = [];
  lines[0] = editor.activeEntities[0].geometry.vertices;
  lines[1] = editor.activeEntities[1].geometry.vertices;
  let points = [];
  if (lines[0][0].x === lines[1][0].x && lines[0][0].y === lines[1][0].y) {
    points[0] = lines[0][1];
    points[2] = lines[0][0];
    points[1] = lines[1][1];
    // debugger;
  } else if (
    lines[0][1].x === lines[1][0].x &&
    lines[0][1].y === lines[1][0].y
  ) {
    points[0] = lines[0][0];
    points[2] = lines[0][1];
    points[1] = lines[1][1];
    // debugger;
  } else if (
    lines[0][1].x === lines[1][1].x &&
    lines[0][1].y === lines[1][1].y
  ) {
    points[0] = lines[0][0];
    points[2] = lines[1][1];
    points[1] = lines[1][0];
    // debugger;
  } else if (
    lines[0][0].x === lines[1][1].x &&
    lines[0][0].y === lines[1][1].y
  ) {
    points[0] = lines[0][1];
    points[2] = lines[1][1];
    points[1] = lines[1][0];
    // debugger;
  }
  let checkerI = 0;

  let length0 = lengthLine(
    editor.activeEntities[0].geometry.vertices[0],
    editor.activeEntities[0].geometry.vertices[1]
  );
  let length1 = lengthLine(
    editor.activeEntities[1].geometry.vertices[0],
    editor.activeEntities[1].geometry.vertices[1]
  );
  if (length0 > length1) {
    newLineLength = length1;
    checkerI = 0;
  } else {
    newLineLength = length0;
    checkerI = 1;
  }

  if (
    lines[checkerI][0].x === points[2].x &&
    lines[checkerI][0].y === points[2].y
  ) {
    points[checkerI] = foundNewPoint(
      points[2],
      lines[checkerI][1],
      newLineLength
    );
  } else if (
    lines[checkerI][1].x === points[2].x &&
    lines[checkerI][1].y === points[2].y
  ) {
    points[checkerI] = foundNewPoint(
      points[2],
      lines[checkerI][0],
      newLineLength
    );
  }

  let pointA = checkerI ? points[0] : points[1];
  let pointC = checkerI ? points[1] : points[0];
  let pointB = points[2];
  let pointD = {
    x: (pointA.x + pointC.x) / 2,
    y: (pointA.y + pointC.y) / 2
  };

  let lineAB = lengthLine(pointA, pointB);
  let lineBD = lengthLine(pointD, pointB);
  newLineLength = (lineAB * lineAB) / lineBD;
  let curveCenter = foundNewPoint(pointB, pointD, newLineLength);

  let helpLayer = scene.getObjectByName('HelpLayer');
  let pointCurveCenter = helpLayer.getObjectByName('pointCurveCenter');
  let helpCenterLine = helpLayer.getObjectByName('helpCenterLine');
  if (!pointCurveCenter) {
    let pointGeometry = new THREE.CircleGeometry(
      camera.top / 100,
      32,
      0,
      2 * Math.PI
    );
    pointGeometry.vertices.shift();
    let centralLineColor = 0xff00ff;

    let geometryLine = new THREE.Geometry();
    geometryLine.vertices.push(new THREE.Vector3(pointB.x, pointB.y, 0));
    geometryLine.vertices.push(
      new THREE.Vector3(curveCenter.x, curveCenter.y, 0)
    );

    let materialLine = new THREE.LineBasicMaterial({ color: centralLineColor });
    helpCenterLine = new THREE.Line(geometryLine, materialLine);
    helpCenterLine.name = 'helpCenterLine';

    pointCurveCenter = positionInLine(
      editor,
      helpCenterLine.geometry.vertices,
      clickResult.point
    );
    pointCurveCenter.name = 'pointCurveCenter';

    helpLayer.add(pointCurveCenter);
    helpLayer.add(helpCenterLine);

    pointCurveCenter.userData.B = {
      x: pointB.x,
      y: pointB.y,
      z: pointB.z
    };

    pointCurveCenter.userData.A = pointC;
    pointCurveCenter.userData.C = pointA;

    // todo checker first and second lines

    return pointCurveCenter;
  } else {
    pointCurveCenter = positionInLine(
      editor,
      helpCenterLine.geometry.vertices,
      clickResult.point,
      pointCurveCenter
    );
    return pointCurveCenter;
  }
};

/*
    Δ ABC
    AC -  helpCenterLine
    AD+DC = AC
    B - mousePoint
    h - height - BD
 */
let positionInLine = (editor, lineWithPoint, pointB, point) => {
  let { camera } = editor;
  if (point) {
    let pointA = lineWithPoint[0];
    let pointC = lineWithPoint[1];
    let lineAC = lengthLine(pointA, pointC);
    let lineAB = lengthLine(pointA, pointB);
    let lineBC = lengthLine(pointB, pointC);
    let lineCD =
      (lineAC * lineAC - lineAB * lineAB + lineBC * lineBC) / (2 * lineAC);
    let pointD = foundNewPoint(pointC, pointA, lineCD);

    if (
      ((pointA.x <= pointD.x && pointC.x >= pointD.x) ||
        (pointA.x >= pointD.x && pointC.x <= pointD.x)) &&
      ((pointA.y <= pointD.y && pointC.y >= pointD.y) ||
        (pointA.y >= pointD.y && pointC.y <= pointD.y))
    ) {
      point.position.x = pointD.x;
      point.position.y = pointD.y;
    }
  } else {
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
    point = new THREE.Line(pointGeometry, pointMaterial);
    // point.name = 'pointCurveCenter';
    point.position.x = lineWithPoint[0].x;
    point.position.y = lineWithPoint[0].y;
  }
  // debugger;
  return point;
};

let lengthLine = (firstPoint, endPoint) => {
  let xLength = firstPoint.x - endPoint.x;
  let yLength = firstPoint.y - endPoint.y;
  return Math.sqrt(xLength * xLength + yLength * yLength);
};

/*
lineBD - length helpCenterLine
pointE - pointCurveCenter

 */

let selectCenterPoint = editor => {
  let { scene } = editor;

  let activeEntities = editor.activeEntities;

  let helpLayer = scene.getObjectByName('HelpLayer');
  let pointCurveCenter = helpLayer.getObjectByName('pointCurveCenter');
  let helpCenterLine = helpLayer.getObjectByName('helpCenterLine');

  let pointA = pointCurveCenter.userData.A;
  let pointB = pointCurveCenter.userData.B;
  let pointE = pointCurveCenter.position;

  let lineBD = lengthLine(pointB, helpCenterLine.geometry.vertices[1]);
  let lineBE = lengthLine(pointB, pointE);
  let lineBA = lengthLine(pointB, pointA);

  let cutLength = (lineBE * lineBA) / lineBD;
  let cutPoint = [];
  activeEntities.forEach((line, i) => {
    if (
      line.geometry.vertices[0].x === pointB.x &&
      line.geometry.vertices[0].y === pointB.y
    ) {
      cutPoint[i] = foundNewPoint(
        line.geometry.vertices[0],
        line.geometry.vertices[1],
        cutLength
      );
      changeGeometry([line], [0], cutPoint[i], scene, editor);
    } else {
      cutPoint[i] = foundNewPoint(
        line.geometry.vertices[1],
        line.geometry.vertices[0],
        cutLength
      );
      changeGeometry([line], [1], cutPoint[i], scene, editor);
    }
  });
  pointCurveCenter.userData.A = cutPoint[0];
  pointCurveCenter.userData.C = cutPoint[1];
  pointCurveCenter.userData.radius = lengthLine(pointE, cutPoint[0]);
  pointCurveCenter.userData.EcenterAC = lengthLine(pointE, {
    x: (cutPoint[0].x + cutPoint[1].x) / 2,
    y: (cutPoint[0].y + cutPoint[1].y) / 2
  });
};

// let centerPointLine = (editor, startPoint, endPoint) =>{
//
// };

export default {
  highlightVertex,
  checkGroupMove,
  foundNewPoint,
  lengthNewLine,
  lengthLine,
  positionInLine,
  selectCenterPoint
};
