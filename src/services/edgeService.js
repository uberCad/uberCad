import * as THREE from '../extend/THREE';

import GeometryUtils from './GeometryUtils';
import ConsoleUtils from './consoleUtils';
import HelpLayerService from './helpLayerService';
import {
  isPoint,
  closestPoint,
  createLine,
  changeArcGeometry as changGeomEditObj
} from './editObject';
import helpLayerService from './helpLayerService';
import sceneService from './sceneService';

let lineDivision = (editor, point, collisionPoints, threshold = 0.0001) => {
  let actionChecker = false;
  point.entities.forEach((line, i) => {
    if (line.name !== '') {
      line.name = '';
    }
  });

  point.entities.forEach((line, lineIndex) => {
    if (line.name !== 'changed line') {
      let lineWithPoint = line;
      let object = line.parent;
      let newLines = false;
      let linePoints;

      if (line.userData.newLines) {
        lineWithPoint = sceneService.searchLineWithPoint(
          line,
          point,
          threshold
        );
        // debugger;
      }

      if (lineWithPoint !== line) {
        point.entities[lineIndex] = null;
        point.entities.push(lineWithPoint);
        // debugger;
      }

      linePoints = sceneService.findWayPoint(lineWithPoint);
      if (
        GeometryUtils.getDistance(point.point, linePoints[0]) > threshold &&
        GeometryUtils.getDistance(point.point, linePoints[1]) > threshold
      ) {
        if (lineWithPoint.geometry.type === 'Geometry') {
          if (
            GeometryUtils.distanceToLine(point.point, lineWithPoint) > threshold
          ) {
            // console.log(GeometryUtils.distanceToLine(point.point, lineWithPoint));
            // console.log('треба дивитись до функцію переноса точок перетину і ліній або дописувати доп алгоритм')
            // debugger;
          }
          newLines = [
            createLine(linePoints[0], point.point),
            createLine(point.point, linePoints[1])
          ];

          // lineWithPoint.geometry.vertices[0].x = point.point.x;
          // lineWithPoint.geometry.vertices[0].y = point.point.y;
        } else if (lineWithPoint.geometry.type === 'CircleGeometry') {
          //todo от 10.09.2020 реалізація з розрахунком ThetaStart і ThetaLengh з подальшим створенням двох нових дуг
          // нові ThetaLengh можна знайти через співвідношення кількості точок дліни і те біля якої з точок vertices точка перетину
          // формування ThetaStart і ThetaLengh можна брати з функционала закруглення кутів
          if (GeometryUtils.distanceToArc(point.point, line) > threshold) {
            // debugger;
          }
          let circlePoints = [];
          let distanceToCirclePoints = [];
          let pointIndex;
          lineWithPoint.userData.reCreate = true;
          lineWithPoint.geometry.vertices.forEach((verticesPoint, i) => {
            circlePoints[i] = {
              x: verticesPoint.x + lineWithPoint.position.x,
              y: verticesPoint.y + lineWithPoint.position.y
            };
            distanceToCirclePoints[i] = GeometryUtils.getDistance(
              point.point,
              circlePoints[i]
            );
          });
          let distance = Math.min(...distanceToCirclePoints);
          pointIndex = distanceToCirclePoints.indexOf(distance);
          // console.log(distance);
          if (
            pointIndex !== 0 &&
            pointIndex !== lineWithPoint.geometry.vertices.length - 1
          ) {
            newLines = [
              GeometryUtils.newCurve(
                lineWithPoint.position,
                lineWithPoint.geometry.parameters.radius,
                circlePoints[0],
                circlePoints[pointIndex],
                editor
              ),
              GeometryUtils.newCurve(
                lineWithPoint.position,
                lineWithPoint.geometry.parameters.radius,
                circlePoints[pointIndex],
                circlePoints[circlePoints.length - 1],
                editor
              )
            ];

            // newLine.position = lineWithPoint.position;
            // let newChangeLine = GeometryUtils.newCurve (lineWithPoint.position,
            //   lineWithPoint.geometry.parameters.radius, circlePoints[pointIndex],
            //   circlePoints[circlePoints.length -1], editor);
            // lineWithPoint.geometry.parameters = {
            //   radius:  newChangeLine.geometry.parameters.radius,
            //   segments:  newChangeLine.geometry.parameters.segments ,
            //   thetaLength:  newChangeLine.geometry.parameters.thetaLength ,
            //   thetaStart:  newChangeLine.geometry.parameters.thetaStart
            // }
            // lineWithPoint.geometry.vertices.forEach( (vertic, i) => {
            //   vertic.x = newChangeLine.geometry.vertices[i].x;
            //   vertic.y = newChangeLine.geometry.vertices[i].y;
            // });
            // let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            // let copyCircleGeometry = changeArcGeometry(
            //   { 0: 'copy' },
            //   {
            //     radius: lineWithPoint.geometry.parameters.radius,
            //     thetaStart: lineWithPoint.geometry.parameters.thetaStart,
            //     thetaLength: lineWithPoint.geometry.parameters.thetaLength
            //   }
            // );
            // // console.log(newLine);
            // lineWithPoint.geometry.vertices.splice(pointIndex + 1,
            //   lineWithPoint.geometry.vertices.length - pointIndex - 1);
            // // console.log(newLine);
            // newLine = new THREE.Line(copyCircleGeometry, materialLine);
            // newLine.position.x = lineWithPoint.position.x;
            // newLine.position.y = lineWithPoint.position.y;
            // // console.log(newLine.geometry.vertices);
            // newLine.geometry.vertices.splice(0, pointIndex);
            // // console.log(newLine.geometry.vertices);
            // lineWithPoint.geometry.vertices [lineWithPoint.geometry.vertices.length - 1].x =
            //   - lineWithPoint.position.x + point.point.x;
            // lineWithPoint.geometry.vertices [lineWithPoint.geometry.vertices.length - 1].y =
            //   - lineWithPoint.position.y + point.point.y;
            // newLine.geometry.vertices [0].x =
            //   - newLine.position.x + point.point.x;
            // newLine.geometry.vertices [0].y =
            //   - newLine.position.y + point.point.y;
          }
        }

        if (newLines) {
          lineWithPoint.userData.needDelete = true;
          point.entities[lineIndex] = null;
          point.entities.push(newLines[0]);
          point.entities.push(newLines[1]);
          // debugger;
          sceneService.drawLine([newLines[1]], editor, 0xff0000);
          sceneService.drawLine([newLines[0]], editor, 0x00ff00);
          actionChecker = true;
          lineWithPoint.name = 'changed line';
          lineWithPoint.geometry.verticesNeedUpdate = true;
          newLines.name = 'NEW LINE';
          // console.log(object.children);
          // debugger;
          // object.geometry.verticesNeedUpdate = true;
          object.add(newLines[0]);
          object.add(newLines[1]);

          if (!lineWithPoint.userData.newLines) {
            lineWithPoint.userData.newLines = [];
          }
          lineWithPoint.userData.newLines.push(newLines[0]);
          lineWithPoint.userData.newLines.push(newLines[1]);
        }
      }
    }
  });
  for (let i = 0; i < point.entities.length; ) {
    if (point.entities[i] !== null) {
      i += 1;
      // debugger;
    } else {
      point.entities.splice(i, 1);
    }
  }
  if (actionChecker) {
    lineDivision(editor, point, collisionPoints, threshold);
  } else {
    sceneService.render(editor);
    return collisionPoints;
  }
};

/**
 * _____________________________________________________________________________________
 *
 * Free space functionality
 * _____________________________________________________________________________________
 *  */
