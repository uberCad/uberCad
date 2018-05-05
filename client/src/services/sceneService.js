import * as THREE from '../extend/THREE'
import ArrayUtils from './arrayUtils'
import GeometryUtils from './GeometryUtils'
import ConsoleUtils from './consoleUtils'
import ToastService from './ToastService'
import {
  SELECT_MODE_NEW,
  SELECT_MODE_ADD,
  SELECT_MODE_SUB,
  SELECT_MODE_INTERSECT
} from '../components/Options/optionsComponent'

let onClick = (event, scene, camera, renderer) => {
  let result = {
    point: undefined, // new THREE.Vector3
    activeEntities: []
  }
  let canvas = event.target.tagName === 'CANVAS' && event.target
  if (!canvas) {
    if (renderer.domElement) {
      canvas = renderer.domElement
    } else {
      return
    }
  }

  let canvasOffset = getOffset(canvas)

  let rayCaster = new THREE.Raycaster() // create once
  let mouse = new THREE.Vector3((event.pageX - canvasOffset.left) / (canvas.clientWidth - 1) * 2 - 1, -((event.pageY - canvasOffset.top) / (canvas.clientHeight - 1)) * 2 + 1, 0)
  rayCaster.setFromCamera(mouse, camera)

  // get mouse coordinates
  mouse.unproject(camera)
  result.point = mouse

  rayCaster.intersectObjects(scene.children, true).forEach(intersection => {
    if (result.activeEntities.indexOf(intersection.object) < 0) {
      result.activeEntities.push(intersection.object)
    }
  })

  result.activeEntities.forEach(function (line) {
    if (line.geometry.type === 'Geometry') {
      line.userData.mouseDistance = GeometryUtils.distanceToLine(result.point, line)
    } else if (line.geometry.type === 'CircleGeometry') {
      line.userData.mouseDistance = GeometryUtils.distanceToArc(result.point, line)
    }
  })
  let compare = (a, b) => {
    if (a.userData.mouseDistance > b.userData.mouseDistance) return 1
    if (a.userData.mouseDistance < b.userData.mouseDistance) return -1
  }
  result.activeEntities.sort(compare)

  return result
}

let doSelection = (selectResult, editor) => {
  highlightEntities(editor, editor.activeEntities, true, undefined, false)
  switch (editor.options.selectMode) {
    case SELECT_MODE_NEW:
      editor.activeEntities = selectResult
      break
    case SELECT_MODE_ADD:
      editor.activeEntities = ArrayUtils.union(editor.activeEntities, selectResult)
      break
    case SELECT_MODE_SUB:
      editor.activeEntities = ArrayUtils.subtract(editor.activeEntities, selectResult)
      break
    case SELECT_MODE_INTERSECT:
      editor.activeEntities = ArrayUtils.intersection(editor.activeEntities, selectResult)
      break
    default:
      console.warn(`Unhandled select mode ${editor.options.selectMode}`)
  }
  highlightEntities(editor, editor.activeEntities)

  return editor.activeEntities
}

let render = (editor) => {
  let {renderer, scene, camera} = editor
  renderer.render(scene, camera)
}

let highlightEntities = (editor, entities, restoreColor = false, color = 0x0000FF, doRender = true) => {
  // console.warn({editor, activeEntities: editor.activeEntities})

  if (!Array.isArray(entities)) {
    entities = [entities]
  }

  entities.forEach(entity => {
    // upd color
    if (restoreColor) {
      delete entity.userData.showInTop
      if (entity.userData.originalColor) {
        entity.material.color = entity.userData.originalColor
        delete entity.userData.originalColor
      }
    } else {
      if (!entity.userData.originalColor) {
        entity.userData.originalColor = entity.material.color
      }
      entity.material.color = new THREE.Color(color)
    }
    // entity.geometry.computeLineDistances();
    entity.material.needUpdate = true
  })
  if (doRender) {
    render(editor)
  }
}

function shotPoints (vertex, distance = 0.1) {
  let vertices = []

  let tmp = vertex.clone()
  tmp.x += distance
  vertices.push(tmp)

  tmp = vertex.clone()
  tmp.x -= distance
  vertices.push(tmp)

  tmp = vertex.clone()
  tmp.y += distance
  vertices.push(tmp)

  tmp = vertex.clone()
  tmp.y -= distance
  vertices.push(tmp)

  return vertices
}

