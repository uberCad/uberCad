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
import consoleUtils from './consoleUtils';

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
        lineWithPoint = searchLineWithPoint(line, point, threshold);
        // debugger;
      }

      if (lineWithPoint !== line) {
        point.entities[lineIndex] = null;
        if (!point.entities.includes(lineWithPoint)) {
          point.entities.push(lineWithPoint);
        }
        // debugger;
      }

      linePoints = sceneService.findWayPoint(lineWithPoint);
      if (
        GeometryUtils.getDistance(point.point, linePoints[0]) > threshold &&
        GeometryUtils.getDistance(point.point, linePoints[1]) > threshold
      ) {
        if (lineWithPoint.geometry.type === 'Geometry') {
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
            // console.log(newLine);
            // lineWithPoint.geometry.vertices.splice(pointIndex + 1,
            //   lineWithPoint.geometry.vertices.length - pointIndex - 1);
            // console.log(newLine);
            // newLine = new THREE.Line(copyCircleGeometry, materialLine);
            // newLine.position.x = lineWithPoint.position.x;
            // newLine.position.y = lineWithPoint.position.y;
            // console.log(newLine.geometry.vertices);
            // newLine.geometry.vertices.splice(0, pointIndex);
            // console.log(newLine.geometry.vertices);
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
          if (!point.entities.includes(newLines[0])) {
            point.entities.push(newLines[0]);
          } else {
            // debugger;
          }
          if (!point.entities.includes(newLines[1])) {
            point.entities.push(newLines[1]);
          } else {
            // debugger;
          }
          // // debugger;
          sceneService.drawLine([newLines[1]], editor, 0xff0000);
          sceneService.drawLine([newLines[0]], editor, 0x00ff00);
          actionChecker = true;
          lineWithPoint.name = 'changed line';
          lineWithPoint.geometry.verticesNeedUpdate = true;
          newLines.name = 'NEW LINE';
          // console.log(object.children);
          // // debugger;
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
    // line.material.color = new THREE.Color(0x000000);
    // line.material.needsUpdate = true;
    // sceneService.render(editor)
  });
  for (let i = 0; i < point.entities.length; ) {
    if (point.entities[i] !== null) {
      i += 1;
      // // debugger;
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

const combineEdgeModels = (editor, svgForFlixo = false) => {
  const {
    scene,
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

  // todo Create copy of object with all points
  let collisionAllPoints = GeometryUtils.getCollisionPoints(objects, threshold);
  let collisionPoints = GeometryUtils.filterOverlappingCollisionPoints(
    collisionAllPoints
  );

  // фільтр на повтор ліній в параметрах точці перетину
  collisionPoints.forEach(point => {
    // todo костиль
    let arr = [];
    arr.push(...point.entities);
    point.entities = arr;
    point.entities.forEach((line, i) => {
      if (point.entities[i] !== null) {
        let wayPoint = sceneService.findWayPoint(line);

        // фільтр на повтор ліній в параметрах точці перетину
        point.entities.forEach((checkLine, j) => {
          if (i !== j && line === checkLine) {
            point.entities[j] = null;
          }
        });

        // костиль - перевірка відстанні ліній до точки перетину, фільтр зайвих ліній
        if (point.entities[i] !== null) {
          let distance;
          if (line.geometry instanceof THREE.CircleGeometry) {
            let circlePoints = [];
            let distanceToCirclePoints = [];
            line.geometry.vertices.forEach((verticesPoint, i) => {
              circlePoints[i] = {
                x: verticesPoint.x + line.position.x,
                y: verticesPoint.y + line.position.y
              };
              distanceToCirclePoints[i] = GeometryUtils.getDistance(
                point.point,
                circlePoints[i]
              );
            });
            distance = Math.min(...distanceToCirclePoints);
          } else if (point.entities[i].geometry.type === 'Geometry') {
            distance = GeometryUtils.distanceToLine(
              point.point,
              point.entities[i]
            );
          }
          if (distance > 0.1) {
            point.entities[i] = null;
          }
        }
        // фільтр нольових ліній
        if (point.entities[i] !== null) {
          if (GeometryUtils.getDistance(wayPoint[0], wayPoint[1]) < 0.01) {
            console.log(GeometryUtils.getDistance(wayPoint[0], wayPoint[1]));
            point.entities[i] = null;
          }
        }
      }
    });
    let nullIndex = 0;
    do {
      if (point.entities[nullIndex] === null) {
        point.entities.splice(nullIndex, 1);
      } else {
        nullIndex += 1;
      }
    } while (nullIndex < point.entities.length);
  });

  collisionPoints = GeometryUtils.filterCollisionPoints(collisionPoints);

  // пошук точкок які знаходяться на відстані менше ніж 0.01 від інших точок
  collisionPoints.forEach((point, pointInd) => {
    if (!point.needDelete) {
      collisionPoints.forEach((checkPoint, pointInd) => {
        if (
          point !== checkPoint &&
          GeometryUtils.getDistance(checkPoint.point, point.point) < 0.01
        ) {
          checkPoint.needDelete = true;
          checkPoint.entities.forEach(line => {
            if (!point.entities.includes(line)) {
              point.entities.push(line);
            }
          });
        }
      });
    }
  });

  // видалення точок які знаходяться в притул до інших
  let lineIndex = 0;
  do {
    if (collisionPoints[lineIndex].needDelete) {
      collisionPoints.splice(lineIndex, 1);
    } else {
      lineIndex += 1;
    }
  } while (lineIndex < collisionPoints.length);

  // пошук ліній які торкаються знайдених точок перетину
  collisionPoints.forEach(point => {
    point.entities.forEach(line => {
      const wayPoint = sceneService.findWayPoint(line);
      if (
        GeometryUtils.getDistance(wayPoint[0], point.point) < 0.001 ||
        GeometryUtils.getDistance(wayPoint[1], point.point) < 0.001
      ) {
        line.parent.children.forEach(checkLine => {
          if (checkLine !== line) {
            const checkLinePoint = sceneService.findWayPoint(checkLine);
            if (
              GeometryUtils.getDistance(checkLinePoint[0], point.point) <
                0.001 ||
              GeometryUtils.getDistance(checkLinePoint[1], point.point) < 0.001
            ) {
              point.entities.push(checkLine);
            }
          }
        });
      }
    });
  });

  // розділення ліній по точка перетину
  collisionPoints.forEach((point, pointInd) => {
    lineDivision(editor, point, collisionPoints, 0.001);
  });

  // перевірка чи не потрапила стара лінія в параметри точки перетину
  collisionPoints.forEach(point => {
    point.entities.forEach((line, lineIndex) => {
      if (line.userData.newLines) {
        let findLineWithPoint = searchLineWithPoint(line, point, threshold);
        if (!point.entities.includes(findLineWithPoint)) {
          point.entities.push(findLineWithPoint);
        } else {
          // debugger;
        }
        point.entities.splice(lineIndex, 1);
      }
    });
  });

  // фільтр на повтор ліній в параметрах точці перетину
  // collisionPoints.forEach(point => {
  //   point.entities.forEach((line, i) => {
  //     if (point.entities[i] !== null) {
  //       let wayPoint = sceneService.findWayPoint(line);
  //
  //       // фільтр на повтор ліній в параметрах точці перетину
  //       point.entities.forEach((checkLine, j) => {
  //         if (i !== j && line === checkLine) {
  //           point.entities[j] = null;
  //         }
  //       });
  //
  //       // костиль - перевірка відстанні ліній до точки перетину, фільтр зайвих ліній
  //       if (point.entities[i] !== null) {
  //         let distance;
  //         if (line.geometry instanceof THREE.CircleGeometry) {
  //           let circlePoints = [];
  //           let distanceToCirclePoints = [];
  //           line.geometry.vertices.forEach((verticesPoint, i) => {
  //             circlePoints[i] = {
  //               x: verticesPoint.x + line.position.x,
  //               y: verticesPoint.y + line.position.y
  //             };
  //             distanceToCirclePoints[i] = GeometryUtils.getDistance(
  //               point.point,
  //               circlePoints[i]
  //             );
  //           });
  //           distance = Math.min(...distanceToCirclePoints);
  //         } else if (point.entities[i].geometry.type === 'Geometry') {
  //           distance = GeometryUtils.distanceToLine(point.point, point.entities[i]);
  //         }
  //         console.log(point.entities[i].geometry.type);
  //         console.log(distance);
  //         // debugger;
  //         if (distance > 0.1) {
  //           point.entities[i] = null;
  //           // debugger;
  //         }
  //
  //         // if (
  //         //   GeometryUtils.getDistance(wayPoint[0], point.point) > 0.01 &&
  //         //   GeometryUtils.getDistance(wayPoint[1], point.point) > 0.01
  //         // ) {
  //         //   point.entities[i] = null;
  //         //   debugger;
  //         // }
  //       }
  //
  //       // фільтр нольових ліній
  //       if (point.entities[i] !== null) {
  //         if (GeometryUtils.getDistance(wayPoint[0], wayPoint[1]) < 0.001) {
  //           console.log(GeometryUtils.getDistance(wayPoint[0], wayPoint[1]));
  //           point.entities[i] = null;
  //           debugger;
  //         }
  //       }
  //
  //       // фільтр на повтор ліній в параметрах точці перетину
  //       point.entities.forEach((checkLine, j) => {
  //         if (i !== j && line === checkLine) {
  //           point.entities[j] = null;
  //         }
  //       });
  //
  //       // if (point.entities[i] !== null) {
  //       //   if (point.id === 141 || point.id === 141) {
  //       //     let distance;
  //       //     if (line.geometry instanceof THREE.CircleGeometry) {
  //       //       let circlePoints = [];
  //       //       let distanceToCirclePoints = [];
  //       //       line.geometry.vertices.forEach((verticesPoint, i) => {
  //       //         circlePoints[i] = {
  //       //           x: verticesPoint.x + line.position.x,
  //       //           y: verticesPoint.y + line.position.y
  //       //         };
  //       //         distanceToCirclePoints[i] = GeometryUtils.getDistance(
  //       //           point.point,
  //       //           circlePoints[i]
  //       //         );
  //       //       });
  //       //       distance = Math.min(...distanceToCirclePoints);
  //       //     } else if (point.entities[i].geometry.type === 'Geometry') {
  //       //       distance = GeometryUtils.distanceToLine(point.point, point.entities[i]);
  //       //     }
  //       //     console.log(point.entities[i].geometry.type);
  //       //     console.log(distance);
  //       //     console.log(point);
  //       //     debugger;
  //       //   }
  //       // }
  //     }
  //   });
  //   let nullIndex = 0;
  //   do {
  //     if (point.entities[nullIndex] === null) {
  //       point.entities.splice(nullIndex, 1);
  //     } else {
  //       nullIndex += 1;
  //     }
  //   } while (nullIndex < point.entities.length);
  // });

  let allObjectArea = 0;
  // видалення ліній які були розділені з об'єкту
  objects.forEach(object => {
    let lineIndex = object.children.length - 1;
    do {
      if (object.children[lineIndex].userData.needDelete) {
        object.children.splice(lineIndex, 1);
      }
      lineIndex -= 1;
    } while (lineIndex > -1);
    const geometryInfo = GeometryUtils.getObjectInfo(object);
    allObjectArea += geometryInfo[0].area;
  });

  // відображення точок перетину на сцені
  let helpLayer = scene.getObjectByName('HelpLayer');
  helpLayer.children = [];
  collisionPoints.forEach(point => {
    helpLayer.add(helpLayerService.positionInLine(editor, [point.point]));
    sceneService.render(editor);
  });
  sceneService.render(editor);

  let voids = testMyFunktion(
    editor,
    collisionPoints,
    collisionAllPoints,
    objects,
    threshold
  );

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
  //     console.log('JSON', JSON.stringify([{'name': 'root', children: tree}]));
  // }
  //
  // let paths = GeometryUtils.generateAllPaths(branches);
  //
  // console.log (objects);
  // console.log (editor);
  // debugger;
  //
  // let cavities = [];
  // objects.forEach (object =>{
  //   console.log (object.name.indexOf('freeSpaceZone'));
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
  // debugger;
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
  // debugger;
  //
  // cavities.forEach(cavity =>
  //   ConsoleUtils.previewPathInConsole(cavity.path, null, cavity)
  // );
  // debugger;
  // console.warn('PATHS', paths, { branches }, { cavities });

  const svg = createSVG(
    viewBox,
    mul,
    // voids,
    objects,
    allObjectArea,
    GeometryUtils.getThermalPoints(scene),
    svgForFlixo,
    collisionPoints
  );

  // console.log (svg);
  // sceneService.createSVG(svg);

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
  //     // console.log('RESPO', response.data.message.result);
  //     if (response.data.message.error) {
  //         console.error('FLIXO',response.data.message.error);
  //         console.log(JSON.stringify(response.data.message.error));
  //     } else {
  //         console.log('FLIXO response', response.data.message.result);
  //     }
  //
  //     // console.log('RESPO', response.data.message.error ? response.data.message.error : response.data.message.result);
  // });

  // console.log('data:image/svg+xml;base64,' + window.btoa(svg));
  // console.log('SVG ', svg);

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

const createSVG = (
  viewBox,
  mul,
  objects,
  allObjectArea,
  thermalPoints,
  svgForFlixo,
  collisionPoints
) => {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${(
      viewBox.width * mul
    ).toFixed(4)}cm" transform="scale(1,-1)" height="${(
      viewBox.height * mul
    ).toFixed(4)}cm" viewBox="${viewBox.x.toFixed(4)} ${viewBox.y.toFixed(
      4
    )} ${viewBox.width.toFixed(4)} ${viewBox.height.toFixed(4)}">
    <desc>
      <schema desc="BuildingSVG" version="2"></schema>
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
    //       console.log(object.userData.edgeModel.regions[0]);
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
        const geometryInfo = GeometryUtils.getObjectInfo(object);
        if (
          object.name.indexOf('freeSpaceZone') !== -1 &&
          object.userData.edgeModel.regions[0] &&
          allObjectArea > geometryInfo[0].area
        ) {
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
        } else if (object.name.indexOf('freeSpaceZone') == -1) {
          return object.userData.edgeModel.regions.map((regions, regIndex) => {
            if (regIndex !== 0) {
              let path = regions.path;
              let area = GeometryUtils.pathArea(regions.area);

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
          });
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
      <bcprop id="Interior" x="${(thermalPoints.hot1.x / 1000).toFixed(
        4
      )}" y="${(thermalPoints.hot1.y / 1000).toFixed(
      4
    )}" temp="293.15" rs="0.13" rel_img="SvgjsImage1091" rel_id="2" rel="min"></bcprop>
      <bcprop id="Interior" x="${(thermalPoints.hot2.x / 1000).toFixed(
        4
      )}" y="${(thermalPoints.hot2.y / 1000).toFixed(
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
            `<circle cx="${(collisionPoint.point.x / 1000).toFixed(4)}" cy="${(
              collisionPoint.point.y / 1000
            ).toFixed(4)}" r="${
              collisionPoint.processed ? '0.0005' : '0.0005'
            }" style="fill:rgb(${
              collisionPoint.processed ? '255,200,200' : '200,200,255'
            }); stroke:black;stroke-width:0.00001" />` + dot
          );
        })
        .join('') +
      `</g>`) ||
    ''}
  </svg>`
  );
};

const searchLineWithPoint = (line, point, threshold) => {
  let lineWithPoint = null;
  // let linePoints;
  if (line.geometry.type === 'Geometry') {
    // console.log('----- line ------', line.id, line.userData, counter)
    line.userData.newLines.forEach(uDLine => {
      // console.log('----- uDLine ------', uDLine.id, uDLine, point.point, GeometryUtils.distanceToLine(point.point, uDLine))
      if (GeometryUtils.distanceToLine(point.point, uDLine) < threshold) {
        lineWithPoint = uDLine;
      }
    });
    // if (counter >= 9) return;
    if (
      lineWithPoint &&
      GeometryUtils.distanceToLine(point.point, lineWithPoint) > threshold
    ) {
      // такого не має бути
      // console.log(GeometryUtils.distanceToLine(point.point, lineWithPoint));
      // console.log(GeometryUtils.distanceToLine(point.point, line));
      // // debugger;
      return;
    }
  } else if (line.geometry.type === 'CircleGeometry') {
    let minDistance;
    line.userData.newLines.forEach(uDLine => {
      let distance = GeometryUtils.distanceToArc(point.point, uDLine);
      if (!isNaN(distance)) {
        if (distance < 0.1 * threshold) {
          lineWithPoint = uDLine;
        }
      } else {
        if (!minDistance) {
          minDistance = GeometryUtils.getDistance(point.point, {
            x: uDLine.geometry.vertices[0].x + uDLine.position.x,
            y: uDLine.geometry.vertices[0].y + uDLine.position.y
          });
          lineWithPoint = uDLine;
        }
        uDLine.geometry.vertices.forEach(vertex => {
          let distanceToPoint = GeometryUtils.getDistance(point.point, {
            x: vertex.x + uDLine.position.x,
            y: vertex.y + uDLine.position.y
          });
          if (distanceToPoint < minDistance) {
            minDistance = distanceToPoint;
            lineWithPoint = uDLine;
          }
        });
      }
    });
    if (
      lineWithPoint &&
      GeometryUtils.distanceToArc(point.point, lineWithPoint) > threshold
    ) {
      // такого не має бути
      // console.log(GeometryUtils.distanceToArc(point.point, lineWithPoint));
      // console.log(GeometryUtils.distanceToArc(point.point, line));
      // // // debugger;
      return;
    }
  }
  if (lineWithPoint) {
    lineWithPoint.name = '';
    if (lineWithPoint.userData.newLines) {
      return searchLineWithPoint(lineWithPoint, point, threshold);
    }
  }
  return lineWithPoint ? lineWithPoint : line;
};

let searchTrueNextPoint = (
  editor,
  collisionPoints,
  oldLine,
  closesPoint,
  pieceOfFreeSpace,
  entrainment,
  threshold
) => {
  const deviation = 1e-5;
  // розпізнаємо якілінії відповідають яким об'єктам
  let nextLine_oldObject;
  const lines_nextObject = [];
  closesPoint.entities.forEach(checkLine => {
    let wayPoints = sceneService.findWayPoint(checkLine);
    console.log(GeometryUtils.getDistance(wayPoints[0], wayPoints[1]));
    if (
      GeometryUtils.getDistance(wayPoints[0], wayPoints[1]) >
      0.3 * threshold
    ) {
      if (checkLine.parent === oldLine.parent) {
        if (checkLine !== oldLine) {
          if (nextLine_oldObject) {
            let wayPoints_nextLine_oldObject = sceneService.findWayPoint(
              nextLine_oldObject
            );
            if (
              GeometryUtils.getDistance(wayPoints[0], wayPoints[1]) >
              GeometryUtils.getDistance(
                wayPoints_nextLine_oldObject[0],
                wayPoints_nextLine_oldObject[1]
              )
            ) {
              nextLine_oldObject = checkLine;
            }
          } else {
            nextLine_oldObject = checkLine;
          }
        }
      } else {
        lines_nextObject.push(checkLine);
      }
    } else {
      // debugger;
    }
  });

  if (lines_nextObject.length > 2) {
    // потребує тесту коретності роботи на практиці
    let lineLength = [];
    lines_nextObject.forEach(line => {
      let wayPoint = sceneService.findWayPoint(line);
      lineLength.push(GeometryUtils.getDistance(wayPoint[0], wayPoint[1]));
    });
    do {
      let spliceIndex = lineLength.indexOf(Math.min(...lineLength));
      lineLength.splice(spliceIndex, 1);
      lines_nextObject.splice(spliceIndex, 1);
    } while (lines_nextObject.length > 2);
  }

  // знаходимо точку звідки ідемо
  let pointsOldLine = sceneService.findWayPoint(
    oldLine,
    closesPoint.point,
    'serch_way'
  );
  let point_E_oldLine =
    GeometryUtils.getDistance(closesPoint.point, pointsOldLine[0]) < deviation
      ? pointsOldLine[1]
      : pointsOldLine[0];

  // знаходимо точку куди ішли
  let pointsNextLine_oldObject = sceneService.findWayPoint(
    nextLine_oldObject,
    closesPoint.point,
    'serch_way'
  );
  let point_D_nextPointOldObject =
    GeometryUtils.getDistance(closesPoint.point, pointsNextLine_oldObject[0]) <
    deviation
      ? pointsNextLine_oldObject[1]
      : pointsNextLine_oldObject[0];

  // знаходимо точки куди ми можемо піти на новому об'єкті
  let pointsWay_1_newObject = sceneService.findWayPoint(
    lines_nextObject[0],
    closesPoint.point,
    'serch_way'
  );
  let point_A_newObject =
    GeometryUtils.getDistance(closesPoint.point, pointsWay_1_newObject[0]) <
    deviation
      ? pointsWay_1_newObject[1]
      : pointsWay_1_newObject[0];

  lines_nextObject[0].userData.nextPointIndex =
    point_A_newObject === pointsWay_1_newObject[0] ? 0 : 1;

  let pointsWay_2_newObject = sceneService.findWayPoint(
    lines_nextObject[1],
    closesPoint.point,
    'serch_way'
  );
  let point_B_newObject =
    GeometryUtils.getDistance(closesPoint.point, pointsWay_2_newObject[0]) <
    GeometryUtils.getDistance(closesPoint.point, pointsWay_2_newObject[1])
      ? pointsWay_2_newObject[1]
      : pointsWay_2_newObject[0];

  lines_nextObject[1].userData.nextPointIndex =
    point_B_newObject === pointsWay_2_newObject[0] ? 0 : 1;

  // debugger;
  oldLine.material.color.set(new THREE.Color(0x0000ff)); // синій
  nextLine_oldObject.material.color.set(new THREE.Color(0xaa00ff)); // фіолетовий
  lines_nextObject[0].material.color.set(new THREE.Color(0xffaa00)); // оранжевий
  lines_nextObject[1].material.color.set(new THREE.Color(0xff0000)); // красний

  console.log(oldLine);
  console.log(nextLine_oldObject);
  console.log(lines_nextObject[0]);
  console.log(lines_nextObject[1]);
  sceneService.render(editor);
  // debugger;

  let pointO = [closesPoint.point];

  // todo добавити/змінити на точку на наступній лінії
  let pointNewLineA = HelpLayerService.foundNewPoint(
    pointO[0],
    point_A_newObject,
    4
  );
  // pointO[3] = HelpLayerService.foundNewPoint (pointNewLineA, pointO[0], 3);
  let pointNewLineB = HelpLayerService.foundNewPoint(
    pointO[0],
    point_B_newObject,
    4
  );

  // todo  первервірка точки перетину точки наступної і тікущої
  let pointNextLineOldObjectD = HelpLayerService.foundNewPoint(
    pointO[0],
    point_D_nextPointOldObject,
    5
  );

  let pointOldLineE = HelpLayerService.foundNewPoint(
    pointO[0],
    point_E_oldLine,
    5
  );
  const { scene, camera, renderer } = editor;
  let helpLayer = scene.getObjectByName('HelpLayer');

  // фича
  console.log(GeometryUtils.getDistance(pointNewLineA, pointNewLineB));
  if (GeometryUtils.getDistance(pointNewLineA, pointNewLineB) < 0.0001) {
    let wayPoint = sceneService.findWayPoint(
      lines_nextObject[0],
      pointO[0],
      'serch_way'
    );
    let wayIndex =
      GeometryUtils.getDistance(wayPoint[0], pointO[0]) <
      GeometryUtils.getDistance(wayPoint[1], pointO[0])
        ? 0
        : 1;
    let pointForSearch = wayPoint[wayIndex];
    lines_nextObject[1] = lines_nextObject[0];
    do {
      let findLine = findNextLine(
        lines_nextObject[1].parent,
        lines_nextObject[1],
        pointForSearch
      );
      pointForSearch = findLine.newFindLinePoint[findLine.index];
      lines_nextObject[1] = findLine.line;
      // debugger;
      pointsWay_2_newObject = sceneService.findWayPoint(
        lines_nextObject[1],
        closesPoint.point,
        'serch_way'
      );
      point_B_newObject =
        GeometryUtils.getDistance(pointO[0], pointsWay_2_newObject[0]) <
        GeometryUtils.getDistance(pointO[0], pointsWay_2_newObject[1])
          ? pointsWay_2_newObject[1]
          : pointsWay_2_newObject[0];

      pointNewLineB = HelpLayerService.foundNewPoint(
        pointO[0],
        point_B_newObject,
        4
      );

      lines_nextObject[1].userData.nextPointIndex =
        point_B_newObject === pointsWay_2_newObject[0] ? 0 : 1;

      // helpLayer.children = [];
      // helpLayer.add( helpLayerService.positionInLine(
      //   editor,
      //   // [point_B_newObject]
      //   [findLine.newFindLinePoint[0]]
      // ));
      // helpLayer.add( helpLayerService.positionInLine(
      //   editor,
      //   // [point_B_newObject]
      //   [findLine.newFindLinePoint[1]]
      // ));
      // helpLayer.add( helpLayerService.positionInLine(
      //   editor,
      //   // [point_B_newObject]
      //   [pointNewLineB]
      // ));
      // helpLayer.add( helpLayerService.positionInLine(
      //   editor,
      //   [point_B_newObject]
      //   // [pointNewLineB]
      // ));
      // console.log('воно працює?');
      // console.log (GeometryUtils.getDistance(pointNewLineA, pointNewLineB));
      // sceneService.render(editor);
      // debugger;
    } while (GeometryUtils.getDistance(pointNewLineA, pointNewLineB) < 0.01);
  }

  //шлях 1
  let helpPointA = helpLayerService.positionInLine(
    editor,
    // [point_A_newObject]
    [pointNewLineA]
  );
  //шлях 2
  let helpPointB = helpLayerService.positionInLine(
    editor,
    // [point_B_newObject]
    [pointNewLineB]
  );

  //куди ішов (наступна лінія в старому об'єкті
  let helpPointD = helpLayerService.positionInLine(
    editor,
    // [point_D_nextPointOldObject]
    [pointNextLineOldObjectD]
  );
  //звідки прийшов
  let helpPointE = helpLayerService.positionInLine(
    editor,
    // [point_E_oldLine]
    [pointOldLineE]
  );
  //перетин
  let helpPointO = helpLayerService.positionInLine(editor, pointO);

  helpLayer.children = [];
  // // debugger;
  // // // перетин
  // helpLayer.add(helpPointO);
  // console.log(helpPointO.position);
  // sceneService.render(editor);
  // // debugger;
  // // // путь 1
  // helpLayer.add(helpPointA);
  // console.log(helpPointA.position);
  // sceneService.render(editor);
  // // debugger;
  // // // путь 2
  // helpLayer.add(helpPointB);
  // console.log(helpPointB.position);
  // sceneService.render(editor);
  // // debugger;
  // // // откуда
  // helpLayer.add(helpPointE);
  // console.log(helpPointE.position);
  // sceneService.render(editor);
  // // debugger;
  // // // куда
  // helpLayer.add(helpPointD);
  // console.log(helpPointD.position);
  // sceneService.render(editor);
  // // debugger;

  // 16/07/2020 розібратись з тим які кути повертаються,
  // поставити визначення потрібного індекса
  // let index = 0;
  // let point = GeometryUtils.linesIntersect (closesPoint.point, linePoint, thisLine.geometry.vertices[0], thisLine.geometry.vertices[1]);
  // let intersectionCAwithOD = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineA, pointO[0], pointNextLineOldObjectD, 0.001);
  // let intersectionCAwithOB = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineA, pointO[0], pointNewLineB, 0.001);
  // let intersectionCBwithOD = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineB, pointO[0], pointNextLineOldObjectD, 0.001);
  // let intersectionCBwithOA = GeometryUtils.linesIntersect (pointOldLineE, pointNewLineB, pointO[0], pointNewLineA, 0.001);
  //
  // console.log ( intersectionCAwithOD);
  // console.log ( intersectionCAwithOB);
  // console.log ( intersectionCBwithOD);
  // console.log ( intersectionCBwithOA);
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
  let pointAinLineOE = GeometryUtils.getDistance(pointNewLineA, pointOldLineE);
  let pointBinLineOE = GeometryUtils.getDistance(pointNewLineB, pointOldLineE);

  console.log(pointAinLineOD);
  console.log(pointBinLineOD);
  console.log(pointAinLineOE);
  console.log(pointBinLineOE);

  let minDistance = Math.min(
    pointAinLineOD,
    pointBinLineOD,
    pointAinLineOE,
    pointBinLineOE
  );
  // console.log (minDistance);
  if (minDistance > 1.5) {
    let newLine;
    if (
      GeometryUtils.getDistance(closesPoint.point, point_A_newObject) < 0.01
    ) {
      console.log(
        GeometryUtils.getDistance(closesPoint.point, point_A_newObject)
      );
      newLine = findNextLine(
        lines_nextObject[0].parent,
        lines_nextObject[0],
        point_A_newObject
      );
      let wayPointNewLine = sceneService.findWayPoint(
        newLine.line,
        closesPoint.point,
        'serch_way'
      );
      pointNewLineA = HelpLayerService.foundNewPoint(
        pointO[0],
        wayPointNewLine[newLine.index === 0 ? 1 : 0],
        4
      );
      helpPointA = helpLayerService.positionInLine(editor, [pointNewLineA]);
    }
    if (
      GeometryUtils.getDistance(closesPoint.point, point_B_newObject) < 0.01
    ) {
      console.log(
        GeometryUtils.getDistance(closesPoint.point, point_B_newObject)
      );
      newLine = findNextLine(
        lines_nextObject[1].parent,
        lines_nextObject[1],
        point_B_newObject
      );
      let wayPointNewLine = sceneService.findWayPoint(
        newLine.line,
        closesPoint.point,
        'serch_way'
      );
      pointNewLineB = HelpLayerService.foundNewPoint(
        pointO[0],
        wayPointNewLine[newLine.index === 0 ? 1 : 0],
        4
      );

      helpPointB = helpLayerService.positionInLine(editor, [pointNewLineB]);
    }
    if (
      GeometryUtils.getDistance(closesPoint.point, point_D_nextPointOldObject) <
      0.01
    ) {
      newLine = findNextLine(
        nextLine_oldObject.parent,
        nextLine_oldObject,
        point_D_nextPointOldObject
      );
      let wayPointNewLine = sceneService.findWayPoint(
        newLine.line,
        closesPoint.point,
        'serch_way'
      );
      pointNextLineOldObjectD = HelpLayerService.foundNewPoint(
        pointO[0],
        wayPointNewLine[newLine.index === 0 ? 1 : 0],
        5
      );
      helpPointD = helpLayerService.positionInLine(editor, [
        pointNextLineOldObjectD
      ]);
    }
    if (GeometryUtils.getDistance(closesPoint.point, point_E_oldLine) < 0.01) {
      newLine = findNextLine(oldLine.parent, oldLine, point_E_oldLine);
      let wayPointNewLine = sceneService.findWayPoint(
        newLine.line,
        closesPoint.point,
        'serch_way'
      );
      pointOldLineE = HelpLayerService.foundNewPoint(
        pointO[0],
        wayPointNewLine[newLine.index === 0 ? 1 : 0],
        5
      );
      helpPointE = helpLayerService.positionInLine(editor, [pointOldLineE]);
    }

    lines_nextObject[0].userData.nextPointIndex =
      point_A_newObject === pointsWay_1_newObject[0] ? 0 : 1;
    lines_nextObject[1].userData.nextPointIndex =
      point_B_newObject === pointsWay_2_newObject[0] ? 0 : 1;

    helpLayer.children = [];
    helpLayer.add(helpPointA);
    helpLayer.add(helpPointB);
    helpLayer.add(helpPointD);
    helpLayer.add(helpPointE);
    helpLayer.add(helpPointO);

    sceneService.render(editor);
    pointAinLineOD = GeometryUtils.getDistance(
      pointNewLineA,
      pointNextLineOldObjectD
    );
    pointBinLineOD = GeometryUtils.getDistance(
      pointNewLineB,
      pointNextLineOldObjectD
    );
    pointAinLineOE = GeometryUtils.getDistance(pointNewLineA, pointOldLineE);
    pointBinLineOE = GeometryUtils.getDistance(pointNewLineB, pointOldLineE);
    minDistance = Math.min(
      pointAinLineOD,
      pointBinLineOD,
      pointAinLineOE,
      pointBinLineOE
    );
    if (isNaN(minDistance)) {
      console.log(closesPoint);
      debugger;
    }
    console.log(minDistance);
    if (minDistance > 1.5) {
      debugger;
    }
    // debugger;
  }

  let nextLine;
  if (pointAinLineOE === minDistance) {
    // debugger;
    helpPointA.material.color.set(new THREE.Color(0xffdc00));
    lines_nextObject[0].material.color.set(new THREE.Color(0x00ff00));
    lines_nextObject[1].material.color.set(new THREE.Color(0xff0000));
    nextLine = lines_nextObject[0];
  }
  if (pointBinLineOE === minDistance) {
    // debugger;
    helpPointB.material.color.set(new THREE.Color(0xffdc00));
    lines_nextObject[1].material.color.set(new THREE.Color(0x00ff00));
    lines_nextObject[0].material.color.set(new THREE.Color(0xff0000));
    nextLine = lines_nextObject[1];
  }
  if (pointAinLineOD === minDistance) {
    // debugger;
    helpPointB.material.color.set(new THREE.Color(0xffdc00));
    lines_nextObject[1].material.color.set(new THREE.Color(0x00ff00));
    lines_nextObject[0].material.color.set(new THREE.Color(0xff0000));
    nextLine = lines_nextObject[1];
  }
  if (pointBinLineOD === minDistance) {
    // debugger;
    helpPointA.material.color.set(new THREE.Color(0xffdc00));
    lines_nextObject[0].material.color.set(new THREE.Color(0x00ff00));
    lines_nextObject[1].material.color.set(new THREE.Color(0xff0000));
    nextLine = lines_nextObject[0];
  }
  if (nextLine) {
    // sceneService.render(editor);
    // debugger;
    nextLine.userData.collisionPointsInf.some(pointInNewLine => {
      if (pointInNewLine !== closesPoint) {
        // debugger;
        if (
          collisionPoints.includes(pointInNewLine) &&
          !pieceOfFreeSpace[0].includes(nextLine) &&
          !pointInNewLine.startFromThisPoint
        ) {
          // debugger;
          pieceOfFreeSpace[0].push(nextLine);
          nextLine = searchTrueNextPoint(
            editor,
            collisionPoints,
            nextLine,
            pointInNewLine,
            pieceOfFreeSpace,
            entrainment,
            threshold
          );
          return;
        } else if (pointInNewLine.startFromThisPoint && nextLine !== 'done') {
          // debugger;
          pieceOfFreeSpace[0].push(nextLine);
          nextLine = 'done';
        }
      }
    });
    // debugger;

    return nextLine;
  }
  return false;
};

const findNextLine = (object, thisLine, linePoint, entrainment = 0.001) => {
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
    }
  }
};

const nextPoint = (
  editor,
  object,
  linePoint = null,
  thisLine = null,
  point,
  pieceOfFreeSpace,
  collisionPoints,
  freeSpace,
  entrainment,
  threshold
) => {
  let wayPoint = sceneService.findWayPoint(thisLine);
  let startFreeSpaceLengt = freeSpace.length;
  if (!linePoint) {
    if (
      GeometryUtils.getDistance(point.point, wayPoint[0]) <
      GeometryUtils.getDistance(point.point, wayPoint[1])
    ) {
      linePoint = wayPoint[1];
    } else {
      linePoint = wayPoint[0];
    }
  }
  let collisionPointsInThisLine = [];
  let nextPointLine;

  if (!pieceOfFreeSpace[0].includes(thisLine)) {
    freeSpace.push(thisLine);
    pieceOfFreeSpace[0].push(thisLine);
  } else {
    // return;
    console.log('диви сюди');
    // debugger;
    return;
  }
  let helpLayer = editor.scene.getObjectByName('HelpLayer');
  // todo походу резонно замінити на do {....} while(...)
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

    nextPointLine = findNextLine(object, thisLine, linePoint, entrainment);
    let oldLine = thisLine;
    // linePoint = nextPointLine.newFindLinePoint[nextPointLine.index];

    if (nextPointLine) {
      let line = nextPointLine.line;
      let newFindLinePoint = nextPointLine.newFindLinePoint;
      let index = nextPointLine.index;

      if (pieceOfFreeSpace[0].includes(line)) {
        console.log(pieceOfFreeSpace[0].indexOf(line));
        pieceOfFreeSpace[0] = [];
        // debugger;
        // todo сюди можливо ще треба буде глянути
        console.log('закольцована полость');
        return;
      }
      if (line.userData.weDoneWithThisLine) {
        pieceOfFreeSpace[0] = [];
        console.log('використаний елемент раніше');
        return;
      }

      // якщо на цій лінії є точки перетину
      if (line.userData.collisionPointsInf) {
        // debugger;
        // перевірка на те чи точка є важливою
        let checkPoint = false;

        // збирає тільки важливі точки які є на цій лінії, після розділу ліній
        // по точкам така точка може бути тільки одна
        collisionPointsInThisLine = [];
        for (let j = 0; j < line.userData.collisionPointsInf.length; j++) {
          if (collisionPoints.includes(line.userData.collisionPointsInf[j])) {
            collisionPointsInThisLine.push(line.userData.collisionPointsInf[j]);
          }
        }

        // // переір точок і ліній з відмічянням їх на сцені
        console.log(collisionPointsInThisLine);
        collisionPointsInThisLine.forEach(point => {
          // helpLayer.children = [];
          // helpLayer.add(helpLayerService.positionInLine(editor, [point.point]));
          // sceneService.render(editor);

          // if (collisionPointsInThisLine.length > 1) {
          //   debugger;
          //   point.entities.forEach(line => {
          //     line.material.color.set(new THREE.Color(0x0000ff)); // синій
          //     sceneService.render(editor);
          //     line.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
          //     // debugger;
          //   });
          // }
          // todo костиль. звідки у нього ростуть ноги було б непогано розібратись
          //  в point.entities має бути мінімум і в ідеалі 4 лінії, якщо більше...
          //  ну може бути в теорії, але менше ніяк...
          if (point.entities.length < 4) {
            let objects = editor.scene.getObjectByName('Objects');
            objects.children.forEach(object => {
              object.children.forEach(line => {
                if (!point.entities.includes(line)) {
                  let lineWay = sceneService.findWayPoint(line);
                  if (
                    GeometryUtils.getDistance(lineWay[0], point.point) <
                      0.001 ||
                    GeometryUtils.getDistance(lineWay[0], point.point) < 0.001
                  ) {
                    point.entities.push(line);
                    // debugger;
                  }
                }
              });
            });
            // debugger;
          }

          // point.entities.forEach(line => {
          //     line.material.color.set(new THREE.Color(0x0000ff)); // синій
          //   sceneService.render(editor);
          //     line.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
          // debugger;
          // });
        });

        let closesPoint = null; // після тесту роботи присваювати замість collisionPointsInThisLine
        let findPoint = [];
        if (collisionPointsInThisLine.length === 1) {
          closesPoint = collisionPointsInThisLine[0];
        } else if (collisionPointsInThisLine.length > 1) {
          // debugger;
          // todo потребує уваги
          collisionPointsInThisLine.forEach(point => {
            findPoint.push(point.point);
          });
          closesPoint =
            collisionPointsInThisLine[closestPoint(findPoint, linePoint)];
          // debugger;
        }

        // перевірка на те що є важлива точка перетину
        if (closesPoint) {
          if (
            closesPoint.weDoneWithThisPoint &&
            !closesPoint.startFromThisPoint
          ) {
            console.log('точкки пішли по другому кругу');
          }
          if (startFreeSpaceLengt !== freeSpace.length) {
            checkPoint = true;
            thisLine = line;

            // if (freeSpace.includes(thisLine)) {
            // debugger;
            //   lineCheker += 1;
            // } else {
            //   lineCheker = 0;
            // }
            // if (lineCheker > 5) {
            //   if (pieceOfFreeSpace[0].includes(thisLine)) {
            //     console.log('закольцована полость');
            //   } else {
            //     console.log('лінії вийшли за тереторію кола');
            //   }
            //   return;
            // }

            if (!pieceOfFreeSpace[0].includes(thisLine)) {
              // thisLine.userData.weDoneWithThisLine = true;
              freeSpace.push(thisLine);
              pieceOfFreeSpace[0].push(thisLine);
            } else {
              console.log('закольцована полость');
            }

            startFreeSpaceLengt = freeSpace.length;
            closesPoint.weDoneWithThisPoint = true;

            if (closesPoint.startFromThisPoint) {
              pieceOfFreeSpace[0].forEach(line => {
                line.userData.weDoneWithThisLine = true;
              });
              console.log('he is alive!!!!!');
              return;
            } else {
              // debugger;
              let entities = closesPoint.entities;

              thisLine.material.color.set(new THREE.Color(0xffdc00));

              thisLine = searchTrueNextPoint(
                editor,
                collisionPoints,
                thisLine,
                closesPoint,
                pieceOfFreeSpace,
                entrainment,
                threshold
              );

              if (thisLine === 'done') {
                pieceOfFreeSpace[0].forEach(line => {
                  line.userData.weDoneWithThisLine = true;
                });
                console.log('he is alive!!!!!');
                return;
              }

              sceneService.render(editor);
              // // debugger;
              //
              // if (freeSpace.includes(thisLine)) {
              //   lineCheker += 1;
              // } else {
              //   // // debugger;
              //   lineCheker = 0;
              // }
              // if (lineCheker > 5) {
              //   if (pieceOfFreeSpace[0].includes(thisLine)) {
              //     console.log('закольцована полость');
              //   } else {
              //     console.log('лінії вийшли за тереторію кола');
              //   }
              //   return;
              // }
              if (!pieceOfFreeSpace[0].includes(thisLine)) {
                // thisLine.userData.weDoneWithThisLine = true;
                freeSpace.push(thisLine);
                pieceOfFreeSpace[0].push(thisLine);
              } else {
                debugger;
              }

              wayPoint = sceneService.findWayPoint(thisLine);

              // todo перевірити чи можна замінити на index
              // // debugger;
              let pointIndex = thisLine.userData.nextPointIndex;
              // GeometryUtils.getDistance(closesPoint.point, wayPoint[0])
              // < GeometryUtils.getDistance(closesPoint.point, wayPoint[1])? 1 : 0;

              thisLine.material.color.set(new THREE.Color(0xffdc00));
              // render(editor);

              object = thisLine.parent;
              // // debugger;
              //
              // // починаємо творити
              // if (entities[0] === line) {
              //   thisLine = entities[1];
              // } else if (entities[1] === line) {
              //   thisLine = entities[0];
              // } else {
              //   // debugger;
              //   console.log("чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, " +
              //     "але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так");
              // }
              //
              // if (freeSpace.includes(thisLine)) {
              //   lineCheker += 1;
              // } else {
              //   lineCheker = 0;
              // }
              // if (lineCheker > 5) {
              //   if (pieceOfFreeSpace[0].includes(thisLine)) {
              //     console.log('закольцована полость');
              //   } else {
              //     console.log('лінії вийшли за тереторію кола');
              //   }
              //   return;
              // }
              //
              // startFreeSpaceLengt = freeSpace.length;
              //
              // object = thisLine.parent;
              // wayPoint = sceneService.findWayPoint(thisLine);
              //
              // collisionPointsInThisLine = [];
              // for (
              //   let j = 0;
              //   j < thisLine.userData.collisionPointsInf.length;
              //   j++
              // ) {
              //   if (
              //     collisionPoints.includes(
              //       thisLine.userData.collisionPointsInf[j]
              //     )
              //   ) {
              //     collisionPointsInThisLine.push(
              //       thisLine.userData.collisionPointsInf[j]
              //     );
              //   }
              // }
              // let pointIndex;
              // // // debugger;
              // // todo так як змінився thisLine цілком можливо що мав змінитись newFindLinePoint, потрібно перевірити логіку
              // if (newFindLinePoint[index] !== closesPoint) {
              //   // debugger;
              //   pointIndex = searchTrueNextPoint(editor, thisLine, linePoint,
              //     nextPointLine, closesPoint, oldLine, pieceOfFreeSpace, entrainment);
              //   // todo тут має бути результат функциї // searchTrueNextPoint (thisLine, linePoint)
              // } else {
              //   console.log('прийшов час подивитись сюди');
              //   // debugger;
              // }

              // похуду це піде в утіль, але спершу тести і перечитка коду
              // if (collisionPointsInThisLine.length > 1) {
              //   // debugger;
              //   console.log(
              //     'от ми нарешті і дійшли до ліній на яких декілька важливих точок'
              //   );
              //   //   // перше що реалізовуємо перевірку чи є точки між тою звідки ідемо(тікуща точка перетену) і точка куди ідемо (wayPoint[pointIndex])
              //   //   //  якщо є повторюємо все що було в цьому форі з позиції скакаємо з цієї лінії на іншу
              //   //   let lengthToWayPoint = [];
              //   //   let newLineClosesPoint = null;
              //   //   let intersectPoint_WayPoint = null;
              //   //   if (pointIndex !== false) {
              //   //     lengthToWayPoint.push(GeometryUtils.getDistance(closesPoint.point, wayPoint[pointIndex]));
              //   //     collisionPointsInThisLine.forEach((collPoint) => {
              //   //       let collPoint_WayPoint = GeometryUtils.getDistance(collPoint.point, wayPoint[pointIndex]);
              //   //       if (collPoint_WayPoint < lengthToWayPoint[0]) {
              //   //         lengthToWayPoint.push(collPoint);
              //   //         if (collPoint_WayPoint > intersectPoint_WayPoint) {
              //   //           newLineClosesPoint = collPoint;
              //   //           intersectPoint_WayPoint = collPoint_WayPoint;
              //   //         }
              //   //       }
              //   //     });
              //   //     console.log(lengthToWayPoint)
              //   //     if (lengthToWayPoint.length > 1) {
              //   //
              //   //       if (!pieceOfFreeSpace[0].includes(thisLine)){
              //   //         // thisLine.userData.weDoneWithThisLine = true;
              //   //         freeSpace.push(thisLine);
              //   //         pieceOfFreeSpace[0].push(thisLine);
              //   //       }
              //   //       nextPointLine = findNextLine(object, thisLine, wayPoint[pointIndex], entrainment);
              //   //       oldLine = thisLine;
              //   //       console.log (newLineClosesPoint);
              //   //       entities = newLineClosesPoint.entities;
              //   //       if (entities[0] === oldLine) {
              //   //         thisLine = entities[1];
              //   //       } else if (entities[1] === oldLine) {
              //   //         thisLine = entities[0];
              //   //       } else {
              //   //         console.log("чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, " +
              //   //           "але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так");
              //   //       }
              //   //
              //   //       if (freeSpace.includes(thisLine)) {
              //   //         lineCheker += 1;
              //   //       } else {
              //   //         lineCheker = 0;
              //   //       }
              //   //       if (lineCheker > 5) {
              //   //         if (pieceOfFreeSpace[0].includes(thisLine)) {
              //   //           console.log('закольцована полость');
              //   //         } else {
              //   //           console.log('лінії вийшли за тереторію кола');
              //   //           // // debugger;
              //   //         }
              //   //         console.log('лінії пішли по другому кругу.... значить коло');
              //   //         return;
              //   //       }
              //   //       if (!pieceOfFreeSpace[0].includes(thisLine)){
              //   //         // thisLine.userData.weDoneWithThisLine = true;
              //   //         freeSpace.push(thisLine);
              //   //         pieceOfFreeSpace[0].push(thisLine);
              //   //       }
              //   //       startFreeSpaceLengt = freeSpace.length;
              //   //       object = thisLine.parent;
              //   //       if (pointIndex === 0) {
              //   //         linePoint = wayPoint[1];
              //   //       } else {
              //   //         linePoint = wayPoint[0];
              //   //       }
              //   //       newLineClosesPoint.weDoneWithThisPoint = true;
              //   //       // debugger;
              //   //       pointIndex = searchTrueNextPoint(editor, collisionPoints, thisLine, linePoint,
              //   //         nextPointLine, newLineClosesPoint, oldLine,
              //   //         pieceOfFreeSpace, entrainment);
              //   //       wayPoint = findWayPoint(thisLine);
              //   //       console.log("якщо воно зараз прям запрацює буде круто");
              //   //     }
              //   //   }
              // }

              if (pointIndex !== false) {
                startFreeSpaceLengt -= 1;
              } else {
                // // debugger;
                pointIndex = 0;
              }
              linePoint = wayPoint[pointIndex];

              // } else {
              //   // todo 08/07/2020 доробити/переробити цей елс, має працювати дл яліній на якій декілька важливих точок перетину.
              //   // можливо пройтись поштучно по кожній лінії
              //   console.log ('todo 08/07/2020 доробити/переробити цей елс, має працювати дл яліній на якій декілька важливих точок перетину.' +
              //     'можливо пройтись поштучно по кожній лінії')
              //   // // debugger;
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
              //   // console.log (closesPoint);
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
        } else {
          console.log(pieceOfFreeSpace);
          console.log(thisLine);
          console.log(collisionPoints);
          // console.log (collisionPoints);
          // debugger;
          // якщо ти тут посуті це ошибка коду.
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
            // // debugger;
            // if (testPoint.line.userData.collisionPointsInf) {
            //   console.log(testPoint.line.userData);
            //   // debugger;
            //   testPoint = findNextLine(object, thisLine, wayPoint[1]);
            //   if (testPoint.line.userData.collisionPointsInf) {
            //     console.log(testPoint.line.userData);
            //     // debugger;
            //   }
            // }
          }
          i = -1;
        } else if (!checkPoint && closesPoint) {
          // // debugger;
          thisLine = line;
          if (!pieceOfFreeSpace[0].includes(thisLine)) {
            // thisLine.userData.weDoneWithThisLine = true;
            freeSpace.push(thisLine);
            pieceOfFreeSpace[0].push(thisLine);
            // // debugger;
            pieceOfFreeSpace[1].push(thisLine);
          }
        }
      } else {
        thisLine = line;
        freeSpace.push(thisLine);
        pieceOfFreeSpace[0].push(thisLine);
      }

      if (i >= 0) {
        linePoint = newFindLinePoint[index];
        i = -1;
      }

      // todo ВЕРНИ ПОСТУПОВЕ Закрашення ліній
      thisLine.material.color.set(new THREE.Color(0xffdc00));
      sceneService.render(editor);
    } else {
      console.log('типу чота не то');
      // debugger;
      return;
    }
  }
  // // debugger;
  // return  new Promise(resolve => {
  //   setTimeout(() => {
  //     resolve(true);
  //   }, 4000)
  // });
};

const testMyFunktion = (
  editor,
  collisionPoints,
  collisionAllPoints,
  objects,
  threshold
) => {
  //step 1 - mark line with collisionPoints
  collisionPoints.forEach(point => {
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
  const { scene } = editor;
  let helpLayer = scene.getObjectByName('HelpLayer');
  helpLayer.children = [];

  //step 2 - call search free spece function
  collisionPoints.forEach((point, i) => {
    // helpLayer.children = [];
    helpLayer.add(helpLayerService.positionInLine(editor, [point.point]));
    console.log(point.entities);
    point.entities.forEach(line => {
      line.material.color.set(new THREE.Color(0x0000ff)); // синій
    });
    sceneService.render(editor);
    point.entities.forEach(line => {
      line.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
    });
    // debugger;

    let pointStartIndex = [];
    let testIndex = 0;
    do {
      if (point.entities[testIndex].userData.collisionPointsInf.length === 1) {
        pointStartIndex.push(testIndex);
      }
      testIndex += 1;
    } while (point.entities[testIndex]);
    // // debugger;
    if (pointStartIndex.length > 0) {
      // todo так як ми розділили лінії на точках перетину, з'являється резон
      //  маркувати не точки (так як одна точка може юзатись пару раз, а лінії
      //  так як після розділу одна лінія може бути тільки в одному об'єкті
      //  пс. маркувати лінії тільки у випадку закольцовки області (косольне
      //  повідомлення "he is alive")
      point.startFromThisPoint = true;

      helpLayer.children = [];
      helpLayer.add(helpLayerService.positionInLine(editor, [point.point]));
      sceneService.render(editor);
      console.log(' точка ' + i + ' в процесі');

      // pointStartIndex.splice(0, 2);
      pointStartIndex.forEach(index => {
        console.log(
          ' точка ' + i + ' в процесі, а якщо конктретно то лінія ' + index
        );
        // debugger;
        if (
          !point.entities[index].userData.weDoneWithThisLine &&
          point.entities[index].userData.collisionPointsInf.length === 1
        ) {
          // point.entities[index].material.color.set(new THREE.Color(0x0000ff)); // синій
          // sceneService.render(editor);
          // debugger;
          // point.entities[index].material.color.set(new THREE.Color(0xffaa00)); // оранжевий
          // console.log (point.entities[index].userData.collisionPointsInf);
          // // debugger;
          // let wayPoint = sceneService.findWayPoint(point.entities[index]);
          // console.log (GeometryUtils.getDistance(wayPoint[0], wayPoint[1]));
          // // debugger;
          freeSpacesAll[freeSpacesAll.length] = [[], []];
          nextPoint(
            editor,
            point.entities[index].parent,
            null,
            point.entities[index],
            point,
            freeSpacesAll[freeSpacesAll.length - 1],
            collisionPoints,
            freeSpace,
            entrainment,
            threshold
          );
        } else if (!point.entities[index].userData.weDoneWithThisLine) {
          console.log(point.entities[index]);
          debugger;
        }
      });
      point.startFromThisPoint = false;
    }
  });

  // // debugger;

  //step 3 - unmark line with collisionPoints
  collisionAllPoints.forEach(point => {
    point.entities.forEach(line => {
      line.userData.collisionPointsInf = [];
    });
  });

  // filter not need line in find object
  freeSpacesAll.forEach((lineGroup, i) => {
    let lines = lineGroup[0];
    if (lines.length > 2) {
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
          // // debugger;
        }
      }
      for (i = objLength - 1; i > 0; i--) {
        if (firstPointIndex === null) {
          console.log(lines[i]);
          thisLineWayPoint = sceneService.findWayPoint(lines[i]);
          colPointThisLine = lines[i].userData.collisionPointsInf;
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
            // // // debugger;
          }
        }
      }
      console.log(firstPointIndex);
      // // // debugger;
      if (firstPointIndex) {
        lines.splice(0, firstPointIndex);
        console.log(lineGroup[1]);
        // // // debugger;
      }
    } else {
      // // debugger;
    }
  });

  // create line for create free space objects
  freeSpacesAll.forEach((lineGroup, i) => {
    lineGroup[1] = [];
    lineGroup[0].forEach(line => {
      let newLine;
      if (line.geometry.type === 'Geometry') {
        if (!line.geometry.vertices) {
          // debugger;
        }
        newLine = createLine(
          line.geometry.vertices[0],
          line.geometry.vertices[1]
        );
      } else if (line.geometry.type === 'CircleGeometry') {
        // // debugger;
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
      // // debugger;
      newLine.userData.collisionPointsInf = line.userData.collisionPointsInf;
      lineGroup[1].push(newLine);
    });

    let linePoint = null;
    if (lineGroup[1].length > 1) {
      let lineIndex = 0;
      do {
        let line = lineGroup[1][lineIndex];
        let wayPoint = sceneService.findWayPoint(line);
        if (linePoint === null) {
          let searchPoint = sceneService.findWayPoint(
            lineGroup[1][lineGroup[1].length - 1]
          );
          let minDist = 1;
          searchPoint.forEach(pointA => {
            wayPoint.forEach(pointB => {
              const dist = GeometryUtils.getDistance(pointA, pointB);
              if (minDist > dist) {
                linePoint = pointA;
                minDist = dist;
              }
            });
          });
        }
        let distance0 = GeometryUtils.getDistance(wayPoint[0], linePoint);
        let distance1 = GeometryUtils.getDistance(wayPoint[1], linePoint);
        if (distance0 < distance1) {
          if (distance0 > 0.1 * threshold && distance0 < 1) {
            // debugger;
            let newLine = createLine(linePoint, wayPoint[0]);
            lineGroup[1].splice(lineIndex, 0, newLine);
            lineIndex += 1;
          }
          linePoint = wayPoint[1];
        } else if (distance0 > distance1) {
          if (distance1 > 0.1 * threshold && distance1 < 1) {
            // debugger;
            let newLine = createLine(linePoint, wayPoint[1]);
            lineGroup[1].splice(lineIndex, 0, newLine);
            lineIndex += 1;
          }
          linePoint = wayPoint[0];
        }
        // if (distance0 > 1 && distance1 > 1){
        //   // debugger;
        //   lineGroup[1] = [];
        // }
        lineIndex += 1;
      } while (lineIndex < lineGroup[1].length);
    }
  });

  let lineIndex = 0;
  do {
    if (freeSpacesAll[lineIndex][1].length < 2) {
      freeSpacesAll.splice(lineIndex, 1);
    } else {
      lineIndex += 1;
    }
  } while (lineIndex < freeSpacesAll.length);

  // todo добити до ума чистку ліній (забирати лінію якщо вона виде в нікуда,
  //  перевіряти чи лінія закольцовалась, якщо ні спробувати найти точку
  //  в якій закольцовується) від 21.09.2020

  // create free space objects
  let edgeModels = [];
  let minArea = 0.01;
  freeSpacesAll.forEach((lineGroup, i) => {
    if (lineGroup[1].length < 2) {
      console.log('skip ' + i + ' object');
      // // debugger;
    } else {

      // todo увеличить точность не теряя пустоты 08/10/2020
      //  1) пробуємо використовувати buildEdgeModel замість createObject
      //  2) дописуємо фічу затикачки дир в окрему функцию яку визиваємо в старті
      //  функциї (точность залежить від маштабу) createObject
      //  3) добиваємо до ума функцию cutLine і запускаємо перед buildEdgeModel
      //  чи createObject
      //  4) у випадку якщо залишаємо createObject, створюємо новий слой в сцені
      //  паралельно з "Objects" і "HelpLayers"
      //
      // edgeModels.push ({
      //   userData: {
      //     edgeModel: GeometryUtils.buildEdgeModel(
      //       { children: lineGroup[1] },
      //       0.0001,
      //       'Free space'
      //     )
      //   }
      // });
      let res;

      // if (i => 19) {
      //   helpLayer.children = [];
      //   lineGroup[0].forEach(line => {
      //     let wayPoint = sceneService.findWayPoint(line);
      //     wayPoint.forEach(point => {
      //       helpLayer.add(helpLayerService.positionInLine(
      //         editor,
      //         [point]
      //       ));
      //     });
      //
      //     line.material.color.set(new THREE.Color(0xff0000));
      //   });
      //   console.log(lineGroup[1]);
      //   sceneService.render(editor);
      //   // debugger;
      // }

      // if (i !== 19) {
      res = sceneService.createObject(
        editor,
        'freeSpaceZone №' + i,
        lineGroup[1],
        0.0001,
        'Free space',
        minArea,
        i
      );

        if (res !== false) {
          const geometryInfo = GeometryUtils.getObjectInfo(res);
          console.log(
            'area ' + i + ' void = ' + geometryInfo[0].region.area
          );
          if (geometryInfo[0].region.area > minArea) {
            edgeModels.push(res);
          }
        }
      // }
      // let edgeModel = GeometryUtils.buildEdgeModel(
      //   { children:  lineGroup[1] },
      //   0.0001,
      //   'Free space'
      // );
      // console.log(edgeModels[edgeModels.length - 1]);
      // debugger;

      // debugger;
      console.log('done with ' + i + ' object');

      // } else {
      //   let edgeModel = GeometryUtils.buildEdgeModel(
      //     { children:  lineGroup[1] },
      //     0.0001,
      //     'Free space'
      //   );
      //   console.log(edgeModel);
      //   debugger;
      // }
    }
  });
  return edgeModels;
  // let edgeModel = GeometryUtils.buildEdgeModel(
  //   { children:  lineGroup[1] },
  //   editor.options.threshold,
  //   'Free space'
  // );
  //
  // skive (lineGroup[0], editor);
  //
  //
  // recolor find free Space
  // drawLine (freeSpace, editor);
};

// let cutLine = (line, pointStart, cutPoint) => {
//   let newLine = [];
//   // console.log(line);
//   // // debugger;
//   // let index = array.indexOf(line);
//   // if (index) {
//   //   // debugger;
//   if (line.geometry.type === 'Geometry') {
//     newLine.push(createLine(
//       line.geometry.vertices[0],
//       cutPoint
//     ));
//     newLine.push(createLine(
//       cutPoint,
//       line.geometry.vertices[1]
//     ));
//   } else if (line.geometry.type === 'CircleGeometry') {
//     let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
//     let copyCircleGeometry = changeArcGeometry(
//       { 0: 'copy' },
//       {
//         radius: line.geometry.parameters.radius,
//         thetaStart: line.geometry.parameters.thetaStart,
//         thetaLength: line.geometry.parameters.thetaLength
//       }
//     );
//     newLine = new THREE.Line(copyCircleGeometry, materialLine);
//     newLine.position.x = line.position.x;
//     newLine.position.y = line.position.y;
//     // console.log(newLine);
//     // // debugger;
//   }
//   // array[index] = newLine;
//   // }
//   // console.log (newLine);
//   // // debugger;
//   return newLine;
// };

export default {
  combineEdgeModels
};