export const combineEdgeModels = (editor, svgForFlixo = false) => {
  const {
    scene,
    renderer,
    camera,
    options: { threshold }
  } = editor;
  const objects = sceneService.getObjects(scene, true);

  if (!objects.length) {
    const error = new Error('No objects for edge-model');
    error.userData = {
      error: 'no objects',
      msg: error.message
    };
    throw error;
  }

  let viewBox = objects[0].userData.edgeModel.svgData.viewBox;
  const box = {
    x: viewBox.x,
    y: viewBox.y,
    x2: +viewBox.x + +viewBox.width,
    y2: +viewBox.y + +viewBox.height
  };

  // width, height, x, y
  objects.forEach(object => {
    const objViewBox = object.userData.edgeModel.svgData.viewBox;
    box.x = Math.min(box.x, objViewBox.x);
    box.y = Math.min(box.y, objViewBox.y);
    box.x2 = Math.max(box.x2, +objViewBox.x + +objViewBox.width);
    box.y2 = Math.max(box.y2, +objViewBox.y + +objViewBox.height);
  });

  // viewBox for SVG
  viewBox = {
    x: box.x,
    y: box.y,
    width: Math.abs(+box.x2 - +box.x),
    height: Math.abs(+box.y2 - +box.y)
  };
  let mul = 25 / Math.max(viewBox.width, viewBox.height);

  // Create copy of object with all points
  let collisionAllPoints = GeometryUtils.getCollisionPoints(objects, threshold);
  let collisionPoints = GeometryUtils.filterOverlappingCollisionPoints(
    collisionAllPoints
  );
  collisionPoints = GeometryUtils.filterCollisionPoints(collisionAllPoints);
  collisionPoints[0].distance = 0;
  collisionPoints.forEach((point, pointInd) => {
    if (pointInd === 0) {
      point.distance = 0;
    }
    lineDivision(editor, point, collisionPoints, 0.001);
  });
  objects.forEach(object => {
    let lineIndex = object.children.length - 1;
    do {
      if (object.children[lineIndex].userData.needDelete) {
        object.children.splice(lineIndex, 1);
      }
      lineIndex -= 1;
    } while (lineIndex > -1);
  });

  let helpLayer = scene.getObjectByName('HelpLayer');
  helpLayer.children = [];
  collisionPoints.forEach(point =>
    helpLayer.add(helpLayerService.positionInLine(editor, [point.point]))
  );
  sceneService.render(editor);
  //step 1 - mark line with collisionPoints
  collisionAllPoints.forEach(point => {
    point.entities.forEach(line => {
      if (!line.userData.collisionPointsInf) {
        line.userData.collisionPointsInf = [];
      }
      if (!line.userData.collisionPointsInf.includes(point)) {
        line.userData.collisionPointsInf.push(point);
      }
    });
  });

  let freeSpacesAll = [];
  let freeSpace = [];
  let entrainment = 0.001;

  let searchTrueNextPoint = (
    thisLine,
    linePoint,
    nextPointLine,
    closesPoint,
    oldLine,
    pieceOfFreeSpace
  ) => {
    let pointO = [];
    pointO[0] = closesPoint.point;
    let deviation = 1e-5;
    //nextLinePointOldObject[index]
    // todo визначення кутів між старою точкою,  точкою перетину і двома новими
    // теоритически далее могут быть случаи когда нужно будет розшырить проверки и улутшить их
    //
    // pointO - точка соприкосновения линий
    // pointStartС - стартовая точка, старт линии которая соприкасается
    // pointNextLineOldObjectD - точка следущёй лини на старом обекте

    let nextPointOldObject = findNextLine(
      nextPointLine.line.parent,
      nextPointLine.line,
      nextPointLine.newFindLinePoint[nextPointLine.index]
    );

    let pointsNewLine = sceneService.findWayPoint(thisLine);
    // let pointsOldLine = [];
    // pointsOldLine[0] = [linePoint,nextPointLine.newFindLinePoint[nextPointLine.index]];

    // if (GeometryUtils.getDistance(closesPoint.point,nextPointLine.newFindLinePoint[nextPointLine.index])<deviation){
    //
    // debugger;
    // }
    // if (GeometryUtils.getDistance(closesPoint.point,linePoint)<deviation){
    //
    // debugger;
    // }

    // let pointsOldLine = sceneService.findWayPoint (oldLine);
    // проверка и настройка путь откуда
    // debugger;
    let pointEndOldLine =
      GeometryUtils.getDistance(
        closesPoint.point,
        nextPointLine.newFindLinePoint[nextPointLine.index]
      ) < deviation
        ? nextPointOldObject.newFindLinePoint[nextPointOldObject.index]
        : nextPointLine.newFindLinePoint[nextPointLine.index];
    // todo я стопорнувся тут. точка Д (pointEndOldLine) щитаяться не коректно

    let pointStartOldLine;
    let pointsOldLine = sceneService.findWayPoint(oldLine);
    if (pointsOldLine[0] === linePoint) {
      pointStartOldLine =
        GeometryUtils.getDistance(closesPoint.point, pointsOldLine[0]) <
        deviation
          ? pointsOldLine[1]
          : pointsOldLine[0];
    } else {
      pointStartOldLine =
        GeometryUtils.getDistance(closesPoint.point, pointsOldLine[1]) <
        deviation
          ? pointsOldLine[0]
          : pointsOldLine[1];
    }
    if (!pointStartOldLine) {
      // debugger;
    }
    // проверка и настройка пути дальше
    if (
      GeometryUtils.getDistance(closesPoint.point, pointsNewLine[0]) < deviation
    ) {
      let nextLine = findNextLine(thisLine.parent, thisLine, pointsNewLine[0]);
      pointsNewLine[0] = nextLine.newFindLinePoint[nextLine.index];
      // debugger;
    }
    if (
      GeometryUtils.getDistance(closesPoint.point, pointsNewLine[1]) < deviation
    ) {
      let nextLine = findNextLine(thisLine.parent, thisLine, pointsNewLine[1]);
      pointsNewLine[1] = nextLine.newFindLinePoint[nextLine.index];
      // debugger;
    }

    // todo  первервірка точки перетину точки наступної і тікущої

    // debugger;
    // let pointO= [];
    // pointO[0] = closesPoint.point;
    // let pointStartС = HelpLayerService.foundNewPoint (pointO[0], linePoint, 4);
    // pointO[1] = HelpLayerService.foundNewPoint (pointStartС, pointO[0], 3);
    let pointNextLineOldObjectD = HelpLayerService.foundNewPoint(
      pointO[0],
      pointEndOldLine,
      5
    );
    // pointO[2] = HelpLayerService.foundNewPoint (pointNextLineOldObjectD, pointO[0], 3);
    // todo добавити/змінити на точку на наступній лінії

    let pointNewLineA = HelpLayerService.foundNewPoint(
      pointO[0],
      pointsNewLine[0],
      4
    );
    // pointO[3] = HelpLayerService.foundNewPoint (pointNewLineA, pointO[0], 3);
    let pointNewLineB = HelpLayerService.foundNewPoint(
      pointO[0],
      pointsNewLine[1],
      4
    );
    // pointO[4] = HelpLayerService.foundNewPoint (pointNewLineB, pointO[0], 3);

    // TODO: delete it if not needed
    // let intersectionIndex = 0;

    let pointOldLineE = HelpLayerService.foundNewPoint(
      pointO[0],
      pointStartOldLine,
      5
    );
    // debugger;
    // TODO: delete it if not needed
    // const {
    //   scene,
    //   camera,
    //   renderer
    // } = editor;
    let helpLayer = scene.getObjectByName('HelpLayer');

    let helpPointA = helpLayerService.positionInLine(
      editor,
      // [pointsNewLine[0]]
      [pointNewLineA]
    );
    let helpPointB = helpLayerService.positionInLine(
      editor,
      // [pointsNewLine[1]]
      [pointNewLineB]
    );
    // let helpPointC = helpLayerService.positionInLine(
    //   editor,
    //   // [linePoint]
    //   [pointStartС]
    // );
    let helpPointD = helpLayerService.positionInLine(
      editor,
      // [pointEndOldLine]
      [pointNextLineOldObjectD]
    );
    let helpPointE = helpLayerService.positionInLine(
      editor,
      // [pointStartOldLine]
      [pointOldLineE]
    );
    let helpPointO = helpLayerService.positionInLine(editor, pointO);
    // проверка на геометрию линии с которой і на которою. в случаю геометрия круга, находим точку не крайню а на выдстані від точки перетину.
    //     if (nextPointLine.line.geometry.type === "CircleGeometry") {
    //       // console.log (thisLine);
    //       debugger;
    //
    //     }

    //перетин
    helpLayer.add(helpPointO);
    // helpLayer.add(helpPointA);
    // helpLayer.add(helpPointB);
    // helpLayer.add(helpPointD);
    // helpLayer.add(helpPointE);
    // renderer.render(scene, camera);
    sceneService.render(editor);
    // debugger;
    // // путь 1
    // helpLayer.add(helpPointA);
    // render (editor);
    // // debugger;
    // // путь 2
    // helpLayer.add(helpPointB);
    // render (editor);
    // // debugger;
    // // откуда
    // helpLayer.add(helpPointE);
    // render (editor);
    // debugger;
    // // куда
    // helpLayer.add(helpPointD);
    // render (editor);
    // debugger;

    // todo від 10.09.2020 подивитись до коректного визначення напрямку руху в старому об'єкті (інколи плутає напрямок звідки і куди

    // 16/07/2020 розібратись з тим які кути повертаються,
    // поставити визначення потрібного індекса
    // let index = 0;
    // let point = GeometryUtils.linesIntersect (closesPoint.point, linePoint, thisLine.geometry.vertices[0], thisLine.geometry.vertices[1]);
    // let intersectionCAwithOD = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineA, pointO[0], pointNextLineOldObjectD, 0.001);
    // let intersectionCAwithOB = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineA, pointO[0], pointNewLineB, 0.001);
    // let intersectionCBwithOD = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineB, pointO[0], pointNextLineOldObjectD, 0.001);
    // let intersectionCBwithOA = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineB, pointO[0], pointNewLineA, 0.001);
    //
    // // console.log ( intersectionCAwithOD);
    // // console.log ( intersectionCAwithOB);
    // // console.log ( intersectionCBwithOD);
    // // console.log ( intersectionCBwithOA);
    //
    // let testPoint = GeometryUtils.pointIntersect({x:0.5, y:1},{x:2, y:1.5},{x:3,y:0.5},{x:3.5,y:2});
    // let test2Point = GeometryUtils.linesIntersect({x:0.5, y:1},{x:2, y:1.5},{x:3,y:0.5},{x:3.5,y:2});
    // let test3Point = GeometryUtils.linesIntersect({x:1, y:3},{x:7, y:1},{x:2,y:1},{x:3,y:5});
    // let test4Point = GeometryUtils.distanseToLinePoint({geometry:{vertices:[{x:1, y:3},{x:7, y:1}]}},{x:1,y:3});

    let pointAinLineOD = GeometryUtils.getDistance(
      pointNewLineA,
      pointNextLineOldObjectD
    );
    let pointBinLineOD = GeometryUtils.getDistance(
      pointNewLineB,
      pointNextLineOldObjectD
    );
    // debugger;

    let returnIndex = null;

    if (returnIndex) {
      debugger;
    }

    if (pointAinLineOD < 1 + deviation) {
      returnIndex = 1;
    }
    if (pointBinLineOD < 1 + deviation) {
      returnIndex = 0;
    }
    let pointAinLineOE = GeometryUtils.getDistance(
      pointNewLineA,
      pointOldLineE
    );
    let pointBinLineOE = GeometryUtils.getDistance(
      pointNewLineB,
      pointOldLineE
    );

    if (pointAinLineOE < 1 + deviation) {
      returnIndex = 0;
    }
    if (pointBinLineOE < 1 + deviation) {
      returnIndex = 1;
    }

    if (returnIndex) {
      // debugger;
      // pushHalfLine (oldLine, pointStartOldLine, pointO, pieceOfFreeSpace);
      // pushHalfLine (thisLine, pointO, pointsNewLine[returnIndex], pieceOfFreeSpace);
      return returnIndex;
    }

    // if (thisLine.geometry.type === "Geometry"){
    // if (intersectionCAwithOD.x && intersectionCAwithOD.y
    //   && intersectionCAwithOB.x && intersectionCAwithOB.y
    //   || !intersectionCAwithOD.x && !intersectionCAwithOD.y
    //   && !intersectionCAwithOB.x && !intersectionCAwithOB.x){
    // if ( !intersectionCBwithOD.isIntersects && !intersectionCBwithOA.isIntersects) {
    //   if (intersectionCAwithOD.isIntersects && intersectionCAwithOB.isIntersects
    //     || !intersectionCAwithOD.isIntersects && !intersectionCAwithOB.isIntersects) {
    //     return 0;
    //   }
    // }
    //   if (intersectionCBwithOD.isIntersects && intersectionCBwithOA.isIntersects
    //     || !intersectionCBwithOD.isIntersects && !intersectionCBwithOA.isIntersects){
    //     return 1;
    //   }
    // debugger;
    // } else if (thisLine.geometry.type === "CircleGeometry"){
    //   //
    //   // console.log ("stop");
    //   // debugger;
    // }

    // let angle0 = GeometryUtils.angleBetweenLines(lineAO, thisLine, 'degree');
    // // console.log (angle0);
    // let angle1 = GeometryUtils.angleBetweenLines(lineAO, lineBO, 'degree');
    // // console.log (angle1);
    // let angle2 = GeometryUtils.angleBetweenLines(lineAO, lineCO, 'degree');
    // // console.log (angle2);
    // debugger;
    // return index;
    //
    // debugger;
    return false;
  };

  // шукає наступну лінію, наступну точку
  const findNextLine = (object, thisLine, linePoint) => {
    for (let i = 0; i < object.children.length; i++) {
      let line = object.children[i];
      let p = false;
      let index;
      let points = sceneService.findWayPoint(line);
      // object.children.forEach((line) => {
      if (line !== thisLine) {
        // if (line.geometry.type === 'Geometry') {
        index = closestPoint(points, linePoint);
        p = isPoint(linePoint, entrainment, points[index]);
        if (p) {
          return {
            newFindLinePoint: [points[1], points[0]],
            line: line,
            index: index
          };
        }
        // } else if (line.geometry.type === 'CircleGeometry') {
        //   index = closestPoint(points, linePoint);
        //   p = isPoint(linePoint, entrainment, points[index]);
        //   if (p) {
        //     return {
        //       newFindLinePoint:[point0, point1],
        //       line: line,
        //       index: index
        //     };
        //   }
        // }
      }
    }
  };

  const nextPoint = (
    object,
    linePoint = null,
    thisLine = null,
    point,
    pieceOfFreeSpace,
    collisionPoints
  ) => {
    let lineCheker = 0;
    let wayPoint = sceneService.findWayPoint(thisLine);
    let startFreeSpaceLengt = freeSpace.length;
    if (!linePoint) {
      linePoint = wayPoint[0];
    }
    let collisionPointsInThisLine = [];
    console.log('_________________ nextPointFunction _________________');
    console.log('object', object);
    console.log('wayPoint', wayPoint);
    console.log('linePoint', linePoint);
    console.log('thisLine', thisLine, thisLine.userData.collisionPointsInf);
    console.log('point', point);
    console.log('pieceOfFreeSpace', pieceOfFreeSpace);
    console.log('collisionPoints', collisionPoints);
    return;
    for (let j = 0; j < thisLine.userData.collisionPointsInf.length; j++) {
      if (collisionPoints.includes(thisLine.userData.collisionPointsInf[j])) {
        collisionPointsInThisLine.push(thisLine.userData.collisionPointsInf[j]);
      }
    }
    let nextPointLine = findNextLine(object, thisLine, linePoint);

    if (!pieceOfFreeSpace[0].includes(thisLine)) {
      freeSpace.push(thisLine);
      pieceOfFreeSpace[0].push(thisLine);
      const newLinePoint = sceneService.findWayPoint(nextPointLine.line);
      console.log('qwerty1', wayPoint[0], newLinePoint[0])
      console.log('qwerty2', wayPoint[0], newLinePoint[1])
      if (
        GeometryUtils.getDistance(wayPoint[0], newLinePoint[0]) < threshold ||
        GeometryUtils.getDistance(wayPoint[0], newLinePoint[1]) < threshold
      ) {
        if (collisionPointsInThisLine.length === 1) {
          pieceOfFreeSpace[1].push(
            sceneService.skive(
              thisLine,
              editor,
              1,
              collisionPointsInThisLine[0].point
            )
          );
        } else {
          // debugger;
        }
      } else if (
        GeometryUtils.getDistance(wayPoint[1], newLinePoint[0]) < threshold ||
        GeometryUtils.getDistance(wayPoint[1], newLinePoint[1]) < threshold
      ) {
        // debugger;
        if (collisionPointsInThisLine.length === 1) {
          pieceOfFreeSpace[1].push(
            sceneService.skive(
              thisLine,
              editor,
              0,
              collisionPointsInThisLine[0].point
            )
          );
        } else {
          // debugger;
        }
      } else {
        debugger;
      }
    }
    for (let i = 0; i < object.children.length; i++) {
      // let p = false;
      // let index = 0;
      // object.children.forEach((line) => {
      // if (line !== thisLine) {
      // if (line.geometry.type === 'Geometry') {
      //   index = closestPoint(line.geometry.vertices, linePoint);
      //   p = isPoint(
      //     linePoint,
      //     entrainment,
      //     line.geometry.vertices[index]
      //   );
      //   if (p) {
      //     newFindLinePoint = [line.geometry.vertices[1],line.geometry.vertices[0]];
      //   }
      // } else if (line.geometry.type === 'CircleGeometry') {
      //   let point0 = {};
      //   let point1 = {};
      //   point0.x = line.geometry.vertices[0].x + line.position.x;
      //   point0.y = line.geometry.vertices[0].y + line.position.y;
      //   point1.x =
      //     line.geometry.vertices[line.geometry.vertices.length - 1].x +
      //     line.position.x;
      //   point1.y =
      //     line.geometry.vertices[line.geometry.vertices.length - 1].y +
      //     line.position.y;
      //   let points = [point0, point1];
      //
      //   index = closestPoint(points, linePoint);
      //   p = isPoint(linePoint, entrainment, points[index]);
      //   if (p) {
      //     newFindLinePoint = [points[1],points[0]];
      //   }
      // }
      // debugger;

      // newFindLinePoint = findNextLine (object, thisLine, linePoint, index);
      nextPointLine = findNextLine(object, thisLine, linePoint);
      let oldLine = thisLine;
      // linePoint = nextPointLine.newFindLinePoint[nextPointLine.index];

      if (nextPointLine) {
        let line = nextPointLine.line;
        let newFindLinePoint = nextPointLine.newFindLinePoint;
        // thisLine = line;
        let index = nextPointLine.index;
        // debugger;
        if (line.userData.collisionPointsInf) {
          // todo лінії які додаються до масиву це нові лінії від точки перетину з наступною || попередньою лінією і точкою перетину строки 1295, 1386, 1417, 1534
          // console.log(freeSpace.length);
          // debugger;
          let checkPoint = false;

          collisionPointsInThisLine = [];
          for (let j = 0; j < line.userData.collisionPointsInf.length; j++) {
            if (collisionPoints.includes(line.userData.collisionPointsInf[j])) {
              collisionPointsInThisLine.push(
                line.userData.collisionPointsInf[j]
              );
            }
          }

          // проверка на пошло по второму колу
          // todo працює зараз каряво, треба пофіксити
          // if (freeSpace.includes(line)){
          //   lineCheker += 1;
          // } else {
          //   lineCheker = 0;
          // }
          // if (lineCheker > 5){
          //   i = object.children.length;
          //   // console.log('лінії пішли по другому кругу.... значить коло');
          //   return;
          // }

          let closesPoint = null;
          let findPoint = [];
          if (collisionPointsInThisLine.length === 1) {
            // pointsNumber ;
            closesPoint = collisionPointsInThisLine[0];
          } else if (collisionPointsInThisLine.length > 1) {
            collisionPointsInThisLine.forEach(point => {
              findPoint.push(point.point);
            });
            closesPoint =
              collisionPointsInThisLine[closestPoint(findPoint, linePoint)];
          }
          if (closesPoint) {
            if (
              closesPoint.weDoneWithThisPoint &&
              !closesPoint.startFromThisPoint
            ) {
              // // console.log('точкки пішли по другому кругу.... значить щось пішло не так');
              // return;
            }
            if (startFreeSpaceLengt !== freeSpace.length) {
              checkPoint = true;
              thisLine = line;
              if (freeSpace.includes(thisLine)) {
                lineCheker += 1;
              } else {
                lineCheker = 0;
              }
              if (lineCheker > 5) {
                if (pieceOfFreeSpace[0].includes(thisLine)) {
                  // console.log('закольцована полость');
                } else {
                  // console.log('лінії вийшли за тереторію кола');
                  // debugger;
                }
                // console.log('лінії пішли по другому кругу.... значить коло');
                return;
              }

              if (!pieceOfFreeSpace[0].includes(thisLine)) {
                // debugger;
                freeSpace.push(thisLine);
                pieceOfFreeSpace[0].push(thisLine);
                //todo вставка sceneService.skive для обробки теперешньої лінії від точки до перетину
                //прослідкувати для точок чи треба змінювати
                let newLinePoint = sceneService.findWayPoint(thisLine);
                let oldLinePoint = sceneService.findWayPoint(oldLine);
                // debugger;
                if (
                  GeometryUtils.getDistance(newLinePoint[0], oldLinePoint[0]) <
                    threshold ||
                  GeometryUtils.getDistance(newLinePoint[0], oldLinePoint[1]) <
                    threshold
                ) {
                  pieceOfFreeSpace[1].push(
                    sceneService.skive(thisLine, editor, 0, closesPoint.point)
                  );
                } else if (
                  GeometryUtils.getDistance(newLinePoint[1], oldLinePoint[0]) <
                    threshold ||
                  GeometryUtils.getDistance(newLinePoint[1], oldLinePoint[1]) <
                    threshold
                ) {
                  pieceOfFreeSpace[1].push(
                    sceneService.skive(thisLine, editor, 1, closesPoint.point)
                  );
                }
              }
              startFreeSpaceLengt = freeSpace.length;
              closesPoint.weDoneWithThisPoint = true;

              if (closesPoint.startFromThisPoint) {
                // console.log('hе is alive!!!!!');
                // debugger;
                i = object.children.length;
                return;
                // debugger;
              } else {
                let entities = closesPoint.entities;

                if (entities[0] === line) {
                  thisLine = entities[1];
                } else if (entities[1] === line) {
                  thisLine = entities[0];
                } else {
                  console.log(
                    'чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, ' +
                      'але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так'
                  );
                }
                if (freeSpace.includes(thisLine)) {
                  lineCheker += 1;
                } else {
                  lineCheker = 0;
                }
                if (lineCheker > 5) {
                  if (pieceOfFreeSpace[0].includes(thisLine)) {
                    // console.log('закольцована полость');
                  } else {
                    // console.log('лінії вийшли за тереторію кола');
                    // debugger;
                  }
                  // console.log('лінії пішли по другому кругу.... значить коло');
                  return;
                }

                startFreeSpaceLengt = freeSpace.length;

                object = thisLine.parent;
                wayPoint = sceneService.findWayPoint(thisLine);

                collisionPointsInThisLine = [];
                for (
                  let j = 0;
                  j < thisLine.userData.collisionPointsInf.length;
                  j++
                ) {
                  if (
                    collisionPoints.includes(
                      thisLine.userData.collisionPointsInf[j]
                    )
                  ) {
                    collisionPointsInThisLine.push(
                      thisLine.userData.collisionPointsInf[j]
                    );
                  }
                }
                // // console.log (collisionPointsInThisLine);
                // if (collisionPointsInThisLine.length === 1) {
                let pointIndex;
                // debugger;
                // todo так як змінився thisLine цілком можливо що мав змінитись newFindLinePoint, потрібно перевірити логіку
                if (newFindLinePoint[index] !== closesPoint) {
                  pointIndex = searchTrueNextPoint(
                    thisLine,
                    linePoint,
                    nextPointLine,
                    closesPoint,
                    oldLine,
                    pieceOfFreeSpace
                  );
                  // todo тут має бути результат функциї // searchTrueNextPoint (thisLine, linePoint)
                } else {
                  // console.log('прийшов час подивитись сюди');
                  debugger;
                }

                if (!pieceOfFreeSpace[0].includes(thisLine)) {
                  freeSpace.push(thisLine);
                  pieceOfFreeSpace[0].push(thisLine);
                  // debugger;
                  if (pointIndex) {
                    pieceOfFreeSpace[1].push(
                      sceneService.skive(
                        thisLine,
                        editor,
                        pointIndex,
                        closesPoint.point
                      )
                    );
                  }
                }

                if (collisionPointsInThisLine.length > 1) {
                  // debugger;
                  // console.log("от ми нарешті і дійшли до ліній на яких декілька важливих точок");
                  // перше що реалізовуємо перевірку чи є точки між тою звідки ідемо(тікуща точка перетену) і точка куди ідемо (wayPoint[pointIndex])
                  //  якщо є повторюємо все що було в цьому форі з позиції скакаємо з цієї лінії на іншу
                  let lengthToWayPoint = [];
                  let newLineClosesPoint = null;
                  let intersectPoint_WayPoint = null;
                  if (pointIndex !== false) {
                    // debugger;
                    lengthToWayPoint.push(
                      GeometryUtils.getDistance(
                        closesPoint.point,
                        wayPoint[pointIndex]
                      )
                    );
                    collisionPointsInThisLine.forEach(collPoint => {
                      // debugger;
                      let collPoint_WayPoint = GeometryUtils.getDistance(
                        collPoint.point,
                        wayPoint[pointIndex]
                      );
                      if (collPoint_WayPoint < lengthToWayPoint[0]) {
                        lengthToWayPoint.push(collPoint);
                        if (collPoint_WayPoint > intersectPoint_WayPoint) {
                          newLineClosesPoint = collPoint;
                          intersectPoint_WayPoint = collPoint_WayPoint;
                        }
                      }
                    });
                    // console.log(lengthToWayPoint)
                    if (lengthToWayPoint.length > 1) {
                      if (!pieceOfFreeSpace[0].includes(thisLine)) {
                        // debugger;
                        freeSpace.push(thisLine);
                        pieceOfFreeSpace[0].push(thisLine);
                        // debugger;
                        pieceOfFreeSpace[1].push(
                          sceneService.skive(
                            thisLine,
                            editor,
                            pointIndex,
                            closesPoint.point
                          )
                        );
                      }
                      nextPointLine = findNextLine(
                        object,
                        thisLine,
                        wayPoint[pointIndex]
                      );
                      oldLine = thisLine;
                      entities = newLineClosesPoint.entities;
                      if (entities[0] === oldLine) {
                        thisLine = entities[1];
                      } else if (entities[1] === oldLine) {
                        thisLine = entities[0];
                      } else {
                        console.log(
                          'чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, ' +
                            'але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так'
                        );
                        // debugger;
                      }

                      if (freeSpace.includes(thisLine)) {
                        lineCheker += 1;
                      } else {
                        lineCheker = 0;
                      }
                      if (lineCheker > 5) {
                        if (pieceOfFreeSpace[0].includes(thisLine)) {
                          // console.log('закольцована полость');
                        } else {
                          // console.log('лінії вийшли за тереторію кола');
                          // debugger;
                        }
                        // console.log('лінії пішли по другому кругу.... значить коло');
                        return;
                      }
                      if (!pieceOfFreeSpace[0].includes(thisLine)) {
                        freeSpace.push(thisLine);
                        pieceOfFreeSpace[0].push(thisLine);
                        // debugger;
                        pieceOfFreeSpace[1].push(thisLine);
                      }
                      startFreeSpaceLengt = freeSpace.length;

                      object = thisLine.parent;
                      if (pointIndex === 0) {
                        linePoint = wayPoint[1];
                      } else {
                        linePoint = wayPoint[0];
                      }

                      newLineClosesPoint.weDoneWithThisPoint = true;
                      pointIndex = searchTrueNextPoint(
                        thisLine,
                        linePoint,
                        nextPointLine,
                        newLineClosesPoint,
                        oldLine,
                        pieceOfFreeSpace
                      );
                      wayPoint = sceneService.findWayPoint(thisLine);
                      // console.log("якщо воно зараз прям запрацює буде круто");
                      // debugger;
                    }
                    // debugger;
                  }
                }

                if (pointIndex !== false) {
                  startFreeSpaceLengt -= 1;
                } else {
                  // debugger;
                  pointIndex = 0;
                }
                linePoint = wayPoint[pointIndex];

                // } else {
                //   // todo 08/07/2020 доробити/переробити цей елс, має працювати дл яліній на якій декілька важливих точок перетину.
                //   // можливо пройтись поштучно по кожній лінії
                //   // console.log ('todo 08/07/2020 доробити/переробити цей елс, має працювати дл яліній на якій декілька важливих точок перетину.' +
                //     'можливо пройтись поштучно по кожній лінії')
                //   // debugger;
                //
                //
                //
                //   let lengthToPoint = [];
                //   // let lengthToPoint1 = [];
                //   collisionPointsInThisLine.forEach(point =>{
                //     lengthToPoint.push(
                //       HelpLayerService.lengthLine(wayPoint[0], point.point));
                //     // lengthToPoint1.push(
                //     //   HelpLayerService.lengthLine(wayPoint[1], point.point));
                //   });
                //   for (let i = 0; i < collisionPointsInThisLine.length; i++){
                //     if (collisionPointsInThisLine[i] === closesPoint){
                //       let min = lengthToPoint[0];
                //       let max = lengthToPoint[0];
                //       let minNumber = 0;
                //       let maxNumber = 0;
                //       for (let ii = 0; ii < collisionPointsInThisLine.length; ii++){
                //         if (min>lengthToPoint[ii]){
                //           min = lengthToPoint[ii];
                //           minNumber = ii;
                //         }
                //         if (max<lengthToPoint[ii]){
                //           max = lengthToPoint[ii];
                //           maxNumber = ii;
                //         }
                //       }
                //       if (minNumber === i){
                //         linePoint = wayPoint[0];
                //       } else if (maxNumber === i){
                //         linePoint = wayPoint[1];
                //       }
                //     }
                //   }
                //   // // console.log (closesPoint);
                //
                //
                //
                //
                //
                //
                //
                // }

                i = -1;
              }
            }
          }
          //тут перевірка на праведний шлях
          if (startFreeSpaceLengt === freeSpace.length && !checkPoint) {
            if (wayPoint[0] === linePoint) {
              linePoint = wayPoint[1];
            } else if (wayPoint[1] === linePoint) {
              linePoint = wayPoint[0];
              console.log(
                'Ну привіт. як твої справи? звісто ти можеш і відповісти але я всерівно того не бачу.' +
                  'Як би там не було, я не знаю навіщо ти зараз це читаєш, але знай ти натрапив на фукцию де я мучався не одну годину,' +
                  'все працюй далі... тут більше нічого не буде.... перпендикулярну парадігму тобі в чай.... '
              );
              // let testPoint = findNextLine(object, thisLine, wayPoint[0]);
              return;
              // debugger;
              // if (testPoint.line.userData.collisionPointsInf) {
              //   // console.log(testPoint.line.userData);
              //   debugger;
              //   testPoint = findNextLine(object, thisLine, wayPoint[1]);
              //   if (testPoint.line.userData.collisionPointsInf) {
              //     // console.log(testPoint.line.userData);
              //     debugger;
              //   }
              // }
            }
            i = -1;
          } else if (!checkPoint) {
            // debugger;
            thisLine = line;
            if (!pieceOfFreeSpace[0].includes(thisLine)) {
              freeSpace.push(thisLine);
              pieceOfFreeSpace[0].push(thisLine);
              // debugger;
              pieceOfFreeSpace[1].push(thisLine);
            }
          }
        } else {
          thisLine = line;
          freeSpace.push(thisLine);
          pieceOfFreeSpace[0].push(thisLine);
          // debugger;
          pieceOfFreeSpace[1].push(thisLine);
          // debugger;
        }

        if (i >= 0) {
          // debugger;
          linePoint = newFindLinePoint[index];
          i = -1;
        }

        // todo ВЕРНИ ПОСТУПОВЕ Закрашення ліній
        // thisLine.material.color.set(new THREE.Color(0xFFDC00));
        // render(editor);

        // debugger;
      }
      // debugger;
      // }
    }
    // debugger;
    // return  new Promise(resolve => {
    //   setTimeout(() => {
    //     resolve(true);
    //   }, 4000)
    // });
  };

  const testMyFunktion = (collisionAllPoints, collisionPoints, objects) => {
    //todo step 2 -
    collisionPoints.forEach((point, i) => {
      if (!point.weDoneWithThisPoint) {
        // todo окраска точок
        sceneService.render(editor);
        point.startFromThisPoint = true;
        freeSpacesAll[freeSpacesAll.length] = [[], []];
        console.log(4353, freeSpacesAll[0][0]);
        nextPoint(
          point.entities[0].parent,
          null,
          point.entities[0],
          point,
          freeSpacesAll[freeSpacesAll.length - 1],
          collisionPoints
        );
        console.log(567657, freeSpacesAll[0][0]);
        point.startFromThisPoint = false;
      }
    });
    // freeSpacesAll[0][0][0].material.color = new THREE.Color(0xdcbd00);
    // console.log(1)
    // freeSpacesAll[0][0][freeSpacesAll[0][0].length - 1].material.color = new THREE.Color(0xd52828);
    // console.log(2)
    // freeSpacesAll[0][0][0].material.needsUpdate = true;
    // console.log(3)
    // freeSpacesAll[0][0][freeSpacesAll[0][0].length - 1].material.needsUpdate = true;
    // console.log(4)
    // renderer.render(scene, camera);
    // debugger;
    return;
    freeSpacesAll.forEach(el => el.forEach(el1 => console.log(el1.length)));
    console.log('freeSpacesAll', freeSpacesAll);
    freeSpacesAll.forEach((lineGroup, i) => {
      // sceneService.drawLine (lineGroup[0], editor);
      console.log('lineGroup', lineGroup, lineGroup.length);
      lineGroup[1] = [];
      lineGroup[0].forEach(line => {
        let newLine;
        if (line.geometry.type === 'Geometry') {
          if (!line.geometry.vertices) {
            debugger;
          }
          newLine = createLine(
            line.geometry.vertices[0],
            line.geometry.vertices[1]
          );
        } else if (line.geometry.type === 'CircleGeometry') {
          let materialLine = new THREE.LineBasicMaterial({
            color: 0x000000
          });
          let changedGeometry = {
            radius: line.geometry.parameters.radius,
            thetaStart: line.geometry.parameters.thetaStart,
            thetaLength: line.geometry.parameters.thetaLength
          };
          let copyCircleGeometry = changGeomEditObj(
            {
              0: 'copy'
            },
            changedGeometry
          );
          newLine = new THREE.Line(copyCircleGeometry, materialLine);

          newLine.position.x = line.position.x;
          newLine.position.y = line.position.y;
        }
        newLine.userData.collisionPointsInf = line.userData.collisionPointsInf;
        lineGroup[1].push(newLine);
      });
    });

    // todo добити до ума чистку ліній (забирати лінію якщо вона виде в нікуда,
    //  перевіряти чи лінія закольцовалась, якщо ні спробувати найти точку
    //  в якій закольцовується) від 21.09.2020
    freeSpacesAll.forEach((lineGroup, i) => {
      let lines = lineGroup[1];
      let objLength = lines.length - 1;
      let colPoint = lines[objLength].userData.collisionPointsInf;
      let colPointThisLine;
      let startPoint;
      let thisPoint;
      let firstPointIndex = null;
      let lastPoint = sceneService.findWayPoint(lines[objLength]);
      let thisLineWayPoint = sceneService.findWayPoint(lines[objLength - 1]);
      if (
        GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[0]) <
          10 * threshold ||
        GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[1]) <
          10 * threshold
      ) {
        startPoint = lastPoint[1];
        thisPoint = lastPoint[0];
      } else if (
        GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[0]) <
          10 * threshold ||
        GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[1]) <
          10 * threshold
      ) {
        startPoint = lastPoint[0];
        thisPoint = lastPoint[1];
      } else {
        objLength -= 1;
        lastPoint = sceneService.findWayPoint(lines[objLength]);
        thisLineWayPoint = sceneService.findWayPoint(lines[objLength - 1]);
        if (
          GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[0]) <
            10 * threshold ||
          GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[1]) <
            10 * threshold
        ) {
          startPoint = lastPoint[1];
          thisPoint = lastPoint[0];
        } else if (
          GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[0]) <
            10 * threshold ||
          GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[1]) <
            10 * threshold
        ) {
          startPoint = lastPoint[0];
          thisPoint = lastPoint[1];
        } else {
          debugger;
        }
      }
      for (i = objLength - 1; i > 0; i--) {
        if (firstPointIndex === null) {
          // console.log (lines[i]);
          thisLineWayPoint = sceneService.findWayPoint(lines[i]);
          colPointThisLine = lines[i].userData.collisionPointsInf;
          // console.log (thisLineWayPoint);
          // debugger;
          if (
            GeometryUtils.getDistance(startPoint, thisLineWayPoint[0]) <
              threshold ||
            GeometryUtils.getDistance(startPoint, thisLineWayPoint[1]) <
              threshold
          ) {
            firstPointIndex = i;
            if (i => 4) {
              let newArray = [];
              for (let j = 0; i < i; i++) {
                newArray.push(lines[i]);
              }
            }
          }
          if (colPointThisLine) {
            colPointThisLine.forEach(pointThisLine => {
              if (
                GeometryUtils.getDistance(startPoint, pointThisLine.point) <
                threshold
              ) {
                firstPointIndex = i;
              }
            });
          }
          if (colPoint) {
            colPoint.forEach(point => {
              if (
                GeometryUtils.getDistance(point.point, thisLineWayPoint[0]) <
                  threshold ||
                GeometryUtils.getDistance(point.point, thisLineWayPoint[1]) <
                  threshold
              ) {
                firstPointIndex = i;
              }
              if (colPointThisLine) {
                colPointThisLine.forEach(pointThisLine => {
                  if (
                    GeometryUtils.getDistance(
                      point.point,
                      pointThisLine.point
                    ) < threshold
                  ) {
                    firstPointIndex = i;
                  }
                });
              }
            });
            // debugger;
          }
        }
      }
      // console.log(firstPointIndex);
      // debugger;
      if (firstPointIndex) {
        lines.splice(0, firstPointIndex);
        // console.log (lineGroup[1]);
        // debugger;
      }
    });

    freeSpacesAll.forEach((lineGroup, i) => {
      sceneService.createObject(
        editor,
        'freeSpaceZone №' + i,
        lineGroup[1],
        1.1,
        'Free space'
      );
    });

    // let edgeModels = []
    for (let i = 0; i < freeSpacesAll.length; i++) {
      if (freeSpacesAll[i].length) {
        // freeSpacesAll[i].forEach((line)=>{
        // line.userData.noIntersections = false;
        // line.material.color.set(new THREE.Color(0xFF0000));
        // });
        sceneService.render(editor);
        // debugger;
        // edgeModels [edgeModels.length] = GeometryUtils.buildEdgeModel(
        //   { children: freeSpacesAll [i] });
      }
    }
    // // console.log (edgeModels);

    // debugger;
    sceneService.drawLine(freeSpace, editor);
  };

  testMyFunktion(collisionAllPoints, collisionPoints, objects);

  sceneService.render(editor);
  // debugger;
  // подкрасить линии на которых есть точки контакта
  // collisionPoints.forEach(point =>{
  //   point.entities.forEach(line=>{
  //     line.material.color.set(new THREE.Color(0xFFDC00));
  //   });
  // });
  //
  //
  //
  //
  //
  // console.error('collisionPoints', collisionPoints)
  //
  // let branches = GeometryUtils.generateCollisionBranches(
  //   collisionPoints,
  //   threshold
  // );
  //
  // debugger;
  // let branches = [];
  //
  // DEVELOPMENT ONLY: generate tree
  // {
  //
  //     function generateTree(branches) {
  //         return branches.map(branch => {
  //             return {
  //                 name: branch.collisionPoint.id,
  //                 children: generateTree(branch.branches)
  //             }
  //         })
  //     }
  //
  //     let tree = [];
  //     branches.forEach(branch => {
  //         tree.push({
  //             name: branch.startPoint.id,
  //             children: generateTree(branch.branches)
  //         });
  //     });
  //     // console.log('JSON', JSON.stringify([{'name': 'root', children: tree}]));
  // }
  //
  // let paths = GeometryUtils.generateAllPaths(branches);

  // console.log (objects);
  // console.log (editor);
  // debugger;
  //
  // let cavities = [];
  // objects.forEach (object =>{
  //   // console.log (object.name.indexOf('freeSpaceZone'));
  //   if (object.name.indexOf('freeSpaceZone') !== -1){
  //     cavities.push(object.userData.edgeModel.regions[0].path)
  //   }
  // });
  // debugger;
  // Object.userData.edgeModel.regions[0].path;
  //
  // TODO TODO TODO
  // TODO TODO TODO
  // TODO TODO TODO
  // check all paths, one by one.
  //     primary order them by count of collisionPoints
  //     secondary check if path is ok:
  //         - cavity must not intersects with internal regions of object.
  //         - cavity can't by intersected by itself
  //     tertiary if region is ok - skip other regions with that collisionPoints
  //
  // paths = paths
  //   .filter(path => path.collisionPoints.length > 1)
  //   .sort(
  //     (pathA, pathB) =>
  //       pathA.collisionPoints.length - pathB.collisionPoints.length
  //   );
  //
  // function shuffleArray(array) {
  //     for (let i = array.length - 1; i > 0; i--) {
  //         let j = Math.floor(Math.random() * (i + 1));
  //         [array[i], array[j]] = [array[j], array[i]];
  //     }
  // }
  //
  // shuffleArray(paths);
  //
  // let cavities = [];
  // // filter paths - check if every used object not in cavity;
  // let usedCollisionPoints = [];
  //
  // // debugger;
  // let iterator = GeometryUtils.queueIterator(paths);
  // let queue = iterator.next();
  // while (!queue.done) {
  //   let cavityToCheck = queue.value;
  //
  //   let result = GeometryUtils.checkCavity(
  //     cavityToCheck,
  //     usedCollisionPoints,
  //     threshold
  //   );
  //
  //   // ConsoleUtils.previewPathInConsole(cavityToCheck.path, null, result)
  //   if (result.needToCheckAgain) {
  //     queue = iterator.next(cavityToCheck);
  //   } else {
  //     if (result.valid) {
  //       cavities.push(cavityToCheck);
  //       usedCollisionPoints.push(...cavityToCheck.collisionPoints);
  //     }
  //     queue = iterator.next();
  //   }
  // }
  //
  // // debugger;
  //
  // cavities.forEach(cavity =>
  //   ConsoleUtils.previewPathInConsole(cavity.path, null, cavity)
  // );
  // debugger;
  // console.warn('PATHS', paths, { branches }, { cavities });

  let thermalPoints = GeometryUtils.getThermalPoints(scene);
  let svg =
    `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${(
      viewBox.width * mul
    ).toFixed(4)}cm" height="${(viewBox.height * mul).toFixed(
      4
    )}cm" viewBox="${viewBox.x.toFixed(4)} ${viewBox.y.toFixed(
      4
    )} ${viewBox.width.toFixed(4)} ${viewBox.height.toFixed(4)}">
<desc>
  <schema desc="BuildingSVG" version="1.1"></schema>
  <constr id="Dummy" scale="1"></constr>
</desc>
<g id="group_d">\n` +
    // objects
    //   .map(object => {
    //     if (object.name.indexOf('freeSpaceZone') === -1) {
    //       let materialSvg = '';
    //       if (object.userData.material) {
    //         let { material } = object.userData;
    //         materialSvg = `<matprop type="const" id="${material.id}" lambda="${material.lambda}" eps="${material.epsilon}" density="${material.density}"/>\n`;
    //       }
    //
    //       // console.log(object.userData.edgeModel.regions[0]);
    //
    //       return (
    //         `<path d="${object.userData.edgeModel.svgData.pathD} " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">\n` +
    //         materialSvg +
    //         `<area value="${(
    //           object.userData.edgeModel.regions[0].area / 1000000
    //         ).toFixed(6)}" />\n` +
    //         `</path>\n` +
    //         ((!svgForFlixo &&
    //           `<circle cx="${(
    //             object.userData.edgeModel.svgData.insidePoint.x / 1000
    //           ).toFixed(4)}" cy="${(
    //             object.userData.edgeModel.svgData.insidePoint.y / 1000
    //           ).toFixed(
    //             4
    //           )}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />`) ||
    //           '') +
    //         object.userData.edgeModel.svgData.subRegionsPathD
    //           .map((pathD, idx) => {
    //             return (
    //               `<path d="${pathD} " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">\n` +
    //               `<matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>\n` +
    //               `<area value="${object.userData.edgeModel.regions[idx + 1]
    //                 .area / 1000000}" />\n` +
    //               `</path>`
    //             );
    //           })
    //           .join('')
    //       );
    //     }
    //   })
    //   .join('') +
    // cavities here

    objects
      .map((object, j) => {
        if (
          object.name.indexOf('freeSpaceZone') !== -1 &&
          object.userData.edgeModel.regions[0]
        ) {
          // debugger;
          // console.log(objects);
          // console.log (object);
          // console.log (j)
          // debugger;
          let path = object.userData.edgeModel.regions[0].path;
          let area = GeometryUtils.pathArea(
            object.userData.edgeModel.regions[0].area
          );

          let vertexList = [];
          let last = path[path.length - 1];
          let lastVertex = `${(last.x / 1000).toFixed(4)}, ${(
            last.y / 1000
          ).toFixed(4)}`;
          let pathD = `M${lastVertex} L`;

          path.forEach(v => {
            let vertex = `${(v.x / 1000).toFixed(4)},${(v.y / 1000).toFixed(
              4
            )}`;
            if (vertex !== lastVertex && vertexList.indexOf(vertex) < 0) {
              pathD += `${vertex} `;
              lastVertex = vertex;
              vertexList.push(vertex);
            }

            // circles += `<circle cx="${(v.x / 1000).toFixed(4)}" cy="${(v.y / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(255,20,20); stroke:black;stroke-width:0.00001" />`
          });
          return (
            `<path d="${pathD} " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" >\n` +
            `<matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"></matprop>\n` +
            `<area value="${area}"></area>\n` +
            `</path>\n`
          );
        }
      })

      // cavities
      //   .map(pathData => {
      //     debugger;
      //     let path = pathData.path;
      //     let area = GeometryUtils.pathArea(pathData.path);
      //
      //     let vertexList = [];
      //     let last = path[path.length - 1];
      //     let lastVertex = `${(last.x / 1000).toFixed(4)}, ${(
      //       last.y / 1000
      //     ).toFixed(4)}`;
      //     let pathD = `M${lastVertex} L`;
      //
      //     path.forEach(v => {
      //       let vertex = `${(v.x / 1000).toFixed(4)},${(v.y / 1000).toFixed(4)}`;
      //       if (vertex !== lastVertex && vertexList.indexOf(vertex) < 0) {
      //         pathD += `${vertex} `;
      //         lastVertex = vertex;
      //         vertexList.push(vertex);
      //       }
      //
      //       // circles += `<circle cx="${(v.x / 1000).toFixed(4)}" cy="${(v.y / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(255,20,20); stroke:black;stroke-width:0.00001" />`
      //     });
      //     return (
      //       `<path d="${pathD} " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" >\n` +
      //       `<matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"></matprop>\n` +
      //       `<area value="${area}"></area>\n` +
      //       `</path>\n`
      //     );
      //   })
      .join('') +
    `</g>
  <g id="temperature">
    <bcprop id="External" x="${(thermalPoints.cold1.x / 1000).toFixed(
      4
    )}" y="${(thermalPoints.cold1.y / 1000).toFixed(
      4
    )}" temp="273.15" rs="0.04" rel_img="SvgjsImage1089" rel_id="0" rel="min"></bcprop>
    <bcprop id="External" x="${(thermalPoints.cold2.x / 1000).toFixed(
      4
    )}" y="${(thermalPoints.cold2.y / 1000).toFixed(
      4
    )}" temp="273.15" rs="0.04" rel_img="SvgjsImage1090" rel_id="1" rel="max"></bcprop>
    <bcprop id="Interior" x="${(thermalPoints.hot1.x / 1000).toFixed(4)}" y="${(
      thermalPoints.hot1.y / 1000
    ).toFixed(
      4
    )}" temp="293.15" rs="0.13" rel_img="SvgjsImage1091" rel_id="2" rel="min"></bcprop>
    <bcprop id="Interior" x="${(thermalPoints.hot2.x / 1000).toFixed(4)}" y="${(
      thermalPoints.hot2.y / 1000
    ).toFixed(
      4
    )}" temp="293.15" rs="0.13" rel_img="SvgjsImage1092" rel_id="3" rel="max"></bcprop>
  </g>
  ${(!svgForFlixo &&
    `<g id="collisions">` +
      collisionPoints
        .map(collisionPoint => {
          let dot = '';
          for (let i = 0; i <= collisionPoint.id; i++) {
            // dot += `<circle cx="${((collisionPoint.point.x + i + 3 + collisionPoint.id * 2) / 1000).toFixed(4)}" cy="${((collisionPoint.point.y - i - 3 - collisionPoint.id * 2) / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(${collisionPoint.id === 1 ? '0,0,0' : '200,200,255'}); stroke:black;stroke-width:0.00001" />`;
          }
          return (
            ` < circle cx = "${(collisionPoint.point.x / 1000).toFixed(4)}"
  cy = "${(collisionPoint.point.y / 1000).toFixed(4)}
