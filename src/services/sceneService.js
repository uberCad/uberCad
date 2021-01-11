import axios from 'axios';

import * as THREE from '../extend/THREE';
import ArrayUtils from './arrayUtils';
import GeometryUtils from './GeometryUtils';
import ConsoleUtils from './consoleUtils';
import HelpLayerService from './helpLayerService';
import ToastService from './ToastService';
import { SelectNewTypes } from '../store/options/types';
import { MEASUREMENT_ANGLE, MEASUREMENT_RADIAL } from '../actions/measurement';
import {
  LINE_PARALLEL,
  LINE_PERPENDICULAR,
  LINE_TANGENT_TO_ARC
} from '../actions/line';
import {
  isPoint,
  unselectLine,
  closestPoint,
  createLine,
  changeArcGeometry,
  changeGeometry,
  changeArcGeometry as changGeomEditObj,
  circleIntersectionAngle as circlInterAngle, addHelpPoints
} from './editObject';
import helpLayerService from './helpLayerService';
import edgeService from './edgeService';

let canvasClick = (event, camera) => {
  let canvas = event.target.tagName === 'CANVAS' && event.target;
  let canvasOffset = getOffset(canvas);

  let mouse = new THREE.Vector3(
    ((event.pageX - canvasOffset.left) / (canvas.clientWidth - 1)) * 2 - 1,
    -((event.pageY - canvasOffset.top) / (canvas.clientHeight - 1)) * 2 + 1,
    0
  );

  let canvasCenter = new THREE.Vector3(0, 0, 0);

  // get canvas center coordinates
  canvasCenter.unproject(camera);

  // get mouse coordinates
  mouse.unproject(camera);

  return {
    mouse,
    canvasCenter
  };
};

const onClick = (event, scene, camera, renderer) => {
  let result = {
    point: undefined, // new THREE.Vector3
    activeEntities: []
  };
  let canvas = event.target.tagName === 'CANVAS' && event.target;
  if (!canvas) {
    if (renderer.domElement) {
      canvas = renderer.domElement;
    } else {
      return;
    }
  }

  let canvasOffset = getOffset(canvas);

  let rayCaster = new THREE.Raycaster(); // create once
  let mouse = new THREE.Vector3(
    ((event.pageX - canvasOffset.left) / (canvas.clientWidth - 1)) * 2 - 1,
    -((event.pageY - canvasOffset.top) / (canvas.clientHeight - 1)) * 2 + 1,
    0
  );
  rayCaster.setFromCamera(mouse, camera);

  // get mouse coordinates
  mouse.unproject(camera);
  result.point = mouse;

  rayCaster.intersectObjects(scene.children, true).forEach(intersection => {
    if (result.activeEntities.indexOf(intersection.object) < 0) {
      result.activeEntities.push(intersection.object);
    }
  });

  result.activeEntities.forEach(function(line) {
    if (line.geometry.type === 'Geometry') {
      line.userData.mouseDistance = GeometryUtils.distanceToLine(
        result.point,
        line
      );
    } else if (line.geometry.type === 'CircleGeometry') {
      line.userData.mouseDistance = GeometryUtils.distanceToArc(
        result.point,
        line
      );
    }
  });
  let compare = (a, b) => {
    if (a.userData.mouseDistance > b.userData.mouseDistance) return 1;
    if (a.userData.mouseDistance < b.userData.mouseDistance) return -1;
  };
  result.activeEntities.sort(compare);

  return result;
};

const doSelection = (selectResultAll, editor) => {
  let selectResult = [];
  if (editor.editMode.isEdit) {
    selectResultAll.forEach(element => {
      if (element.parent.name === editor.editMode.editObject.name) {
        // debugger;
        selectResult.push(element);
      }
    });
  } else {
    selectResultAll.forEach(element => {
      if (element.parent.visible === true) {
        selectResult.push(element);
      }
    });
  }
  highlightEntities(editor, editor.activeEntities, true, undefined, false);
  switch (editor.options.selectMode) {
    case LINE_TANGENT_TO_ARC:
      editor.activeEntities = selectResult;
      break;
    case LINE_PERPENDICULAR:
      editor.activeEntities = selectResult;
      break;
    case LINE_PARALLEL:
      editor.activeEntities = selectResult;
      break;
    case MEASUREMENT_RADIAL:
      editor.activeEntities = selectResult;
      break;
    case MEASUREMENT_ANGLE:
      editor.activeEntities = selectResult;
      break;
    case SelectNewTypes.NEW:
      editor.activeEntities = selectResult;
      break;
    case SelectNewTypes.ADD:
      editor.activeEntities = ArrayUtils.union(
        editor.activeEntities,
        selectResult
      );
      break;
    case SelectNewTypes.SUB:
      editor.activeEntities = ArrayUtils.subtract(
        editor.activeEntities,
        selectResult
      );
      break;
    case SelectNewTypes.INTERSECT:
      editor.activeEntities = ArrayUtils.intersection(
        editor.activeEntities,
        selectResult
      );
      break;
    default:
      console.warn(`Unhandled select mode ${editor.options.selectMode}`);
  }
  highlightEntities(editor, editor.activeEntities);

  return editor.activeEntities;
};

const render = editor => {
  const { renderer, scene, camera } = editor;
  renderer.render(scene, camera);
};

const highlightEntities = (
  editor,
  entities,
  restoreColor = false,
  color = 0x0000ff,
  doRender = true
) => {
  // console.warn({editor, activeEntities: editor.activeEntities})

  if (!Array.isArray(entities)) {
    entities = [entities];
  }

  entities.forEach(entity => {
    // upd color
    if (restoreColor) {
      // todo частково повторюэ роботу функцыъ unselect
      let { scene } = editor;
      unselectLine([entity], scene);

      // delete entity.userData.showInTop;
      // if (entity.userData.lastoriginalColor) {
      //   entity.material.color = entity.userData.lastoriginalColor.clone();
      //   delete entity.userData.lastoriginalColor;
      //   // entity.userData.helpPoints.forEach(helpPoint=>delete helpPoint);
      //   // editor.scene.children[1].children=[];
      // }else if (entity.userData.originalColor) {
      //   // entity.material.color.set(entity.userData.originalColor);
      //   entity.material.color = entity.userData.originalColor.clone();
      //   delete entity.userData.originalColor;
      // }
    } else {
      if (!entity.userData || !entity.userData.originalColor) {
        entity.userData.originalColor = entity.material.color.clone();
      } else {
        entity.userData.lastoriginalColor = entity.material.color.clone();
      }
      entity.material.color.set(new THREE.Color(color));
    }
    // entity.geometry.computeLineDistances();
    entity.material.needUpdate = true;
  });
  if (doRender) {
    render(editor);
  }
};

function getEntityNeighbours(entity, editor, usedEntities = [], startPoint) {
  // entity on layer: find only on same layer. otherwise only on Layers
  // if entity belongs to object - find only in object entities

  let { cadCanvas } = editor;
  usedEntities = [...usedEntities, entity];

  let result = {
    entity,
    next: []
  };

  let vertex;
  if (!startPoint) {
    vertex = GeometryUtils.getFirstVertex(entity);
  } else {
    vertex = GeometryUtils.getAnotherVertex(entity, startPoint);
  }

  // intersection on same layer
  let objects = cadCanvas.getLayers().children;

  if (editor.options.singleLayerSelect) {
    let layerName = entity.parent.name;
    cadCanvas.getLayers().children.forEach(layer => {
      if (layer.name === layerName) {
        objects = layer.children;
      }
    });
  }

  let intersections = getIntersections(
    vertex,
    objects,
    usedEntities,
    editor.options.threshold
  );
  if (!intersections.length) {
    vertex = GeometryUtils.getAnotherVertex(entity, vertex);
    intersections = getIntersections(
      vertex,
      objects,
      usedEntities,
      editor.options.threshold
    );
  }

  intersections.forEach(intersect => {
    result.next.push(
      getEntityNeighbours(
        intersect.object,
        editor,
        usedEntities,
        intersect.vertex
      )
    );
  });

  return result;
}

