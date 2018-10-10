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
import axios from 'axios'
import { MEASUREMENT_ANGLE, MEASUREMENT_RADIAL } from '../actions/measurement'
import { LINE_PARALLEL, LINE_PERPENDICULAR, LINE_TANGENT_TO_ARC } from '../actions/line'
import { CHAMFER_LENGTH_ANGLE, CHAMFER_TWO_LENGTH, ROUNDING_LENGTH, ROUNDING_RADIUS } from '../actions/chamfer'
import { ARC_TANGENT_LINE } from '../actions/arc'

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
    case ARC_TANGENT_LINE:
      editor.activeEntities = selectResult
      break
    case ROUNDING_LENGTH:
      editor.activeEntities = selectResult
      break
    case ROUNDING_RADIUS:
      editor.activeEntities = selectResult
      break
    case CHAMFER_LENGTH_ANGLE:
      editor.activeEntities = selectResult
      break
    case CHAMFER_TWO_LENGTH:
      editor.activeEntities = selectResult
      break
    case LINE_TANGENT_TO_ARC:
      editor.activeEntities = selectResult
      break
    case LINE_PERPENDICULAR:
      editor.activeEntities = selectResult
      break
    case LINE_PARALLEL:
      editor.activeEntities = selectResult
      break
    case MEASUREMENT_RADIAL:
      editor.activeEntities = selectResult
      break
    case MEASUREMENT_ANGLE:
      editor.activeEntities = selectResult
      break
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
        entity.material.color.set(entity.userData.originalColor)
        delete entity.userData.originalColor
      }
    } else {
      if (!entity.userData.originalColor) {
        entity.userData.originalColor = entity.material.color.clone()
      }
      entity.material.color.set(new THREE.Color(color))
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

  return entities
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
    if (GeometryUtils.entityIntersectArea(entity, area, geometries)) {
      frustumIntersectsFiltered.push(entity)
    }
  })

  // console.timeEnd('selectInFrustum');
  return frustumIntersectsFiltered
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
  if (object.type !== 'Line') {
    object = new THREE.BoxHelper(object, 0xffff00)
  }
  let stepsCount = 25
  let {camera} = editor

  let controls = editor.cadCanvas.getControls()

  let pointOfInterests
  if (object.geometry instanceof THREE.CircleGeometry) {
    pointOfInterests = object.position
  } else {
    object.geometry.computeBoundingSphere()
    pointOfInterests = object.geometry.boundingSphere.center
  }
  let step = (new THREE.Vector3(0, 0, 0)).subVectors(pointOfInterests, camera.position).divideScalar(stepsCount)

  let radius = object.type === 'LineSegments' ? object.geometry.boundingSphere.radius / 2 : object.geometry.boundingSphere.radius
  let canvasDimension
  if (camera.right > camera.top) {
    canvasDimension = camera.top
  } else {
    canvasDimension = camera.right
  }
  let factor = Math.pow(radius / canvasDimension * 2, 1 / stepsCount)

  let stepsLeft = stepsCount

  function animateCameraMove () {
    stepsLeft--
    if (stepsLeft > 0) {
      window.requestAnimationFrame(animateCameraMove)
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
  let object
  let {scene} = editor

  let usedEntities = entities.length
  entities = entities.filter(e => !e.userData.belongsToObject)
  usedEntities -= entities.length

  try {
    scene.children.forEach(objectsContainer => {
      if (objectsContainer.name === 'Objects') {
        objectsContainer.children.forEach(object => {
          if (object.name === name) {
            let error = new Error(`Object with name "${name}" already exists`)
            error.userData = {
              error: 'duplicate name',
              msg: error.message,
              name: name
            }
            throw error
          }
        })

        // create object (entities container)
        // move entities from layers to object
        // render

        // object = new THREE.Object3D();
        object = new THREE.Group()
        object.name = name
        object.userData['container'] = true
        object.userData['object'] = true
        // object.visible = false;

        try {
          object.userData['edgeModel'] = GeometryUtils.buildEdgeModel({children: entities}, threshold)

          // let size = GeometryUtils.calcSize(entities)
          // console.log(`object area: ${GeometryUtils.calcArea(entities).toFixed(4)}\nLength: ${GeometryUtils.calcLength(entities).toFixed(4)}\nSize:\n\tWidth: ${size.x.toFixed(4)}\n\tHeight: ${size.y.toFixed(4)}`)
          // ConsoleUtils.previewObjectInConsole(object)
        } catch (e) {
          console.warn('BUILD EDGE MODEL IN threeDXF')
          console.warn(e)

          let error = new Error('Problem building edge model')
          error.userData = {
            error: 'edge model',
            data: e,
            msg: error.message
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
          entity.userData.belongsToObject = true
          object.add(entity)
        })

        if (object.children.length) {
          objectsContainer.add(object)
        } else {
          let error = new Error(usedEntities ? 'Selected entities already belongs to object' : 'No entities selected')
          error.userData = {
            error: 'empty object',
            msg: error.message
          }
          throw error

          // throw {
          //   error: 'empty object',
          //   msg: usedEntities ? 'Selected entities already belongs to object' : 'No entities selected'
          // };
        }
      }
    })
  } catch (e) {
    switch (e.userData.error) {
      case 'edge model':
        // console.warn(e.userData.data.userData.error)
        if (e.userData.data && e.userData.data.userData && e.userData.data.userData.error) {
          switch (e.userData.data.userData.error) {
            case 'interruption':
              // show problem line
              console.error('show problem line', e)

              highlightEntities(editor, entities, true)
              // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

              // e.userData.data.entity.userData.showInTop = true
              highlightEntities(editor, [e.userData.data.userData.entity])
              setPointOfInterest(editor, e.userData.data.userData.entity)

              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg)

              break

            case 'intersection':
              // show problem line
              console.error('show intersected lines', e)

              this.highlightEntities(entities, true)
              // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

              // e.data.entity.userData.showInTop = true;
              this.highlightEntities(e.userData.data.entities)
              setPointOfInterest(editor, e.userData.data.entities[0])

              // this.render();
              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg)

              break

            case 'unused entities':
              // show unused entity
              console.error('show unused entity', e)
              ToastService.msg(e.userData.msg + '<br />' + e.userData.data.msg)

              break
            default:
              let text = e.userData.msg
              if (e.userData.data && e.userData.data.msg) {
                text += `<br />${e.userData.data.msg}`
              }
              // alert(text);
              ToastService.msg(text)
              break
          }
        } else {
          let text = e.userData.msg
          if (e.userData.data && e.userData.data.msg) {
            text += `<br />${e.userData.data.msg}`
          }
          // alert(text);
          ToastService.msg(text)
        }

        // console.error(e);
        break
      case 'duplicate name':
        // alert(e.msg);
        ToastService.msg(e.userData.msg)
        break
      case 'empty object':
        ToastService.msg(e.userData.msg)
        break
      default:
        throw e
      // break;
    }
    return false
  }

  render(editor)
  return object
}