function getNeighbours (entity, editor, entities = []) {
  let {scene} = editor

  let vertices = []

  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc

    let vertex = new THREE.Vector3(0, 0, 0)
    vertices.push(vertex.addVectors(entity.geometry.vertices[0], entity.position))

    vertex = new THREE.Vector3(0, 0, 0)
    vertices.push(vertex.addVectors(entity.geometry.vertices[entity.geometry.vertices.length - 1], entity.position))
  } else {
    // line?
    vertices = entity.geometry.vertices
  }

  vertices.forEach(vertex => {
    let tmpVertices = [vertex].concat(shotPoints(vertex, 0.1))

    tmpVertices.forEach(tmpVertex => {
      let rayCaster = new THREE.Raycaster(tmpVertex, new THREE.Vector3(0, 0, 1))

      // TODO: intersection on same layer

      let objects = scene.children
      if (editor.options.singleLayerSelect) {
        let layerName = entity.parent.name
        scene.children.forEach(child => {
          if (child.name === 'Layers') {
            child.children.forEach(layer => {
              if (layer.name === layerName) {
                objects = layer.children
              }
            })
          }
        })
      }

      let intersections = rayCaster.intersectObjects(objects, true)

      intersections.forEach(intersect => {
        if (entities.indexOf(intersect.object) < 0) {
          // object not in array yet, check

          let checkVertices = []
          if (intersect.object.geometry instanceof THREE.CircleGeometry) {
            let vertex = new THREE.Vector3(0, 0, 0)
            checkVertices.push(vertex.addVectors(intersect.object.geometry.vertices[0], intersect.object.position))

            vertex = new THREE.Vector3(0, 0, 0)
            checkVertices.push(vertex.addVectors(intersect.object.geometry.vertices[intersect.object.geometry.vertices.length - 1], intersect.object.position))
          } else {
            checkVertices = intersect.object.geometry.vertices
          }

          checkVertices.forEach(checkVertex => {
            if (checkVertex.distanceTo(vertex) < editor.options.threshold) {
              entities.push(intersect.object)
              getNeighbours(intersect.object, editor, entities)
            }
          })
        }
      })
    })
  })

  return entities
}

let recursiveSelect = (object, editor) => {
  let entities = getNeighbours(object, editor)
  entities.push(object)

  // unique entities
  entities = [...new Set(entities)]

  entities = GeometryUtils.skipZeroLines(entities, editor.options.threshold)

  let area = calcArea(entities)
  let lineLength = calcLength(entities)
  let size = calcSize(entities)
  console.log('object area: ' + area.toFixed(4) + '<br />length: ' + lineLength.toFixed(4) + '<br /><b>Size:</b><br />Width: ' + size.x.toFixed(4) + '<br />Height: ' + size.y.toFixed(4))

  return entities
}

let calcArea = (entities) => {
  let vertices = getSerialVertices(entities)
  let sumX = 0
  let sumY = 0
  let multipleIdx = 0
  for (let i = 0; i < vertices.length; i++) {
    multipleIdx = i + 1
    if (multipleIdx >= vertices.length) {
      multipleIdx = 0
    }
    sumX += vertices[i].x * vertices[multipleIdx].y
    sumY += vertices[multipleIdx].x * vertices[i].y
  }
  return Math.abs((sumY - sumX) / 2)
}

let calcLength = entities => {
  let total = 0
  entities.forEach(entity => {
    entity.computeLineDistances()
    total += entity.geometry.lineDistances[entity.geometry.lineDistances.length - 1]
  })
  return total
}

let calcSize = entities => {
  let init = false
  let left, top, right, bottom

  entities.forEach(entity => {
    getVertices(entity, true).forEach(vertex => {
      if (!init) {
        init = true
        left = right = vertex.x
        top = bottom = vertex.y
      }
      if (left < vertex.x) { left = vertex.x }
      if (right > vertex.x) { right = vertex.x }
      if (top < vertex.y) { top = vertex.y }
      if (bottom > vertex.y) { bottom = vertex.y }
    })
  })

  // ACHTUNG!
  // swap width and height

  return new THREE.Vector2(Math.abs(top - bottom), Math.abs(left - right))
}