function getIntersections(vertex, objects, usedEntities, threshold = 0.000001) {
  let rayCaster = new THREE.Raycaster(vertex, new THREE.Vector3(0, 0, 1));
  //lower intersections count
  rayCaster.linePrecision = 0.0001;

  let intersections = rayCaster.intersectObjects(objects, true);

  // check if we at start point again
  try {
    intersections = intersections.filter(function(intersect) {
      if (usedEntities.length > 2 && usedEntities[0] === intersect.object) {
        throw 'first loop detected';
      }

      if (usedEntities.includes(intersect.object)) {
        return false;
      }

      let vertices = GeometryUtils.getVertices(intersect.object);
      for (let i = 0; i < vertices.length; i++) {
        if (GeometryUtils.getDistance(vertex, vertices[i]) < threshold) {
          intersect.vertex = vertices[i];
          intersect.id = intersect.object.id;
          return true;
        }
      }

      return false;
    });
  } catch (e) {
    if (e === 'first loop detected') {
      intersections = [];
    } else {
      throw e;
    }
  }

  return intersections;
}

/**
 * @deprecated
 * @param entity
 * @param editor
 * @param entities
 * @returns {Array}
 */
function getNeighbours_old(entity, editor, entities = []) {
  let { scene } = editor;

  let vertices = [];

  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc

    let vertex = new THREE.Vector3(0, 0, 0);
    vertices.push(
      vertex.addVectors(entity.geometry.vertices[0], entity.position)
    );

    vertex = new THREE.Vector3(0, 0, 0);
    vertices.push(
      vertex.addVectors(
        entity.geometry.vertices[entity.geometry.vertices.length - 1],
        entity.position
      )
    );
  } else {
    // line?
    vertices = entity.geometry.vertices;
  }

  vertices.forEach(vertex => {
    let tmpVertices = [vertex];

    tmpVertices.forEach(tmpVertex => {
      let rayCaster = new THREE.Raycaster(
        tmpVertex,
        new THREE.Vector3(0, 0, 1)
      );
      //lower intersections count
      rayCaster.linePrecision = 0.0001;

      // TODO: intersection on same layer

      let objects = scene.children;
      if (editor.options.singleLayerSelect) {
        let layerName = entity.parent.name;
        scene.children.forEach(child => {
          if (child.name === 'Layers') {
            child.children.forEach(layer => {
              if (layer.name === layerName) {
                objects = layer.children;
              }
            });
          }
        });
      }

      let intersections = rayCaster.intersectObjects(objects, true);

      intersections.forEach(intersect => {
        if (entities.indexOf(intersect.object) < 0) {
          // object not in array yet, check

          let checkVertices = [];
          if (intersect.object.geometry instanceof THREE.CircleGeometry) {
            let vertex = new THREE.Vector3(0, 0, 0);
            checkVertices.push(
              vertex.addVectors(
                intersect.object.geometry.vertices[0],
                intersect.object.position
              )
            );

            vertex = new THREE.Vector3(0, 0, 0);
            checkVertices.push(
              vertex.addVectors(
                intersect.object.geometry.vertices[
                  intersect.object.geometry.vertices.length - 1
                ],
                intersect.object.position
              )
            );
          } else {
            checkVertices = intersect.object.geometry.vertices;
          }

          checkVertices.forEach(checkVertex => {
            if (checkVertex.distanceTo(vertex) < editor.options.threshold) {
              entities.push(intersect.object);
              getNeighbours_old(intersect.object, editor, entities);
            }
          });
        }
      });
    });
  });

  return entities;
}

const recursiveSelect = (object, editor) => {
  let entities = [];

  let neighbours = getEntityNeighbours(object, editor);
  let pathVariants = GeometryUtils.getPathVariants(neighbours);
  pathVariants = GeometryUtils.filterSelfIntersectingPaths(pathVariants);

  if (pathVariants.length) {
    let minArea = Infinity;
    let variantWithSmallestArea = [];
    pathVariants.forEach(variant => {
      let vertices = GeometryUtils.getSerialVerticesFromOrderedEntities(
        variant
      );
      let area = GeometryUtils.pathArea(vertices);

      if (area < minArea) {
        variantWithSmallestArea = variant;
        minArea = area;
      }
    });

    entities = variantWithSmallestArea;
  } else {
    alert('Finding path with deprecated method');
    // debugger;
    entities = getNeighbours_old(object, editor);
    entities.push(object);

    // unique entities
    entities = [...new Set(entities)];

    entities = GeometryUtils.skipZeroLines(entities, editor.options.threshold);
  }

  // ConsoleUtils.previewPathInConsole(GeometryUtils.getSerialVertices(entities));
  //try to build looped mesh

  return entities;
};

function selectInFrustum(area, container) {
  let planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), Math.max(area.x1, area.x2)),
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -Math.min(area.x1, area.x2)),

    new THREE.Plane(new THREE.Vector3(0, -1, 0), Math.max(area.y1, area.y2)),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -Math.min(area.y1, area.y2)),

    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
  ];

  let frustum = new THREE.Frustum(...planes);

  let iterator = entityIterator(container);

  let frustumIntersects = [];

  let entity = iterator.next();
  while (!entity.done) {
    try {
      if (frustum.intersectsObject(entity.value)) {
        frustumIntersects.push(entity.value);
      }
      entity = iterator.next();
    } catch (e) {
      // debugger;
      console.error(
        e,
        'problem with frustrum intersects, at selectInFrustum()'
      );
    }
  }

  let frustumIntersectsFiltered = [];

  let geometries = {};

  frustumIntersects.forEach(entity => {
    if (GeometryUtils.entityIntersectArea(entity, area, geometries)) {
      frustumIntersectsFiltered.push(entity);
    }
  });

  // console.timeEnd('selectInFrustum');
  return frustumIntersectsFiltered;
}

function* entityIterator(container, iterateContainers = false) {
  if (iterateContainers) {
    yield container;
  }
  for (let child in container.children) {
    if (Object.prototype.hasOwnProperty.call(container.children, child)) {
      if (
        container.children[child].children.length ||
        container.children[child].userData.container
      ) {
        yield* entityIterator(container.children[child], iterateContainers);
      } else {
        yield container.children[child];
      }
    }
  }
}

let setPointOfInterest = (editor, objects) => {
  let stepsCount = 25,
    { camera } = editor,
    pointOfInterests,
    boundingBox,
    dollyScale;

  if (Array.isArray(objects) && objects.length) {
    //type of items

    boundingBox = GeometryUtils.getBoundingBox(objects);

    dollyScale =
      camera.right / camera.top > boundingBox.aspectRatio
        ? boundingBox.height / camera.top
        : boundingBox.width / camera.right;

    if (objects[0] instanceof THREE.Vector3) {
      let radius = (camera.top * dollyScale) / 50;
      HelpLayerService.highlightVertex(objects, editor, 3000, radius);
    }

    // TODO show points on helperLayer for 3 seconds
    //vertexes
    //lines
    //arcs
    //objects
  } else {
    //single line/arc/object
    if (objects.type !== 'Line') {
      //line, arc
      objects = new THREE.BoxHelper(objects, 0xffff00);
    }

    if (objects.geometry instanceof THREE.CircleGeometry) {
      boundingBox = GeometryUtils.getArcBoundingBox(objects);
    } else {
      objects.geometry.computeBoundingBox();
      GeometryUtils.computeBoundingBoxAdditionalInfo(
        objects.geometry.boundingBox
      );
      boundingBox = objects.geometry.boundingBox;
    }

    dollyScale =
      camera.right / camera.top > boundingBox.aspectRatio
        ? boundingBox.height / camera.top
        : boundingBox.width / camera.right;
  }
  pointOfInterests = boundingBox.center;

  let step = new THREE.Vector3(0, 0, 0)
    .subVectors(pointOfInterests, camera.position)
    .divideScalar(stepsCount);

  let dollyFactor = Math.pow(dollyScale / 1.8, 1 / stepsCount);

  animateCameraMove(editor, step, dollyFactor, stepsCount - 1);
};