" r="
$ {
  collisionPoint.processed ? '0.0005' : '0.0005'
}
" style="
fill: rgb($ {
  collisionPoint.processed ? '255,200,200' : '200,200,255'
});
stroke: black;
stroke - width: 0.00001 " />` + dot
          );
        })
        .join('') +
      `</g>`) ||
    ''} <
/svg>`;

  // console.log(svg);

  // $http.post('http://localhost:4000/api/flixo', {
  //     id: 204406510,
  //     jsonrpc: "2.0",
  //     method: "call",
  //     params: {
  //         frame: "external",
  //
  //         // material_list: flixoExample.material_list,
  //         // svg: flixoExample.svg,
  //         // svg_w_h: flixoExample.svg_w_h,
  //         //
  //         material_list: '[{"id":"0","material":"O-1036"},{"id":"1","material":"O-2000"}]',
  //         svg: svg,
  //         svg_w_h: [{"w": "0.06", "h": "0.04"}, {"w": "0.04", "h": "0.02"}], //objects.map(object => {return {"w": "2.100000", "h": "6.799999"};}),
  //         //
  //         token: "651,ef70663ba61ac6838d127257a284188d38a42314b7193340e8052bf843f889ec,1"
  //
  //     }
  // }).then(response => {
  //     // // console.log('RESPO', response.data.message.result);
  //     if (response.data.message.error) {
  //         console.error('FLIXO',response.data.message.error);
  //         // console.log(JSON.stringify(response.data.message.error));
  //     } else {
  //         // console.log('FLIXO response', response.data.message.result);
  //     }
  //
  //     // // console.log('RESPO', response.data.message.error ? response.data.message.error : response.data.message.result);
  // });

  // // console.log('data:image/svg+xml;base64,' + window.btoa(svg));
  // // console.log('SVG ', svg);

  ConsoleUtils.previewInConsole(
    'data:image/svg+xml;base64,' + window.btoa(svg)
  );
  // CameraUtils.previewInConsole('data:image/svg+xml;base64,' + window.btoa(flixoExample.svg));
  // let svg = null;
  return {
    svg,
    viewBox
  };
};

export default {
  combineEdgeModels
};