function selectInFrustum (area, container, editor) {
  let planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), Math.max(area.x1, area.x2)),
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -Math.min(area.x1, area.x2)),

    new THREE.Plane(new THREE.Vector3(0, -1, 0), Math.max(area.y1, area.y2)),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -Math.min(area.y1, area.y2)),

    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
  ]

  let frustum = new THREE.Frustum(
    ...planes
  )

  let iterator = entityIterator(container)

  let frustumIntersects = []

  let entity = iterator.next()
  while (!entity.done) {
    try {
      if (frustum.intersectsObject(entity.value)) {
        frustumIntersects.push(entity.value)
      }
      entity = iterator.next()
    } catch (e) {
      // debugger;
      console.error(e, 'problem with frustrum intersects, at selectInFrustum()')
    }
  }

  let frustumIntersectsFiltered = []

  let geometries = {}

  frustumIntersects.forEach((entity, idx) => {
    // if (idx < 50 || idx > 60 ) return;

    // console.log('item', entity);
    if (entityIntersectArea(entity, area, geometries)) {
      frustumIntersectsFiltered.push(entity)
    }
  })

  // console.timeEnd('selectInFrustum');
  return frustumIntersectsFiltered
}

function entityIntersectArea (entity, area) {
// console.log('ENTITY', entity, 'AREA', area);
  // console.count(entity.geometry.type);

  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    try {
      entity.geometry.vertices.forEach((vertex, idx) => {
        // TODO optimize code
        // skip even vertex for calculation speed. I think three is possibility to check evert fifth vertex...
        if (idx % 2 === 1 && vertexInArea((new THREE.Vector3(0, 0, 0)).addVectors(vertex, entity.position), area)) {
          throw new Error('true')
        }
      })
    } catch (e) {
      return true
    }

    return false
  } else {
    // console.log('LINE', entity);

    // check if any vertex in selected area;
    try {
      entity.geometry.vertices.forEach(vertex => {
        if (vertexInArea(vertex, area)) {
          throw new Error('true')
        }
      })
    } catch (e) {
      return true
    }

    // check if line intersect area
    try {
      let prevVertex

      entity.geometry.vertices.forEach(vertex => {
        if (prevVertex) {
          // console.log(area);
          // x1,y1 - x2,y1
          // x1,y1 - x1,y2
          // x1,y2 - x2,y2
          // x2,y1 - x2,y2
          if (
            GeometryUtils.linesIntersect(prevVertex, vertex, new THREE.Vector3(area.x1, area.y1, 0), new THREE.Vector3(area.x2, area.y1, 0)) ||
            GeometryUtils.linesIntersect(prevVertex, vertex, new THREE.Vector3(area.x1, area.y1, 0), new THREE.Vector3(area.x1, area.y2, 0)) ||
            GeometryUtils.linesIntersect(prevVertex, vertex, new THREE.Vector3(area.x1, area.y2, 0), new THREE.Vector3(area.x2, area.y2, 0)) ||
            GeometryUtils.linesIntersect(prevVertex, vertex, new THREE.Vector3(area.x2, area.y1, 0), new THREE.Vector3(area.x2, area.y2, 0))
          ) {
            throw new Error('true')
          }
        }
        prevVertex = vertex
      })
    } catch (e) {
      return true
    }

    return false
  }

  // alert('Unexpected geometry @ThreeDxf.entityIntersectArea()');
}

function * entityIterator (container, iterateContainers = false) {
  if (iterateContainers) {
    yield container
  }
  for (let child in container.children) {
    if (container.children.hasOwnProperty(child)) {
      if (container.children[child].children.length || container.children[child].userData.container) {
        yield * entityIterator(container.children[child], iterateContainers)
      } else {
        yield container.children[child]
      }
    }
  }
}