const animateCameraMove = (editor, step, dollyFactor, stepsLeft) => {
  let { camera, cadCanvas } = editor;

  if (stepsLeft > 0) {
    window.requestAnimationFrame(
      animateCameraMove.bind(null, editor, step, dollyFactor, stepsLeft - 1)
    );
  }

  step.z = 0;
  camera.position.add(step);

  camera.left *= dollyFactor;
  camera.right *= dollyFactor;
  camera.top *= dollyFactor;
  camera.bottom *= dollyFactor;
  camera.updateProjectionMatrix();

  camera.needUpdate = true;
  cadCanvas.render();
};

const showAll = (editor, mode, hide_show = false) => {
  const current = {
    object:
      mode === 'activeEntities'
        ? { children: editor.activeEntities }
        : editor.scene,
    elements:
      mode === 'activeEntities'
        ? editor.activeEntities
        : mode === 'Objects'
    ? editor.scene.getObjectByName('Objects').children
    : mode === 'Voids'
          ? editor.scene.getObjectByName('VoidsLayer').children
          : editor.scene.getObjectByName('Layers').children,
  };
  const objectElementsReport = {
    visible: 0,
    length: current.elements.length
  };
  for (let i = 0; i < current.elements.length; i++) {
    if (current.elements[i].visible) {
      objectElementsReport.visible++;
    }
  }

  if (hide_show === 'hide'){
    objectElementsReport.visible = objectElementsReport.length;
  } else if (hide_show === 'show'){
    objectElementsReport.visible = objectElementsReport.length - 1;
  }
  current.elements.forEach (elem =>{
    elem.visible =
          objectElementsReport.visible === objectElementsReport.length ?
          false : true;
  });
  render(editor);
};