let lastObjectName = ''
let groupEntities = (editor, entities, objectName) => {
  if (!objectName) {
    objectName = window.prompt('Set object name', lastObjectName)
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

let getObjects = (scene, returnObjects = false) => {
  for (let container of scene.children) {
    if (container.name === 'Objects') {
      if (returnObjects) {
        return container.children
      } else {
        return container
      }
    }
  }
}

let getLayers = scene => {
  for (let container of scene.children) {
    if (container.name === 'Layers') {
      return container
    }
  }
}

let combineEdgeModels = (editor, svgForFlixo = false) => {
  let {scene, options: {threshold}} = editor
  let objects = getObjects(scene, true)
  // console.log('combineEdgeModels', scene, threshold, objects)

  if (!objects.length) {
    let error = new Error('No objects for edge-model')
    error.userData = {
      error: 'no objects',
      msg: error.message
    }
    throw error
  }

  let viewBox = objects[0].userData.edgeModel.svgData.viewBox
  let box = {
    x: viewBox.x,
    y: viewBox.y,
    x2: +viewBox.x + +viewBox.width,
    y2: +viewBox.y + +viewBox.height
  }

  // width, height, x, y
  objects.forEach(object => {
    let objViewBox = object.userData.edgeModel.svgData.viewBox

    box.x = Math.min(box.x, objViewBox.x)
    box.y = Math.min(box.y, objViewBox.y)
    box.x2 = Math.max(box.x2, +objViewBox.x + +objViewBox.width)
    box.y2 = Math.max(box.y2, +objViewBox.y + +objViewBox.height)
  })

  // viewBox for SVG
  viewBox = {
    x: box.x,
    y: box.y,
    width: Math.abs(+box.x2 - +box.x),
    height: Math.abs(+box.y2 - +box.y)
  }
  let mul = 25 / Math.max(viewBox.width, viewBox.height)

  let collisionPoints = GeometryUtils.getCollisionPoints(objects, threshold)

  collisionPoints = GeometryUtils.filterOverlappingCollisionPoints(collisionPoints)

  collisionPoints = GeometryUtils.filterCollisionPoints(collisionPoints)

  // collisionPoints = GeometryUtils.filterCollisionPointsWithSharedEntities(collisionPoints)

  // console.error('collisionPoints', collisionPoints)

  let branches = GeometryUtils.generateCollisionBranches(collisionPoints, threshold)

  // let branches = [];

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

  let paths = GeometryUtils.generateAllPaths(branches)

  // TODO TODO TODO
  // TODO TODO TODO
  // TODO TODO TODO
  // check all paths, one by one.
  //     primary order them by count of collisionPoints
  //     secondary check if path is ok:
  //         - cavity must not intersects with internal regions of object.
  //         - cavity can't by intersected by itself
  //     tertiary if region is ok - skip other regions with that collisionPoints

  paths = paths
    .filter(path => path.collisionPoints.length > 1)
    .sort((pathA, pathB) => pathA.collisionPoints.length - pathB.collisionPoints.length)

  // function shuffleArray(array) {
  //     for (let i = array.length - 1; i > 0; i--) {
  //         let j = Math.floor(Math.random() * (i + 1));
  //         [array[i], array[j]] = [array[j], array[i]];
  //     }
  // }
  //
  // shuffleArray(paths);

  let cavities = []
  // filter paths - check if every used object not in cavity;
  let usedCollisionPoints = []

  // debugger;
  let iterator = GeometryUtils.queueIterator(paths)
  let queue = iterator.next()
  while (!queue.done) {
    let cavityToCheck = queue.value

    let result = GeometryUtils.checkCavity(cavityToCheck, usedCollisionPoints, threshold)

    // ConsoleUtils.previewPathInConsole(cavityToCheck.path, null, result)
    if (result.needToCheckAgain) {
      queue = iterator.next(cavityToCheck)
    } else {
      if (result.valid) {
        cavities.push(cavityToCheck)
        usedCollisionPoints.push(...cavityToCheck.collisionPoints)
      }
      queue = iterator.next()
    }
  }

  // debugger;

  cavities.forEach(cavity => ConsoleUtils.previewPathInConsole(cavity.path, null, cavity))
  console.warn('PATHS', paths, {branches}, {cavities})

  let thermalPoints = GeometryUtils.getThermalPoints(scene)
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${(viewBox.width * mul).toFixed(4)}cm" height="${(viewBox.height * mul).toFixed(4)}cm" viewBox="${viewBox.x.toFixed(4)} ${viewBox.y.toFixed(4)} ${viewBox.width.toFixed(4)} ${viewBox.height.toFixed(4)}">
<desc>
  <schema desc="BuildingSVG" version="1.1"></schema>
  <constr id="Dummy" scale="1"></constr>
</desc>
<g id="group_d">\n` +
    objects.map(object => {
      let materialSvg = ''
      if (object.userData.material) {
        let {material} = object.userData
        materialSvg = `<matprop type="const" id="${material.id}" lambda="${material.lambda}" eps="${material.epsilon}" density="${material.density}"/>\n`
      }

      console.log(object.userData.edgeModel.regions[0])

      return `<path d="${object.userData.edgeModel.svgData.pathD} " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">\n` +
        materialSvg +
        `<area value="${(object.userData.edgeModel.regions[0].area / 1000000).toFixed(6)}" />\n` +
        `</path>\n` +
        ((!svgForFlixo && `<circle cx="${(object.userData.edgeModel.svgData.insidePoint.x / 1000).toFixed(4)}" cy="${(object.userData.edgeModel.svgData.insidePoint.y / 1000).toFixed(4)}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />`) || '') +
        object.userData.edgeModel.svgData.subRegionsPathD.map((pathD, idx) => {
          return `<path d="${pathD} " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">\n` +
            `<matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>\n` +
            `<area value="${(object.userData.edgeModel.regions[idx + 1].area / 1000000)}" />\n` +
            `</path>`
        }).join('')
    }).join('') +
    // cavities here
    cavities.map(pathData => {
      let path = pathData.path
      let area = GeometryUtils.pathArea(pathData.path)

      let vertexList = []
      let last = path[path.length - 1]
      let lastVertex = `${(last.x / 1000).toFixed(4)}, ${(last.y / 1000).toFixed(4)}`
      let pathD = `M${lastVertex} L`

      path.forEach(v => {
        let vertex = `${(v.x / 1000).toFixed(4)},${(v.y / 1000).toFixed(4)}`
        if (vertex !== lastVertex && vertexList.indexOf(vertex) < 0) {
          pathD += `${vertex} `
          lastVertex = vertex
          vertexList.push(vertex)
        }

        // circles += `<circle cx="${(v.x / 1000).toFixed(4)}" cy="${(v.y / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(255,20,20); stroke:black;stroke-width:0.00001" />`
      })
      return `<path d="${pathD} " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" >\n` +
        `<matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"></matprop>\n` +
        `<area value="${area}"></area>\n` +
        `</path>\n`
    }).join('') +
    `</g>
  <g id="temperature">
    <bcprop id="External" x="${(thermalPoints.cold1.x / 1000).toFixed(4)}" y="${(thermalPoints.cold1.y / 1000).toFixed(4)}" temp="273.15" rs="0.04" rel_img="SvgjsImage1089" rel_id="0" rel="min"></bcprop>
    <bcprop id="External" x="${(thermalPoints.cold2.x / 1000).toFixed(4)}" y="${(thermalPoints.cold2.y / 1000).toFixed(4)}" temp="273.15" rs="0.04" rel_img="SvgjsImage1090" rel_id="1" rel="max"></bcprop>
    <bcprop id="Interior" x="${(thermalPoints.hot1.x / 1000).toFixed(4)}" y="${(thermalPoints.hot1.y / 1000).toFixed(4)}" temp="293.15" rs="0.13" rel_img="SvgjsImage1091" rel_id="2" rel="min"></bcprop>
    <bcprop id="Interior" x="${(thermalPoints.hot2.x / 1000).toFixed(4)}" y="${(thermalPoints.hot2.y / 1000).toFixed(4)}" temp="293.15" rs="0.13" rel_img="SvgjsImage1092" rel_id="3" rel="max"></bcprop>
  </g>
  ${(!svgForFlixo && `<g id="collisions">` +
    collisionPoints.map(collisionPoint => {
      let dot = ''
      for (let i = 0; i <= collisionPoint.id; i++) {
        // dot += `<circle cx="${((collisionPoint.point.x + i + 3 + collisionPoint.id * 2) / 1000).toFixed(4)}" cy="${((collisionPoint.point.y - i - 3 - collisionPoint.id * 2) / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(${collisionPoint.id === 1 ? '0,0,0' : '200,200,255'}); stroke:black;stroke-width:0.00001" />`;
      }
      return `<circle cx="${(collisionPoint.point.x / 1000).toFixed(4)}" cy="${(collisionPoint.point.y / 1000).toFixed(4)}" r="${collisionPoint.processed ? '0.0005' : '0.0005'}" style="fill:rgb(${collisionPoint.processed ? '255,200,200' : '200,200,255'}); stroke:black;stroke-width:0.00001" />` + dot
    }).join('') +
    `</g>`) || ''}
  </svg>`

  console.log(svg)

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

  ConsoleUtils.previewInConsole('data:image/svg+xml;base64,' + window.btoa(svg))
  // CameraUtils.previewInConsole('data:image/svg+xml;base64,' + window.btoa(flixoExample.svg));

  return {
    svg,
    viewBox
  }
}