let setPointOfInterest = (editor, object) => {
  let STEPS_COUNT = 25
  let {camera} = editor

  console.log(editor)
  console.log(editor.cadCanvas)
  console.log(editor.cadCanvas.getControls())

  let controls = editor.cadCanvas.getControls()

  let pointOfInterests
  if (object.geometry instanceof THREE.CircleGeometry) {
    pointOfInterests = object.position
  } else {
    object.geometry.computeBoundingSphere()
    pointOfInterests = object.geometry.boundingSphere.center
  }
  let step = (new THREE.Vector3(0, 0, 0)).subVectors(pointOfInterests, camera.position).divideScalar(STEPS_COUNT)

  let radius = object.geometry.boundingSphere.radius
  let canvasDimension
  if (camera.right > camera.top) {
    canvasDimension = camera.top
  } else {
    canvasDimension = camera.right
  }
  let factor = Math.pow(radius / canvasDimension * 2, 1 / STEPS_COUNT)

  let steps_left = STEPS_COUNT

  function animateCameraMove () {
    steps_left--
    if (steps_left > 0) {
      requestAnimationFrame(animateCameraMove)
    }

    step.z = 0
    controls.target.add(step)
    camera.position.add(step)

    camera.left *= factor
    camera.right *= factor
    camera.top *= factor
    camera.bottom *= factor
    camera.updateProjectionMatrix()

    camera.needUpdate = true
    controls.update()
  }

  animateCameraMove()
}

let showAll = editor => {
  let {scene} = editor
  let iterator = entityIterator(scene, true)

  let entity = iterator.next()
  while (!entity.done) {
    try {
      entity.value.visible = true
      entity = iterator.next()
    } catch (e) {
      // debugger
      console.error(e, 'problem with showing all, at showAll()')
    }
  }
  render(editor)
}

let createObject = (editor, name, entities, threshold = 0.000001) => {
  let object;
  let {scene} = editor

  let usedEntities = entities.length;
  entities = entities.filter(e => !e.userData.belongsToObject);
  usedEntities -= entities.length;

  try {
    scene.children.forEach(objectsContainer => {
      if (objectsContainer.name === 'Objects') {
        objectsContainer.children.forEach(object => {
          if (object.name === name) {

            let error = new Error(`Object with name "${name}" already exists`)
            error.userData = {
              error: 'duplicate name',
              msg: `Object with name "${name}" already exists`,
              name: name
            }
            throw error

            // throw {
            //   error: 'duplicate name',
            //   msg: `Object with name "${name}" already exists`,
            //   name: name
            // }
          }
        });

        //create object (entities container)
        //move entities from layers to object
        //render

        // object = new THREE.Object3D();
        object = new THREE.Group();
        object.name = name;
        object.userData['container'] = true;
        object.userData['object'] = true;
        // object.visible = false;

        try {
          object.userData['edgeModel'] = GeometryUtils.buildEdgeModel({children: entities}, threshold);
          ConsoleUtils.previewObjectInConsole(object)
        } catch (e) {
          console.warn('BUILD EDGE MODEL IN threeDXF');
          console.warn(e);

          let error = new Error('Problem building edge model')
          error.userData = {
            error: 'edge model',
            data: e,
            msg: 'Problem building edge model'
          }
          throw error

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
          let error = new Error(usedEntities ? 'Selected entities already belongs to object' : 'No entities selected')
          error.userData = {
            error: 'empty object',
            msg: usedEntities ? 'Selected entities already belongs to object' : 'No entities selected'
          }
          throw error

          // throw {
          //   error: 'empty object',
          //   msg: usedEntities ? 'Selected entities already belongs to object' : 'No entities selected'
          // };
        }
      }
    });
  } catch (e) {
    console.error('errore', e);

    switch (e.userData.error) {
      case 'edge model':
        if (e.userData.data && e.userData.data.error) {
          switch (e.userData.data.error) {
            case 'interruption':
              //show problem line
              console.error('show problem line', e);

              this.highlightEntities(entities, true);
              // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

              e.userData.data.entity.userData.showInTop = true;
              this.highlightEntities([e.data.entity]);
              setPointOfInterest(editor, e.data.entity);

              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg);



              break;

            case 'intersection':
              //show problem line
              console.error('show intersected lines', e);

              this.highlightEntities(entities, true);
              // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

              // e.data.entity.userData.showInTop = true;
              this.highlightEntities(e.userData.data.entities);
              setPointOfInterest(editor, e.userData.data.entities[0]);

              // this.render();
              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg);


              break;

            case 'unused entities':
              //show unused entity
              console.error('show unused entity', e);
              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg);

              break;
            default:
              let text = e.userData.msg;
              if (e.userData.data && e.userData.data.msg) {
                text += `<br />${e.userData.data.msg}`;
              }
              // alert(text);
              ToastService.msg(text);
              break;
          }
        } else {
          let text = e.userData.msg;
          if (e.userData.data && e.userData.data.msg) {
            text += `<br />${e.userData.data.msg}`;
          }
          // alert(text);
          ToastService.msg(text);
        }

        // console.error(e);
        break
      case 'duplicate name':
        // alert(e.msg);
        ToastService.msg(e.userData.msg);
        break
      case 'empty object':
        ToastService.msg(e.userData.msg);
        break
      default:
        throw e;
        // break;
    }
    return false;
  }

  render(editor);
  return object;

}