const objectFix = (editor, entities, threshold, sort = 'no', objectNumber) => {

  addHelpPoints(editor, editor.scene, editor.camera.top / 50, true);
  entities = GeometryUtils.skipZeroLines([...entities], threshold);
  let helpLayer = editor.scene.getObjectByName('HelpLayer');

  // if (objectNumber === 135) {
  //   entities.forEach(line => {
  //     helpLayer.children = [];
  //     let wayPoint = findWayPoint(line);
  //     wayPoint.forEach(point => {
  //       helpLayer.add(helpLayerService.positionInLine(editor, [point]));
  //     })
  //     render(editor)
  //     debugger;
  //   })
  // }

  if (entities.length > 1) {
    let lineIndex = 0;
    // спробувати упорядкувати лінії
    let area = [];
    let areaIndex = 0;
    let pointIndex = 0;
    let wayPoint;

    do {
      if (!area[areaIndex]) {
        let indexSearchLine = 0;
        do {
          if (!entities[indexSearchLine].userData.weDoneWithThisLine) {
            area[areaIndex] = [];
            area[areaIndex].push(entities[indexSearchLine]);
            lineIndex += 1;
            entities[indexSearchLine].userData.weDoneWithThisLine = true;
            wayPoint = findWayPoint(area[areaIndex][area[areaIndex].length - 1]);
          }
          indexSearchLine += 1;
        } while (!area[areaIndex] && indexSearchLine < entities.length);
      }

      let nextLine = {};
      if (sort === 'no') {
        nextLine = edgeService.findNextLine(
          { children: entities },
          area[areaIndex][area[areaIndex].length - 1],
          wayPoint[pointIndex]
        );
      } else if (sort === 'done') {
        nextLine.line = entities[lineIndex];
      }

      if (nextLine.line && nextLine.line.userData.weDoneWithThisLine) {
        // debugger;
        nextLine = edgeService.findNextLine(
          { children: entities },
          area[areaIndex][area[areaIndex].length - 1],
          wayPoint[pointIndex === 1 ? 0 : 1]
        );
      }
      if (!nextLine.line) {
        // debugger;
        nextLine = closestLine(entities, wayPoint[pointIndex]);
      }

      if (
        // !nextLine.line.userData.weDoneWithThisLine &&
        !area[areaIndex].includes(nextLine.line)) {
        nextLine.line.userData.weDoneWithThisLine = true;
        pointIndex = nextLine === 0 ? 1 : 0;
        wayPoint = nextLine.newFindLinePoint;
        area[areaIndex].push(nextLine.line);
        lineIndex += 1;
      } else {
        console.log(area[areaIndex].indexOf(nextLine.line));
        if (area[areaIndex].indexOf(nextLine.line) !== 0) {
          debugger;
        }
        areaIndex += 1;
      }
      console.log(area[areaIndex]);
    } while (lineIndex < entities.length);

    // пошук ближчої точки обрізкаліній при необхідності

    // перевірка на лишні лінії
    entities = [];
    area.forEach((lineGroup, lineGroupIndex) => {
      lineGroup.forEach((line, lineIndex) => {
        // line.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
        // render(editor);
        //todo пошук дубліката ліній( дві лінії які майже ідеально накладуються
        // друг на друга
        let lineWayPoint = findWayPoint(line);
        for (let chLiI = lineIndex + 1; chLiI < lineGroup.length; chLiI++) {
          // lineGroup[chLiI].material.color.set(new THREE.Color(0x00ff00)); // оранжевий
          // render(editor);
          if (line.geometry.type === lineGroup[chLiI].geometry.type) {
            let checkLineWayPoint = findWayPoint(lineGroup[chLiI]);
            let pointDist = [
              GeometryUtils.getDistance(lineWayPoint[0], checkLineWayPoint[0]),
              GeometryUtils.getDistance(lineWayPoint[1], checkLineWayPoint[1]),
              GeometryUtils.getDistance(lineWayPoint[0], checkLineWayPoint[1]),
              GeometryUtils.getDistance(lineWayPoint[1], checkLineWayPoint[0])
            ];
            // todo поправити граничні допуски перевірки
            let ignoreDist = GeometryUtils.getDistance(lineWayPoint[0], lineWayPoint[1]) / 100
            if ((pointDist[0] < ignoreDist && pointDist[1] < ignoreDist) ||
              (pointDist[2] < ignoreDist && pointDist[3] < ignoreDist)) {
              if ((line.geometry.type === 'CircleGeometry' &&
                GeometryUtils.getDistance(lineWayPoint[2], checkLineWayPoint[2]) < threshold) ||
                line.geometry.type === 'Geometry') {
                lineGroup.splice(chLiI, 1);
                chLiI -= 1;
              }
            }
          }
          // lineGroup[chLiI].material.color.set(new THREE.Color(0x0000ff)); // синій
        }
        // line.material.color.set(new THREE.Color(0x0000ff)); // синій
      });
      let linePoint = null;
      let thisLineIndex;
      let previousPointIndex;
      lineIndex = 0;
      do {
        let line = lineGroup[lineIndex];
        let wayPoint = findWayPoint(line);
        if (linePoint === null) {
          let searchPoint = findWayPoint(
            lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1]
          );
          let minDist = null;
          searchPoint.forEach((pointA, pointAIndex) => {
            wayPoint.forEach(pointB => {
              const dist = GeometryUtils.getDistance(pointA, pointB);
              if (minDist > dist || minDist === null) {
                previousPointIndex = pointAIndex;
                linePoint = pointA;
                minDist = dist;
              }
            });
          });
        }

        let distance = [];
        distance[0] = GeometryUtils.getDistance(wayPoint[0], linePoint);
        distance[1] = GeometryUtils.getDistance(wayPoint[1], linePoint);
        // console.log(distance[0]);
        // console.log(distance[1]);
        //
        // if (distance[0] > 1 && distance[1] > 1) {
        //   debugger;
        // }
        thisLineIndex = distance[0] < distance[1] ? 0 : 1;

        let alternativePoint = [];

        let overlay = false;
        let changeLine;
        let cutPoint;
        let changePointIndex;

        //todo пошук ліній які накладуються
        if (lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1
            ].geometry.type === 'Geometry' &&
          lineGroup[lineIndex].geometry.type === 'Geometry') {
          alternativePoint.push(
            helpLayerService.positionInLine(
              editor,
              lineGroup[lineIndex],
              lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1]
                .geometry.vertices[previousPointIndex === 0 ? 1 : 0]
            )
          );
          alternativePoint.push(
            helpLayerService.positionInLine(
              editor,
              lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1],
              wayPoint[thisLineIndex === 0 ? 1 : 0]
            )
          );
          let dist = [];
          dist.push(GeometryUtils.getDistance(
            alternativePoint[0].position,
            lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1]
              .geometry.vertices[previousPointIndex === 0 ? 1 : 0]
          ));
          dist.push(GeometryUtils.getDistance(
            alternativePoint[1].position,
            wayPoint[thisLineIndex === 0 ? 1 : 0]
          ));
          console.log(dist);
          if (dist[0] <= threshold || dist[1] <= threshold) {
            console.log(overlay);
            console.log(dist);
            //края з яких проектуються точки і порівнюються відстані
            helpLayer.children = [];
            helpLayer.add(
              helpLayerService.positionInLine(
                editor,
                [wayPoint[thisLineIndex === 0 ? 1 : 0]]
              )
            );
            helpLayer.add(
              helpLayerService.positionInLine(
                editor,
                lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1]
                  .geometry.vertices[previousPointIndex === 0 ? 1 : 0]
              )
            );
            render(editor);
            debugger;
            helpLayer.children = [];
            helpLayer.add(alternativePoint[0]);
            render(editor);
            debugger;
            helpLayer.children = [];
            helpLayer.add(alternativePoint[1]);
            render(editor);
            debugger;
            // ставимо в хедпплінти по очерді проектуємо тучку і точку перевірки з виводом на сцену
            // виділяємо кольором лінію з якою працюємо
            debugger;
            // if (objectNumber === 135) {
            if (dist[0] < dist[1]) {
              changeLine = lineGroup[lineIndex];
              cutPoint = lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1]
                .geometry.vertices[previousPointIndex === 0 ? 1 : 0];
              changePointIndex = thisLineIndex;
              if (lineIndex > 0) {
                lineGroup.splice(lineIndex - 1, 1);
                lineIndex -= 1;
              } else {
                lineGroup.splice(lineGroup.length - 1, 1);
              }
              linePoint = null;

            } else {
              changeLine = lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1];
              cutPoint = lineGroup[lineIndex]
                .geometry.vertices[thisLineIndex === 0 ? 1 : 0];
              changePointIndex = previousPointIndex;
              lineGroup.splice(lineIndex, 1);
              debugger;
            }
            // helpLayer.children = [];
            // helpLayer.add(alternativePoint[0]);
            // render(editor);
            // console.log(objectNumber);
            // debugger;
            // helpLayer.children = [];
            // helpLayer.add(alternativePoint[1]);
            // render(editor);
            // console.log(objectNumber);
            // debugger;
            // }
            overlay = true;
          }
        }

        if (!overlay) {
          alternativePoint = [];
          alternativePoint.push(
            helpLayerService.positionInLine(
              editor,
              lineGroup[lineIndex],
              linePoint
            )
          );
          alternativePoint.push(
            helpLayerService.positionInLine(
              editor,
              lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1],
              wayPoint[thisLineIndex]
            )
          );

          // if (lineIndex > 12) {
          //   lineGroup[lineIndex].material.color.set(new THREE.Color(0x0000ff)); // синій
          //   render(editor);
          //   debugger;
          //   lineGroup[lineIndex].material.color.set(new THREE.Color(0xffaa00)); // оранжевий
          //   render(editor);
          //   debugger;
          //   helpLayer.children = [];
          //   helpLayer.add(alternativePoint[0]);
          //   helpLayer.add(alternativePoint[1]);
          //   render(editor);
          //   debugger;
          //   // helpLayer.add(helpLayerService.positionInLine(editor, [wayPoint[0]]));
          //   // render(editor);
          //   // debugger;
          //   // helpLayer.add(helpLayerService.positionInLine(editor, [wayPoint[1]]));
          //   // render(editor);
          //   // debugger;
          // }

          distance[2] = GeometryUtils.getDistance(
            alternativePoint[0].position,
            linePoint
          );
          distance[3] = GeometryUtils.getDistance(
            alternativePoint[1].position,
            wayPoint[thisLineIndex]
          );
          if (distance[2] < distance[thisLineIndex] ||
            distance[3] < distance[thisLineIndex]) {
            if (distance[2] < distance[3]) {
              changeLine = lineGroup[lineIndex];
              cutPoint = alternativePoint[0].position;
              changePointIndex = thisLineIndex;
              wayPoint[changePointIndex] = cutPoint;
            } else {
              changeLine = lineGroup[lineIndex > 0 ? lineIndex - 1 : lineGroup.length - 1];
              cutPoint = alternativePoint[1].position;
              changePointIndex = previousPointIndex;
              linePoint = cutPoint;
            }
          }
          if (cutPoint) {
            // changeLine.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
            // helpLayer.children = [];
            // helpLayer.add(helpLayerService.positionInLine(editor, [cutPoint]));
            // render(editor);
            // debugger;
            // changeLine.material.color.set(new THREE.Color(0x0000ff)); // синій

            // console.log (editor.activeEntities);
            editor.activeEntities = [changeLine];

            // if (objectNumber === 135) {
            //   changeLine.material.color.set(new THREE.Color(0x0000ff)); // синій
            //   render(editor);
            //   debugger;
            //   changeLine.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
            //   render(editor);
            //   debugger;
            // }

            if (changeLine.geometry.type === 'Geometry') {
              changeLine.geometry.vertices[changePointIndex].x = cutPoint.x;
              changeLine.geometry.vertices[changePointIndex].y = cutPoint.y;
            } else if (changeLine.geometry.type === 'CircleGeometry') {
              // todo 23,11,2020 треба дививтись
              let circlePoints = findWayPoint(changeLine);
              // circlePoints[changePointIndex] = cutPoint;
              // GeometryUtils.newCurve(
              //   changeLine.position,
              //   changeLine.geometry.parameters.radius,
              //   circlePoints[0],
              //   circlePoints[1],
              //   editor
              // )
              // debugger;
              if (!changeLine.userData.helpGeometry) {
                changeLine.userData.helpGeometry = {
                  helpLength: changeLine.geometry.parameters.thetaLength,
                  helpStart: changeLine.geometry.parameters.thetaStart
                };
              }
              addHelpPoints(editor, editor.scene, editor.camera.top / 50, true);
              changeLine.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
              render(editor);

              let wayPoint = findWayPoint(changeLine);
              // changeLine.geometry = GeometryUtils.newCurve(
              //   changeLine.position,
              //   changeLine.geometry.radius,
              //   changePointIndex === 0? cutPoint: wayPoint[0],
              //   changePointIndex === 1? cutPoint: wayPoint[1],
              //   'fix'
              // );

              changeGeometry([changeLine], [changePointIndex + 1], cutPoint, editor.scene, editor, 'CircleFix');
              changeLine.material.color.set(new THREE.Color(0x0000ff)); // синій
            }

            // helpLayer.children = [];
            // helpLayer.add(helpLayerService.positionInLine(editor, [cutPoint]));
            // render(editor);
          }
        }

        helpLayer.children = [];
        if (!overlay) {
          distance[5] = GeometryUtils.getDistance(wayPoint[thisLineIndex], linePoint)

          if (distance[5] > threshold) {
            let newLine = createLine(linePoint, wayPoint[thisLineIndex]);
            lineGroup.splice(lineIndex, 0, newLine);
            // entities.push(newLine);
            lineIndex += 1;
          }
          previousPointIndex = distance[0] < distance[1] ? 1 : 0;
          linePoint = wayPoint[previousPointIndex];

          // if (distance0 < distance1) {
          //   if (distance0 > 0.1 * threshold && distance0 < 1) {
          //     let newLine = createLine(linePoint, wayPoint[0]);
          //     lineGroup.splice(lineIndex, 0, newLine);
          //     entities.push(newLine);
          //
          //     lineIndex += 1;
          //   }
          //   linePoint = wayPoint[1];
          // } else if (distance0 > distance1) {
          //   if (distance1 > 0.1 * threshold && distance1 < 1) {
          //     // debugger;
          //     let newLine = createLine(linePoint, wayPoint[1]);
          //     lineGroup.splice(lineIndex, 0, newLine);
          //     entities.push(newLine);
          //     lineIndex += 1;
          //   }
          //   linePoint = wayPoint[0];
          // }
          lineIndex += 1;
        }
        // console.log(overlay);
        // console.log(lineIndex);
      } while (lineIndex < lineGroup.length);
      entities.push(...lineGroup);
    });
  }
  helpLayer.children = [];
  render(editor);

  debugger
  editor.activeEntities = entities;
  // debugger;
  return entities;
};

