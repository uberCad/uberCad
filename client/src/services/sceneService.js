import * as THREE from '../extend/THREE'
import ArrayUtils from './arrayUtils'
import GeometryUtils from './GeometryUtils'
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
  highlightEntities(editor, true, undefined, false)
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
  highlightEntities(editor)

  return editor.activeEntities
}

let render = (editor) => {
  let {renderer, scene, camera} = editor
  renderer.render(scene, camera)
}

let highlightEntities = (editor, restoreColor = false, color = 0x0000FF, doRender = true) => {
  let entities = editor.activeEntities
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
  console.log('RECURSIVE SELECT ', editor.options.threshold)

  let entities = getNeighbours(object, editor)
  entities.push(object)

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

function * entityIterator (container) {
  for (let child in container.children) {
    if (container.children.hasOwnProperty(child)) {
      if (container.children[child].children.length || container.children[child].userData.container) {
        yield * entityIterator(container.children[child])
      } else {
        yield container.children[child]
      }
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
  entityIterator
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