let sendToFlixo = svg => {
  let options = {}
  options.headers = options.headers || {}
  options.data = {
    id: 768599000,
    jsonrpc: '2.0',
    method: 'call',
    params: {
      frame: 'external',
      material_list: '[{"id":"0","material":"O-1036"},{"id":"1","material":"O-1036"},{"id":"2","material":"O-1053"},{"id":"3","material":"O-2000"},{"id":"4","material":"O-2000"},{"id":"5","material":"O-2000"},{"id":"6","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"7","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"8","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"9","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"10","material":"O-1053"},{"id":"11","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"12","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"13","material":"O-2000"},{"id":"14","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"15","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"16","material":"O-2000"},{"id":"17","material":"O-1036"},{"id":"18","material":"O-2000"},{"id":"19","material":"O-1036"},{"id":"20","material":"O-1053"},{"id":"21","material":"O-2000"},{"id":"22","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"23","material":"O-2000"},{"id":"24","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"25","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"26","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"27","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"28","material":"O-1036"},{"id":"29","material":"O-2000"},{"id":"30","material":"O-2000"},{"id":"31","material":"O-2000"},{"id":"32","material":"O-1053"},{"id":"33","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"34","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"35","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"36","material":"O-2000"},{"id":"37","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"38","material":"O-1036"},{"id":"39","material":"O-1036"},{"id":"40","material":"O-2000"},{"id":"41","material":"O-2000"},{"id":"42","material":"O-2000"},{"id":"43","material":"O-1036"},{"id":"44","material":"O-2000"},{"id":"45","material":"O-2000"},{"id":"46","material":"O-1036"},{"id":"47","material":"O-2000"},{"id":"48","material":"O-2000"},{"id":"49","material":"O-1036"},{"id":"50","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"51","material":"O-1053"},{"id":"52","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"53","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"54","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"55","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"56","material":"O-2000"},{"id":"57","material":"O-2000"},{"id":"58","material":"O-2000"},{"id":"59","material":"O-1053"},{"id":"60","material":"O-2000"},{"id":"61","material":"O-2000"},{"id":"62","material":"O-1036"},{"id":"63","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"64","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"65","material":"O-1036"},{"id":"66","material":"O-1036"},{"id":"67","material":"O-2054"},{"id":"68","material":"O-2000"},{"id":"69","material":"O-2000"},{"id":"70","material":"O-1036"},{"id":"71","material":"O-1036"},{"id":"72","material":"O-1036"},{"id":"73","material":"O-2000"},{"id":"74","material":"O-2000"},{"id":"75","material":"O-2000"},{"id":"76","material":"O-1036"},{"id":"77","material":"O-1036"}]',
      svg_w_h: [{'w': '7.000002', 'h': '1.960000'}, {'w': '4.600002', 'h': '2.870001'}, {
        'w': '1.010002',
        'h': '3.200000'
      }, {'w': '3.380001', 'h': '3.200000'}, {'w': '3.359997', 'h': '1.190001'}, {
        'w': '3.359997',
        'h': '2.090000'
      }, {'w': '0.009998', 'h': '0.030001'}, {'w': '0.009998', 'h': '0.030001'}, {
        'w': '0.070004',
        'h': '0.122499'
      }, {'w': '0.070004', 'h': '0.122499'}, {'w': '1.009998', 'h': '3.200000'}, {
        'w': '0.070000',
        'h': '0.122499'
      }, {'w': '0.070000', 'h': '0.122499'}, {'w': '3.020000', 'h': '4.610000'}, {
        'w': '0.009998',
        'h': '0.030001'
      }, {'w': '0.009998', 'h': '0.030001'}, {'w': '0.510000', 'h': '1.820001'}, {
        'w': '5.250000',
        'h': '3.630000'
      }, {'w': '0.309999', 'h': '0.240000'}, {'w': '3.709999', 'h': '0.650000'}, {
        'w': '1.010000',
        'h': '3.000000'
      }, {'w': '2.800001', 'h': '3.000000'}, {'w': '0.084999', 'h': '0.155001'}, {
        'w': '2.690001',
        'h': '2.830000'
      }, {'w': '0.010000', 'h': '0.040000'}, {'w': '0.005001', 'h': '0.025000'}, {
        'w': '0.070000',
        'h': '0.122499'
      }, {'w': '0.070000', 'h': '0.122500'}, {'w': '0.830000', 'h': '0.540001'}, {
        'w': '0.570000',
        'h': '0.300001'
      }, {'w': '0.570000', 'h': '0.070000'}, {'w': '0.219999', 'h': '0.150000'}, {
        'w': '1.010000',
        'h': '3.000000'
      }, {'w': '0.059999', 'h': '0.100000'}, {'w': '0.070000', 'h': '0.122499'}, {
        'w': '0.070000',
        'h': '0.122500'
      }, {'w': '2.100000', 'h': '6.799999'}, {'w': '0.085001', 'h': '0.155001'}, {
        'w': '10.500000',
        'h': '1.889999'
      }, {'w': '0.830000', 'h': '0.590000'}, {'w': '0.570000', 'h': '0.100000'}, {
        'w': '0.570000',
        'h': '0.150002'
      }, {'w': '0.219999', 'h': '0.150000'}, {'w': '0.830000', 'h': '0.520000'}, {
        'w': '0.600000',
        'h': '0.300000'
      }, {'w': '0.570000', 'h': '0.070000'}, {'w': '0.699999', 'h': '2.130001'}, {
        'w': '0.730000',
        'h': '0.799999'
      }, {'w': '0.220001', 'h': '0.150001'}, {'w': '6.730000', 'h': '3.660001'}, {
        'w': '0.059999',
        'h': '0.100000'
      }, {'w': '2.189999', 'h': '2.400000'}, {'w': '0.019999', 'h': '0.020000'}, {
        'w': '0.019999',
        'h': '0.030000'
      }, {'w': '0.059999', 'h': '0.104912'}, {'w': '0.059999', 'h': '0.104912'}, {
        'w': '5.549999',
        'h': '1.109999'
      }, {'w': '6.000000', 'h': '3.170000'}, {'w': '5.480000', 'h': '2.420000'}, {
        'w': '2.180000',
        'h': '2.400000'
      }, {'w': '2.540001', 'h': '5.170000'}, {'w': '2.559999', 'h': '2.129999'}, {
        'w': '2.610001',
        'h': '3.500000'
      }, {'w': '0.059999', 'h': '0.104912'}, {'w': '0.059999', 'h': '0.104912'}, {
        'w': '0.110001',
        'h': '0.230000'
      }, {'w': '2.520000', 'h': '0.740000'}, {'w': '21.799999', 'h': '2.400000'}, {
        'w': '1.330000',
        'h': '0.299999'
      }, {'w': '0.450001', 'h': '0.250000'}, {'w': '0.950001', 'h': '0.650002'}, {
        'w': '0.190001',
        'h': '0.180000'
      }, {'w': '0.420000', 'h': '0.080000'}, {'w': '0.179998', 'h': '0.230000'}, {
        'w': '0.520000',
        'h': '0.309999'
      }, {'w': '0.320000', 'h': '0.110001'}, {'w': '0.180000', 'h': '0.180000'}, {'w': '0.269999', 'h': '0.060001'}],
      token: '710,e2dc4fb09a0d4d8232fddb099dc4f9f9e9f35ea71ff2ca61f003b9ce7273bd47,1',
      svg
    }
  }

  return new Promise((resolve, reject) => {
    axios.post(`http://localhost:5000/api/flixo`, options.data, {headers: options.headers})
      .then(response => {
        resolve(response.data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

let fixSceneAfterImport = scene => {
  scene.children.forEach(object => {
    object.traverse(function (child) {
      if (child.geometry instanceof THREE.CircleGeometry) {
        // remove zero vertex from arc with coordinates (0,0,0) (points to center)
        let zeroVertex = child.geometry.vertices[0]
        if (!zeroVertex.x && !zeroVertex.y && !zeroVertex.z) {
          child.geometry.vertices.shift()
        }
      }
    })
  })
  return scene
}

let someSvg = ``

let removeLineByName = (name, scene) => {
  const existLine = scene.getObjectByName(name)
  if (existLine) {
    existLine.parent.remove(existLine)
    return true
  }
}

export default {
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
  removeLineByName
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