const closestLine = (arr, point) => {
  let closesPoint;
  let closesLine = arr[0];
  let minDistacnce;
  let index;
  arr.forEach (line => {
    let wayPoint = findWayPoint(line);
    if (!closesPoint){
      closesPoint = wayPoint[0];
      minDistacnce = GeometryUtils.getDistance(point, closesPoint);
      closesLine = line;
      index = 0;
    }
    wayPoint.forEach((linePoint, i) => {
      let distance = GeometryUtils.getDistance(point, linePoint);
      if (minDistacnce > distance && !line.userData.weDoneWithThisLine){
        minDistacnce = distance;
        closesPoint = linePoint;
        closesLine = line;
        index = 0;
      }
    });
  });
  return {
    newFindLinePoint: findWayPoint(closesLine),
    line: closesLine,
    index: index
  }
};

const createObject = (
  editor,
  name,
  entities,
  threshold = 0.000001,
  mode = 'standart',
  minArea = 0.01,
  objectsContainer = editor.scene.getObjectByName('Objects'),
  index
) => {
  let object;
  let { scene } = editor;

  let usedEntities = entities.length;
  // if (mode !== 'Free space') {
    entities = entities.filter(e => !e.userData.belongsToObject);
  // }
  usedEntities -= entities.length;

  try {
    // scene.children.forEach(objectsContainer => {
      if (objectsContainer.name === 'Objects' ||
        objectsContainer.name === 'VoidsLayer') {
        // if (mode !== 'Free space') {
          objectsContainer.children.forEach(object => {
            if (object.name === name) {
              let error = new Error(
                `Object with name "${name}" already exists`
              );
              error.userData = {
                error: 'duplicate name',
                msg: error.message,
                name: name
              };
              throw error;
            }
          });
        // }

        // create object (entities container)
        // move entities from layers to object
        // render

        // object = new THREE.Object3D();
        object = new THREE.Group();
        object.name = name;
        object.userData['container'] = true;
        object.userData['object'] = true;
        // object.visible = false;

        try {
          object.userData['edgeModel'] = GeometryUtils.buildEdgeModel(
            { children: entities },
            threshold,
            mode,
            minArea,
            index
          );

          // let size = GeometryUtils.calcSize(entities)
          // // console.log(`object area: ${GeometryUtils.calcArea(entities).toFixed(4)}\nLength: ${GeometryUtils.calcLength(entities).toFixed(4)}\nSize:\n\tWidth: ${size.x.toFixed(4)}\n\tHeight: ${size.y.toFixed(4)}`)
          // ConsoleUtils.previewObjectInConsole(object)
        } catch (e) {
          console.warn('BUILD EDGE MODEL IN threeDXF');
          console.warn(e);

          let error = new Error('Problem building edge model');
          error.userData = {
            error: 'edge model',
            data: e,
            msg: error.message
          };
          throw error;

          // throw {
          //   error: 'edge model',
          //   data: e,
          //   msg: 'Problem building edge model'
          // }
        }

        entities.forEach(entity => {
          // let idx = entity.parent.children.indexOf(entity);
          // entity.parent.children.splice(idx, 1);
          entity.userData.belongsToObject = true;
          object.add(entity);
        });

        if (object.children.length) {
          let region = object.userData.edgeModel.regions;
          if (region.length === 1 || mode !== 'Free space') {
          //   if (region[0].area > 1 || mode !== 'Free space') {
          //     console.log (object.name);
              // console.log (object.userData.info.area.toFixed(4));
              // console.log (object.children.length);
              // debugger;
            const geometryInfo = GeometryUtils.getObjectInfo(object);
            // console.log('area ' + i + ' void = ' + geometryInfo[0].region.area);
            if (geometryInfo[0].region.area > minArea || mode !== 'Free space') {
              objectsContainer.add(object);
            }
          }
        } else {
          let error = new Error(
            usedEntities
              ? 'Selected entities already belongs to object'
              : 'No entities selected'
          );
          error.userData = {
            error: 'empty object',
            msg: error.message
          };
          throw error;

          // throw {
          //   error: 'empty object',
          //   msg: usedEntities ? 'Selected entities already belongs to object' : 'No entities selected'
          // };
        }
      }
    // });
  } catch (e) {
    if (mode !== 'Free space') {
      switch (e.userData.error) {
        case 'edge model':
          // console.warn(e.userData.data.userData.error)
          if (
            e.userData.data &&
            e.userData.data.userData &&
            e.userData.data.userData.error
          ) {
            switch (e.userData.data.userData.error) {
              case 'interruption':
                // show problem line
                console.error('show problem line', e);

                highlightEntities(editor, entities, true);
                // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

                // e.userData.data.entity.userData.showInTop = true
                highlightEntities(editor, e.userData.data.userData.entities);
                // setPointOfInterest(editor, e.userData.data.userData.entity);
                setPointOfInterest(editor, e.userData.data.userData.vertices);

                ToastService.msg(
                  e.userData.msg + '\n' + e.userData.data.userData.msg
                );

                break;

              case 'intersection':
                // show problem line
                console.error('show intersected lines', e);

                highlightEntities(editor, entities, true);
                // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

                // e.data.entity.userData.showInTop = true;
                // highlightEntities(editor, e.userData.data.entities);
                // setPointOfInterest(editor, e.userData.data.entities[0]);

                // this.render();
                ToastService.msg(e.userData.msg + '\n' + e.userData.data.msg);

                break;

              case 'unused entities':
                // show unused entity
                console.error('show unused entity', e);
                ToastService.msg(e.userData.msg + '\n' + e.userData.data.msg);

                break;
              default: {
                let text = e.userData.msg;
                if (e.userData.data && e.userData.data.msg) {
                  text += `\n${e.userData.data.msg}`;
                }
                // alert(text);
                ToastService.msg(text);
              }
                break;
            }
          } else {
            let text = e.userData.msg;
            if (e.userData.data && e.userData.data.msg) {
              text += `\n${e.userData.data.msg}`;
            }
            // alert(text);
            ToastService.msg(text);
          }

          // console.error(e);
          break;
        case 'duplicate name':
          // alert(e.msg);
          ToastService.msg(e.userData.msg);
          break;
        case 'empty object':
          ToastService.msg(e.userData.msg);
          break;
        default:
          throw e;
        // break;
      }
    }
      return false;
    // }
  }

  render(editor);
  return object;
};

