import * as THREE from '../extend/THREE';
import ArrayUtils from './arrayUtils';
import GeometryUtils from './GeometryUtils';
import ConsoleUtils from './consoleUtils';
import HelpLayerService from './helpLayerService';
import ToastService from './ToastService';
import {
  SELECT_MODE_NEW,
  SELECT_MODE_ADD,
  SELECT_MODE_SUB,
  SELECT_MODE_INTERSECT
} from '../components/Options/optionsComponent';
import axios from 'axios';
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
  changeArcGeometry as changGeomEditObj, circleIntersectionAngle as circlInterAngle
} from './editObject';
import helpLayerService from './helpLayerService';

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

let onClick = (event, scene, camera, renderer) => {
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

let doSelection = (selectResultAll, editor) => {
  let selectResult = [];
  if (editor.editMode.isEdit) {
    selectResultAll.forEach(element => {
      if (element.parent.name === editor.editMode.editObject.name) {
        // debugger;
        selectResult.push(element);
      }
    });
  } else {
    selectResult = selectResultAll;
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
    case SELECT_MODE_NEW:
      editor.activeEntities = selectResult;
      break;
    case SELECT_MODE_ADD:
      editor.activeEntities = ArrayUtils.union(
        editor.activeEntities,
        selectResult
      );
      break;
    case SELECT_MODE_SUB:
      editor.activeEntities = ArrayUtils.subtract(
        editor.activeEntities,
        selectResult
      );
      break;
    case SELECT_MODE_INTERSECT:
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

let render = editor => {
  let { renderer, scene, camera } = editor;
  renderer.render(scene, camera);
};

let highlightEntities = (
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

let recursiveSelect = (object, editor) => {
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

let animateCameraMove = (editor, step, dollyFactor, stepsLeft) => {
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

let showAll = editor => {
  let { scene } = editor;
  let iterator = entityIterator(scene, true);

  let entity = iterator.next();
  while (!entity.done) {
    try {
      entity.value.visible = true;
      entity = iterator.next();
    } catch (e) {
      // debugger
      console.error(e, 'problem with showing all, at showAll()');
    }
  }
  render(editor);
};

let createObject = (editor, name, entities,
                    threshold = 0.000001, mode = 'standart') => {
  let object;
  let { scene } = editor;

  let usedEntities = entities.length;
  if (mode !== 'Free space') {
    entities = entities.filter(e => !e.userData.belongsToObject);
  }
  usedEntities -= entities.length;

  try {
    scene.children.forEach(objectsContainer => {
      if (objectsContainer.name === 'Objects') {
        if (mode !== 'Free space') {
          objectsContainer.children.forEach(object => {
            if (object.name === name) {
              let error = new Error(`Object with name "${name}" already exists`);
              error.userData = {
                error: 'duplicate name',
                msg: error.message,
                name: name
              };
              throw error;
            }
          });
        }
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
            mode
          );
// debugger;
          // let size = GeometryUtils.calcSize(entities)
          // console.log(`object area: ${GeometryUtils.calcArea(entities).toFixed(4)}\nLength: ${GeometryUtils.calcLength(entities).toFixed(4)}\nSize:\n\tWidth: ${size.x.toFixed(4)}\n\tHeight: ${size.y.toFixed(4)}`)
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
          objectsContainer.add(object);
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
    });
  } catch (e) {
    debugger;
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
                debugger;
                this.highlightEntities(entities, true);
                // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

                // e.data.entity.userData.showInTop = true;
                this.highlightEntities(e.userData.data.entities);
                setPointOfInterest(editor, e.userData.data.entities[0]);

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
      return false;
    }
  }

  render(editor);
  return object;
};

let lastObjectName = '';
let groupEntities = (editor, entities, objectName) => {
  if (!objectName) {
    objectName = window.prompt('Set object name', lastObjectName);
  }

  if (objectName) {
    lastObjectName = objectName;
    try {
      let object = createObject(
        editor,
        objectName,
        entities,
        editor.options.threshold
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

let getObjects = (scene, returnObjects = false) => {
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

let getLayers = scene => {
  for (let container of scene.children) {
    if (container.name === 'Layers') {
      return container;
    }
  }
};

let combineEdgeModels = (editor, svgForFlixo = false) => {
  let {
    scene,
    options: { threshold }
  } = editor;
  let objects = getObjects(scene, true);
  // console.log('combineEdgeModels', scene, threshold, objects)

  if (!objects.length) {
    let error = new Error('No objects for edge-model');
    error.userData = {
      error: 'no objects',
      msg: error.message
    };
    throw error;
  }

  let viewBox = objects[0].userData.edgeModel.svgData.viewBox;
  let box = {
    x: viewBox.x,
    y: viewBox.y,
    x2: +viewBox.x + +viewBox.width,
    y2: +viewBox.y + +viewBox.height
  };

  // width, height, x, y
  objects.forEach(object => {
    let objViewBox = object.userData.edgeModel.svgData.viewBox;

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

  // todo створюємо копію objects з усіма лініями.
  let collisionAllPoints = GeometryUtils.getCollisionPoints(objects, threshold);
  //
  let collisionPoints = GeometryUtils.filterOverlappingCollisionPoints(
    collisionAllPoints
  );
  collisionPoints = GeometryUtils.filterCollisionPoints(collisionPoints);

  // collisionPoints = GeometryUtils.filterCollisionPointsWithSharedEntities(collisionPoints);
  //todo доробити функцию обробки ліній в точках перетину об'єктів
  // collisionPointsFunk (editor, objects, collisionPoints);

  let helpLayer = scene.getObjectByName('HelpLayer');
  helpLayer.children = [];
  collisionPoints.forEach(point=>{
    helpLayer.add( helpLayerService.positionInLine(
      editor,
      [point.point]
    ));
  });
  render(editor);
  collisionPoints.forEach( (point, pointInd) =>{
    lineDivision(editor, point, collisionPoints, 0.001);
  });

  objects.forEach(object =>{
    let lineIndex = object.children.length - 1;
    do {
      if ( object.children[lineIndex].userData.needDelete){
        object.children.splice (lineIndex, 1);
      }
        lineIndex -= 1;
    } while (lineIndex > -1);
  });

  // collisionPoints.forEach(collisionPoint =>{
  //   //todo розділити лінії на точках перетину
  //   lineDivision (collisionPoint);
  // });
  // todo повторно знайти точки перетину
  // collisionAllPoints = GeometryUtils.getCollisionPoints(objects, threshold);
  // collisionPoints = GeometryUtils.filterOverlappingCollisionPoints(
  //   collisionAllPoints
  // );
  // collisionPoints = GeometryUtils.filterCollisionPoints(collisionPoints);
  // collisionPoints.forEach(collisionPoint =>{
  //   //todo перевірити чи всі точки перетину знаходяться на кінцях ліній
  //   //
  // });

  //step 1 - mark line with collisionPoints
  collisionAllPoints.forEach(point => {
    point.entities.forEach((line) => {
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

  let searchTrueNextPoint = (thisLine, linePoint, nextPointLine,
                             closesPoint, oldLine, pieceOfFreeSpace) =>{
    let pointO= [];
    pointO[0] = closesPoint.point;
    let deviation  = 1e-5;
    //nextLinePointOldObject[index]
    // todo визначення кутів між старою точкою,  точкою перетину і двома новими
    // теоритически далее могут быть случаи когда нужно будет розшырить проверки и улутшить их
    //
    // pointO - точка соприкосновения линий
    // pointStartС - стартовая точка, старт линии которая соприкасается
    // pointNextLineOldObjectD - точка следущёй лини на старом обекте

    let nextPointOldObject = findNextLine(nextPointLine.line.parent,
      nextPointLine.line,
      nextPointLine.newFindLinePoint[nextPointLine.index]);

    let pointsNewLine = findWayPoint (thisLine);
    // let pointsOldLine = [];
    // pointsOldLine[0] = [linePoint,nextPointLine.newFindLinePoint[nextPointLine.index]];
    //
    //
    // if (GeometryUtils.getDistance(closesPoint.point,nextPointLine.newFindLinePoint[nextPointLine.index])<deviation){
    //
      // debugger;
    // }
    // if (GeometryUtils.getDistance(closesPoint.point,linePoint)<deviation){
    //
      // debugger;
    // }
    //
    // let pointsOldLine = findWayPoint (oldLine);
    // проверка и настройка путь откуда
    // debugger;
    // debugger;
    let pointEndOldLine = GeometryUtils.getDistance (closesPoint.point,
      nextPointLine.newFindLinePoint[nextPointLine.index])<deviation?
      nextPointOldObject.newFindLinePoint[nextPointOldObject.index]:
      nextPointLine.newFindLinePoint[nextPointLine.index];
    // todo я стопорнувся тут. точка Д (pointEndOldLine) щитаяться не коректно
    // debugger;

    let pointStartOldLine;
    let pointsOldLine = findWayPoint (oldLine);
    if (pointsOldLine[0] === linePoint) {
      // debugger;
      pointStartOldLine = GeometryUtils.getDistance(closesPoint.point, pointsOldLine[0]) < deviation ? pointsOldLine[1] : pointsOldLine[0];
      // debugger;
    } else {
      // debugger;
      pointStartOldLine = GeometryUtils.getDistance(closesPoint.point, pointsOldLine[1]) < deviation ? pointsOldLine[0] : pointsOldLine[1];
      // debugger;
    }
    if (!pointStartOldLine){
      // debugger;
    }
    // проверка и настройка пути дальше

    // debugger;
    if (GeometryUtils.getDistance(closesPoint.point,pointsNewLine[0])<deviation){
      let nextLine = findNextLine(thisLine.parent, thisLine, pointsNewLine[0]);
      pointsNewLine[0] = nextLine.newFindLinePoint[nextLine.index];
      // debugger;
    }
    if (GeometryUtils.getDistance(closesPoint.point,pointsNewLine[1])<deviation){
      let nextLine = findNextLine(thisLine.parent, thisLine, pointsNewLine[1]);
      pointsNewLine[1] = nextLine.newFindLinePoint[nextLine.index];
      // debugger;
    }




    // todo  первервірка точки перетину точки наступної і вибраної


    // debugger;
    // let pointO= [];
    // pointO[0] = closesPoint.point;
    // let pointStartС = HelpLayerService.foundNewPoint (pointO[0], linePoint, 4);
    // pointO[1] = HelpLayerService.foundNewPoint (pointStartС, pointO[0], 3);
    let pointNextLineOldObjectD = HelpLayerService.foundNewPoint (pointO[0],
      pointEndOldLine, 5);
    // pointO[2] = HelpLayerService.foundNewPoint (pointNextLineOldObjectD, pointO[0], 3);
    // todo добавити/змінити на точку на наступній лінії

    let pointNewLineA = HelpLayerService.foundNewPoint (pointO[0], pointsNewLine[0], 4);
    // pointO[3] = HelpLayerService.foundNewPoint (pointNewLineA, pointO[0], 3);
    let pointNewLineB = HelpLayerService.foundNewPoint (pointO[0], pointsNewLine[1], 4);
    // pointO[4] = HelpLayerService.foundNewPoint (pointNewLineB, pointO[0], 3);
    let intersectionIndex = 0;

    let pointOldLineE = HelpLayerService.foundNewPoint (pointO[0], pointStartOldLine, 5);
    // debugger;

    let {
      scene,camera,renderer
    } = editor;
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
    let helpPointO = helpLayerService.positionInLine(
      editor,
      pointO
    );
// проверка на геометрию линии с которой і на которою. в случаю геометрия круга, находим точку не крайню а на выдстані від точки перетину.
//     if (nextPointLine.line.geometry.type === "CircleGeometry") {
//       console.log (thisLine);
//       debugger;
//
//     }



    //перетин
    helpLayer.add(helpPointO);
    // renderer.render(scene, camera);
    render (editor);
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
    let index = 0;
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

    let pointAinLineOD = GeometryUtils.getDistance (pointNewLineA, pointNextLineOldObjectD);
    let pointBinLineOD = GeometryUtils.getDistance (pointNewLineB, pointNextLineOldObjectD);
    // debugger;

    let returnIndex = null;

    if (returnIndex){
      debugger;
    }

    if (pointAinLineOD<1+deviation){
      returnIndex = 1;
    }
    if (pointBinLineOD<1+deviation){
      returnIndex =  0;
    }
    let pointAinLineOE = GeometryUtils.getDistance (pointNewLineA, pointOldLineE);
    let pointBinLineOE = GeometryUtils.getDistance (pointNewLineB, pointOldLineE);

    if (pointAinLineOE<1+deviation){
      returnIndex =  0;
    }
    if (pointBinLineOE<1+deviation){
      returnIndex =  1;
    }

    if (returnIndex){
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
    //   console.log ("stop");
    //   // debugger;
    // }
    //
    // let angle0 = GeometryUtils.angleBetweenLines(lineAO, thisLine, 'degree');
    // console.log (angle0);
    // let angle1 = GeometryUtils.angleBetweenLines(lineAO, lineBO, 'degree');
    // console.log (angle1);
    // let angle2 = GeometryUtils.angleBetweenLines(lineAO, lineCO, 'degree');
    // console.log (angle2);
    // debugger;
    // return index;
    //
    // debugger;
    return false;

  };

// шукає наступну лінію, наступну точку
  let findNextLine = (object, thisLine, linePoint) =>{

    for (let i =0; i <object.children.length; i++) {
      let line = object.children[i];
      let p = false;
      let index;
      let points = findWayPoint (line);
      // object.children.forEach((line) => {
      if (line !== thisLine) {
        // if (line.geometry.type === 'Geometry') {
          index = closestPoint(points, linePoint);
          p = isPoint(
            linePoint,
            entrainment,
            points[index]
          );
          if (p) {
            return {
              newFindLinePoint:[points[1], points[0]],
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

  let nextPoint = (object, linePoint = null,
                   thisLine = null, point,
                   pieceOfFreeSpace, collisionPoints) => {

    // let newFindLinePoint = [];
    let lineCheker = 0;
    let wayPoint = findWayPoint(thisLine);
    let startFreeSpaceLengt = freeSpace.length;
    if (!linePoint) {
      linePoint = wayPoint[0];
    }
    let collisionPointsInThisLine = [];
    for (let j = 0; j < thisLine.userData.collisionPointsInf.length; j++) {
      if (collisionPoints.includes(thisLine.userData.collisionPointsInf[j])) {
        collisionPointsInThisLine.push(thisLine.userData.collisionPointsInf[j]);
      }
    }
    let nextPointLine = findNextLine(object, thisLine, linePoint);

    if (!pieceOfFreeSpace[0].includes(thisLine)) {
      freeSpace.push(thisLine);
      pieceOfFreeSpace[0].push(thisLine);
      // debugger;
      let newLinePoint = findWayPoint(nextPointLine.line);
      if (GeometryUtils.getDistance(wayPoint[0], newLinePoint[0]) < threshold ||
        GeometryUtils.getDistance(wayPoint[0], newLinePoint[1]) < threshold){
        // debugger;
        if (collisionPointsInThisLine.length === 1) {
          pieceOfFreeSpace[1].push(skive(thisLine, editor, 1, collisionPointsInThisLine[0].point));
        } else {
          // debugger;
        }
      }else if (GeometryUtils.getDistance(wayPoint[1], newLinePoint[0]) < threshold ||
        GeometryUtils.getDistance(wayPoint[1], newLinePoint[1]) < threshold){
        // debugger;
        if (collisionPointsInThisLine.length === 1) {
          pieceOfFreeSpace[1].push(skive(thisLine, editor, 0, collisionPointsInThisLine[0].point));
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
          console.log(freeSpace.length);
          // debugger;
          let checkPoint = false;

          collisionPointsInThisLine = [];
          for (let j = 0; j < line.userData.collisionPointsInf.length; j++) {
            if (collisionPoints.includes(line.userData.collisionPointsInf[j])) {
              collisionPointsInThisLine.push(line.userData.collisionPointsInf[j]);
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
          //   console.log('лінії пішли по другому кругу.... значить коло');
          //   return;
          // }

          let closesPoint = null;
          let findPoint = [];
          if (collisionPointsInThisLine.length === 1) {
            // pointsNumber ;
            closesPoint = collisionPointsInThisLine[0];
          } else if (collisionPointsInThisLine.length > 1) {
            collisionPointsInThisLine.forEach((point)=>{
              findPoint.push(point.point);
            });
            closesPoint = collisionPointsInThisLine[closestPoint(findPoint, linePoint)];
          }
          if (closesPoint) {
            if (closesPoint.weDoneWithThisPoint && !closesPoint.startFromThisPoint) {
              // console.log('точкки пішли по другому кругу.... значить щось пішло не так');
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
                  console.log('закольцована полость');
                } else {
                  console.log('лінії вийшли за тереторію кола');
                  // debugger;
                }
                console.log('лінії пішли по другому кругу.... значить коло');
                return;
              }

              if (!pieceOfFreeSpace[0].includes(thisLine)) {
                // debugger;
                freeSpace.push(thisLine);
                pieceOfFreeSpace[0].push(thisLine);
                //todo вставка skive для обробки теперешньої лінії від точки до перетину
                //прослідкувати для точок чи треба змінювати
                let newLinePoint = findWayPoint(thisLine);
                let oldLinePoint = findWayPoint(oldLine);
                // debugger;
                if (GeometryUtils.getDistance(newLinePoint[0], oldLinePoint[0]) < threshold ||
                  GeometryUtils.getDistance(newLinePoint[0], oldLinePoint[1]) < threshold) {
                  pieceOfFreeSpace[1].push(skive(thisLine, editor, 0, closesPoint.point));
                } else if (GeometryUtils.getDistance(newLinePoint[1], oldLinePoint[0]) < threshold ||
                  GeometryUtils.getDistance(newLinePoint[1], oldLinePoint[1]) < threshold) {
                  pieceOfFreeSpace[1].push(skive(thisLine, editor, 1, closesPoint.point));
                }
              }
              startFreeSpaceLengt = freeSpace.length;
              closesPoint.weDoneWithThisPoint = true;

              if (closesPoint.startFromThisPoint) {
                console.log('hе is alive!!!!!');
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
                  console.log("чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, " +
                    "але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так");

                }
                if (freeSpace.includes(thisLine)) {
                  lineCheker += 1;
                } else {
                  lineCheker = 0;
                }
                if (lineCheker > 5) {
                  if (pieceOfFreeSpace[0].includes(thisLine)) {
                    console.log('закольцована полость');
                  } else {
                    console.log('лінії вийшли за тереторію кола');
                    // debugger;
                  }
                  console.log('лінії пішли по другому кругу.... значить коло');
                  return;
                }

                startFreeSpaceLengt = freeSpace.length;

                object = thisLine.parent;
                wayPoint = findWayPoint(thisLine);

                collisionPointsInThisLine = [];
                for (let j = 0; j < thisLine.userData.collisionPointsInf.length; j++) {
                  if (collisionPoints.includes(thisLine.userData.collisionPointsInf[j])) {
                    collisionPointsInThisLine.push(thisLine.userData.collisionPointsInf[j]);
                  }
                }
                // console.log (collisionPointsInThisLine);
                // if (collisionPointsInThisLine.length === 1) {
                let pointIndex;
                // debugger;
                // todo так як змінився thisLine цілком можливо що мав змінитись newFindLinePoint, потрібно перевірити логіку
                if (newFindLinePoint[index] != closesPoint) {
                  pointIndex = searchTrueNextPoint(thisLine, linePoint,
                    nextPointLine, closesPoint, oldLine, pieceOfFreeSpace);
                  // todo тут має бути результат функциї // searchTrueNextPoint (thisLine, linePoint)
                } else {
                  console.log('прийшов час подивитись сюди');
                  debugger;
                }

                if (!pieceOfFreeSpace[0].includes(thisLine)){
                  freeSpace.push(thisLine);
                  pieceOfFreeSpace[0].push(thisLine);
                  // debugger;
                  if (pointIndex) {
                    pieceOfFreeSpace[1].push(skive(thisLine, editor, pointIndex, closesPoint.point));
                  }
                }

                if (collisionPointsInThisLine.length > 1) {
                  // debugger;
                  console.log("от ми нарешті і дійшли до ліній на яких декілька важливих точок");
                  // перше що реалізовуємо перевірку чи є точки між тою звідки ідемо(тікуща точка перетену) і точка куди ідемо (wayPoint[pointIndex])
                  //  якщо є повторюємо все що було в цьому форі з позиції скакаємо з цієї лінії на іншу
                  let lengthToWayPoint = [];
                  let newLineClosesPoint = null;
                  let intersectPoint_WayPoint = null;
                  if (pointIndex !== false) {
                    // debugger;
                    lengthToWayPoint.push(GeometryUtils.getDistance(closesPoint.point, wayPoint[pointIndex]));
                    collisionPointsInThisLine.forEach((collPoint) => {
                      // debugger;
                      let collPoint_WayPoint = GeometryUtils.getDistance(collPoint.point, wayPoint[pointIndex]);
                      if (collPoint_WayPoint < lengthToWayPoint[0]) {
                        lengthToWayPoint.push(collPoint);
                        if (collPoint_WayPoint > intersectPoint_WayPoint) {
                          newLineClosesPoint = collPoint;
                          intersectPoint_WayPoint = collPoint_WayPoint;
                        }
                      }
                    });
                    console.log(lengthToWayPoint)
                    if (lengthToWayPoint.length > 1) {

                      if (!pieceOfFreeSpace[0].includes(thisLine)){
                        // debugger;
                        freeSpace.push(thisLine);
                        pieceOfFreeSpace[0].push(thisLine);
                        // debugger;
                        pieceOfFreeSpace[1].push(skive(thisLine, editor, pointIndex, closesPoint.point));
                      }
                      nextPointLine = findNextLine(object, thisLine, wayPoint[pointIndex]);
                      oldLine = thisLine;
                      entities = newLineClosesPoint.entities;
                      if (entities[0] === oldLine) {
                        thisLine = entities[1];
                      } else if (entities[1] === oldLine) {
                        thisLine = entities[0];
                      } else {
                        console.log("чувак тут задниця... розумієш в одній точкі має зустрітись лише два обєкта, " +
                          "але якщо ти бачеш це повідомлення то тут мінімум три... короче я хз, але тут явно щось пішло не так");
                        // debugger;
                      }

                      if (freeSpace.includes(thisLine)) {
                        lineCheker += 1;
                      } else {
                        lineCheker = 0;
                      }
                      if (lineCheker > 5) {
                        if (pieceOfFreeSpace[0].includes(thisLine)) {
                          console.log('закольцована полость');
                        } else {
                          console.log('лінії вийшли за тереторію кола');
                          // debugger;
                        }
                        console.log('лінії пішли по другому кругу.... значить коло');
                        return;
                      }
                        if (!pieceOfFreeSpace[0].includes(thisLine)){
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
                      pointIndex = searchTrueNextPoint(thisLine, linePoint,
                        nextPointLine, newLineClosesPoint, oldLine,
                        pieceOfFreeSpace);
                      wayPoint = findWayPoint(thisLine);
                      console.log("якщо воно зараз прям запрацює буде круто");
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
                //   console.log ('todo 08/07/2020 доробити/переробити цей елс, має працювати дл яліній на якій декілька важливих точок перетину.' +
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
          }
          //тут перевірка на праведний шлях
          if (startFreeSpaceLengt === freeSpace.length && !checkPoint) {
            if (wayPoint[0] === linePoint) {
              linePoint = wayPoint[1];
            } else if (wayPoint[1] === linePoint) {
              linePoint = wayPoint[0];
              console.log("Ну привіт. як твої справи? звісто ти можеш і відповісти але я всерівно того не бачу." +
                "Як би там не було, я не знаю навіщо ти зараз це читаєш, але знай ти натрапив на фукцию де я мучався не одну годину," +
                "все працюй далі... тут більше нічого не буде.... перпендикулярну парадігму тобі в чай.... ");
              // let testPoint = findNextLine(object, thisLine, wayPoint[0]);
              return;
              // debugger;
              // if (testPoint.line.userData.collisionPointsInf) {
              //   console.log(testPoint.line.userData);
              //   debugger;
              //   testPoint = findNextLine(object, thisLine, wayPoint[1]);
              //   if (testPoint.line.userData.collisionPointsInf) {
              //     console.log(testPoint.line.userData);
              //     debugger;
              //   }
              // }
            }
            i = -1;
          } else if (!checkPoint) {
            // debugger;
            thisLine = line;
            if (!pieceOfFreeSpace[0].includes(thisLine)){
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
        //
        // debugger;
      }
      // debugger;
      // }
    }
    // debugger;
    // return  new Promise(resolve => {тз
    //   setTimeout(() => {
    //     resolve(true);
    //   }, 4000)
    // });
  };

  let testMyFunktion = (collisionAllPoints, collisionPoints, objects) => {
    //todo step 2 -
    collisionPoints.forEach( (point, i) => {
      // let point = collisionPoints[43];
      // if (!point.weDoneWithThisPoint) {
      //   point.startFromThisPoint = true;
      //   nextPoint(point.entities[0].parent, null, point.entities[0], point);
      //   point.startFromThisPoint = false;
      // }
      // });
      // debugger;
      if (!point.weDoneWithThisPoint) {
        // todo окраска точок
        // point.entities.forEach(line => {
        //   line.material.color.set(new THREE.Color(0xFFDC00));
        // });
        render(editor);
        // debugger;
        point.startFromThisPoint = true;
        freeSpacesAll[freeSpacesAll.length] = [[],[]];
        nextPoint(point.entities[0].parent, null, point.entities[0],
          point, freeSpacesAll[freeSpacesAll.length-1], collisionPoints);
        point.startFromThisPoint = false;
        // debugger;
        // // todo step 3 - color of new freeSpace
        // freeSpace.forEach(async line => {
        //   debugger;
        //   line.material.color.set(new THREE.Color(0xFF4136));
        //   render(editor);
        //   await delay(150);
        // });
        // todo розділ обєктів по масивах, розкомітити в кінці коли все буде працювати
        // freeSpacesAll.push(freeSpace);
        // freeSpace = [];
        console.log ('точнка №' + i);
        console.log (freeSpacesAll);
      }
    }); // collisionPoints.forEach( (point)
    // console.log ('точнка №' + i);
// debugger;
    freeSpacesAll.forEach( (lineGroup, i) => {
      // debugger;
      // drawLine (lineGroup[0], editor);
      // debugger;
      lineGroup[1] = [];
      lineGroup[0].forEach(line =>{
        let newLine;
        if (line.geometry.type === 'Geometry') {
          if (!line.geometry.vertices){
            debugger;
          }
          newLine = createLine(
            line.geometry.vertices[0],
            line.geometry.vertices[1]
          )
        } else if (line.geometry.type === 'CircleGeometry') {
          // debugger;
          let materialLine = new THREE.LineBasicMaterial({
            color: 0x000000
          });
          let changedGeometry = {
            radius: line.geometry.parameters.radius,
            thetaStart: line.geometry.parameters.thetaStart,
            thetaLength: line.geometry.parameters.thetaLength
          };
          let copyCircleGeometry = changGeomEditObj(
            { 0: 'copy' },
            changedGeometry
          );
          newLine = new THREE.Line(
            copyCircleGeometry,
            materialLine
          );

          newLine.position.x = line.position.x;
          newLine.position.y = line.position.y;
        }
        // debugger;
        newLine.userData.collisionPointsInf = line.userData.collisionPointsInf;
        lineGroup[1].push (newLine);
      });


      // let edgeModel = GeometryUtils.buildEdgeModel(
      //   { children:  lineGroup[1] },
      //   editor.options.threshold,
      //   'Free space'
      // );
      // debugger;
      // debugger;
      // skive (lineGroup[0], editor);
    });

    // todo добити до ума чистку ліній (забирати лінію якщо вона виде в нікуда,
    //  перевіряти чи лінія закольцовалась, якщо ні спробувати найти точку
    //  в якій закольцовується) від 21.09.2020
    freeSpacesAll.forEach((lineGroup, i)=> {
      let lines = lineGroup[1];
      let objLength = lines.length - 1;
      let colPoint = lines[objLength].userData.collisionPointsInf;
      let colPointThisLine;
      let startPoint;
      let thisPoint;
      let firstPointIndex = null;
      let lastPoint = findWayPoint(lines[objLength]);
      let thisLineWayPoint = findWayPoint(lines[objLength - 1]);
      if (GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[0]) < 10*threshold
        || GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[1]) < 10*threshold) {
        startPoint = lastPoint[1];
        thisPoint = lastPoint[0];
      } else if (GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[0]) < 10*threshold
        || GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[1]) < 10*threshold) {
        startPoint = lastPoint[0];
        thisPoint = lastPoint[1];
      } else {
        objLength -= 1;
        lastPoint = findWayPoint(lines[objLength]);
        thisLineWayPoint = findWayPoint(lines[objLength - 1]);
        if (GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[0]) < 10*threshold
          || GeometryUtils.getDistance(lastPoint[0], thisLineWayPoint[1]) < 10*threshold) {
          startPoint = lastPoint[1];
          thisPoint = lastPoint[0];
        } else if (GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[0]) < 10*threshold
          || GeometryUtils.getDistance(lastPoint[1], thisLineWayPoint[1]) < 10*threshold) {
          startPoint = lastPoint[0];
          thisPoint = lastPoint[1];
        } else {
          debugger;
        }
      }
      for (i = objLength - 1; i > 0; i--) {
        if (firstPointIndex === null) {
          console.log (lines[i]);
          thisLineWayPoint = findWayPoint(lines[i]);
          colPointThisLine = lines[i].userData.collisionPointsInf;
          console.log (thisLineWayPoint);
          // debugger;
          if (GeometryUtils.getDistance(startPoint, thisLineWayPoint[0]) < threshold
            || GeometryUtils.getDistance(startPoint, thisLineWayPoint[1]) < threshold) {
            firstPointIndex = i;
            if (i => 4){
              let newArray = [];
              for (let j = 0; i < i; i++) {
                newArray.push (lines[i]);
              }
            }
          }
          if (colPointThisLine){
            colPointThisLine.forEach(pointThisLine=>{
              if (GeometryUtils.getDistance(startPoint, pointThisLine.point) < threshold) {
                firstPointIndex = i;
              }
            });
          }
          if (colPoint){
            colPoint.forEach(point=>{
              if (GeometryUtils.getDistance(point.point, thisLineWayPoint[0]) < threshold
                || GeometryUtils.getDistance(point.point, thisLineWayPoint[1]) < threshold) {
                firstPointIndex = i;
              }
              if (colPointThisLine){
                colPointThisLine.forEach(pointThisLine=>{
                  if (GeometryUtils.getDistance(point.point, pointThisLine.point) < threshold) {
                    firstPointIndex = i;
                  }
                });
              }
            });
            // debugger;
          }
        }
      }
      console.log(firstPointIndex);
      // debugger;
      if (firstPointIndex){
        lines.splice (0, firstPointIndex);
        console.log (lineGroup[1]);
        // debugger;
      }
    });


    freeSpacesAll.forEach((lineGroup, i)=>{
      createObject(
        editor,
        'freeSpaceZone №' + i,
        lineGroup[1],
        1.1,
        'Free space'
      );
    });

    // let edgeModels = []
    for (let i = 0; i < freeSpacesAll.length; i++){
      if (freeSpacesAll[i].length) {
        // freeSpacesAll[i].forEach((line)=>{
          // line.userData.noIntersections = false;
          // line.material.color.set(new THREE.Color(0xFF0000));
        // });
        render(editor);
        // debugger;
        // edgeModels [edgeModels.length] = GeometryUtils.buildEdgeModel(
        //   { children: freeSpacesAll [i] });
      }
    }
    // console.log (edgeModels);



    // debugger;
    drawLine (freeSpace, editor);

  };

  // testMyFunktion(collisionAllPoints, collisionPoints, objects);

  render(editor);
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

  console.log (objects);
  console.log (editor);
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
      .map( (object, j) => {
        if (object.name.indexOf('freeSpaceZone') !== -1 && object.userData.edgeModel.regions[0]) {
          // debugger;
          console.log(objects);
          console.log (object);
          console.log (j)
          // debugger;
          let path = object.userData.edgeModel.regions[0].path;
          let area = GeometryUtils.pathArea(object.userData.edgeModel.regions[0].area);

          let vertexList = [];
          let last = path[path.length - 1];
          let lastVertex = `${(last.x / 1000).toFixed(4)}, ${(
            last.y / 1000
          ).toFixed(4)}`;
          let pathD = `M${lastVertex} L`;

          path.forEach(v => {
            let vertex = `${(v.x / 1000).toFixed(4)},${(v.y / 1000).toFixed(4)}`;
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
  </svg>`;

  console.log(svg);

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
  //
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

//функція обробки ліній після пошуку пустот (аналіз замкнутості простору, підганяння точок друг до друга
let skive = (object, editor, cutPointIndex, colPoint, threshold = 0.001) => {
  if (object.length) {
    //todo переробити для лінії а не груп ліній
    // debugger;
    let thisLine = object[0];
    let thisLinePoints = findWayPoint(thisLine);
    let nextLinePoints = findWayPoint(object[1]);
    let pointIndex;
    // if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[0]) < threshold
    //   || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[0]) < threshold){
    //   pointIndex = 1;
    // } else if (GeometryUtils.getDistance(thisLinePoints[0], nextLinePoints[1]) < threshold
    //   || GeometryUtils.getDistance(thisLinePoints[1], nextLinePoints[1]) < threshold){
    //   pointIndex = 0;
    // } else {
    //   console.log ('точка перетену або ерор');
    //   debugger;
    // }

    object.forEach((line, i) => {
      let collisionPoints = line.userData.collisionPointsInf;
      if (collisionPoints) {
        console.log(line.userData.collisionPointsInf);
        let lineIndex = null;
        let linePoints = findWayPoint(line);
        for (let j = 0; j < object.length; j++) {
          if (object[j] !== line) {
            let closeLinePoint = findWayPoint(object[j]);
            if (GeometryUtils.getDistance(linePoints[0], closeLinePoint[0]) < threshold
              || GeometryUtils.getDistance(linePoints[0], closeLinePoint[1]) < threshold) {
              if (lineIndex === null) {
                // debugger;
                lineIndex = 1;
              } else {
                // debugger;
                lineIndex = 3;
              }
            }
            if (GeometryUtils.getDistance(linePoints[1], closeLinePoint[0]) < threshold
              || GeometryUtils.getDistance(linePoints[1], closeLinePoint[1]) < threshold) {
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
              console.log(collisionPoints);
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
                if (GeometryUtils.getDistance(colPoint.point, closeLinePoint[0]) < threshold
                  || GeometryUtils.getDistance(colPoint.point, closeLinePoint[1]) < threshold) {
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
                circlePoints [i] = {
                  x: verticesPoint.x + line.position.x,
                  y: verticesPoint.y + line.position.y
                }
                distanceToCirclePoints[i] = GeometryUtils.getDistance(colPoint.point, circlePoints [i]);
              });
              let distance = Math.min(...distanceToCirclePoints);
              pointIndex = distanceToCirclePoints.indexOf(distance);
              console.log(distance);
              if (pointIndex !== 0 && pointIndex !== line.geometry.vertices.length - 1) {
                let newChangeLine = lineIndex === 0 ? GeometryUtils.newCurve(line.position,
                  line.geometry.parameters.radius, circlePoints[0],
                  circlePoints[pointIndex]) :
                  GeometryUtils.newCurve(line.position,
                    line.geometry.parameters.radius, circlePoints[pointIndex],
                    circlePoints[circlePoints.length - 1]);
                line.geometry.parameters = {
                  radius: newChangeLine.geometry.parameters.radius,
                  segments: newChangeLine.geometry.parameters.segments,
                  thetaLength: newChangeLine.geometry.parameters.thetaLength,
                  thetaStart: newChangeLine.geometry.parameters.thetaStart
                }
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
      newLine = createLine(
        linePoints [cutPointIndex],
        colPoint
      );
    } else if (line.geometry.type === 'CircleGeometry') {
      newLine = GeometryUtils.newCurve(line.position,
        line.geometry.parameters.radius, linePoints [cutPointIndex],
        colPoint);
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
  //       console.log(GeometryUtils.linesIntersect(nextLinePoints[0], nextLinePoints[1], thisLinePoints[0], thisLinePoints[1]));
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
  //         console.log(GeometryUtils.linesIntersect(nextLinePoints[0], nextLinePoints[1], thisLinePoints[0], thisLinePoints[1]));
  //         debugger;
  //         thisLine = line;
  //         thisLinePoints = nextLinePoints;
  //       } else {
  //         nextLinePoints = findWayPoint(line);
  //         console.log(thisLine.userData.collisionPointsInf);
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
  //         console.log('точка перетену або ерор');
  //         debugger;
  //       }
  //
  //     }
  //   })
  // }
}



// let collisionPointsFunk = (editor, objects, collisionPoints, threshold = 0.001) =>{
//   let {scene} = editor;
//   let helpLayer = scene.getObjectByName('HelpLayer');
//   helpLayer.children = [];
//   collisionPoints.forEach(point=>{
//     helpLayer.add( helpLayerService.positionInLine(
//       editor,
//       [point.point]
//     ));
//   });
//   render(editor);
//   collisionPoints.forEach( (point, pointInd) =>{
//     lineDivision(editor, point, collisionPoints, threshold);
//   });
// }

let searchLineWithPoint = (line, point, threshold) =>{
  let lineWithPoint = line;
  let linePoints;
  if (line.geometry.type === 'Geometry') {
    // if (GeometryUtils.distanceToLine(point.point, line) > threshold) {
    //   if (line.userData.newLines) {
    //     if (GeometryUtils.distanceToLine(point.point, line) > 0.1 * threshold) {
          line.userData.newLines.forEach(uDLine => {
            console.log(GeometryUtils.distanceToLine(point.point, uDLine));
            if (GeometryUtils.distanceToLine(point.point, uDLine) < 0.1 * threshold) {
              lineWithPoint = uDLine;
              // debugger;
              // linePoints = findWayPoint(lineWithPoint);
              // lineWithPoint.name = '';
            }
          });
        // }
        // if (lineWithPoint !== line){
        //   point.entities[lineIndex] = null;
        //   point.entities.push (lineWithPoint);
        //   // debugger;
        // }
      // }

      if (GeometryUtils.distanceToLine(point.point, lineWithPoint) > threshold) {
        // такого не має бути
        console.log(GeometryUtils.distanceToLine(point.point, lineWithPoint));
        console.log(GeometryUtils.distanceToLine(point.point, line));
        debugger;
        return;
      }
    // }
  } else if (line.geometry.type === 'CircleGeometry') {
    let minDistance;
    line.userData.newLines.forEach(uDLine => {
      // debugger;
      // console.log(GeometryUtils.distanceToArc(point.point, uDLine));
      let distance = GeometryUtils.distanceToArc(point.point, uDLine);
      if (!isNaN(distance)) {
      if (distance < 0.1 * threshold) {
        lineWithPoint = uDLine;
        // debugger;
        // linePoints = findWayPoint(lineWithPoint);
        // lineWithPoint.name = '';
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
            // debugger;
          }
        });
      }
    });

    // let pointIndex = false;
    // let minDistance = GeometryUtils.getDistance(point.point, {
    //   x: line.geometry.vertices[0].x + line.position.x,
    //   y: line.geometry.vertices[0].y + line.position.y
    // });
    // let closestLine = line;
    // line.geometry.vertices.forEach(vertex => {
    //   let distanceToPoint = GeometryUtils.getDistance(point.point, {
    //     x: vertex.x + line.position.x,
    //     y: vertex.y + line.position.y
    //   });
      // console.log (distanceToPoint);
      // if (distanceToPoint < 10 * threshold) {
      //   pointIndex = true;
      // }
      // if (distanceToPoint < minDistance) {
      //   minDistance = distanceToPoint;
      //   closestLine = line;
      // }
    // });
    // if (!pointIndex) {
      // debugger;
      // if (line.userData.newLines) {
      //
        // line.userData.newLines.forEach(uDLine => {
        //   uDLine.geometry.vertices.forEach(vertex => {
        //     let distanceToPoint = GeometryUtils.getDistance(point.point, {
        //       x: vertex.x + line.position.x,
        //       y: vertex.y + line.position.y
        //     });
        //     if (distanceToPoint < minDistance) {
        //       minDistance = distanceToPoint;
        //       closestLine = uDLine;
        //     }
        //   });
        // });
      //
      // }
    // }
    // lineWithPoint = closestLine;
    // lineWithPoint.name = '';
    //   // debugger;
    if (GeometryUtils.distanceToArc(point.point, lineWithPoint) > threshold) {
      // такого не має бути
      console.log(GeometryUtils.distanceToArc(point.point, lineWithPoint));
      console.log(GeometryUtils.distanceToArc(point.point, line));
      debugger;
      return;
    }
  }
  lineWithPoint.name = '';
  console.log (lineWithPoint);
  // debugger;

  if (lineWithPoint.userData.newLines){
    return searchLineWithPoint (lineWithPoint, point, threshold);
  } else {
    return lineWithPoint;
  }
}

let lineDivision = (editor, point, collisionPoints, threshold = 0.0001)=> {
  let actionChecker = false;
  point.entities.forEach( (line,i)=> {
    if (line.name !== '') {
      line.name = '';
    }
  });

  point.entities.forEach((line, lineIndex)=> {
    if (line.name !== 'changed line') {
      let lineWithPoint = line;
      let object = line.parent;
      let newLines = false;
      let linePoints;

      if (line.userData.newLines){
        lineWithPoint = searchLineWithPoint (line, point, threshold);
        // debugger;
      }

      if (lineWithPoint !== line) {
        point.entities[lineIndex] = null;
        point.entities.push(lineWithPoint);
        // debugger;
      }

      linePoints = findWayPoint(lineWithPoint);
      if (GeometryUtils.getDistance(point.point, linePoints[0]) > threshold &&
        GeometryUtils.getDistance(point.point, linePoints[1]) > threshold
      ) {
        if (lineWithPoint.geometry.type === 'Geometry') {
          if (GeometryUtils.distanceToLine(point.point, lineWithPoint) > threshold) {
            console.log(GeometryUtils.distanceToLine(point.point, lineWithPoint));
            console.log('треба дивитись до функцію переноса точок перетину і ліній або дописувати доп алгоритм')
            debugger;
          }
          newLines = [createLine(
            linePoints[0],
            point.point
          ),
            createLine(
              point.point,
              linePoints[1])];

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
            circlePoints [i] = {
              x: verticesPoint.x + lineWithPoint.position.x,
              y: verticesPoint.y + lineWithPoint.position.y
            }
            distanceToCirclePoints[i] = GeometryUtils.getDistance(point.point, circlePoints [i]);
          });
          let distance = Math.min(...distanceToCirclePoints);
          pointIndex = distanceToCirclePoints.indexOf(distance);
          console.log(distance);
          if (pointIndex !== 0 && pointIndex !== lineWithPoint.geometry.vertices.length - 1) {

            newLines = [
              GeometryUtils.newCurve(lineWithPoint.position,
                lineWithPoint.geometry.parameters.radius, circlePoints[0],
                circlePoints[pointIndex], editor),
              GeometryUtils.newCurve(lineWithPoint.position,
                lineWithPoint.geometry.parameters.radius, circlePoints[pointIndex],
                circlePoints[circlePoints.length - 1], editor)];

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
          point.entities.push(newLines[0]);
          point.entities.push(newLines[1]);
          // debugger;
          drawLine([newLines[1]], editor, 0xFF0000);
          drawLine([newLines[0]], editor, 0x00FF00);
          actionChecker = true;
          lineWithPoint.name = 'changed line';
          lineWithPoint.geometry.verticesNeedUpdate = true;
          newLines.name = 'NEW LINE';
          console.log(object.children);
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
  for (let i = 0; i < point.entities.length;){
    if ( point.entities[i] !== null){
      i+=1;
      // debugger;
    } else {
      point.entities.splice (i,1);
    }
  }
  if (actionChecker) {
    lineDivision(editor, point, collisionPoints, threshold)
  } else {
    render(editor);
    return collisionPoints;
  }
};

let drawLine = async (freeSpace, editor, color =  0xFF0000) => {
  // freeSpace.forEach(line => {
  // debugger;
  //   for (let i = 0; i<freeSpacesAll.length; i++){
  //     let freeSpaces = freeSpacesAll[i];
  for (let j = 0; j<freeSpace.length; j++) {
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
    }, ms)
  })
}

// повертає точки ліній
let findWayPoint = (line)=>{
  let points = [];
  if (!line){
    return [];
  }
  if (line.geometry.type === 'Geometry') {
    points[0] = line.geometry.vertices[0];
    points[1] = line.geometry.vertices[1];
  } else if (line.geometry.type === 'CircleGeometry'){
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
  }
  return points;
};

let cutLine = (line, pointStart, cutPoint) => {
  let newLine = [];
  // console.log(line);
  // debugger;
  // let index = array.indexOf(line);
  // if (index) {
  //   debugger;
  if (line.geometry.type === 'Geometry') {
    newLine.push(createLine(
      line.geometry.vertices[0],
      cutPoint
    ));
    newLine.push(createLine(
      cutPoint,
      line.geometry.vertices[1]
    ));
  } else if (line.geometry.type === 'CircleGeometry') {
    let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    let copyCircleGeometry = changeArcGeometry(
      { 0: 'copy' },
      {
        radius: line.geometry.parameters.radius,
        thetaStart: line.geometry.parameters.thetaStart,
        thetaLength: line.geometry.parameters.thetaLength
      }
    );
    newLine = new THREE.Line(copyCircleGeometry, materialLine);
    newLine.position.x = line.position.x;
    newLine.position.y = line.position.y;
    console.log(newLine);
    debugger;
  }
  // array[index] = newLine;
  // }
  console.log (newLine);
  debugger;
  return newLine;
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
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });
};

let fixSceneAfterImport = scene => {
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

let removeLineByName = (name, scene) => {
  const existLine = scene.getObjectByName(name);
  if (existLine) {
    existLine.parent.remove(existLine);
    return true;
  }
};

let getOffset = elem => {
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
  render,
  entityIterator,
  setPointOfInterest,
  showAll,
  groupEntities,
  createObject,
  getObjects,
  getLayers,
  combineEdgeModels,
  fixSceneAfterImport,
  sendToFlixo,
  someSvg,
  removeLineByName,
  getEntityNeighbours,
  getOffset
};