let lastObjectName = ''
let groupEntities = (editor, entities, objectName) => {
  if (!objectName) {
    objectName = prompt('Set object name', lastObjectName)
  }

  if (objectName) {
    lastObjectName = objectName
    try {
      let object = createObject(editor, objectName, entities, editor.options.threshold)
      if (object) {
        lastObjectName = ''
      }
      return object
    } catch (e) {
      console.error(e)
      return false
    }
  }
}

export default {
  onClick,
  doSelection,
  highlightEntities,
  recursiveSelect,
  calcArea,
  calcLength,
  calcSize,
  selectInFrustum,
  render,
  entityIterator,
  setPointOfInterest,
  showAll,
  groupEntities,
  createObject
}

function vertexInArea (vertex, area) {
  return ((vertex.x >= Math.min(area.x1, area.x2) && vertex.x <= Math.max(area.x1, area.x2)) && (vertex.y >= Math.min(area.y1, area.y2) && vertex.y <= Math.max(area.y1, area.y2)))
}

function getOffset (elem) {
  let offset = null
  if (elem) {
    offset = {left: 0, top: 0}
    do {
      offset.top += elem.offsetTop
      offset.left += elem.offsetLeft
      elem = elem.offsetParent
    } while (elem)
  }
  return offset
}

function getVertices (entity, allVertices = false) {
  let vertices = []
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    let vertex = new THREE.Vector3(0, 0, 0)
    if (allVertices) {
      entity.geometry.vertices.forEach(v => {
        vertices.push(vertex.addVectors(v, entity.position))
      })
    } else {
      vertices.push(vertex.addVectors(entity.geometry.vertices[0], entity.position))
      vertex = new THREE.Vector3(0, 0, 0)
      vertices.push(vertex.addVectors(entity.geometry.vertices[entity.geometry.vertices.length - 1], entity.position))
    }
  } else {
    // line?
    vertices = entity.geometry.vertices
  }
  return vertices
}

function getSerialVertices (entities) {
  function buildChain (entities, vertices, currentEntity, vertex, stopVertex) {
    // console.log('buildChain. ENTITIES:', entities, 'VERTICES:', vertices, 'CURRENT_ENTITY', currentEntity, 'VERTEX', vertex, 'STOP_VERTEX', stopVertex);
    if (!currentEntity) {
      if (entities.length) {
        currentEntity = entities[0]
        stopVertex = GeometryUtils.getFirstVertex(currentEntity)
        vertex = stopVertex
        vertices.push(stopVertex)

        if (entities.length === 1) {
          // polygon
          return currentEntity.geometry.vertices
        }
      } else {
        return vertices
      }
    }

    vertex = GeometryUtils.getAnotherVertex(currentEntity, vertex)

    // if current vertex is closely to stopVertex than finish
    if (vertex.distanceTo(stopVertex) < 0.001) {
      // console.log('FIRED STOP VERTEX');
      return vertices
    }

    // find entity (not current)
    let distances = []
    entities.forEach(entity => {
      if (entity === currentEntity) {
        return false
      }

      getVertices(entity).forEach(v => {
        distances.push({
          entity: entity,
          vertex,
          v,
          distance: vertex.distanceTo(v)
        })
      })
    })

    // get closest vertex
    let minDistance = distances.pop()
    distances.forEach(distance => {
      if (distance.distance < minDistance.distance) {
        minDistance = distance
      }
    })

    vertices.push(vertex)
    return buildChain(entities, vertices, minDistance.entity, minDistance.v, stopVertex)
  }

  return buildChain(entities, [])
}