let lastObjectName = '';
const groupEntities = (editor, entities, objectName) => {
  if (!objectName) {
    // todo зробити вікно в стилі проекту з владками імені точності і включалкой автофікса
    objectName = window.prompt('Set object name pls', lastObjectName);
  }

  if (objectName) {
    lastObjectName = objectName;
    try {
      // entities.forEach (line=>{
      //   line.material.color.set(new THREE.Color(0x0000ff)); // синій
      //   render(editor);
      //   line.material.color.set(new THREE.Color(0xffaa00)); // оранжевий
      //   debugger;
      // });

      // debugger;
      console.log(editor);
      debugger;
      //todo вставити перевірку на включалку автофікса при створенні нового обєкту
      entities = objectFix(editor, entities, editor.options.threshold);
      debugger;
      let object = createObject(
        editor,
        objectName,
        entities,
        editor.options.threshold,
        'Auto fix on'
        // 'Free space'
      );
      if (object) {
        lastObjectName = '';
      }
      return object;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};

const getVoidsLayer = (scene, returnObjects = false) => {
  for (let container of scene.children) {
    if (container.name === 'VoidsLayer') {
      if (returnObjects) {
        return container.children;
      } else {
        return container;
      }
    }
  }
};

const getObjects = (scene, returnObjects = false) => {
  for (let container of scene.children) {
    if (container.name === 'Objects') {
      if (returnObjects) {
        return container.children;
      } else {
        return container;
      }
    }
  }
};

const getLayers = scene => {
  for (let container of scene.children) {
    if (container.name === 'Layers') {
      return container;
    }
  }
};

//функція обробки ліній після пошуку пустот (аналіз замкнутості простору, підганяння точок друг до друга
let skive = (object, cutPointIndex, colPoint, threshold = 0.001) => {
  if (object.length) {
    //todo переробити для лінії а не груп ліній
    // debugger;
    let thisLine = object[0];
    let thisLinePoints = findWayPoint(thisLine);
    let nextLinePoints = findWayPoint(object[1]);
    let pointIndex;

    object.forEach((line, i) => {
      let collisionPoints = line.userData.collisionPointsInf;
      if (collisionPoints) {
        let lineIndex = null;
        let linePoints = findWayPoint(line);
        for (let j = 0; j < object.length; j++) {
          if (object[j] !== line) {
            let closeLinePoint = findWayPoint(object[j]);
            if (
              GeometryUtils.getDistance(linePoints[0], closeLinePoint[0]) <
                threshold ||
              GeometryUtils.getDistance(linePoints[0], closeLinePoint[1]) <
                threshold
            ) {
              if (lineIndex === null) {
                // debugger;
                lineIndex = 1;
              } else {
                // debugger;
                lineIndex = 3;
              }
            }
            if (
              GeometryUtils.getDistance(linePoints[1], closeLinePoint[0]) <
                threshold ||
              GeometryUtils.getDistance(linePoints[1], closeLinePoint[1]) <
                threshold
            ) {
              if (lineIndex === null) {
                // debugger;
                lineIndex = 0;
              } else {
                // debugger;
                lineIndex = 3;
              }
            }
          }
        }
        // debugger;
        if (lineIndex !== 3) {
          let colPoint;
          if (collisionPoints.length === 1) {
            if (collisionPoints[0].point) {
              colPoint = collisionPoints[0];
            } else {
              lineIndex = 3;
            }
          } else {
            collisionPoints.forEach((point, pointIndex) => {
              // console.log(collisionPoints);
              point.entities.forEach(searchLine => {
                if (searchLine !== line) {
                  if (object.includes(searchLine)) {
                    if (point.point) {
                      colPoint = point;
                      debugger;
                    }
                  }
                }
              });
              // debugger;
              // for (let index; index <  point.entities.length; index ++){
              //  if (point.entities[])
              // }
            });
            debugger;
          }

          if (lineIndex !== 3 && colPoint) {
            debugger;
            for (let j = 0; j < object.length; j++) {
              if (line !== object[j]) {
                let closeLinePoint = findWayPoint(object[j]);
                if (
                  GeometryUtils.getDistance(colPoint.point, closeLinePoint[0]) <
                    threshold ||
                  GeometryUtils.getDistance(colPoint.point, closeLinePoint[1]) <
                    threshold
                ) {
                  debugger;
                }
              }
            }
            if (line.geometry.type === 'Geometry') {
              // debugger;
              thisLine.geometry.vertices[lineIndex].x = colPoint.point.x;
              thisLine.geometry.vertices[lineIndex].y = colPoint.point.y;
            } else if (line.geometry.type === 'CircleGeometry') {
              // debugger;
              let circlePoints = [];
              let distanceToCirclePoints = [];
              let pointIndex;
              line.geometry.vertices.forEach((verticesPoint, i) => {
                circlePoints[i] = {
                  x: verticesPoint.x + line.position.x,
                  y: verticesPoint.y + line.position.y
                };
                distanceToCirclePoints[i] = GeometryUtils.getDistance(
                  colPoint.point,
                  circlePoints[i]
                );
              });
              let distance = Math.min(...distanceToCirclePoints);
              pointIndex = distanceToCirclePoints.indexOf(distance);
              // console.log(distance);
              if (
                pointIndex !== 0 &&
                pointIndex !== line.geometry.vertices.length - 1
              ) {
                let newChangeLine =
                  lineIndex === 0
                    ? GeometryUtils.newCurve(
                        line.position,
                        line.geometry.parameters.radius,
                        circlePoints[0],
                        circlePoints[pointIndex]
                      )
                    : GeometryUtils.newCurve(
                        line.position,
                        line.geometry.parameters.radius,
                        circlePoints[pointIndex],
                        circlePoints[circlePoints.length - 1]
                      );
                line.geometry.parameters = {
                  radius: newChangeLine.geometry.parameters.radius,
                  segments: newChangeLine.geometry.parameters.segments,
                  thetaLength: newChangeLine.geometry.parameters.thetaLength,
                  thetaStart: newChangeLine.geometry.parameters.thetaStart
                };
                line.geometry.vertices.forEach((vertic, i) => {
                  vertic.x = newChangeLine.geometry.vertices[i].x;
                  vertic.y = newChangeLine.geometry.vertices[i].y;
                });
              }
            }
            // drawLine([line], editor, 0x00FF00);
            line.geometry.verticesNeedUpdate = true;
          }
        }
      }
    });
  } else {
    // debugger;
    let line = object;
    let linePoints = findWayPoint(line);
    let newLine;
    if (line.geometry.type === 'Geometry') {
      newLine = createLine(linePoints[cutPointIndex], colPoint);
    } else if (line.geometry.type === 'CircleGeometry') {
      newLine = GeometryUtils.newCurve(
        line.position,
        line.geometry.parameters.radius,
        linePoints[cutPointIndex],
        colPoint
      );
    }
    line.parent.add(newLine);
    // drawLine([newLine], editor, 0x00FF00);
    // newLine.geometry.verticesNeedUpdate = true;
    // debugger;
    return newLine;
  }
  // if ('це треба викинути в утіл' === false) {
  //   debugger;
  //   object.forEach((line, i) => {
  //     thisLine.material.color.set(new THREE.Color(0x00FF00));
  //     render(editor);
  //
  //     if (line !== thisLine) {
  //
  //       nextLinePoints = findWayPoint(line);
  //       // console.log(GeometryUtils.linesIntersect(nextLinePoints[0], nextLinePoints[1], thisLinePoints[0], thisLinePoints[1]));
  //       // debugger;
  //
  //       if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[0]) < threshold
  //         || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[0]) < threshold
  //         || GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[1]) < threshold
  //         || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[1]) < threshold) {
  //         // if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[0]) < threshold
  //         //   || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[0]) < threshold){
  //         //   pointIndex = 1;
  //         //   line.geometry.vertices[pointIndex].x = collisionPoint.point.x;
  //         //   line.geometry.vertices[pointIndex].y = collisionPoint.point.y;
  //         // }
  //         // if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[1]) < threshold
  //         //   || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[1]) < threshold){
  //         //   pointIndex = 0;
  //         //   line.geometry.vertices[pointIndex].x = collisionPoint.point.x;
  //         //   line.geometry.vertices[pointIndex].y = collisionPoint.point.y;
  //         // }
  //         if (thisLine.geometry.type === 'Geometry') {
  //           if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[0]) < threshold) {
  //             pointIndex = 1;
  //             thisLine.geometry.vertices[0].x = line.geometry.vertices[0].x;
  //             thisLine.geometry.vertices[0].y = line.geometry.vertices[0].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[0]) < threshold) {
  //             pointIndex = 1;
  //             thisLine.geometry.vertices[1].x = line.geometry.vertices[0].x;
  //             thisLine.geometry.vertices[1].y = line.geometry.vertices[0].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[1]) < threshold) {
  //             pointIndex = 0;
  //             thisLine.geometry.vertices[0].x = line.geometry.vertices[1].x;
  //             thisLine.geometry.vertices[0].y = line.geometry.vertices[1].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[1]) < threshold) {
  //             pointIndex = 0;
  //             thisLine.geometry.vertices[1].x = line.geometry.vertices[1].x;
  //             thisLine.geometry.vertices[1].y = line.geometry.vertices[1].y;
  //           }
  //         } else if (line.geometry.type === 'Geometry') {
  //           if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[0]) < threshold) {
  //             pointIndex = 1;
  //             line.geometry.vertices[0].x = thisLine.geometry.vertices[0].x;
  //             line.geometry.vertices[0].y = thisLine.geometry.vertices[0].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[0]) < threshold) {
  //             pointIndex = 1;
  //             line.geometry.vertices[0].x = thisLine.geometry.vertices[1].x;
  //             line.geometry.vertices[0].y = thisLine.geometry.vertices[1].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[1]) < threshold) {
  //             pointIndex = 0;
  //             line.geometry.vertices[1].x = thisLine.geometry.vertices[0].x;
  //             line.geometry.vertices[1].y = thisLine.geometry.vertices[0].y;
  //           }
  //           if (GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[1]) < threshold) {
  //             pointIndex = 0;
  //             line.geometry.vertices[1].x = thisLine.geometry.vertices[1].x;
  //             line.geometry.vertices[1].y = thisLine.geometry.vertices[1].y;
  //           }
  //         } else {
  //           debugger;
  //         }
  //         // console.log(GeometryUtils.linesIntersect(nextLinePoints[0], nextLinePoints[1], thisLinePoints[0], thisLinePoints[1]));
  //         debugger;
  //         thisLine = line;
  //         thisLinePoints = nextLinePoints;
  //       } else {
  //         nextLinePoints = findWayPoint(line);
  //         // console.log(thisLine.userData.collisionPointsInf);
  //         // if (line.geometry.type === 'Geometry') {
  //         if (thisLine.userData.collisionPointsInf) {
  //           // if (line.userData.collisionPointsInf){
  //           thisLine.userData.collisionPointsInf.forEach(collisionPoint => {
  //             debugger;
  //             collisionPoint.entities.forEach((collisionLine, lineIndex) => {
  //               if (collisionLine === line) {
  //                 if (line.geometry.type === 'Geometry') {
  //                   line.geometry.vertices[pointIndex].x = collisionPoint.point.x;
  //                   line.geometry.vertices[pointIndex].y = collisionPoint.point.y;
  //                 } else if (line.geometry.type === 'CircleGeometry') {
  //                   debugger;
  //                 }
  //                 let collisionNextLine = collisionPoint.entities[lineIndex === 0 ? 1 : 0];
  //                 collisionNextLine.name = 'colisionNextLine';
  //                 debugger;
  //
  //                 if (collisionNextLine === object [i]) {
  //                   debugger;
  //                 }
  //               }
  //             });
  //           });
  //           // }
  //
  //
  //           // if (GeometryUtils.getDistance(thisLinePoints[pointIndex], nextLinePoints[0]) < threshold){
  //           //   debugger;
  //           // }
  //           // if (GeometryUtils.getDistance(thisLinePoints[pointIndex], nextLinePoints[1]) < threshold){
  //           //   debugger;
  //           // }
  //           // debugger;
  //         }
  //         thisLine = line;
  //         thisLinePoints = nextLinePoints;
  //         debugger;
  //         // console.log('точка перетену або ерор');
  //         debugger;
  //       }
  //
  //     }
  //   })
  // }
};

let drawLine = async (freeSpace, editor, color = 0xff0000) => {
  // freeSpace.forEach(line => {
  // debugger;
  //   for (let i = 0; i<freeSpacesAll.length; i++){
  //     let freeSpaces = freeSpacesAll[i];
  for (let j = 0; j < freeSpace.length; j++) {
    let line = freeSpace[j];
    // debugger;
    line.material.color.set(new THREE.Color(color));
    render(editor);
    await delay(50);
  }
  // }
};

//задержка для последовательной закраски линий
function delay(ms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, ms);
  });
}

const createSVG = svg => {
  return new Promise((resolve, reject) => {
    // axios
    //   .post(`http://localhost:31415/api/svg`, {data: svg})
    //   .then(response => resolve(response.data))
    //   .catch(reject);

    const svgContent = 'data:image/svg+xml;base64,' + window.btoa(svg);

    const win = window.open();
    win.document.write(
      `<iframe src="${svgContent}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
    );
    resolve();
  });
};

let sendToFlixo = svg => {
  let options = {};
  options.headers = options.headers || {};
  options.data = {
    id: 768599000,
    jsonrpc: '2.0',
    method: 'call',
    params: {
      frame: 'external',
      material_list:
        '[{"id":"0","material":"O-1036"},{"id":"1","material":"O-1036"},{"id":"2","material":"O-1053"},{"id":"3","material":"O-2000"},{"id":"4","material":"O-2000"},{"id":"5","material":"O-2000"},{"id":"6","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"7","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"8","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"9","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"10","material":"O-1053"},{"id":"11","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"12","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"13","material":"O-2000"},{"id":"14","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"15","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"16","material":"O-2000"},{"id":"17","material":"O-1036"},{"id":"18","material":"O-2000"},{"id":"19","material":"O-1036"},{"id":"20","material":"O-1053"},{"id":"21","material":"O-2000"},{"id":"22","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"23","material":"O-2000"},{"id":"24","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"25","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"26","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"27","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"28","material":"O-1036"},{"id":"29","material":"O-2000"},{"id":"30","material":"O-2000"},{"id":"31","material":"O-2000"},{"id":"32","material":"O-1053"},{"id":"33","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"34","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"35","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"36","material":"O-2000"},{"id":"37","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"38","material":"O-1036"},{"id":"39","material":"O-1036"},{"id":"40","material":"O-2000"},{"id":"41","material":"O-2000"},{"id":"42","material":"O-2000"},{"id":"43","material":"O-1036"},{"id":"44","material":"O-2000"},{"id":"45","material":"O-2000"},{"id":"46","material":"O-1036"},{"id":"47","material":"O-2000"},{"id":"48","material":"O-2000"},{"id":"49","material":"O-1036"},{"id":"50","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"51","material":"O-1053"},{"id":"52","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"53","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"54","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"55","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"56","material":"O-2000"},{"id":"57","material":"O-2000"},{"id":"58","material":"O-2000"},{"id":"59","material":"O-1053"},{"id":"60","material":"O-2000"},{"id":"61","material":"O-2000"},{"id":"62","material":"O-1036"},{"id":"63","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"64","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"65","material":"O-1036"},{"id":"66","material":"O-1036"},{"id":"67","material":"O-2054"},{"id":"68","material":"O-2000"},{"id":"69","material":"O-2000"},{"id":"70","material":"O-1036"},{"id":"71","material":"O-1036"},{"id":"72","material":"O-1036"},{"id":"73","material":"O-2000"},{"id":"74","material":"O-2000"},{"id":"75","material":"O-2000"},{"id":"76","material":"O-1036"},{"id":"77","material":"O-1036"}]',
      svg_w_h: [
        { w: '7.000002', h: '1.960000' },
        { w: '4.600002', h: '2.870001' },
        {
          w: '1.010002',
          h: '3.200000'
        },
        { w: '3.380001', h: '3.200000' },
        { w: '3.359997', h: '1.190001' },
        {
          w: '3.359997',
          h: '2.090000'
        },
        { w: '0.009998', h: '0.030001' },
        { w: '0.009998', h: '0.030001' },
        {
          w: '0.070004',
          h: '0.122499'
        },
        { w: '0.070004', h: '0.122499' },
        { w: '1.009998', h: '3.200000' },
        {
          w: '0.070000',
          h: '0.122499'
        },
        { w: '0.070000', h: '0.122499' },
        { w: '3.020000', h: '4.610000' },
        {
          w: '0.009998',
          h: '0.030001'
        },
        { w: '0.009998', h: '0.030001' },
        { w: '0.510000', h: '1.820001' },
        {
          w: '5.250000',
          h: '3.630000'
        },
        { w: '0.309999', h: '0.240000' },
        { w: '3.709999', h: '0.650000' },
        {
          w: '1.010000',
          h: '3.000000'
        },
        { w: '2.800001', h: '3.000000' },
        { w: '0.084999', h: '0.155001' },
        {
          w: '2.690001',
          h: '2.830000'
        },
        { w: '0.010000', h: '0.040000' },
        { w: '0.005001', h: '0.025000' },
        {
          w: '0.070000',
          h: '0.122499'
        },
        { w: '0.070000', h: '0.122500' },
        { w: '0.830000', h: '0.540001' },
        {
          w: '0.570000',
          h: '0.300001'
        },
        { w: '0.570000', h: '0.070000' },
        { w: '0.219999', h: '0.150000' },
        {
          w: '1.010000',
          h: '3.000000'
        },
        { w: '0.059999', h: '0.100000' },
        { w: '0.070000', h: '0.122499' },
        {
          w: '0.070000',
          h: '0.122500'
        },
        { w: '2.100000', h: '6.799999' },
        { w: '0.085001', h: '0.155001' },
        {
          w: '10.500000',
          h: '1.889999'
        },
        { w: '0.830000', h: '0.590000' },
        { w: '0.570000', h: '0.100000' },
        {
          w: '0.570000',
          h: '0.150002'
        },
        { w: '0.219999', h: '0.150000' },
        { w: '0.830000', h: '0.520000' },
        {
          w: '0.600000',
          h: '0.300000'
        },
        { w: '0.570000', h: '0.070000' },
        { w: '0.699999', h: '2.130001' },
        {
          w: '0.730000',
          h: '0.799999'
        },
        { w: '0.220001', h: '0.150001' },
        { w: '6.730000', h: '3.660001' },
        {
          w: '0.059999',
          h: '0.100000'
        },
        { w: '2.189999', h: '2.400000' },
        { w: '0.019999', h: '0.020000' },
        {
          w: '0.019999',
          h: '0.030000'
        },
        { w: '0.059999', h: '0.104912' },
        { w: '0.059999', h: '0.104912' },
        {
          w: '5.549999',
          h: '1.109999'
        },
        { w: '6.000000', h: '3.170000' },
        { w: '5.480000', h: '2.420000' },
        {
          w: '2.180000',
          h: '2.400000'
        },
        { w: '2.540001', h: '5.170000' },
        { w: '2.559999', h: '2.129999' },
        {
          w: '2.610001',
          h: '3.500000'
        },
        { w: '0.059999', h: '0.104912' },
        { w: '0.059999', h: '0.104912' },
        {
          w: '0.110001',
          h: '0.230000'
        },
        { w: '2.520000', h: '0.740000' },
        { w: '21.799999', h: '2.400000' },
        {
          w: '1.330000',
          h: '0.299999'
        },
        { w: '0.450001', h: '0.250000' },
        { w: '0.950001', h: '0.650002' },
        {
          w: '0.190001',
          h: '0.180000'
        },
        { w: '0.420000', h: '0.080000' },
        { w: '0.179998', h: '0.230000' },
        {
          w: '0.520000',
          h: '0.309999'
        },
        { w: '0.320000', h: '0.110001' },
        { w: '0.180000', h: '0.180000' },
        { w: '0.269999', h: '0.060001' }
      ],
      token:
        '710,e2dc4fb09a0d4d8232fddb099dc4f9f9e9f35ea71ff2ca61f003b9ce7273bd47,1',
      svg
    }
  };

  return new Promise((resolve, reject) => {
    axios
      .post(`http://localhost:5000/api/flixo`, options.data, {
        headers: options.headers
      })
      .then(response => resolve(response.data))
      .catch(reject);
  });
};

// повертає точки ліній
const findWayPoint = (line, closesPoint = null, mode = 'normal') => {
  let points = [];
  if (!line) {
    return [];
  }
  if (line.geometry.type === 'Geometry') {
    points[0] = line.geometry.vertices[0];
    points[1] = line.geometry.vertices[1];
  } else if (line.geometry.type === 'CircleGeometry') {
    points[0] = {
      x: line.geometry.vertices[0].x + line.position.x,
      y: line.geometry.vertices[0].y + line.position.y
    };
    points[1] = {
      x:
        line.geometry.vertices[line.geometry.vertices.length - 1].x +
        line.position.x,
      y:
        line.geometry.vertices[line.geometry.vertices.length - 1].y +
        line.position.y
    };
    //если у дуги всегда одноковое количество сигментов можна прописать статичные числа
    points[2] = {
      x:
        line.geometry.vertices[Math.floor(line.geometry.vertices.length/2)].x +
        line.position.x,
      y:
        line.geometry.vertices[Math.floor(line.geometry.vertices.length/2)].y +
        line.position.y
    };
    if (mode === 'serch_way') {
      let distance = GeometryUtils.getDistance(points[0], points[1]);
      if (closesPoint !== null) {
        if (
          GeometryUtils.getDistance(closesPoint, points[0]) <
          GeometryUtils.getDistance(closesPoint, points[1])
        ) {
          points[1] = HelpLayerService.foundNewPoint(
            closesPoint,
            {
              x: line.geometry.vertices[1].x + line.position.x,
              y: line.geometry.vertices[1].y + line.position.y
            },
            distance
          );
        } else {
          points[0] =  HelpLayerService.foundNewPoint(
            closesPoint,
            {
              x:
                line.geometry.vertices[line.geometry.vertices.length - 2].x +
                line.position.x,
              y:
                line.geometry.vertices[line.geometry.vertices.length - 2].y +
                line.position.y
            },
            distance
          );
        }
      } else {
        console.log('you need "point"');
      }
    }
  }
  return points;
};

const fixSceneAfterImport = scene => {
  scene.children.forEach(object => {
    object.traverse(function(child) {
      if (child.geometry instanceof THREE.CircleGeometry) {
        // remove zero vertex from arc with coordinates (0,0,0) (points to center)
        let zeroVertex = child.geometry.vertices[0];
        if (!zeroVertex.x && !zeroVertex.y && !zeroVertex.z) {
          child.geometry.vertices.shift();
        }
      }
    });
  });
  return scene;
};

let someSvg = ``;

const removeLineByName = (name, scene) => {
  const existLine = scene.getObjectByName(name);
  if (existLine) {
    existLine.parent.remove(existLine);
    return true;
  }
};

const getOffset = elem => {
  let offset = null;
  if (elem) {
    offset = { left: 0, top: 0 };
    do {
      offset.top += elem.offsetTop;
      offset.left += elem.offsetLeft;
      elem = elem.offsetParent;
    } while (elem);
  }
  return offset;
};

export default {
  canvasClick,
  onClick,
  doSelection,
  highlightEntities,
  recursiveSelect,
  selectInFrustum,
  findWayPoint,
  drawLine,
  render,
  skive,
  entityIterator,
  setPointOfInterest,
  showAll,
  groupEntities,
  objectFix,
  createObject,
  getObjects,
  getVoidsLayer,
  getLayers,
  fixSceneAfterImport,
  sendToFlixo,
  createSVG,
  someSvg,
  removeLineByName,
  getEntityNeighbours,
  getOffset
};
