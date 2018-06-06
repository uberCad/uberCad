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
  let stepsCount = 25
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
  let step = (new THREE.Vector3(0, 0, 0)).subVectors(pointOfInterests, camera.position).divideScalar(stepsCount)

  let radius = object.geometry.boundingSphere.radius
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
    console.error('errore', e)

    switch (e.userData.error) {
      case 'edge model':
        if (e.userData.data && e.userData.data.error) {
          switch (e.userData.data.error) {
            case 'interruption':
              // show problem line
              console.error('show problem line', e)

              this.highlightEntities(entities, true)
              // cadCanvas.highlightEntities($scope.editor.activeEntities, true);

              e.userData.data.entity.userData.showInTop = true
              this.highlightEntities([e.data.entity])
              setPointOfInterest(editor, e.data.entity)

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

let combineEdgeModels = editor => {
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

    ConsoleUtils.previewPathInConsole(cavityToCheck.path, null, result)
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

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${(viewBox.width * mul).toFixed(4)}cm" height="${(viewBox.height * mul).toFixed(4)}cm" viewBox="${viewBox.x.toFixed(4)} ${viewBox.y.toFixed(4)} ${viewBox.width.toFixed(4)} ${viewBox.height.toFixed(4)}">
<desc>
      <schema desc="BuildingSVG" version="1.1"></schema>
      <constr id="Dummy" scale="1"></constr>
    </desc>
    <g id="group_d">${
    objects.map(object => {
      // console.log('SVG BUILDER', object);
      return `<path d="${object.userData.edgeModel.svgData.pathD} " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="${(object.userData.edgeModel.svgData.insidePoint.x / 1000).toFixed(4)}" cy="${(object.userData.edgeModel.svgData.insidePoint.y / 1000).toFixed(4)}" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />` +
        object.userData.edgeModel.svgData.subRegionsPathD.map(pathD => {
          return `<path d="${pathD} " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path>`
        }).join('')
    }).join('')
    }
  <g id="temperature">
<bcprop id="External" x="-0.3606" y="-0.1793" temp="273.15" rs="0.04" rel_img="SvgjsImage1089" rel_id="0" rel="min"></bcprop>
<bcprop id="External" x="-0.1796" y="-0.1793" temp="273.15" rs="0.04" rel_img="SvgjsImage1090" rel_id="1" rel="max"></bcprop>
<bcprop id="Interior" x="-0.2036" y="-0.1073" temp="293.15" rs="0.13" rel_img="SvgjsImage1091" rel_id="2" rel="min"></bcprop>
<bcprop id="Interior" x="-0.3606" y="-0.1073" temp="293.15" rs="0.13" rel_img="SvgjsImage1092" rel_id="3" rel="max"></bcprop>
  </g>
  <g id="collisions">
    ${
    collisionPoints.map(collisionPoint => {
      let dot = ''
      for (let i = 0; i <= collisionPoint.id; i++) {
        // dot += `<circle cx="${((collisionPoint.point.x + i + 3 + collisionPoint.id * 2) / 1000).toFixed(4)}" cy="${((collisionPoint.point.y - i - 3 - collisionPoint.id * 2) / 1000).toFixed(4)}" r="0.0002" style="fill:rgb(${collisionPoint.id === 1 ? '0,0,0' : '200,200,255'}); stroke:black;stroke-width:0.00001" />`;
      }
      return `<circle cx="${(collisionPoint.point.x / 1000).toFixed(4)}" cy="${(collisionPoint.point.y / 1000).toFixed(4)}" r="${collisionPoint.processed ? '0.0005' : '0.0005'}" style="fill:rgb(${collisionPoint.processed ? '255,200,200' : '200,200,255'}); stroke:black;stroke-width:0.00001" />` + dot
    }).join('')
    }
  </g>
  <g id="cavities">
    ${
    cavities.map(pathData => {
      let path = pathData.path
      // console.warn('PATH render', path, cavities.length);
      // let circles = ''

      let vertexList = []

      let last = path[path.length - 1]
      let lastVertex = `${(last.x / 1000).toFixed(4)},${(last.y / 1000).toFixed(4)}`
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
      return `<path d="${pathD} " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" />`
    }).join('')
    }
  </g>
  </g>
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
    jsonrpc: "2.0",
    method: "call",
    params: {
      frame: "external",
      material_list: '[{"id":"0","material":"O-1036"},{"id":"1","material":"O-1036"},{"id":"2","material":"O-1053"},{"id":"3","material":"O-2000"},{"id":"4","material":"O-2000"},{"id":"5","material":"O-2000"},{"id":"6","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"7","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"8","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"9","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"10","material":"O-1053"},{"id":"11","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"12","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"13","material":"O-2000"},{"id":"14","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"15","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"16","material":"O-2000"},{"id":"17","material":"O-1036"},{"id":"18","material":"O-2000"},{"id":"19","material":"O-1036"},{"id":"20","material":"O-1053"},{"id":"21","material":"O-2000"},{"id":"22","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"23","material":"O-2000"},{"id":"24","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"25","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"26","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"27","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"28","material":"O-1036"},{"id":"29","material":"O-2000"},{"id":"30","material":"O-2000"},{"id":"31","material":"O-2000"},{"id":"32","material":"O-1053"},{"id":"33","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"34","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"35","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"36","material":"O-2000"},{"id":"37","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"38","material":"O-1036"},{"id":"39","material":"O-1036"},{"id":"40","material":"O-2000"},{"id":"41","material":"O-2000"},{"id":"42","material":"O-2000"},{"id":"43","material":"O-1036"},{"id":"44","material":"O-2000"},{"id":"45","material":"O-2000"},{"id":"46","material":"O-1036"},{"id":"47","material":"O-2000"},{"id":"48","material":"O-2000"},{"id":"49","material":"O-1036"},{"id":"50","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"51","material":"O-1053"},{"id":"52","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"53","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"54","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"55","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"56","material":"O-2000"},{"id":"57","material":"O-2000"},{"id":"58","material":"O-2000"},{"id":"59","material":"O-1053"},{"id":"60","material":"O-2000"},{"id":"61","material":"O-2000"},{"id":"62","material":"O-1036"},{"id":"63","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"64","material":"{00000000-0000-0000-0000-000000000000}"},{"id":"65","material":"O-1036"},{"id":"66","material":"O-1036"},{"id":"67","material":"O-2054"},{"id":"68","material":"O-2000"},{"id":"69","material":"O-2000"},{"id":"70","material":"O-1036"},{"id":"71","material":"O-1036"},{"id":"72","material":"O-1036"},{"id":"73","material":"O-2000"},{"id":"74","material":"O-2000"},{"id":"75","material":"O-2000"},{"id":"76","material":"O-1036"},{"id":"77","material":"O-1036"}]',
      svg_w_h: [{"w":"7.000002","h":"1.960000"},{"w":"4.600002","h":"2.870001"},{"w":"1.010002","h":"3.200000"},{"w":"3.380001","h":"3.200000"},{"w":"3.359997","h":"1.190001"},{"w":"3.359997","h":"2.090000"},{"w":"0.009998","h":"0.030001"},{"w":"0.009998","h":"0.030001"},{"w":"0.070004","h":"0.122499"},{"w":"0.070004","h":"0.122499"},{"w":"1.009998","h":"3.200000"},{"w":"0.070000","h":"0.122499"},{"w":"0.070000","h":"0.122499"},{"w":"3.020000","h":"4.610000"},{"w":"0.009998","h":"0.030001"},{"w":"0.009998","h":"0.030001"},{"w":"0.510000","h":"1.820001"},{"w":"5.250000","h":"3.630000"},{"w":"0.309999","h":"0.240000"},{"w":"3.709999","h":"0.650000"},{"w":"1.010000","h":"3.000000"},{"w":"2.800001","h":"3.000000"},{"w":"0.084999","h":"0.155001"},{"w":"2.690001","h":"2.830000"},{"w":"0.010000","h":"0.040000"},{"w":"0.005001","h":"0.025000"},{"w":"0.070000","h":"0.122499"},{"w":"0.070000","h":"0.122500"},{"w":"0.830000","h":"0.540001"},{"w":"0.570000","h":"0.300001"},{"w":"0.570000","h":"0.070000"},{"w":"0.219999","h":"0.150000"},{"w":"1.010000","h":"3.000000"},{"w":"0.059999","h":"0.100000"},{"w":"0.070000","h":"0.122499"},{"w":"0.070000","h":"0.122500"},{"w":"2.100000","h":"6.799999"},{"w":"0.085001","h":"0.155001"},{"w":"10.500000","h":"1.889999"},{"w":"0.830000","h":"0.590000"},{"w":"0.570000","h":"0.100000"},{"w":"0.570000","h":"0.150002"},{"w":"0.219999","h":"0.150000"},{"w":"0.830000","h":"0.520000"},{"w":"0.600000","h":"0.300000"},{"w":"0.570000","h":"0.070000"},{"w":"0.699999","h":"2.130001"},{"w":"0.730000","h":"0.799999"},{"w":"0.220001","h":"0.150001"},{"w":"6.730000","h":"3.660001"},{"w":"0.059999","h":"0.100000"},{"w":"2.189999","h":"2.400000"},{"w":"0.019999","h":"0.020000"},{"w":"0.019999","h":"0.030000"},{"w":"0.059999","h":"0.104912"},{"w":"0.059999","h":"0.104912"},{"w":"5.549999","h":"1.109999"},{"w":"6.000000","h":"3.170000"},{"w":"5.480000","h":"2.420000"},{"w":"2.180000","h":"2.400000"},{"w":"2.540001","h":"5.170000"},{"w":"2.559999","h":"2.129999"},{"w":"2.610001","h":"3.500000"},{"w":"0.059999","h":"0.104912"},{"w":"0.059999","h":"0.104912"},{"w":"0.110001","h":"0.230000"},{"w":"2.520000","h":"0.740000"},{"w":"21.799999","h":"2.400000"},{"w":"1.330000","h":"0.299999"},{"w":"0.450001","h":"0.250000"},{"w":"0.950001","h":"0.650002"},{"w":"0.190001","h":"0.180000"},{"w":"0.420000","h":"0.080000"},{"w":"0.179998","h":"0.230000"},{"w":"0.520000","h":"0.309999"},{"w":"0.320000","h":"0.110001"},{"w":"0.180000","h":"0.180000"},{"w":"0.269999","h":"0.060001"}],
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

let someSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="25.0000cm" height="4.7310cm" viewBox="-0.3606 -0.1793 0.3810 0.0721">
<desc>
      <schema desc="BuildingSVG" version="1.1"></schema>
      <constr id="Dummy" scale="1"></constr>
    </desc>
    <g id="group_d"><path d="M-0.3606,-0.1103 L-0.3601,-0.1108 -0.3592,-0.1108 -0.3592,-0.1089 -0.3561,-0.1091 -0.3561,-0.1150 -0.3558,-0.1153 -0.3561,-0.1156 -0.3561,-0.1298 -0.3592,-0.1298 -0.3592,-0.1258 -0.3601,-0.1258 -0.3606,-0.1263 -0.3606,-0.1326 -0.3601,-0.1331 -0.3592,-0.1331 -0.3592,-0.1316 -0.3561,-0.1316 -0.3560,-0.1316 -0.3559,-0.1316 -0.3559,-0.1317 -0.3559,-0.1318 -0.3559,-0.1357 -0.3558,-0.1358 -0.3558,-0.1359 -0.3558,-0.1360 -0.3557,-0.1360 -0.3556,-0.1360 -0.3556,-0.1361 -0.3555,-0.1361 -0.3555,-0.1360 -0.3554,-0.1360 -0.3537,-0.1348 -0.3534,-0.1343 -0.3534,-0.1342 -0.3534,-0.1341 -0.3535,-0.1341 -0.3535,-0.1340 -0.3543,-0.1326 -0.3543,-0.1323 -0.3543,-0.1322 -0.3543,-0.1321 -0.3542,-0.1321 -0.3542,-0.1320 -0.3542,-0.1319 -0.3541,-0.1319 -0.3540,-0.1319 -0.3539,-0.1319 -0.3532,-0.1319 -0.3512,-0.1319 -0.3505,-0.1319 -0.3504,-0.1319 -0.3503,-0.1319 -0.3502,-0.1319 -0.3502,-0.1320 -0.3502,-0.1321 -0.3501,-0.1321 -0.3501,-0.1322 -0.3501,-0.1323 -0.3501,-0.1326 -0.3508,-0.1338 -0.3508,-0.1339 -0.3508,-0.1340 -0.3507,-0.1340 -0.3506,-0.1340 -0.3506,-0.1341 -0.3500,-0.1341 -0.3499,-0.1341 -0.3498,-0.1341 -0.3498,-0.1340 -0.3497,-0.1340 -0.3496,-0.1340 -0.3474,-0.1323 -0.3473,-0.1322 -0.3472,-0.1322 -0.3472,-0.1321 -0.3471,-0.1321 -0.3470,-0.1321 -0.3470,-0.1320 -0.3469,-0.1320 -0.3468,-0.1320 -0.3468,-0.1319 -0.3467,-0.1319 -0.3466,-0.1319 -0.3465,-0.1319 -0.3464,-0.1319 -0.3463,-0.1319 -0.3462,-0.1319 -0.3289,-0.1319 -0.3288,-0.1319 -0.3287,-0.1319 -0.3286,-0.1319 -0.3285,-0.1319 -0.3284,-0.1319 -0.3283,-0.1319 -0.3283,-0.1320 -0.3282,-0.1320 -0.3281,-0.1320 -0.3281,-0.1321 -0.3280,-0.1321 -0.3279,-0.1321 -0.3279,-0.1322 -0.3278,-0.1322 -0.3277,-0.1323 -0.3255,-0.1340 -0.3254,-0.1340 -0.3253,-0.1340 -0.3253,-0.1341 -0.3252,-0.1341 -0.3251,-0.1341 -0.3245,-0.1341 -0.3245,-0.1340 -0.3244,-0.1340 -0.3243,-0.1340 -0.3243,-0.1339 -0.3243,-0.1338 -0.3250,-0.1326 -0.3250,-0.1323 -0.3250,-0.1322 -0.3250,-0.1321 -0.3249,-0.1321 -0.3249,-0.1320 -0.3249,-0.1319 -0.3248,-0.1319 -0.3247,-0.1319 -0.3246,-0.1319 -0.3239,-0.1319 -0.3219,-0.1319 -0.3212,-0.1319 -0.3211,-0.1319 -0.3210,-0.1319 -0.3209,-0.1319 -0.3209,-0.1320 -0.3209,-0.1321 -0.3208,-0.1321 -0.3208,-0.1322 -0.3208,-0.1323 -0.3208,-0.1326 -0.3216,-0.1340 -0.3216,-0.1341 -0.3217,-0.1341 -0.3217,-0.1342 -0.3217,-0.1343 -0.3214,-0.1348 -0.3197,-0.1360 -0.3196,-0.1360 -0.3196,-0.1361 -0.3195,-0.1361 -0.3195,-0.1360 -0.3194,-0.1360 -0.3193,-0.1360 -0.3193,-0.1359 -0.3193,-0.1358 -0.3193,-0.1357 -0.3193,-0.1318 -0.3193,-0.1317 -0.3192,-0.1317 -0.3192,-0.1316 -0.3191,-0.1316 -0.3160,-0.1316 -0.3160,-0.1331 -0.3151,-0.1331 -0.3146,-0.1326 -0.3146,-0.1263 -0.3151,-0.1258 -0.3160,-0.1258 -0.3160,-0.1298 -0.3191,-0.1298 -0.3191,-0.1156 -0.3194,-0.1153 -0.3191,-0.1150 -0.3191,-0.1091 -0.3160,-0.1089 -0.3160,-0.1108 -0.3151,-0.1108 -0.3146,-0.1103 -0.3146,-0.1073 -0.3606,-0.1073 -0.3606,-0.1103 M-0.3208,-0.1093 L-0.3208,-0.1138 -0.3211,-0.1138 -0.3211,-0.1168 -0.3208,-0.1168 -0.3208,-0.1276 -0.3211,-0.1276 -0.3211,-0.1288 -0.3208,-0.1288 -0.3208,-0.1302 -0.3224,-0.1302 -0.3224,-0.1301 -0.3236,-0.1301 -0.3236,-0.1302 -0.3516,-0.1302 -0.3516,-0.1301 -0.3528,-0.1301 -0.3528,-0.1302 -0.3544,-0.1302 -0.3544,-0.1288 -0.3541,-0.1288 -0.3541,-0.1276 -0.3544,-0.1276 -0.3544,-0.1168 -0.3541,-0.1168 -0.3541,-0.1138 -0.3544,-0.1138 -0.3544,-0.1093 -0.3208,-0.1093  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.3425" cy="-0.1214" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.3208,-0.1093 L-0.3208,-0.1138 -0.3211,-0.1138 -0.3211,-0.1168 -0.3208,-0.1168 -0.3208,-0.1276 -0.3211,-0.1276 -0.3211,-0.1288 -0.3208,-0.1288 -0.3208,-0.1302 -0.3224,-0.1302 -0.3224,-0.1301 -0.3236,-0.1301 -0.3236,-0.1302 -0.3516,-0.1302 -0.3516,-0.1301 -0.3528,-0.1301 -0.3528,-0.1302 -0.3544,-0.1302 -0.3544,-0.1288 -0.3541,-0.1288 -0.3541,-0.1276 -0.3544,-0.1276 -0.3544,-0.1168 -0.3541,-0.1168 -0.3541,-0.1138 -0.3544,-0.1138 -0.3544,-0.1093 -0.3208,-0.1093  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2666,-0.1118 L-0.2666,-0.1073 -0.3086,-0.1073 -0.3086,-0.1150 -0.3146,-0.1150 -0.3146,-0.1108 -0.3186,-0.1108 -0.3191,-0.1113 -0.3191,-0.1120 -0.3161,-0.1120 -0.3161,-0.1168 -0.3143,-0.1168 -0.3143,-0.1243 -0.3165,-0.1243 -0.3165,-0.1250 -0.3160,-0.1255 -0.3143,-0.1255 -0.3143,-0.1302 -0.3146,-0.1302 -0.3146,-0.1314 -0.3143,-0.1314 -0.3143,-0.1396 -0.3142,-0.1396 -0.3141,-0.1396 -0.3141,-0.1397 -0.3141,-0.1398 -0.3141,-0.1434 -0.3140,-0.1434 -0.3140,-0.1435 -0.3140,-0.1436 -0.3139,-0.1436 -0.3139,-0.1437 -0.3138,-0.1437 -0.3137,-0.1437 -0.3136,-0.1437 -0.3136,-0.1436 -0.3116,-0.1422 -0.3116,-0.1421 -0.3116,-0.1420 -0.3116,-0.1419 -0.3116,-0.1418 -0.3116,-0.1417 -0.3116,-0.1416 -0.3116,-0.1415 -0.3117,-0.1415 -0.3117,-0.1414 -0.3125,-0.1400 -0.3125,-0.1397 -0.3125,-0.1396 -0.3125,-0.1395 -0.3124,-0.1395 -0.3124,-0.1394 -0.3124,-0.1393 -0.3123,-0.1393 -0.3122,-0.1393 -0.3121,-0.1393 -0.3087,-0.1393 -0.3086,-0.1393 -0.3085,-0.1393 -0.3084,-0.1393 -0.3084,-0.1394 -0.3084,-0.1395 -0.3083,-0.1395 -0.3083,-0.1396 -0.3083,-0.1397 -0.3083,-0.1400 -0.3090,-0.1412 -0.3090,-0.1413 -0.3090,-0.1414 -0.3089,-0.1414 -0.3088,-0.1414 -0.3088,-0.1415 -0.3080,-0.1415 -0.3053,-0.1395 -0.3053,-0.1394 -0.3052,-0.1394 -0.3051,-0.1394 -0.3051,-0.1393 -0.3050,-0.1393 -0.3049,-0.1393 -0.3048,-0.1393 -0.3047,-0.1393 -0.2929,-0.1393 -0.2928,-0.1393 -0.2927,-0.1393 -0.2926,-0.1393 -0.2925,-0.1393 -0.2924,-0.1393 -0.2923,-0.1393 -0.2923,-0.1394 -0.2922,-0.1394 -0.2921,-0.1394 -0.2921,-0.1395 -0.2920,-0.1395 -0.2919,-0.1395 -0.2919,-0.1396 -0.2918,-0.1396 -0.2917,-0.1397 -0.2894,-0.1415 -0.2885,-0.1415 -0.2885,-0.1414 -0.2884,-0.1414 -0.2883,-0.1414 -0.2883,-0.1413 -0.2883,-0.1412 -0.2890,-0.1400 -0.2890,-0.1397 -0.2890,-0.1396 -0.2890,-0.1395 -0.2889,-0.1395 -0.2889,-0.1394 -0.2889,-0.1393 -0.2888,-0.1393 -0.2887,-0.1393 -0.2886,-0.1393 -0.2852,-0.1393 -0.2851,-0.1393 -0.2850,-0.1393 -0.2849,-0.1393 -0.2849,-0.1394 -0.2849,-0.1395 -0.2848,-0.1395 -0.2848,-0.1396 -0.2848,-0.1397 -0.2848,-0.1400 -0.2856,-0.1414 -0.2856,-0.1415 -0.2857,-0.1415 -0.2857,-0.1416 -0.2857,-0.1417 -0.2857,-0.1418 -0.2857,-0.1419 -0.2857,-0.1420 -0.2857,-0.1421 -0.2857,-0.1422 -0.2837,-0.1436 -0.2837,-0.1437 -0.2836,-0.1437 -0.2835,-0.1437 -0.2834,-0.1437 -0.2834,-0.1436 -0.2833,-0.1436 -0.2833,-0.1435 -0.2833,-0.1434 -0.2833,-0.1398 -0.2832,-0.1398 -0.2832,-0.1397 -0.2832,-0.1396 -0.2831,-0.1396 -0.2831,-0.1296 -0.2834,-0.1293 -0.2831,-0.1290 -0.2831,-0.1280 -0.2834,-0.1277 -0.2831,-0.1274 -0.2831,-0.1208 -0.2834,-0.1205 -0.2831,-0.1202 -0.2831,-0.1093 -0.2754,-0.1093 -0.2754,-0.1118 -0.2730,-0.1118 -0.2725,-0.1113 -0.2725,-0.1108 -0.2740,-0.1108 -0.2740,-0.1088 -0.2680,-0.1088 -0.2680,-0.1108 -0.2690,-0.1108 -0.2690,-0.1113 -0.2685,-0.1118 -0.2666,-0.1118 M-0.2856,-0.1093 L-0.2856,-0.1376 -0.3056,-0.1376 -0.3056,-0.1361 -0.3071,-0.1361 -0.3071,-0.1376 -0.3125,-0.1376 -0.3125,-0.1168 -0.3068,-0.1168 -0.3068,-0.1108 -0.3056,-0.1108 -0.3056,-0.1093 -0.2856,-0.1093  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2903" cy="-0.1235" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2856,-0.1093 L-0.2856,-0.1376 -0.3056,-0.1376 -0.3056,-0.1361 -0.3071,-0.1361 -0.3071,-0.1376 -0.3125,-0.1376 -0.3125,-0.1168 -0.3068,-0.1168 -0.3068,-0.1108 -0.3056,-0.1108 -0.3056,-0.1093 -0.2856,-0.1093  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.3289,-0.1639 L-0.3462,-0.1639 -0.3463,-0.1639 -0.3464,-0.1638 -0.3465,-0.1638 -0.3466,-0.1638 -0.3467,-0.1638 -0.3468,-0.1638 -0.3468,-0.1637 -0.3469,-0.1637 -0.3470,-0.1637 -0.3471,-0.1636 -0.3472,-0.1636 -0.3472,-0.1635 -0.3473,-0.1635 -0.3474,-0.1635 -0.3496,-0.1618 -0.3496,-0.1617 -0.3497,-0.1617 -0.3498,-0.1617 -0.3499,-0.1617 -0.3500,-0.1617 -0.3506,-0.1617 -0.3507,-0.1617 -0.3508,-0.1617 -0.3508,-0.1618 -0.3508,-0.1619 -0.3508,-0.1620 -0.3501,-0.1631 -0.3501,-0.1635 -0.3501,-0.1636 -0.3502,-0.1637 -0.3502,-0.1638 -0.3503,-0.1638 -0.3504,-0.1638 -0.3504,-0.1639 -0.3505,-0.1639 -0.3539,-0.1639 -0.3540,-0.1639 -0.3540,-0.1638 -0.3541,-0.1638 -0.3542,-0.1638 -0.3542,-0.1637 -0.3543,-0.1636 -0.3543,-0.1635 -0.3543,-0.1631 -0.3535,-0.1617 -0.3535,-0.1616 -0.3534,-0.1616 -0.3534,-0.1615 -0.3534,-0.1614 -0.3537,-0.1609 -0.3554,-0.1597 -0.3555,-0.1597 -0.3556,-0.1597 -0.3557,-0.1597 -0.3558,-0.1597 -0.3558,-0.1598 -0.3558,-0.1599 -0.3559,-0.1600 -0.3559,-0.1640 -0.3559,-0.1641 -0.3560,-0.1641 -0.3560,-0.1642 -0.3561,-0.1642 -0.3592,-0.1642 -0.3592,-0.1627 -0.3601,-0.1627 -0.3606,-0.1632 -0.3606,-0.1673 -0.3601,-0.1678 -0.3592,-0.1678 -0.3592,-0.1659 -0.3561,-0.1659 -0.3561,-0.1710 -0.3558,-0.1713 -0.3561,-0.1716 -0.3561,-0.1773 -0.3592,-0.1773 -0.3592,-0.1758 -0.3604,-0.1758 -0.3605,-0.1758 -0.3605,-0.1759 -0.3606,-0.1759 -0.3606,-0.1760 -0.3606,-0.1793 -0.2906,-0.1793 -0.2906,-0.1748 -0.2925,-0.1748 -0.2930,-0.1753 -0.2930,-0.1758 -0.2920,-0.1758 -0.2920,-0.1778 -0.2977,-0.1778 -0.2977,-0.1758 -0.2965,-0.1758 -0.2965,-0.1753 -0.2970,-0.1748 -0.3003,-0.1748 -0.3003,-0.1758 -0.2991,-0.1758 -0.2991,-0.1773 -0.3003,-0.1773 -0.3003,-0.1775 -0.3114,-0.1775 -0.3114,-0.1773 -0.3146,-0.1773 -0.3146,-0.1760 -0.3146,-0.1759 -0.3146,-0.1758 -0.3147,-0.1758 -0.3148,-0.1758 -0.3160,-0.1758 -0.3160,-0.1773 -0.3191,-0.1773 -0.3191,-0.1716 -0.3194,-0.1713 -0.3191,-0.1710 -0.3191,-0.1659 -0.3160,-0.1659 -0.3160,-0.1678 -0.3151,-0.1678 -0.3146,-0.1673 -0.3146,-0.1632 -0.3151,-0.1627 -0.3160,-0.1627 -0.3160,-0.1642 -0.3191,-0.1642 -0.3191,-0.1641 -0.3192,-0.1641 -0.3192,-0.1640 -0.3193,-0.1640 -0.3193,-0.1600 -0.3193,-0.1599 -0.3193,-0.1598 -0.3193,-0.1597 -0.3194,-0.1597 -0.3195,-0.1597 -0.3196,-0.1597 -0.3197,-0.1597 -0.3214,-0.1609 -0.3217,-0.1614 -0.3217,-0.1615 -0.3217,-0.1616 -0.3216,-0.1616 -0.3216,-0.1617 -0.3208,-0.1631 -0.3208,-0.1635 -0.3208,-0.1636 -0.3209,-0.1637 -0.3209,-0.1638 -0.3210,-0.1638 -0.3211,-0.1638 -0.3211,-0.1639 -0.3212,-0.1639 -0.3246,-0.1639 -0.3247,-0.1639 -0.3247,-0.1638 -0.3248,-0.1638 -0.3249,-0.1638 -0.3249,-0.1637 -0.3250,-0.1636 -0.3250,-0.1635 -0.3250,-0.1631 -0.3243,-0.1620 -0.3243,-0.1619 -0.3243,-0.1618 -0.3243,-0.1617 -0.3244,-0.1617 -0.3245,-0.1617 -0.3251,-0.1617 -0.3252,-0.1617 -0.3253,-0.1617 -0.3254,-0.1617 -0.3255,-0.1617 -0.3255,-0.1618 -0.3277,-0.1635 -0.3278,-0.1635 -0.3279,-0.1635 -0.3279,-0.1636 -0.3280,-0.1636 -0.3281,-0.1637 -0.3282,-0.1637 -0.3283,-0.1637 -0.3283,-0.1638 -0.3284,-0.1638 -0.3285,-0.1638 -0.3286,-0.1638 -0.3287,-0.1638 -0.3288,-0.1639 -0.3289,-0.1639 M-0.3236,-0.1656 L-0.3236,-0.1657 -0.3224,-0.1657 -0.3224,-0.1656 -0.3208,-0.1656 -0.3208,-0.1670 -0.3211,-0.1670 -0.3211,-0.1682 -0.3208,-0.1682 -0.3208,-0.1748 -0.3211,-0.1748 -0.3211,-0.1760 -0.3208,-0.1760 -0.3208,-0.1775 -0.3224,-0.1775 -0.3224,-0.1773 -0.3236,-0.1773 -0.3236,-0.1775 -0.3516,-0.1775 -0.3516,-0.1773 -0.3528,-0.1773 -0.3528,-0.1775 -0.3544,-0.1775 -0.3544,-0.1760 -0.3541,-0.1760 -0.3541,-0.1748 -0.3544,-0.1748 -0.3544,-0.1682 -0.3541,-0.1682 -0.3541,-0.1670 -0.3544,-0.1670 -0.3544,-0.1656 -0.3528,-0.1656 -0.3528,-0.1657 -0.3516,-0.1657 -0.3516,-0.1656 -0.3236,-0.1656  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.3218" cy="-0.1698" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.3236,-0.1656 L-0.3236,-0.1657 -0.3224,-0.1657 -0.3224,-0.1656 -0.3208,-0.1656 -0.3208,-0.1670 -0.3211,-0.1670 -0.3211,-0.1682 -0.3208,-0.1682 -0.3208,-0.1748 -0.3211,-0.1748 -0.3211,-0.1760 -0.3208,-0.1760 -0.3208,-0.1775 -0.3224,-0.1775 -0.3224,-0.1773 -0.3236,-0.1773 -0.3236,-0.1775 -0.3516,-0.1775 -0.3516,-0.1773 -0.3528,-0.1773 -0.3528,-0.1775 -0.3544,-0.1775 -0.3544,-0.1760 -0.3541,-0.1760 -0.3541,-0.1748 -0.3544,-0.1748 -0.3544,-0.1682 -0.3541,-0.1682 -0.3541,-0.1670 -0.3544,-0.1670 -0.3544,-0.1656 -0.3528,-0.1656 -0.3528,-0.1657 -0.3516,-0.1657 -0.3516,-0.1656 -0.3236,-0.1656  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1796,-0.1793 L-0.1796,-0.1748 -0.1815,-0.1748 -0.1820,-0.1753 -0.1820,-0.1758 -0.1810,-0.1758 -0.1810,-0.1778 -0.1867,-0.1778 -0.1867,-0.1758 -0.1855,-0.1758 -0.1855,-0.1753 -0.1860,-0.1748 -0.1893,-0.1748 -0.1893,-0.1758 -0.1881,-0.1758 -0.1881,-0.1773 -0.1893,-0.1773 -0.1893,-0.1775 -0.2004,-0.1775 -0.2004,-0.1773 -0.2036,-0.1773 -0.2036,-0.1760 -0.2036,-0.1759 -0.2036,-0.1758 -0.2037,-0.1758 -0.2038,-0.1758 -0.2050,-0.1758 -0.2050,-0.1773 -0.2081,-0.1773 -0.2081,-0.1716 -0.2084,-0.1713 -0.2081,-0.1710 -0.2081,-0.1659 -0.2050,-0.1659 -0.2050,-0.1678 -0.2041,-0.1678 -0.2036,-0.1673 -0.2036,-0.1642 -0.2036,-0.1641 -0.2037,-0.1641 -0.2037,-0.1640 -0.2038,-0.1640 -0.2038,-0.1606 -0.2038,-0.1605 -0.2038,-0.1604 -0.2039,-0.1604 -0.2040,-0.1604 -0.2041,-0.1604 -0.2042,-0.1604 -0.2043,-0.1604 -0.2043,-0.1605 -0.2044,-0.1605 -0.2045,-0.1605 -0.2046,-0.1605 -0.2046,-0.1606 -0.2047,-0.1606 -0.2048,-0.1606 -0.2048,-0.1607 -0.2049,-0.1607 -0.2049,-0.1608 -0.2050,-0.1608 -0.2053,-0.1611 -0.2054,-0.1611 -0.2054,-0.1612 -0.2055,-0.1612 -0.2055,-0.1613 -0.2056,-0.1613 -0.2056,-0.1614 -0.2057,-0.1615 -0.2057,-0.1616 -0.2058,-0.1616 -0.2058,-0.1617 -0.2058,-0.1618 -0.2058,-0.1619 -0.2058,-0.1620 -0.2059,-0.1620 -0.2059,-0.1621 -0.2059,-0.1622 -0.2059,-0.1623 -0.2059,-0.1624 -0.2053,-0.1634 -0.2053,-0.1638 -0.2053,-0.1639 -0.2054,-0.1640 -0.2054,-0.1641 -0.2055,-0.1641 -0.2056,-0.1641 -0.2056,-0.1642 -0.2057,-0.1642 -0.2091,-0.1642 -0.2092,-0.1642 -0.2092,-0.1641 -0.2093,-0.1641 -0.2094,-0.1641 -0.2094,-0.1640 -0.2095,-0.1639 -0.2095,-0.1638 -0.2095,-0.1634 -0.2089,-0.1623 -0.2089,-0.1622 -0.2089,-0.1621 -0.2089,-0.1620 -0.2090,-0.1620 -0.2091,-0.1620 -0.2096,-0.1620 -0.2097,-0.1620 -0.2098,-0.1620 -0.2099,-0.1620 -0.2100,-0.1620 -0.2100,-0.1621 -0.2134,-0.1647 -0.2135,-0.1647 -0.2136,-0.1647 -0.2136,-0.1648 -0.2137,-0.1648 -0.2138,-0.1649 -0.2139,-0.1649 -0.2140,-0.1649 -0.2140,-0.1650 -0.2141,-0.1650 -0.2142,-0.1650 -0.2143,-0.1650 -0.2144,-0.1650 -0.2145,-0.1651 -0.2146,-0.1651 -0.2570,-0.1651 -0.2571,-0.1651 -0.2572,-0.1650 -0.2573,-0.1650 -0.2574,-0.1650 -0.2575,-0.1650 -0.2576,-0.1650 -0.2576,-0.1649 -0.2577,-0.1649 -0.2578,-0.1649 -0.2579,-0.1648 -0.2580,-0.1648 -0.2580,-0.1647 -0.2581,-0.1647 -0.2582,-0.1647 -0.2616,-0.1621 -0.2616,-0.1620 -0.2617,-0.1620 -0.2618,-0.1620 -0.2619,-0.1620 -0.2620,-0.1620 -0.2625,-0.1620 -0.2626,-0.1620 -0.2627,-0.1620 -0.2627,-0.1621 -0.2627,-0.1622 -0.2628,-0.1622 -0.2627,-0.1623 -0.2621,-0.1634 -0.2621,-0.1638 -0.2621,-0.1639 -0.2622,-0.1640 -0.2622,-0.1641 -0.2623,-0.1641 -0.2624,-0.1641 -0.2624,-0.1642 -0.2625,-0.1642 -0.2659,-0.1642 -0.2660,-0.1642 -0.2660,-0.1641 -0.2661,-0.1641 -0.2662,-0.1641 -0.2662,-0.1640 -0.2663,-0.1639 -0.2663,-0.1638 -0.2663,-0.1634 -0.2657,-0.1624 -0.2657,-0.1623 -0.2657,-0.1622 -0.2657,-0.1621 -0.2657,-0.1620 -0.2658,-0.1620 -0.2658,-0.1619 -0.2658,-0.1618 -0.2658,-0.1617 -0.2658,-0.1616 -0.2659,-0.1616 -0.2659,-0.1615 -0.2660,-0.1614 -0.2660,-0.1613 -0.2661,-0.1613 -0.2661,-0.1612 -0.2662,-0.1612 -0.2662,-0.1611 -0.2663,-0.1611 -0.2666,-0.1608 -0.2667,-0.1608 -0.2667,-0.1607 -0.2668,-0.1607 -0.2668,-0.1606 -0.2669,-0.1606 -0.2670,-0.1606 -0.2670,-0.1605 -0.2671,-0.1605 -0.2672,-0.1605 -0.2673,-0.1605 -0.2673,-0.1604 -0.2674,-0.1604 -0.2675,-0.1604 -0.2676,-0.1604 -0.2677,-0.1604 -0.2678,-0.1604 -0.2678,-0.1605 -0.2678,-0.1606 -0.2679,-0.1606 -0.2679,-0.1640 -0.2679,-0.1641 -0.2680,-0.1641 -0.2680,-0.1642 -0.2681,-0.1642 -0.2681,-0.1773 -0.2761,-0.1773 -0.2761,-0.1753 -0.2782,-0.1753 -0.2787,-0.1758 -0.2787,-0.1763 -0.2775,-0.1763 -0.2775,-0.1778 -0.2832,-0.1778 -0.2832,-0.1763 -0.2822,-0.1763 -0.2822,-0.1758 -0.2827,-0.1753 -0.2846,-0.1753 -0.2846,-0.1793 -0.1796,-0.1793 M-0.2101,-0.1671 L-0.2101,-0.1773 -0.2656,-0.1773 -0.2656,-0.1672 -0.2655,-0.1671 -0.2655,-0.1670 -0.2655,-0.1669 -0.2655,-0.1668 -0.2655,-0.1667 -0.2654,-0.1667 -0.2654,-0.1666 -0.2653,-0.1665 -0.2652,-0.1664 -0.2651,-0.1664 -0.2651,-0.1663 -0.2650,-0.1663 -0.2649,-0.1662 -0.2648,-0.1662 -0.2647,-0.1662 -0.2646,-0.1662 -0.2595,-0.1662 -0.2594,-0.1662 -0.2594,-0.1663 -0.2593,-0.1663 -0.2592,-0.1664 -0.2591,-0.1664 -0.2591,-0.1665 -0.2590,-0.1665 -0.2589,-0.1665 -0.2589,-0.1666 -0.2588,-0.1666 -0.2587,-0.1667 -0.2586,-0.1667 -0.2585,-0.1667 -0.2585,-0.1668 -0.2584,-0.1668 -0.2583,-0.1668 -0.2582,-0.1669 -0.2581,-0.1669 -0.2580,-0.1669 -0.2579,-0.1669 -0.2578,-0.1670 -0.2577,-0.1670 -0.2576,-0.1670 -0.2575,-0.1670 -0.2574,-0.1670 -0.2573,-0.1670 -0.2572,-0.1670 -0.2571,-0.1671 -0.2570,-0.1671 -0.2101,-0.1671  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2207" cy="-0.1684" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2101,-0.1671 L-0.2101,-0.1773 -0.2656,-0.1773 -0.2656,-0.1672 -0.2655,-0.1671 -0.2655,-0.1670 -0.2655,-0.1669 -0.2655,-0.1668 -0.2655,-0.1667 -0.2654,-0.1667 -0.2654,-0.1666 -0.2653,-0.1665 -0.2652,-0.1664 -0.2651,-0.1664 -0.2651,-0.1663 -0.2650,-0.1663 -0.2649,-0.1662 -0.2648,-0.1662 -0.2647,-0.1662 -0.2646,-0.1662 -0.2595,-0.1662 -0.2594,-0.1662 -0.2594,-0.1663 -0.2593,-0.1663 -0.2592,-0.1664 -0.2591,-0.1664 -0.2591,-0.1665 -0.2590,-0.1665 -0.2589,-0.1665 -0.2589,-0.1666 -0.2588,-0.1666 -0.2587,-0.1667 -0.2586,-0.1667 -0.2585,-0.1667 -0.2585,-0.1668 -0.2584,-0.1668 -0.2583,-0.1668 -0.2582,-0.1669 -0.2581,-0.1669 -0.2580,-0.1669 -0.2579,-0.1669 -0.2578,-0.1670 -0.2577,-0.1670 -0.2576,-0.1670 -0.2575,-0.1670 -0.2574,-0.1670 -0.2573,-0.1670 -0.2572,-0.1670 -0.2571,-0.1671 -0.2570,-0.1671 -0.2101,-0.1671  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2090,-0.1424 L-0.2089,-0.1424 -0.2089,-0.1423 -0.2089,-0.1422 -0.2088,-0.1422 -0.2088,-0.1421 -0.2089,-0.1421 -0.2089,-0.1420 -0.2095,-0.1409 -0.2095,-0.1406 -0.2095,-0.1405 -0.2095,-0.1404 -0.2094,-0.1404 -0.2094,-0.1403 -0.2094,-0.1402 -0.2093,-0.1402 -0.2092,-0.1402 -0.2091,-0.1402 -0.2057,-0.1402 -0.2056,-0.1402 -0.2055,-0.1402 -0.2054,-0.1402 -0.2054,-0.1403 -0.2054,-0.1404 -0.2053,-0.1404 -0.2053,-0.1405 -0.2053,-0.1406 -0.2053,-0.1409 -0.2059,-0.1419 -0.2059,-0.1420 -0.2059,-0.1421 -0.2059,-0.1422 -0.2059,-0.1423 -0.2058,-0.1424 -0.2058,-0.1425 -0.2058,-0.1426 -0.2058,-0.1427 -0.2057,-0.1427 -0.2057,-0.1428 -0.2056,-0.1429 -0.2056,-0.1430 -0.2055,-0.1430 -0.2055,-0.1431 -0.2054,-0.1431 -0.2054,-0.1432 -0.2053,-0.1432 -0.2050,-0.1435 -0.2049,-0.1435 -0.2049,-0.1436 -0.2048,-0.1436 -0.2048,-0.1437 -0.2047,-0.1437 -0.2046,-0.1437 -0.2046,-0.1438 -0.2045,-0.1438 -0.2044,-0.1438 -0.2043,-0.1439 -0.2042,-0.1439 -0.2041,-0.1439 -0.2040,-0.1439 -0.2039,-0.1439 -0.2038,-0.1439 -0.2038,-0.1438 -0.2038,-0.1437 -0.2038,-0.1404 -0.2038,-0.1403 -0.2037,-0.1403 -0.2037,-0.1402 -0.2036,-0.1402 -0.2036,-0.1263 -0.2041,-0.1258 -0.2050,-0.1258 -0.2050,-0.1298 -0.2081,-0.1298 -0.2081,-0.1186 -0.2084,-0.1183 -0.2081,-0.1180 -0.2081,-0.1091 -0.2050,-0.1089 -0.2050,-0.1108 -0.2041,-0.1108 -0.2036,-0.1103 -0.2036,-0.1073 -0.2606,-0.1073 -0.2606,-0.1150 -0.2703,-0.1150 -0.2704,-0.1150 -0.2705,-0.1150 -0.2706,-0.1150 -0.2707,-0.1150 -0.2707,-0.1151 -0.2708,-0.1151 -0.2708,-0.1152 -0.2709,-0.1152 -0.2709,-0.1153 -0.2710,-0.1154 -0.2710,-0.1155 -0.2710,-0.1156 -0.2711,-0.1157 -0.2710,-0.1158 -0.2710,-0.1159 -0.2710,-0.1160 -0.2710,-0.1161 -0.2709,-0.1161 -0.2709,-0.1162 -0.2708,-0.1162 -0.2708,-0.1163 -0.2707,-0.1163 -0.2707,-0.1164 -0.2706,-0.1164 -0.2705,-0.1164 -0.2704,-0.1164 -0.2704,-0.1165 -0.2703,-0.1165 -0.2681,-0.1165 -0.2681,-0.1290 -0.2678,-0.1293 -0.2681,-0.1296 -0.2681,-0.1402 -0.2680,-0.1402 -0.2679,-0.1402 -0.2679,-0.1403 -0.2679,-0.1404 -0.2679,-0.1437 -0.2678,-0.1437 -0.2678,-0.1438 -0.2678,-0.1439 -0.2677,-0.1439 -0.2676,-0.1439 -0.2675,-0.1439 -0.2674,-0.1439 -0.2673,-0.1439 -0.2672,-0.1438 -0.2671,-0.1438 -0.2670,-0.1438 -0.2670,-0.1437 -0.2669,-0.1437 -0.2668,-0.1437 -0.2668,-0.1436 -0.2667,-0.1436 -0.2667,-0.1435 -0.2666,-0.1435 -0.2663,-0.1432 -0.2662,-0.1432 -0.2662,-0.1431 -0.2661,-0.1431 -0.2661,-0.1430 -0.2660,-0.1430 -0.2660,-0.1429 -0.2659,-0.1428 -0.2659,-0.1427 -0.2658,-0.1427 -0.2658,-0.1426 -0.2658,-0.1425 -0.2658,-0.1424 -0.2657,-0.1423 -0.2657,-0.1422 -0.2657,-0.1421 -0.2657,-0.1420 -0.2657,-0.1419 -0.2663,-0.1409 -0.2663,-0.1406 -0.2663,-0.1405 -0.2663,-0.1404 -0.2662,-0.1404 -0.2662,-0.1403 -0.2662,-0.1402 -0.2661,-0.1402 -0.2660,-0.1402 -0.2659,-0.1402 -0.2625,-0.1402 -0.2624,-0.1402 -0.2623,-0.1402 -0.2622,-0.1402 -0.2622,-0.1403 -0.2622,-0.1404 -0.2621,-0.1404 -0.2621,-0.1405 -0.2621,-0.1406 -0.2621,-0.1409 -0.2627,-0.1420 -0.2627,-0.1421 -0.2628,-0.1421 -0.2628,-0.1422 -0.2627,-0.1422 -0.2627,-0.1423 -0.2627,-0.1424 -0.2626,-0.1424 -0.2619,-0.1430 -0.2097,-0.1430 -0.2090,-0.1424 M-0.2594,-0.1410 L-0.2595,-0.1410 -0.2595,-0.1409 -0.2596,-0.1409 -0.2597,-0.1409 -0.2598,-0.1409 -0.2599,-0.1408 -0.2600,-0.1408 -0.2600,-0.1407 -0.2601,-0.1407 -0.2601,-0.1406 -0.2602,-0.1406 -0.2602,-0.1405 -0.2603,-0.1405 -0.2603,-0.1404 -0.2603,-0.1403 -0.2604,-0.1402 -0.2604,-0.1401 -0.2604,-0.1400 -0.2604,-0.1395 -0.2604,-0.1394 -0.2604,-0.1393 -0.2604,-0.1392 -0.2605,-0.1391 -0.2605,-0.1390 -0.2605,-0.1389 -0.2606,-0.1389 -0.2606,-0.1388 -0.2607,-0.1388 -0.2607,-0.1387 -0.2608,-0.1387 -0.2608,-0.1386 -0.2609,-0.1386 -0.2610,-0.1386 -0.2610,-0.1385 -0.2611,-0.1385 -0.2612,-0.1385 -0.2613,-0.1385 -0.2614,-0.1385 -0.2656,-0.1385 -0.2656,-0.1170 -0.2586,-0.1170 -0.2586,-0.1093 -0.2101,-0.1093 -0.2101,-0.1308 -0.2100,-0.1308 -0.2100,-0.1309 -0.2100,-0.1310 -0.2100,-0.1311 -0.2100,-0.1312 -0.2099,-0.1312 -0.2099,-0.1313 -0.2099,-0.1314 -0.2098,-0.1314 -0.2098,-0.1315 -0.2097,-0.1315 -0.2096,-0.1316 -0.2095,-0.1316 -0.2095,-0.1317 -0.2094,-0.1317 -0.2093,-0.1317 -0.2092,-0.1317 -0.2091,-0.1318 -0.2066,-0.1318 -0.2065,-0.1318 -0.2064,-0.1318 -0.2063,-0.1318 -0.2062,-0.1318 -0.2061,-0.1319 -0.2060,-0.1319 -0.2060,-0.1320 -0.2059,-0.1320 -0.2058,-0.1321 -0.2057,-0.1322 -0.2057,-0.1323 -0.2056,-0.1323 -0.2056,-0.1324 -0.2056,-0.1325 -0.2056,-0.1326 -0.2056,-0.1327 -0.2056,-0.1328 -0.2056,-0.1375 -0.2056,-0.1376 -0.2056,-0.1377 -0.2056,-0.1378 -0.2056,-0.1379 -0.2057,-0.1379 -0.2057,-0.1380 -0.2057,-0.1381 -0.2058,-0.1381 -0.2058,-0.1382 -0.2059,-0.1382 -0.2060,-0.1383 -0.2061,-0.1383 -0.2061,-0.1384 -0.2062,-0.1384 -0.2063,-0.1384 -0.2064,-0.1384 -0.2065,-0.1385 -0.2066,-0.1385 -0.2106,-0.1385 -0.2107,-0.1385 -0.2108,-0.1385 -0.2109,-0.1385 -0.2110,-0.1386 -0.2111,-0.1386 -0.2111,-0.1387 -0.2112,-0.1387 -0.2113,-0.1388 -0.2114,-0.1389 -0.2114,-0.1390 -0.2115,-0.1390 -0.2115,-0.1391 -0.2115,-0.1392 -0.2115,-0.1393 -0.2115,-0.1394 -0.2116,-0.1395 -0.2116,-0.1400 -0.2116,-0.1401 -0.2116,-0.1402 -0.2116,-0.1403 -0.2116,-0.1404 -0.2117,-0.1404 -0.2117,-0.1405 -0.2117,-0.1406 -0.2118,-0.1406 -0.2118,-0.1407 -0.2119,-0.1407 -0.2120,-0.1408 -0.2121,-0.1408 -0.2121,-0.1409 -0.2122,-0.1409 -0.2123,-0.1409 -0.2124,-0.1409 -0.2125,-0.1410 -0.2126,-0.1410 -0.2594,-0.1410  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2399" cy="-0.1289" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2594,-0.1410 L-0.2595,-0.1410 -0.2595,-0.1409 -0.2596,-0.1409 -0.2597,-0.1409 -0.2598,-0.1409 -0.2599,-0.1408 -0.2600,-0.1408 -0.2600,-0.1407 -0.2601,-0.1407 -0.2601,-0.1406 -0.2602,-0.1406 -0.2602,-0.1405 -0.2603,-0.1405 -0.2603,-0.1404 -0.2603,-0.1403 -0.2604,-0.1402 -0.2604,-0.1401 -0.2604,-0.1400 -0.2604,-0.1395 -0.2604,-0.1394 -0.2604,-0.1393 -0.2604,-0.1392 -0.2605,-0.1391 -0.2605,-0.1390 -0.2605,-0.1389 -0.2606,-0.1389 -0.2606,-0.1388 -0.2607,-0.1388 -0.2607,-0.1387 -0.2608,-0.1387 -0.2608,-0.1386 -0.2609,-0.1386 -0.2610,-0.1386 -0.2610,-0.1385 -0.2611,-0.1385 -0.2612,-0.1385 -0.2613,-0.1385 -0.2614,-0.1385 -0.2656,-0.1385 -0.2656,-0.1170 -0.2586,-0.1170 -0.2586,-0.1093 -0.2101,-0.1093 -0.2101,-0.1308 -0.2100,-0.1308 -0.2100,-0.1309 -0.2100,-0.1310 -0.2100,-0.1311 -0.2100,-0.1312 -0.2099,-0.1312 -0.2099,-0.1313 -0.2099,-0.1314 -0.2098,-0.1314 -0.2098,-0.1315 -0.2097,-0.1315 -0.2096,-0.1316 -0.2095,-0.1316 -0.2095,-0.1317 -0.2094,-0.1317 -0.2093,-0.1317 -0.2092,-0.1317 -0.2091,-0.1318 -0.2066,-0.1318 -0.2065,-0.1318 -0.2064,-0.1318 -0.2063,-0.1318 -0.2062,-0.1318 -0.2061,-0.1319 -0.2060,-0.1319 -0.2060,-0.1320 -0.2059,-0.1320 -0.2058,-0.1321 -0.2057,-0.1322 -0.2057,-0.1323 -0.2056,-0.1323 -0.2056,-0.1324 -0.2056,-0.1325 -0.2056,-0.1326 -0.2056,-0.1327 -0.2056,-0.1328 -0.2056,-0.1375 -0.2056,-0.1376 -0.2056,-0.1377 -0.2056,-0.1378 -0.2056,-0.1379 -0.2057,-0.1379 -0.2057,-0.1380 -0.2057,-0.1381 -0.2058,-0.1381 -0.2058,-0.1382 -0.2059,-0.1382 -0.2060,-0.1383 -0.2061,-0.1383 -0.2061,-0.1384 -0.2062,-0.1384 -0.2063,-0.1384 -0.2064,-0.1384 -0.2065,-0.1385 -0.2066,-0.1385 -0.2106,-0.1385 -0.2107,-0.1385 -0.2108,-0.1385 -0.2109,-0.1385 -0.2110,-0.1386 -0.2111,-0.1386 -0.2111,-0.1387 -0.2112,-0.1387 -0.2113,-0.1388 -0.2114,-0.1389 -0.2114,-0.1390 -0.2115,-0.1390 -0.2115,-0.1391 -0.2115,-0.1392 -0.2115,-0.1393 -0.2115,-0.1394 -0.2116,-0.1395 -0.2116,-0.1400 -0.2116,-0.1401 -0.2116,-0.1402 -0.2116,-0.1403 -0.2116,-0.1404 -0.2117,-0.1404 -0.2117,-0.1405 -0.2117,-0.1406 -0.2118,-0.1406 -0.2118,-0.1407 -0.2119,-0.1407 -0.2120,-0.1408 -0.2121,-0.1408 -0.2121,-0.1409 -0.2122,-0.1409 -0.2123,-0.1409 -0.2124,-0.1409 -0.2125,-0.1410 -0.2126,-0.1410 -0.2594,-0.1410  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1848,-0.1085 L-0.1847,-0.1085 -0.1846,-0.1085 -0.1845,-0.1085 -0.1844,-0.1085 -0.1843,-0.1085 -0.1842,-0.1085 -0.1841,-0.1086 -0.1840,-0.1086 -0.1839,-0.1086 -0.1838,-0.1087 -0.1837,-0.1087 -0.1836,-0.1088 -0.1836,-0.1089 -0.1835,-0.1089 -0.1834,-0.1090 -0.1833,-0.1090 -0.1833,-0.1091 -0.1832,-0.1092 -0.1831,-0.1093 -0.1830,-0.1094 -0.1830,-0.1095 -0.1829,-0.1096 -0.1829,-0.1097 -0.1829,-0.1098 -0.1828,-0.1099 -0.1828,-0.1100 -0.1828,-0.1101 -0.1828,-0.1102 -0.1828,-0.1103 -0.1828,-0.1104 -0.1828,-0.1105 -0.1828,-0.1226 -0.1828,-0.1227 -0.1828,-0.1228 -0.1828,-0.1229 -0.1828,-0.1230 -0.1828,-0.1231 -0.1829,-0.1232 -0.1829,-0.1233 -0.1829,-0.1234 -0.1830,-0.1235 -0.1830,-0.1236 -0.1831,-0.1237 -0.1832,-0.1238 -0.1833,-0.1239 -0.1833,-0.1240 -0.1834,-0.1240 -0.1835,-0.1241 -0.1836,-0.1242 -0.1837,-0.1243 -0.1838,-0.1243 -0.1839,-0.1244 -0.1840,-0.1244 -0.1841,-0.1244 -0.1842,-0.1245 -0.1843,-0.1245 -0.1844,-0.1245 -0.1845,-0.1245 -0.1846,-0.1245 -0.1847,-0.1246 -0.1848,-0.1246 -0.2072,-0.1246 -0.2073,-0.1246 -0.2074,-0.1246 -0.2075,-0.1246 -0.2075,-0.1247 -0.2076,-0.1247 -0.2076,-0.1248 -0.2077,-0.1248 -0.2077,-0.1249 -0.2077,-0.1250 -0.2077,-0.1251 -0.2078,-0.1251 -0.2077,-0.1252 -0.2077,-0.1253 -0.2077,-0.1254 -0.2076,-0.1255 -0.2059,-0.1273 -0.2051,-0.1273 -0.2055,-0.1258 -0.1850,-0.1258 -0.1849,-0.1258 -0.1848,-0.1258 -0.1847,-0.1258 -0.1846,-0.1258 -0.1845,-0.1258 -0.1844,-0.1258 -0.1843,-0.1259 -0.1842,-0.1259 -0.1841,-0.1259 -0.1840,-0.1260 -0.1839,-0.1260 -0.1838,-0.1261 -0.1838,-0.1262 -0.1837,-0.1262 -0.1836,-0.1263 -0.1835,-0.1263 -0.1835,-0.1264 -0.1834,-0.1265 -0.1833,-0.1266 -0.1832,-0.1267 -0.1832,-0.1268 -0.1831,-0.1269 -0.1831,-0.1270 -0.1831,-0.1271 -0.1830,-0.1272 -0.1830,-0.1273 -0.1830,-0.1274 -0.1830,-0.1275 -0.1830,-0.1276 -0.1830,-0.1277 -0.1830,-0.1278 -0.1830,-0.1374 -0.1830,-0.1375 -0.1830,-0.1376 -0.1830,-0.1377 -0.1830,-0.1378 -0.1831,-0.1379 -0.1831,-0.1380 -0.1832,-0.1380 -0.1832,-0.1381 -0.1833,-0.1382 -0.1834,-0.1383 -0.1835,-0.1384 -0.1836,-0.1384 -0.1837,-0.1385 -0.1838,-0.1385 -0.1839,-0.1385 -0.1840,-0.1385 -0.1840,-0.1386 -0.1841,-0.1386 -0.1842,-0.1386 -0.1876,-0.1386 -0.1877,-0.1386 -0.1878,-0.1386 -0.1879,-0.1386 -0.1880,-0.1386 -0.1881,-0.1387 -0.1882,-0.1387 -0.1882,-0.1388 -0.1883,-0.1388 -0.1884,-0.1389 -0.1884,-0.1390 -0.1885,-0.1390 -0.1885,-0.1391 -0.1886,-0.1391 -0.1886,-0.1392 -0.1887,-0.1393 -0.1887,-0.1394 -0.1887,-0.1395 -0.1887,-0.1396 -0.1887,-0.1397 -0.1888,-0.1398 -0.1888,-0.1423 -0.1872,-0.1423 -0.1867,-0.1418 -0.1867,-0.1413 -0.1876,-0.1413 -0.1876,-0.1398 -0.1831,-0.1398 -0.1831,-0.1413 -0.1839,-0.1413 -0.1839,-0.1418 -0.1834,-0.1423 -0.1821,-0.1423 -0.1820,-0.1423 -0.1820,-0.1422 -0.1819,-0.1422 -0.1818,-0.1422 -0.1817,-0.1421 -0.1816,-0.1421 -0.1816,-0.1420 -0.1816,-0.1419 -0.1816,-0.1418 -0.1816,-0.1073 -0.2036,-0.1073 -0.2036,-0.1085 -0.2030,-0.1085 -0.2030,-0.1108 -0.2052,-0.1108 -0.2052,-0.1105 -0.2052,-0.1104 -0.2053,-0.1104 -0.2054,-0.1104 -0.2055,-0.1104 -0.2056,-0.1104 -0.2058,-0.1107 -0.2059,-0.1107 -0.2059,-0.1108 -0.2059,-0.1109 -0.2059,-0.1110 -0.2060,-0.1110 -0.2060,-0.1120 -0.2030,-0.1120 -0.2029,-0.1120 -0.2028,-0.1120 -0.2028,-0.1119 -0.2027,-0.1119 -0.2026,-0.1119 -0.2025,-0.1119 -0.2024,-0.1118 -0.2023,-0.1118 -0.2022,-0.1117 -0.2021,-0.1116 -0.2020,-0.1115 -0.2020,-0.1114 -0.2019,-0.1114 -0.2019,-0.1113 -0.2018,-0.1112 -0.2018,-0.1111 -0.2018,-0.1110 -0.2018,-0.1109 -0.2018,-0.1108 -0.2018,-0.1090 -0.2017,-0.1089 -0.2017,-0.1088 -0.2017,-0.1087 -0.2016,-0.1086 -0.2015,-0.1086 -0.2015,-0.1085 -0.2014,-0.1085 -0.2013,-0.1085 -0.1848,-0.1085  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.1831" cy="-0.1252" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2808,-0.1714 L-0.2807,-0.1714 -0.2806,-0.1713 -0.2805,-0.1713 -0.2804,-0.1713 -0.2804,-0.1712 -0.2803,-0.1712 -0.2802,-0.1711 -0.2802,-0.1710 -0.2801,-0.1710 -0.2801,-0.1709 -0.2801,-0.1708 -0.2801,-0.1707 -0.2801,-0.1706 -0.2801,-0.1705 -0.2801,-0.1704 -0.2801,-0.1703 -0.2802,-0.1703 -0.2802,-0.1702 -0.2803,-0.1702 -0.2803,-0.1701 -0.2804,-0.1701 -0.2804,-0.1700 -0.2805,-0.1700 -0.2806,-0.1700 -0.2807,-0.1700 -0.2808,-0.1700 -0.2831,-0.1700 -0.2831,-0.1689 -0.2832,-0.1689 -0.2832,-0.1688 -0.2832,-0.1687 -0.2833,-0.1687 -0.2833,-0.1651 -0.2833,-0.1650 -0.2833,-0.1649 -0.2834,-0.1649 -0.2835,-0.1649 -0.2835,-0.1648 -0.2836,-0.1648 -0.2836,-0.1649 -0.2837,-0.1649 -0.2857,-0.1663 -0.2857,-0.1664 -0.2857,-0.1665 -0.2857,-0.1666 -0.2857,-0.1667 -0.2857,-0.1668 -0.2857,-0.1669 -0.2857,-0.1670 -0.2856,-0.1670 -0.2856,-0.1671 -0.2856,-0.1672 -0.2848,-0.1685 -0.2848,-0.1689 -0.2848,-0.1690 -0.2849,-0.1691 -0.2849,-0.1692 -0.2850,-0.1692 -0.2851,-0.1692 -0.2851,-0.1693 -0.2852,-0.1693 -0.2886,-0.1693 -0.2887,-0.1693 -0.2887,-0.1692 -0.2888,-0.1692 -0.2889,-0.1692 -0.2889,-0.1691 -0.2890,-0.1690 -0.2890,-0.1689 -0.2890,-0.1685 -0.2883,-0.1674 -0.2883,-0.1673 -0.2883,-0.1672 -0.2883,-0.1671 -0.2884,-0.1671 -0.2885,-0.1671 -0.2894,-0.1671 -0.2917,-0.1689 -0.2918,-0.1689 -0.2919,-0.1689 -0.2919,-0.1690 -0.2920,-0.1690 -0.2921,-0.1691 -0.2922,-0.1691 -0.2923,-0.1691 -0.2923,-0.1692 -0.2924,-0.1692 -0.2925,-0.1692 -0.2926,-0.1692 -0.2927,-0.1692 -0.2928,-0.1693 -0.2929,-0.1693 -0.3044,-0.1693 -0.3045,-0.1693 -0.3046,-0.1692 -0.3047,-0.1692 -0.3048,-0.1692 -0.3049,-0.1692 -0.3050,-0.1692 -0.3050,-0.1691 -0.3051,-0.1691 -0.3052,-0.1691 -0.3053,-0.1690 -0.3054,-0.1690 -0.3054,-0.1689 -0.3055,-0.1689 -0.3056,-0.1689 -0.3080,-0.1671 -0.3088,-0.1671 -0.3089,-0.1671 -0.3090,-0.1671 -0.3090,-0.1672 -0.3090,-0.1673 -0.3090,-0.1674 -0.3083,-0.1685 -0.3083,-0.1689 -0.3083,-0.1690 -0.3084,-0.1691 -0.3084,-0.1692 -0.3085,-0.1692 -0.3086,-0.1692 -0.3086,-0.1693 -0.3087,-0.1693 -0.3121,-0.1693 -0.3122,-0.1693 -0.3122,-0.1692 -0.3123,-0.1692 -0.3124,-0.1692 -0.3124,-0.1691 -0.3125,-0.1690 -0.3125,-0.1689 -0.3125,-0.1685 -0.3117,-0.1672 -0.3117,-0.1671 -0.3117,-0.1670 -0.3116,-0.1670 -0.3116,-0.1669 -0.3116,-0.1668 -0.3116,-0.1667 -0.3116,-0.1666 -0.3116,-0.1665 -0.3116,-0.1664 -0.3116,-0.1663 -0.3136,-0.1649 -0.3137,-0.1649 -0.3137,-0.1648 -0.3138,-0.1648 -0.3138,-0.1649 -0.3139,-0.1649 -0.3140,-0.1649 -0.3140,-0.1650 -0.3140,-0.1651 -0.3141,-0.1651 -0.3141,-0.1687 -0.3141,-0.1688 -0.3141,-0.1689 -0.3142,-0.1689 -0.3143,-0.1689 -0.3143,-0.1700 -0.3166,-0.1700 -0.3167,-0.1700 -0.3168,-0.1700 -0.3169,-0.1700 -0.3169,-0.1701 -0.3170,-0.1701 -0.3170,-0.1702 -0.3171,-0.1702 -0.3171,-0.1703 -0.3172,-0.1703 -0.3172,-0.1704 -0.3172,-0.1705 -0.3172,-0.1706 -0.3173,-0.1707 -0.3172,-0.1707 -0.3172,-0.1708 -0.3172,-0.1709 -0.3172,-0.1710 -0.3171,-0.1710 -0.3171,-0.1711 -0.3170,-0.1712 -0.3169,-0.1712 -0.3169,-0.1713 -0.3168,-0.1713 -0.3167,-0.1713 -0.3166,-0.1714 -0.2808,-0.1714  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2928" cy="-0.1703" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2720,-0.1516 L-0.2719,-0.1493 -0.2719,-0.1492 -0.2719,-0.1491 -0.2718,-0.1490 -0.2718,-0.1489 -0.2717,-0.1489 -0.2716,-0.1488 -0.2715,-0.1488 -0.2714,-0.1488 -0.2713,-0.1488 -0.2712,-0.1488 -0.2712,-0.1489 -0.2691,-0.1500 -0.2691,-0.1501 -0.2690,-0.1501 -0.2689,-0.1501 -0.2666,-0.1501 -0.2665,-0.1501 -0.2664,-0.1501 -0.2663,-0.1501 -0.2663,-0.1500 -0.2662,-0.1500 -0.2662,-0.1499 -0.2661,-0.1499 -0.2661,-0.1498 -0.2661,-0.1497 -0.2661,-0.1496 -0.2661,-0.1490 -0.2661,-0.1489 -0.2661,-0.1488 -0.2661,-0.1487 -0.2661,-0.1486 -0.2662,-0.1486 -0.2662,-0.1485 -0.2663,-0.1484 -0.2664,-0.1484 -0.2664,-0.1483 -0.2667,-0.1481 -0.2668,-0.1481 -0.2669,-0.1481 -0.2670,-0.1482 -0.2670,-0.1483 -0.2671,-0.1484 -0.2671,-0.1489 -0.2671,-0.1490 -0.2672,-0.1491 -0.2673,-0.1491 -0.2688,-0.1491 -0.2715,-0.1475 -0.2716,-0.1475 -0.2716,-0.1474 -0.2717,-0.1474 -0.2717,-0.1473 -0.2718,-0.1473 -0.2718,-0.1472 -0.2718,-0.1471 -0.2718,-0.1470 -0.2716,-0.1429 -0.2716,-0.1428 -0.2715,-0.1428 -0.2715,-0.1427 -0.2715,-0.1426 -0.2714,-0.1426 -0.2714,-0.1425 -0.2713,-0.1425 -0.2712,-0.1425 -0.2711,-0.1425 -0.2681,-0.1425 -0.2681,-0.1415 -0.2711,-0.1415 -0.2712,-0.1415 -0.2713,-0.1415 -0.2714,-0.1415 -0.2715,-0.1415 -0.2716,-0.1415 -0.2716,-0.1416 -0.2717,-0.1416 -0.2718,-0.1416 -0.2718,-0.1417 -0.2719,-0.1417 -0.2720,-0.1417 -0.2720,-0.1418 -0.2721,-0.1418 -0.2721,-0.1419 -0.2722,-0.1419 -0.2722,-0.1420 -0.2723,-0.1420 -0.2723,-0.1421 -0.2724,-0.1422 -0.2724,-0.1423 -0.2725,-0.1424 -0.2725,-0.1425 -0.2725,-0.1426 -0.2726,-0.1427 -0.2726,-0.1428 -0.2726,-0.1429 -0.2730,-0.1516 -0.2730,-0.1517 -0.2730,-0.1518 -0.2730,-0.1519 -0.2730,-0.1520 -0.2731,-0.1520 -0.2731,-0.1521 -0.2731,-0.1522 -0.2730,-0.1522 -0.2730,-0.1523 -0.2730,-0.1524 -0.2730,-0.1525 -0.2730,-0.1526 -0.2726,-0.1613 -0.2726,-0.1614 -0.2726,-0.1615 -0.2725,-0.1616 -0.2725,-0.1617 -0.2725,-0.1618 -0.2724,-0.1619 -0.2724,-0.1620 -0.2723,-0.1621 -0.2723,-0.1622 -0.2722,-0.1622 -0.2722,-0.1623 -0.2721,-0.1623 -0.2721,-0.1624 -0.2720,-0.1624 -0.2720,-0.1625 -0.2719,-0.1625 -0.2718,-0.1626 -0.2717,-0.1626 -0.2716,-0.1626 -0.2716,-0.1627 -0.2715,-0.1627 -0.2714,-0.1627 -0.2713,-0.1627 -0.2712,-0.1627 -0.2712,-0.1628 -0.2711,-0.1628 -0.2681,-0.1628 -0.2681,-0.1618 -0.2711,-0.1618 -0.2712,-0.1617 -0.2713,-0.1617 -0.2714,-0.1617 -0.2714,-0.1616 -0.2715,-0.1616 -0.2715,-0.1615 -0.2715,-0.1614 -0.2716,-0.1614 -0.2716,-0.1613 -0.2718,-0.1572 -0.2718,-0.1571 -0.2718,-0.1570 -0.2718,-0.1569 -0.2717,-0.1569 -0.2717,-0.1568 -0.2716,-0.1568 -0.2716,-0.1567 -0.2715,-0.1567 -0.2688,-0.1551 -0.2673,-0.1551 -0.2672,-0.1551 -0.2672,-0.1552 -0.2671,-0.1552 -0.2671,-0.1553 -0.2671,-0.1554 -0.2671,-0.1559 -0.2670,-0.1559 -0.2670,-0.1560 -0.2669,-0.1561 -0.2668,-0.1561 -0.2667,-0.1561 -0.2664,-0.1559 -0.2664,-0.1558 -0.2663,-0.1558 -0.2662,-0.1557 -0.2662,-0.1556 -0.2661,-0.1556 -0.2661,-0.1555 -0.2661,-0.1554 -0.2661,-0.1553 -0.2661,-0.1552 -0.2661,-0.1546 -0.2661,-0.1545 -0.2661,-0.1544 -0.2661,-0.1543 -0.2662,-0.1543 -0.2662,-0.1542 -0.2663,-0.1542 -0.2664,-0.1541 -0.2665,-0.1541 -0.2666,-0.1541 -0.2689,-0.1541 -0.2690,-0.1541 -0.2691,-0.1541 -0.2691,-0.1542 -0.2712,-0.1553 -0.2712,-0.1554 -0.2713,-0.1554 -0.2714,-0.1554 -0.2715,-0.1554 -0.2716,-0.1554 -0.2717,-0.1553 -0.2718,-0.1553 -0.2718,-0.1552 -0.2719,-0.1551 -0.2719,-0.1550 -0.2719,-0.1549 -0.2720,-0.1526 -0.2720,-0.1525 -0.2720,-0.1524 -0.2720,-0.1523 -0.2720,-0.1522 -0.2721,-0.1522 -0.2721,-0.1521 -0.2721,-0.1520 -0.2720,-0.1520 -0.2720,-0.1519 -0.2720,-0.1518 -0.2720,-0.1517 -0.2720,-0.1516  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2725" cy="-0.1507" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.3539,-0.1639 L-0.3505,-0.1639 -0.3504,-0.1639 -0.3504,-0.1638 -0.3503,-0.1638 -0.3502,-0.1638 -0.3502,-0.1637 -0.3501,-0.1636 -0.3501,-0.1635 -0.3501,-0.1631 -0.3509,-0.1617 -0.3509,-0.1616 -0.3510,-0.1616 -0.3510,-0.1615 -0.3510,-0.1614 -0.3510,-0.1613 -0.3510,-0.1612 -0.3511,-0.1611 -0.3511,-0.1605 -0.3511,-0.1604 -0.3511,-0.1603 -0.3511,-0.1602 -0.3511,-0.1601 -0.3511,-0.1600 -0.3511,-0.1599 -0.3511,-0.1598 -0.3511,-0.1597 -0.3512,-0.1596 -0.3512,-0.1595 -0.3512,-0.1594 -0.3513,-0.1593 -0.3513,-0.1592 -0.3514,-0.1591 -0.3514,-0.1590 -0.3514,-0.1589 -0.3515,-0.1588 -0.3515,-0.1587 -0.3516,-0.1586 -0.3517,-0.1585 -0.3517,-0.1584 -0.3518,-0.1583 -0.3519,-0.1582 -0.3520,-0.1581 -0.3521,-0.1580 -0.3539,-0.1562 -0.3540,-0.1561 -0.3540,-0.1560 -0.3541,-0.1560 -0.3541,-0.1559 -0.3542,-0.1558 -0.3542,-0.1557 -0.3543,-0.1557 -0.3543,-0.1556 -0.3543,-0.1555 -0.3543,-0.1554 -0.3544,-0.1554 -0.3544,-0.1553 -0.3544,-0.1552 -0.3544,-0.1551 -0.3544,-0.1550 -0.3544,-0.1549 -0.3545,-0.1548 -0.3545,-0.1489 -0.3544,-0.1488 -0.3544,-0.1487 -0.3544,-0.1486 -0.3543,-0.1485 -0.3542,-0.1485 -0.3542,-0.1484 -0.3541,-0.1484 -0.3540,-0.1484 -0.3465,-0.1484 -0.3464,-0.1484 -0.3464,-0.1483 -0.3463,-0.1483 -0.3462,-0.1483 -0.3461,-0.1482 -0.3460,-0.1481 -0.3460,-0.1480 -0.3460,-0.1479 -0.3460,-0.1478 -0.3460,-0.1477 -0.3460,-0.1476 -0.3461,-0.1475 -0.3462,-0.1474 -0.3463,-0.1474 -0.3464,-0.1474 -0.3465,-0.1474 -0.3540,-0.1474 -0.3540,-0.1473 -0.3541,-0.1473 -0.3542,-0.1473 -0.3543,-0.1472 -0.3544,-0.1472 -0.3544,-0.1471 -0.3544,-0.1470 -0.3544,-0.1469 -0.3545,-0.1469 -0.3545,-0.1409 -0.3544,-0.1408 -0.3544,-0.1407 -0.3544,-0.1406 -0.3544,-0.1405 -0.3544,-0.1404 -0.3544,-0.1403 -0.3543,-0.1403 -0.3543,-0.1402 -0.3543,-0.1401 -0.3543,-0.1400 -0.3542,-0.1400 -0.3542,-0.1399 -0.3541,-0.1398 -0.3541,-0.1397 -0.3540,-0.1397 -0.3540,-0.1396 -0.3539,-0.1396 -0.3539,-0.1395 -0.3521,-0.1377 -0.3520,-0.1376 -0.3519,-0.1375 -0.3518,-0.1374 -0.3517,-0.1373 -0.3517,-0.1372 -0.3516,-0.1372 -0.3516,-0.1371 -0.3515,-0.1370 -0.3515,-0.1369 -0.3514,-0.1368 -0.3514,-0.1367 -0.3514,-0.1366 -0.3513,-0.1366 -0.3513,-0.1365 -0.3513,-0.1364 -0.3512,-0.1363 -0.3512,-0.1362 -0.3512,-0.1361 -0.3511,-0.1360 -0.3511,-0.1359 -0.3511,-0.1358 -0.3511,-0.1357 -0.3511,-0.1356 -0.3511,-0.1355 -0.3511,-0.1354 -0.3511,-0.1353 -0.3511,-0.1352 -0.3511,-0.1346 -0.3510,-0.1345 -0.3510,-0.1344 -0.3510,-0.1343 -0.3510,-0.1342 -0.3510,-0.1341 -0.3509,-0.1341 -0.3509,-0.1340 -0.3501,-0.1326 -0.3501,-0.1323 -0.3501,-0.1322 -0.3501,-0.1321 -0.3502,-0.1321 -0.3502,-0.1320 -0.3502,-0.1319 -0.3503,-0.1319 -0.3504,-0.1319 -0.3505,-0.1319 -0.3539,-0.1319 -0.3540,-0.1319 -0.3541,-0.1319 -0.3542,-0.1319 -0.3542,-0.1320 -0.3542,-0.1321 -0.3543,-0.1321 -0.3543,-0.1322 -0.3543,-0.1323 -0.3543,-0.1326 -0.3535,-0.1340 -0.3535,-0.1341 -0.3534,-0.1341 -0.3534,-0.1342 -0.3534,-0.1343 -0.3534,-0.1344 -0.3534,-0.1345 -0.3534,-0.1346 -0.3534,-0.1350 -0.3534,-0.1351 -0.3534,-0.1352 -0.3534,-0.1353 -0.3534,-0.1354 -0.3534,-0.1355 -0.3534,-0.1356 -0.3535,-0.1357 -0.3535,-0.1358 -0.3535,-0.1359 -0.3536,-0.1359 -0.3536,-0.1360 -0.3536,-0.1361 -0.3537,-0.1361 -0.3537,-0.1362 -0.3538,-0.1363 -0.3539,-0.1364 -0.3559,-0.1384 -0.3559,-0.1385 -0.3560,-0.1385 -0.3560,-0.1386 -0.3560,-0.1387 -0.3561,-0.1388 -0.3561,-0.1570 -0.3560,-0.1570 -0.3560,-0.1571 -0.3560,-0.1572 -0.3559,-0.1573 -0.3539,-0.1593 -0.3538,-0.1594 -0.3538,-0.1595 -0.3537,-0.1595 -0.3537,-0.1596 -0.3536,-0.1597 -0.3536,-0.1598 -0.3535,-0.1598 -0.3535,-0.1599 -0.3535,-0.1600 -0.3535,-0.1601 -0.3534,-0.1601 -0.3534,-0.1602 -0.3534,-0.1603 -0.3534,-0.1604 -0.3534,-0.1605 -0.3534,-0.1606 -0.3534,-0.1607 -0.3534,-0.1611 -0.3534,-0.1612 -0.3534,-0.1613 -0.3534,-0.1614 -0.3534,-0.1615 -0.3534,-0.1616 -0.3535,-0.1616 -0.3535,-0.1617 -0.3543,-0.1631 -0.3543,-0.1635 -0.3543,-0.1636 -0.3542,-0.1637 -0.3542,-0.1638 -0.3541,-0.1638 -0.3540,-0.1638 -0.3540,-0.1639 -0.3539,-0.1639  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.3525" cy="-0.1594" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.3212,-0.1319 L-0.3246,-0.1319 -0.3247,-0.1319 -0.3248,-0.1319 -0.3249,-0.1319 -0.3249,-0.1320 -0.3249,-0.1321 -0.3250,-0.1321 -0.3250,-0.1322 -0.3250,-0.1323 -0.3250,-0.1326 -0.3242,-0.1340 -0.3242,-0.1341 -0.3241,-0.1341 -0.3241,-0.1342 -0.3241,-0.1343 -0.3241,-0.1344 -0.3241,-0.1345 -0.3241,-0.1346 -0.3241,-0.1352 -0.3240,-0.1353 -0.3240,-0.1354 -0.3240,-0.1355 -0.3240,-0.1356 -0.3240,-0.1357 -0.3240,-0.1358 -0.3240,-0.1359 -0.3240,-0.1360 -0.3239,-0.1361 -0.3239,-0.1362 -0.3239,-0.1363 -0.3238,-0.1364 -0.3238,-0.1365 -0.3238,-0.1366 -0.3237,-0.1367 -0.3237,-0.1368 -0.3236,-0.1369 -0.3236,-0.1370 -0.3235,-0.1371 -0.3235,-0.1372 -0.3234,-0.1372 -0.3234,-0.1373 -0.3233,-0.1374 -0.3232,-0.1375 -0.3231,-0.1376 -0.3230,-0.1377 -0.3212,-0.1395 -0.3212,-0.1396 -0.3211,-0.1396 -0.3211,-0.1397 -0.3210,-0.1397 -0.3210,-0.1398 -0.3209,-0.1399 -0.3209,-0.1400 -0.3208,-0.1400 -0.3208,-0.1401 -0.3208,-0.1402 -0.3208,-0.1403 -0.3207,-0.1403 -0.3207,-0.1404 -0.3207,-0.1405 -0.3207,-0.1406 -0.3207,-0.1407 -0.3207,-0.1408 -0.3207,-0.1409 -0.3207,-0.1469 -0.3207,-0.1470 -0.3207,-0.1471 -0.3207,-0.1472 -0.3208,-0.1472 -0.3209,-0.1473 -0.3210,-0.1473 -0.3211,-0.1473 -0.3211,-0.1474 -0.3212,-0.1474 -0.3287,-0.1474 -0.3288,-0.1474 -0.3289,-0.1474 -0.3290,-0.1475 -0.3291,-0.1476 -0.3291,-0.1477 -0.3291,-0.1478 -0.3292,-0.1479 -0.3291,-0.1479 -0.3291,-0.1480 -0.3291,-0.1481 -0.3290,-0.1482 -0.3289,-0.1483 -0.3288,-0.1483 -0.3287,-0.1483 -0.3287,-0.1484 -0.3212,-0.1484 -0.3211,-0.1484 -0.3210,-0.1484 -0.3209,-0.1484 -0.3209,-0.1485 -0.3208,-0.1485 -0.3207,-0.1486 -0.3207,-0.1487 -0.3207,-0.1488 -0.3207,-0.1489 -0.3207,-0.1548 -0.3207,-0.1549 -0.3207,-0.1550 -0.3207,-0.1551 -0.3207,-0.1552 -0.3207,-0.1553 -0.3207,-0.1554 -0.3208,-0.1554 -0.3208,-0.1555 -0.3208,-0.1556 -0.3208,-0.1557 -0.3209,-0.1557 -0.3209,-0.1558 -0.3210,-0.1559 -0.3210,-0.1560 -0.3211,-0.1560 -0.3211,-0.1561 -0.3212,-0.1562 -0.3230,-0.1580 -0.3231,-0.1581 -0.3232,-0.1582 -0.3233,-0.1583 -0.3234,-0.1584 -0.3234,-0.1585 -0.3235,-0.1586 -0.3236,-0.1587 -0.3236,-0.1588 -0.3237,-0.1589 -0.3237,-0.1590 -0.3238,-0.1591 -0.3238,-0.1592 -0.3238,-0.1593 -0.3239,-0.1594 -0.3239,-0.1595 -0.3239,-0.1596 -0.3240,-0.1597 -0.3240,-0.1598 -0.3240,-0.1599 -0.3240,-0.1600 -0.3240,-0.1601 -0.3240,-0.1602 -0.3240,-0.1603 -0.3240,-0.1604 -0.3241,-0.1605 -0.3241,-0.1611 -0.3241,-0.1612 -0.3241,-0.1613 -0.3241,-0.1614 -0.3241,-0.1615 -0.3241,-0.1616 -0.3242,-0.1616 -0.3242,-0.1617 -0.3250,-0.1631 -0.3250,-0.1635 -0.3250,-0.1636 -0.3249,-0.1637 -0.3249,-0.1638 -0.3248,-0.1638 -0.3247,-0.1638 -0.3247,-0.1639 -0.3246,-0.1639 -0.3212,-0.1639 -0.3211,-0.1639 -0.3211,-0.1638 -0.3210,-0.1638 -0.3209,-0.1638 -0.3209,-0.1637 -0.3208,-0.1636 -0.3208,-0.1635 -0.3208,-0.1631 -0.3216,-0.1617 -0.3216,-0.1616 -0.3217,-0.1616 -0.3217,-0.1615 -0.3217,-0.1614 -0.3217,-0.1613 -0.3217,-0.1612 -0.3218,-0.1611 -0.3218,-0.1607 -0.3217,-0.1606 -0.3217,-0.1605 -0.3217,-0.1604 -0.3217,-0.1603 -0.3217,-0.1602 -0.3217,-0.1601 -0.3216,-0.1601 -0.3216,-0.1600 -0.3216,-0.1599 -0.3216,-0.1598 -0.3215,-0.1598 -0.3215,-0.1597 -0.3214,-0.1596 -0.3214,-0.1595 -0.3213,-0.1595 -0.3213,-0.1594 -0.3212,-0.1593 -0.3192,-0.1573 -0.3191,-0.1572 -0.3191,-0.1571 -0.3191,-0.1570 -0.3191,-0.1388 -0.3191,-0.1387 -0.3191,-0.1386 -0.3191,-0.1385 -0.3192,-0.1385 -0.3192,-0.1384 -0.3212,-0.1364 -0.3213,-0.1363 -0.3214,-0.1362 -0.3214,-0.1361 -0.3215,-0.1361 -0.3215,-0.1360 -0.3215,-0.1359 -0.3216,-0.1359 -0.3216,-0.1358 -0.3216,-0.1357 -0.3217,-0.1356 -0.3217,-0.1355 -0.3217,-0.1354 -0.3217,-0.1353 -0.3217,-0.1352 -0.3217,-0.1351 -0.3218,-0.1350 -0.3218,-0.1346 -0.3217,-0.1345 -0.3217,-0.1344 -0.3217,-0.1343 -0.3217,-0.1342 -0.3217,-0.1341 -0.3216,-0.1341 -0.3216,-0.1340 -0.3208,-0.1326 -0.3208,-0.1323 -0.3208,-0.1322 -0.3208,-0.1321 -0.3209,-0.1321 -0.3209,-0.1320 -0.3209,-0.1319 -0.3210,-0.1319 -0.3211,-0.1319 -0.3212,-0.1319  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.3231" cy="-0.1330" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.3094,-0.1693 L-0.3087,-0.1693 -0.3086,-0.1693 -0.3086,-0.1692 -0.3085,-0.1692 -0.3084,-0.1692 -0.3084,-0.1691 -0.3083,-0.1690 -0.3083,-0.1689 -0.3083,-0.1685 -0.3091,-0.1671 -0.3091,-0.1670 -0.3092,-0.1670 -0.3092,-0.1669 -0.3092,-0.1668 -0.3092,-0.1667 -0.3092,-0.1666 -0.3093,-0.1665 -0.3093,-0.1652 -0.3093,-0.1651 -0.3093,-0.1650 -0.3093,-0.1649 -0.3093,-0.1648 -0.3093,-0.1647 -0.3093,-0.1646 -0.3093,-0.1645 -0.3094,-0.1644 -0.3094,-0.1643 -0.3094,-0.1642 -0.3094,-0.1641 -0.3095,-0.1640 -0.3095,-0.1639 -0.3096,-0.1638 -0.3096,-0.1637 -0.3096,-0.1636 -0.3097,-0.1635 -0.3097,-0.1634 -0.3098,-0.1633 -0.3099,-0.1632 -0.3099,-0.1631 -0.3100,-0.1630 -0.3101,-0.1630 -0.3101,-0.1629 -0.3102,-0.1628 -0.3103,-0.1627 -0.3104,-0.1626 -0.3105,-0.1625 -0.3106,-0.1625 -0.3107,-0.1624 -0.3107,-0.1623 -0.3122,-0.1613 -0.3123,-0.1613 -0.3123,-0.1612 -0.3124,-0.1612 -0.3124,-0.1611 -0.3125,-0.1611 -0.3125,-0.1610 -0.3125,-0.1609 -0.3126,-0.1609 -0.3126,-0.1608 -0.3126,-0.1607 -0.3126,-0.1606 -0.3126,-0.1605 -0.3127,-0.1605 -0.3127,-0.1553 -0.3126,-0.1552 -0.3126,-0.1551 -0.3126,-0.1550 -0.3125,-0.1549 -0.3124,-0.1549 -0.3124,-0.1548 -0.3123,-0.1548 -0.3122,-0.1548 -0.3047,-0.1548 -0.3046,-0.1548 -0.3046,-0.1547 -0.3045,-0.1547 -0.3044,-0.1547 -0.3043,-0.1546 -0.3042,-0.1545 -0.3042,-0.1544 -0.3042,-0.1543 -0.3042,-0.1542 -0.3042,-0.1541 -0.3042,-0.1540 -0.3043,-0.1539 -0.3044,-0.1538 -0.3045,-0.1538 -0.3046,-0.1538 -0.3047,-0.1538 -0.3122,-0.1538 -0.3122,-0.1537 -0.3123,-0.1537 -0.3124,-0.1537 -0.3125,-0.1536 -0.3126,-0.1536 -0.3126,-0.1535 -0.3126,-0.1534 -0.3126,-0.1533 -0.3127,-0.1533 -0.3127,-0.1480 -0.3126,-0.1480 -0.3126,-0.1479 -0.3126,-0.1478 -0.3126,-0.1477 -0.3126,-0.1476 -0.3125,-0.1476 -0.3125,-0.1475 -0.3124,-0.1474 -0.3124,-0.1473 -0.3123,-0.1473 -0.3122,-0.1472 -0.3107,-0.1462 -0.3107,-0.1461 -0.3106,-0.1461 -0.3105,-0.1460 -0.3104,-0.1459 -0.3103,-0.1459 -0.3103,-0.1458 -0.3102,-0.1457 -0.3101,-0.1456 -0.3101,-0.1455 -0.3100,-0.1455 -0.3099,-0.1454 -0.3099,-0.1453 -0.3098,-0.1452 -0.3097,-0.1451 -0.3097,-0.1450 -0.3096,-0.1449 -0.3096,-0.1448 -0.3096,-0.1447 -0.3095,-0.1447 -0.3095,-0.1446 -0.3094,-0.1445 -0.3094,-0.1444 -0.3094,-0.1443 -0.3094,-0.1442 -0.3093,-0.1440 -0.3093,-0.1439 -0.3093,-0.1438 -0.3093,-0.1437 -0.3093,-0.1436 -0.3093,-0.1435 -0.3093,-0.1434 -0.3093,-0.1433 -0.3093,-0.1420 -0.3092,-0.1419 -0.3092,-0.1418 -0.3092,-0.1417 -0.3092,-0.1416 -0.3092,-0.1415 -0.3091,-0.1415 -0.3091,-0.1414 -0.3083,-0.1400 -0.3083,-0.1397 -0.3083,-0.1396 -0.3083,-0.1395 -0.3084,-0.1395 -0.3084,-0.1394 -0.3084,-0.1393 -0.3085,-0.1393 -0.3086,-0.1393 -0.3087,-0.1393 -0.3094,-0.1393 -0.3114,-0.1393 -0.3121,-0.1393 -0.3122,-0.1393 -0.3123,-0.1393 -0.3124,-0.1393 -0.3124,-0.1394 -0.3124,-0.1395 -0.3125,-0.1395 -0.3125,-0.1396 -0.3125,-0.1397 -0.3125,-0.1400 -0.3117,-0.1414 -0.3117,-0.1415 -0.3116,-0.1415 -0.3116,-0.1416 -0.3116,-0.1417 -0.3116,-0.1418 -0.3116,-0.1419 -0.3116,-0.1420 -0.3116,-0.1434 -0.3116,-0.1435 -0.3116,-0.1436 -0.3116,-0.1437 -0.3116,-0.1438 -0.3116,-0.1439 -0.3117,-0.1439 -0.3117,-0.1440 -0.3117,-0.1441 -0.3118,-0.1441 -0.3118,-0.1442 -0.3119,-0.1443 -0.3120,-0.1444 -0.3121,-0.1444 -0.3140,-0.1458 -0.3141,-0.1458 -0.3141,-0.1459 -0.3142,-0.1459 -0.3142,-0.1460 -0.3142,-0.1461 -0.3142,-0.1462 -0.3143,-0.1462 -0.3143,-0.1623 -0.3142,-0.1623 -0.3142,-0.1624 -0.3142,-0.1625 -0.3142,-0.1626 -0.3141,-0.1626 -0.3141,-0.1627 -0.3140,-0.1627 -0.3121,-0.1641 -0.3120,-0.1641 -0.3120,-0.1642 -0.3119,-0.1642 -0.3119,-0.1643 -0.3118,-0.1643 -0.3118,-0.1644 -0.3117,-0.1644 -0.3117,-0.1645 -0.3117,-0.1646 -0.3116,-0.1646 -0.3116,-0.1647 -0.3116,-0.1648 -0.3116,-0.1649 -0.3116,-0.1650 -0.3116,-0.1651 -0.3116,-0.1665 -0.3116,-0.1666 -0.3116,-0.1667 -0.3116,-0.1668 -0.3116,-0.1669 -0.3116,-0.1670 -0.3117,-0.1670 -0.3117,-0.1671 -0.3125,-0.1685 -0.3125,-0.1689 -0.3125,-0.1690 -0.3124,-0.1691 -0.3124,-0.1692 -0.3123,-0.1692 -0.3122,-0.1692 -0.3122,-0.1693 -0.3121,-0.1693 -0.3114,-0.1693 -0.3094,-0.1693  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.3102" cy="-0.1681" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2890,-0.1685 L-0.2890,-0.1689 -0.2890,-0.1690 -0.2889,-0.1691 -0.2889,-0.1692 -0.2888,-0.1692 -0.2887,-0.1692 -0.2887,-0.1693 -0.2886,-0.1693 -0.2879,-0.1693 -0.2859,-0.1693 -0.2852,-0.1693 -0.2851,-0.1693 -0.2851,-0.1692 -0.2850,-0.1692 -0.2849,-0.1692 -0.2849,-0.1691 -0.2848,-0.1690 -0.2848,-0.1689 -0.2848,-0.1685 -0.2856,-0.1671 -0.2856,-0.1670 -0.2857,-0.1670 -0.2857,-0.1669 -0.2857,-0.1668 -0.2857,-0.1667 -0.2857,-0.1666 -0.2858,-0.1665 -0.2858,-0.1651 -0.2857,-0.1650 -0.2857,-0.1649 -0.2857,-0.1648 -0.2857,-0.1647 -0.2857,-0.1646 -0.2856,-0.1646 -0.2856,-0.1645 -0.2856,-0.1644 -0.2855,-0.1644 -0.2855,-0.1643 -0.2854,-0.1643 -0.2854,-0.1642 -0.2853,-0.1642 -0.2853,-0.1641 -0.2852,-0.1641 -0.2833,-0.1627 -0.2832,-0.1627 -0.2832,-0.1626 -0.2831,-0.1626 -0.2831,-0.1625 -0.2831,-0.1624 -0.2831,-0.1623 -0.2831,-0.1462 -0.2831,-0.1461 -0.2831,-0.1460 -0.2831,-0.1459 -0.2832,-0.1459 -0.2832,-0.1458 -0.2833,-0.1458 -0.2852,-0.1444 -0.2853,-0.1444 -0.2854,-0.1443 -0.2855,-0.1442 -0.2855,-0.1441 -0.2856,-0.1441 -0.2856,-0.1440 -0.2856,-0.1439 -0.2857,-0.1439 -0.2857,-0.1438 -0.2857,-0.1437 -0.2857,-0.1436 -0.2857,-0.1435 -0.2858,-0.1434 -0.2858,-0.1420 -0.2857,-0.1419 -0.2857,-0.1418 -0.2857,-0.1417 -0.2857,-0.1416 -0.2857,-0.1415 -0.2856,-0.1415 -0.2856,-0.1414 -0.2848,-0.1400 -0.2848,-0.1397 -0.2848,-0.1396 -0.2848,-0.1395 -0.2849,-0.1395 -0.2849,-0.1394 -0.2849,-0.1393 -0.2850,-0.1393 -0.2851,-0.1393 -0.2852,-0.1393 -0.2859,-0.1393 -0.2879,-0.1393 -0.2886,-0.1393 -0.2887,-0.1393 -0.2888,-0.1393 -0.2889,-0.1393 -0.2889,-0.1394 -0.2889,-0.1395 -0.2890,-0.1395 -0.2890,-0.1396 -0.2890,-0.1397 -0.2890,-0.1400 -0.2882,-0.1414 -0.2882,-0.1415 -0.2881,-0.1415 -0.2881,-0.1416 -0.2881,-0.1417 -0.2881,-0.1418 -0.2881,-0.1419 -0.2881,-0.1420 -0.2881,-0.1433 -0.2880,-0.1434 -0.2880,-0.1435 -0.2880,-0.1436 -0.2880,-0.1437 -0.2880,-0.1438 -0.2880,-0.1439 -0.2880,-0.1440 -0.2880,-0.1442 -0.2879,-0.1443 -0.2879,-0.1444 -0.2879,-0.1445 -0.2878,-0.1446 -0.2878,-0.1447 -0.2877,-0.1447 -0.2877,-0.1448 -0.2877,-0.1449 -0.2876,-0.1450 -0.2876,-0.1451 -0.2875,-0.1452 -0.2874,-0.1453 -0.2874,-0.1454 -0.2873,-0.1455 -0.2872,-0.1455 -0.2872,-0.1456 -0.2871,-0.1457 -0.2870,-0.1458 -0.2870,-0.1459 -0.2869,-0.1459 -0.2868,-0.1460 -0.2867,-0.1461 -0.2866,-0.1461 -0.2866,-0.1462 -0.2851,-0.1472 -0.2850,-0.1473 -0.2849,-0.1473 -0.2849,-0.1474 -0.2848,-0.1475 -0.2848,-0.1476 -0.2847,-0.1476 -0.2847,-0.1477 -0.2847,-0.1478 -0.2847,-0.1479 -0.2847,-0.1480 -0.2847,-0.1533 -0.2847,-0.1534 -0.2847,-0.1535 -0.2847,-0.1536 -0.2848,-0.1536 -0.2849,-0.1537 -0.2850,-0.1537 -0.2851,-0.1537 -0.2851,-0.1538 -0.2852,-0.1538 -0.2927,-0.1538 -0.2928,-0.1538 -0.2929,-0.1538 -0.2930,-0.1539 -0.2931,-0.1540 -0.2931,-0.1541 -0.2931,-0.1542 -0.2932,-0.1543 -0.2931,-0.1543 -0.2931,-0.1544 -0.2931,-0.1545 -0.2930,-0.1546 -0.2929,-0.1547 -0.2928,-0.1547 -0.2927,-0.1547 -0.2927,-0.1548 -0.2852,-0.1548 -0.2851,-0.1548 -0.2850,-0.1548 -0.2849,-0.1548 -0.2849,-0.1549 -0.2848,-0.1549 -0.2847,-0.1550 -0.2847,-0.1551 -0.2847,-0.1552 -0.2847,-0.1553 -0.2847,-0.1605 -0.2847,-0.1606 -0.2847,-0.1607 -0.2847,-0.1608 -0.2847,-0.1609 -0.2848,-0.1609 -0.2848,-0.1610 -0.2848,-0.1611 -0.2849,-0.1611 -0.2849,-0.1612 -0.2850,-0.1612 -0.2850,-0.1613 -0.2851,-0.1613 -0.2866,-0.1623 -0.2866,-0.1624 -0.2867,-0.1625 -0.2868,-0.1625 -0.2869,-0.1626 -0.2870,-0.1627 -0.2871,-0.1628 -0.2872,-0.1629 -0.2872,-0.1630 -0.2873,-0.1630 -0.2874,-0.1631 -0.2874,-0.1632 -0.2875,-0.1633 -0.2876,-0.1634 -0.2876,-0.1635 -0.2877,-0.1636 -0.2877,-0.1637 -0.2877,-0.1638 -0.2878,-0.1639 -0.2878,-0.1640 -0.2879,-0.1641 -0.2879,-0.1642 -0.2879,-0.1643 -0.2880,-0.1644 -0.2880,-0.1645 -0.2880,-0.1646 -0.2880,-0.1647 -0.2880,-0.1648 -0.2880,-0.1649 -0.2880,-0.1650 -0.2880,-0.1651 -0.2881,-0.1652 -0.2881,-0.1665 -0.2881,-0.1666 -0.2881,-0.1667 -0.2881,-0.1668 -0.2881,-0.1669 -0.2881,-0.1670 -0.2882,-0.1670 -0.2882,-0.1671 -0.2890,-0.1685  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2868" cy="-0.1648" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2673,-0.1553 L-0.2674,-0.1553 -0.2675,-0.1553 -0.2675,-0.1554 -0.2676,-0.1554 -0.2677,-0.1554 -0.2677,-0.1555 -0.2678,-0.1555 -0.2678,-0.1556 -0.2679,-0.1556 -0.2679,-0.1557 -0.2680,-0.1557 -0.2680,-0.1558 -0.2680,-0.1559 -0.2680,-0.1560 -0.2680,-0.1561 -0.2681,-0.1561 -0.2681,-0.1566 -0.2680,-0.1566 -0.2680,-0.1567 -0.2680,-0.1568 -0.2680,-0.1569 -0.2679,-0.1569 -0.2679,-0.1570 -0.2678,-0.1570 -0.2678,-0.1571 -0.2677,-0.1571 -0.2676,-0.1571 -0.2653,-0.1571 -0.2652,-0.1571 -0.2651,-0.1571 -0.2651,-0.1572 -0.2650,-0.1572 -0.2649,-0.1573 -0.2649,-0.1574 -0.2648,-0.1574 -0.2648,-0.1575 -0.2648,-0.1576 -0.2648,-0.1604 -0.2648,-0.1605 -0.2648,-0.1606 -0.2648,-0.1607 -0.2648,-0.1608 -0.2649,-0.1608 -0.2649,-0.1609 -0.2649,-0.1610 -0.2650,-0.1611 -0.2663,-0.1634 -0.2663,-0.1638 -0.2663,-0.1639 -0.2662,-0.1640 -0.2662,-0.1641 -0.2661,-0.1641 -0.2660,-0.1641 -0.2660,-0.1642 -0.2659,-0.1642 -0.2625,-0.1642 -0.2624,-0.1642 -0.2624,-0.1641 -0.2623,-0.1641 -0.2622,-0.1641 -0.2622,-0.1640 -0.2621,-0.1639 -0.2621,-0.1638 -0.2621,-0.1634 -0.2630,-0.1618 -0.2631,-0.1617 -0.2631,-0.1616 -0.2631,-0.1615 -0.2632,-0.1615 -0.2632,-0.1614 -0.2632,-0.1613 -0.2632,-0.1612 -0.2632,-0.1611 -0.2632,-0.1529 -0.2470,-0.1529 -0.2469,-0.1529 -0.2468,-0.1529 -0.2467,-0.1529 -0.2467,-0.1528 -0.2466,-0.1528 -0.2465,-0.1527 -0.2464,-0.1527 -0.2464,-0.1526 -0.2463,-0.1526 -0.2463,-0.1525 -0.2463,-0.1524 -0.2462,-0.1524 -0.2462,-0.1523 -0.2462,-0.1522 -0.2462,-0.1521 -0.2462,-0.1520 -0.2462,-0.1519 -0.2462,-0.1518 -0.2463,-0.1518 -0.2463,-0.1517 -0.2464,-0.1516 -0.2464,-0.1515 -0.2465,-0.1515 -0.2466,-0.1514 -0.2467,-0.1514 -0.2468,-0.1513 -0.2469,-0.1513 -0.2470,-0.1513 -0.2632,-0.1513 -0.2632,-0.1432 -0.2632,-0.1431 -0.2632,-0.1430 -0.2632,-0.1429 -0.2631,-0.1428 -0.2631,-0.1427 -0.2631,-0.1426 -0.2630,-0.1426 -0.2630,-0.1425 -0.2621,-0.1409 -0.2621,-0.1406 -0.2621,-0.1405 -0.2621,-0.1404 -0.2622,-0.1404 -0.2622,-0.1403 -0.2622,-0.1402 -0.2623,-0.1402 -0.2624,-0.1402 -0.2625,-0.1402 -0.2659,-0.1402 -0.2660,-0.1402 -0.2661,-0.1402 -0.2662,-0.1402 -0.2662,-0.1403 -0.2662,-0.1404 -0.2663,-0.1404 -0.2663,-0.1405 -0.2663,-0.1406 -0.2663,-0.1409 -0.2650,-0.1432 -0.2650,-0.1433 -0.2649,-0.1433 -0.2649,-0.1434 -0.2649,-0.1435 -0.2648,-0.1436 -0.2648,-0.1437 -0.2648,-0.1438 -0.2648,-0.1439 -0.2648,-0.1466 -0.2648,-0.1467 -0.2648,-0.1468 -0.2649,-0.1468 -0.2649,-0.1469 -0.2649,-0.1470 -0.2650,-0.1470 -0.2651,-0.1470 -0.2651,-0.1471 -0.2652,-0.1471 -0.2653,-0.1471 -0.2676,-0.1471 -0.2677,-0.1471 -0.2678,-0.1472 -0.2679,-0.1472 -0.2679,-0.1473 -0.2680,-0.1473 -0.2680,-0.1474 -0.2680,-0.1475 -0.2680,-0.1476 -0.2681,-0.1476 -0.2681,-0.1481 -0.2680,-0.1481 -0.2680,-0.1482 -0.2680,-0.1483 -0.2680,-0.1484 -0.2680,-0.1485 -0.2679,-0.1485 -0.2679,-0.1486 -0.2678,-0.1486 -0.2678,-0.1487 -0.2677,-0.1487 -0.2677,-0.1488 -0.2676,-0.1488 -0.2675,-0.1489 -0.2674,-0.1489 -0.2673,-0.1489 -0.2672,-0.1489 -0.2671,-0.1489 -0.2671,-0.1488 -0.2671,-0.1487 -0.2671,-0.1481 -0.2653,-0.1481 -0.2652,-0.1481 -0.2651,-0.1481 -0.2651,-0.1482 -0.2650,-0.1482 -0.2649,-0.1483 -0.2649,-0.1484 -0.2648,-0.1484 -0.2648,-0.1485 -0.2648,-0.1486 -0.2648,-0.1556 -0.2648,-0.1557 -0.2648,-0.1558 -0.2649,-0.1558 -0.2649,-0.1559 -0.2649,-0.1560 -0.2650,-0.1560 -0.2651,-0.1560 -0.2651,-0.1561 -0.2652,-0.1561 -0.2653,-0.1561 -0.2671,-0.1561 -0.2671,-0.1556 -0.2671,-0.1555 -0.2671,-0.1554 -0.2672,-0.1554 -0.2672,-0.1553 -0.2673,-0.1553  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2640" cy="-0.1613" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2036,-0.1566 L-0.2036,-0.1561 -0.2036,-0.1560 -0.2036,-0.1559 -0.2036,-0.1558 -0.2036,-0.1557 -0.2037,-0.1557 -0.2037,-0.1556 -0.2038,-0.1556 -0.2038,-0.1555 -0.2039,-0.1555 -0.2039,-0.1554 -0.2040,-0.1554 -0.2041,-0.1554 -0.2041,-0.1553 -0.2042,-0.1553 -0.2043,-0.1553 -0.2044,-0.1553 -0.2044,-0.1554 -0.2045,-0.1554 -0.2045,-0.1555 -0.2046,-0.1556 -0.2046,-0.1561 -0.2063,-0.1561 -0.2064,-0.1561 -0.2065,-0.1561 -0.2065,-0.1560 -0.2066,-0.1560 -0.2067,-0.1560 -0.2067,-0.1559 -0.2067,-0.1558 -0.2068,-0.1558 -0.2068,-0.1557 -0.2068,-0.1556 -0.2068,-0.1486 -0.2068,-0.1485 -0.2068,-0.1484 -0.2067,-0.1484 -0.2067,-0.1483 -0.2066,-0.1482 -0.2065,-0.1482 -0.2065,-0.1481 -0.2064,-0.1481 -0.2063,-0.1481 -0.2046,-0.1481 -0.2046,-0.1487 -0.2045,-0.1487 -0.2045,-0.1488 -0.2045,-0.1489 -0.2044,-0.1489 -0.2043,-0.1489 -0.2042,-0.1489 -0.2041,-0.1489 -0.2040,-0.1488 -0.2039,-0.1488 -0.2039,-0.1487 -0.2038,-0.1487 -0.2038,-0.1486 -0.2037,-0.1486 -0.2037,-0.1485 -0.2036,-0.1485 -0.2036,-0.1484 -0.2036,-0.1483 -0.2036,-0.1482 -0.2036,-0.1481 -0.2036,-0.1476 -0.2036,-0.1475 -0.2036,-0.1474 -0.2036,-0.1473 -0.2037,-0.1473 -0.2037,-0.1472 -0.2038,-0.1472 -0.2039,-0.1471 -0.2040,-0.1471 -0.2041,-0.1471 -0.2063,-0.1471 -0.2064,-0.1471 -0.2065,-0.1471 -0.2065,-0.1470 -0.2066,-0.1470 -0.2067,-0.1470 -0.2067,-0.1469 -0.2067,-0.1468 -0.2068,-0.1468 -0.2068,-0.1467 -0.2068,-0.1466 -0.2068,-0.1439 -0.2068,-0.1438 -0.2068,-0.1437 -0.2068,-0.1436 -0.2067,-0.1435 -0.2067,-0.1434 -0.2067,-0.1433 -0.2066,-0.1433 -0.2066,-0.1432 -0.2053,-0.1409 -0.2053,-0.1406 -0.2053,-0.1405 -0.2053,-0.1404 -0.2054,-0.1404 -0.2054,-0.1403 -0.2054,-0.1402 -0.2055,-0.1402 -0.2056,-0.1402 -0.2057,-0.1402 -0.2091,-0.1402 -0.2092,-0.1402 -0.2093,-0.1402 -0.2094,-0.1402 -0.2094,-0.1403 -0.2094,-0.1404 -0.2095,-0.1404 -0.2095,-0.1405 -0.2095,-0.1406 -0.2095,-0.1409 -0.2086,-0.1425 -0.2086,-0.1426 -0.2085,-0.1426 -0.2085,-0.1427 -0.2085,-0.1428 -0.2084,-0.1429 -0.2084,-0.1430 -0.2084,-0.1431 -0.2084,-0.1432 -0.2084,-0.1513 -0.2246,-0.1513 -0.2247,-0.1513 -0.2248,-0.1513 -0.2249,-0.1514 -0.2250,-0.1514 -0.2251,-0.1515 -0.2252,-0.1515 -0.2252,-0.1516 -0.2253,-0.1517 -0.2253,-0.1518 -0.2254,-0.1518 -0.2254,-0.1519 -0.2254,-0.1520 -0.2254,-0.1521 -0.2254,-0.1522 -0.2254,-0.1523 -0.2254,-0.1524 -0.2253,-0.1524 -0.2253,-0.1525 -0.2253,-0.1526 -0.2252,-0.1526 -0.2252,-0.1527 -0.2251,-0.1527 -0.2250,-0.1528 -0.2249,-0.1528 -0.2249,-0.1529 -0.2248,-0.1529 -0.2247,-0.1529 -0.2246,-0.1529 -0.2084,-0.1529 -0.2084,-0.1611 -0.2084,-0.1612 -0.2084,-0.1613 -0.2084,-0.1614 -0.2084,-0.1615 -0.2085,-0.1615 -0.2085,-0.1616 -0.2085,-0.1617 -0.2086,-0.1618 -0.2095,-0.1634 -0.2095,-0.1638 -0.2095,-0.1639 -0.2094,-0.1640 -0.2094,-0.1641 -0.2093,-0.1641 -0.2092,-0.1641 -0.2092,-0.1642 -0.2091,-0.1642 -0.2057,-0.1642 -0.2056,-0.1642 -0.2056,-0.1641 -0.2055,-0.1641 -0.2054,-0.1641 -0.2054,-0.1640 -0.2053,-0.1639 -0.2053,-0.1638 -0.2053,-0.1634 -0.2066,-0.1611 -0.2067,-0.1610 -0.2067,-0.1609 -0.2067,-0.1608 -0.2068,-0.1608 -0.2068,-0.1607 -0.2068,-0.1606 -0.2068,-0.1605 -0.2068,-0.1604 -0.2068,-0.1576 -0.2068,-0.1575 -0.2068,-0.1574 -0.2067,-0.1574 -0.2067,-0.1573 -0.2066,-0.1572 -0.2065,-0.1572 -0.2065,-0.1571 -0.2064,-0.1571 -0.2063,-0.1571 -0.2041,-0.1571 -0.2040,-0.1571 -0.2039,-0.1571 -0.2038,-0.1571 -0.2038,-0.1570 -0.2037,-0.1570 -0.2037,-0.1569 -0.2036,-0.1569 -0.2036,-0.1568 -0.2036,-0.1567 -0.2036,-0.1566  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2069" cy="-0.1416" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2748,-0.1120 L-0.2748,-0.1128 -0.2746,-0.1129 -0.2744,-0.1130 -0.2742,-0.1131 -0.2740,-0.1133 -0.2738,-0.1134 -0.2736,-0.1135 -0.2734,-0.1136 -0.2732,-0.1136 -0.2730,-0.1137 -0.2727,-0.1138 -0.2725,-0.1139 -0.2723,-0.1139 -0.2721,-0.1140 -0.2718,-0.1140 -0.2716,-0.1140 -0.2714,-0.1140 -0.2712,-0.1141 -0.2709,-0.1141 -0.2707,-0.1141 -0.2705,-0.1141 -0.2702,-0.1140 -0.2700,-0.1140 -0.2698,-0.1140 -0.2695,-0.1139 -0.2693,-0.1139 -0.2691,-0.1138 -0.2689,-0.1137 -0.2687,-0.1137 -0.2684,-0.1136 -0.2682,-0.1135 -0.2680,-0.1134 -0.2678,-0.1133 -0.2677,-0.1133 -0.2677,-0.1134 -0.2676,-0.1134 -0.2676,-0.1135 -0.2676,-0.1136 -0.2676,-0.1137 -0.2677,-0.1137 -0.2679,-0.1138 -0.2681,-0.1139 -0.2683,-0.1140 -0.2685,-0.1140 -0.2687,-0.1141 -0.2689,-0.1142 -0.2691,-0.1142 -0.2693,-0.1143 -0.2695,-0.1143 -0.2697,-0.1144 -0.2700,-0.1144 -0.2702,-0.1144 -0.2704,-0.1144 -0.2706,-0.1144 -0.2708,-0.1144 -0.2710,-0.1144 -0.2713,-0.1144 -0.2715,-0.1144 -0.2717,-0.1144 -0.2719,-0.1143 -0.2721,-0.1143 -0.2723,-0.1143 -0.2725,-0.1142 -0.2728,-0.1142 -0.2730,-0.1141 -0.2732,-0.1140 -0.2734,-0.1139 -0.2736,-0.1139 -0.2738,-0.1138 -0.2740,-0.1137 -0.2742,-0.1136 -0.2743,-0.1135 -0.2744,-0.1135 -0.2744,-0.1134 -0.2745,-0.1134 -0.2745,-0.1135 -0.2746,-0.1135 -0.2747,-0.1136 -0.2747,-0.1137 -0.2747,-0.1138 -0.2747,-0.1139 -0.2747,-0.1140 -0.2747,-0.1141 -0.2747,-0.1142 -0.2747,-0.1143 -0.2746,-0.1144 -0.2746,-0.1145 -0.2745,-0.1145 -0.2745,-0.1146 -0.2744,-0.1146 -0.2744,-0.1147 -0.2743,-0.1147 -0.2743,-0.1148 -0.2742,-0.1148 -0.2741,-0.1148 -0.2740,-0.1148 -0.2739,-0.1149 -0.2738,-0.1149 -0.2737,-0.1148 -0.2736,-0.1148 -0.2735,-0.1148 -0.2734,-0.1148 -0.2733,-0.1147 -0.2732,-0.1147 -0.2731,-0.1147 -0.2730,-0.1147 -0.2730,-0.1148 -0.2729,-0.1148 -0.2728,-0.1148 -0.2727,-0.1148 -0.2727,-0.1149 -0.2726,-0.1149 -0.2725,-0.1149 -0.2724,-0.1149 -0.2723,-0.1149 -0.2722,-0.1149 -0.2722,-0.1150 -0.2721,-0.1150 -0.2720,-0.1150 -0.2690,-0.1150 -0.2689,-0.1150 -0.2688,-0.1150 -0.2688,-0.1149 -0.2687,-0.1149 -0.2686,-0.1149 -0.2685,-0.1149 -0.2684,-0.1149 -0.2683,-0.1149 -0.2682,-0.1148 -0.2681,-0.1148 -0.2680,-0.1148 -0.2679,-0.1147 -0.2678,-0.1147 -0.2677,-0.1147 -0.2677,-0.1146 -0.2676,-0.1146 -0.2675,-0.1145 -0.2674,-0.1145 -0.2674,-0.1144 -0.2673,-0.1144 -0.2672,-0.1143 -0.2672,-0.1142 -0.2671,-0.1142 -0.2670,-0.1141 -0.2670,-0.1140 -0.2669,-0.1140 -0.2669,-0.1139 -0.2668,-0.1138 -0.2668,-0.1137 -0.2667,-0.1136 -0.2667,-0.1135 -0.2667,-0.1134 -0.2666,-0.1133 -0.2666,-0.1132 -0.2666,-0.1131 -0.2666,-0.1130 -0.2666,-0.1129 -0.2665,-0.1129 -0.2665,-0.1118 -0.2684,-0.1118 -0.2689,-0.1113 -0.2689,-0.1108 -0.2684,-0.1105 -0.2683,-0.1104 -0.2683,-0.1103 -0.2684,-0.1102 -0.2689,-0.1099 -0.2690,-0.1099 -0.2690,-0.1098 -0.2691,-0.1098 -0.2692,-0.1098 -0.2693,-0.1098 -0.2694,-0.1098 -0.2720,-0.1098 -0.2721,-0.1098 -0.2722,-0.1098 -0.2723,-0.1098 -0.2724,-0.1098 -0.2724,-0.1099 -0.2725,-0.1099 -0.2730,-0.1102 -0.2730,-0.1103 -0.2731,-0.1103 -0.2731,-0.1104 -0.2730,-0.1105 -0.2724,-0.1108 -0.2724,-0.1113 -0.2729,-0.1118 -0.2746,-0.1118 -0.2747,-0.1118 -0.2748,-0.1118 -0.2748,-0.1119 -0.2748,-0.1120 M-0.2696,-0.1110 L-0.2696,-0.1111 -0.2696,-0.1112 -0.2696,-0.1113 -0.2697,-0.1113 -0.2697,-0.1114 -0.2697,-0.1115 -0.2698,-0.1115 -0.2698,-0.1116 -0.2699,-0.1116 -0.2699,-0.1117 -0.2700,-0.1117 -0.2701,-0.1117 -0.2702,-0.1117 -0.2702,-0.1118 -0.2703,-0.1118 -0.2711,-0.1118 -0.2712,-0.1118 -0.2712,-0.1117 -0.2713,-0.1117 -0.2714,-0.1117 -0.2715,-0.1117 -0.2715,-0.1116 -0.2716,-0.1116 -0.2716,-0.1115 -0.2717,-0.1115 -0.2717,-0.1114 -0.2717,-0.1113 -0.2718,-0.1113 -0.2718,-0.1112 -0.2718,-0.1111 -0.2718,-0.1110 -0.2718,-0.1109 -0.2718,-0.1108 -0.2718,-0.1107 -0.2717,-0.1107 -0.2717,-0.1106 -0.2717,-0.1105 -0.2716,-0.1105 -0.2716,-0.1104 -0.2715,-0.1104 -0.2714,-0.1103 -0.2713,-0.1103 -0.2712,-0.1103 -0.2711,-0.1103 -0.2703,-0.1103 -0.2702,-0.1103 -0.2701,-0.1103 -0.2700,-0.1103 -0.2699,-0.1104 -0.2698,-0.1104 -0.2698,-0.1105 -0.2697,-0.1105 -0.2697,-0.1106 -0.2697,-0.1107 -0.2696,-0.1107 -0.2696,-0.1108 -0.2696,-0.1109 -0.2696,-0.1110 M-0.2731,-0.1126 L-0.2730,-0.1126 -0.2730,-0.1125 -0.2729,-0.1125 -0.2697,-0.1125 -0.2696,-0.1125 -0.2695,-0.1125 -0.2694,-0.1125 -0.2693,-0.1125 -0.2692,-0.1126 -0.2691,-0.1126 -0.2690,-0.1126 -0.2689,-0.1126 -0.2688,-0.1126 -0.2687,-0.1126 -0.2686,-0.1126 -0.2685,-0.1126 -0.2684,-0.1126 -0.2683,-0.1126 -0.2682,-0.1126 -0.2681,-0.1127 -0.2680,-0.1127 -0.2679,-0.1127 -0.2678,-0.1127 -0.2677,-0.1127 -0.2676,-0.1128 -0.2676,-0.1129 -0.2676,-0.1130 -0.2677,-0.1130 -0.2679,-0.1131 -0.2680,-0.1131 -0.2682,-0.1131 -0.2684,-0.1131 -0.2685,-0.1131 -0.2687,-0.1132 -0.2689,-0.1132 -0.2690,-0.1132 -0.2692,-0.1132 -0.2694,-0.1132 -0.2695,-0.1132 -0.2697,-0.1132 -0.2699,-0.1132 -0.2700,-0.1132 -0.2702,-0.1132 -0.2704,-0.1132 -0.2705,-0.1132 -0.2707,-0.1132 -0.2709,-0.1132 -0.2710,-0.1132 -0.2712,-0.1132 -0.2714,-0.1132 -0.2715,-0.1132 -0.2717,-0.1132 -0.2719,-0.1131 -0.2720,-0.1131 -0.2722,-0.1131 -0.2724,-0.1131 -0.2725,-0.1131 -0.2727,-0.1130 -0.2729,-0.1130 -0.2730,-0.1130 -0.2731,-0.1130 -0.2732,-0.1130 -0.2733,-0.1129 -0.2733,-0.1128 -0.2732,-0.1128 -0.2732,-0.1127 -0.2732,-0.1126 -0.2731,-0.1126  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2712" cy="-0.1132" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2696,-0.1110 L-0.2696,-0.1111 -0.2696,-0.1112 -0.2696,-0.1113 -0.2697,-0.1113 -0.2697,-0.1114 -0.2697,-0.1115 -0.2698,-0.1115 -0.2698,-0.1116 -0.2699,-0.1116 -0.2699,-0.1117 -0.2700,-0.1117 -0.2701,-0.1117 -0.2702,-0.1117 -0.2702,-0.1118 -0.2703,-0.1118 -0.2711,-0.1118 -0.2712,-0.1118 -0.2712,-0.1117 -0.2713,-0.1117 -0.2714,-0.1117 -0.2715,-0.1117 -0.2715,-0.1116 -0.2716,-0.1116 -0.2716,-0.1115 -0.2717,-0.1115 -0.2717,-0.1114 -0.2717,-0.1113 -0.2718,-0.1113 -0.2718,-0.1112 -0.2718,-0.1111 -0.2718,-0.1110 -0.2718,-0.1109 -0.2718,-0.1108 -0.2718,-0.1107 -0.2717,-0.1107 -0.2717,-0.1106 -0.2717,-0.1105 -0.2716,-0.1105 -0.2716,-0.1104 -0.2715,-0.1104 -0.2714,-0.1103 -0.2713,-0.1103 -0.2712,-0.1103 -0.2711,-0.1103 -0.2703,-0.1103 -0.2702,-0.1103 -0.2701,-0.1103 -0.2700,-0.1103 -0.2699,-0.1104 -0.2698,-0.1104 -0.2698,-0.1105 -0.2697,-0.1105 -0.2697,-0.1106 -0.2697,-0.1107 -0.2696,-0.1107 -0.2696,-0.1108 -0.2696,-0.1109 -0.2696,-0.1110  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2731,-0.1126 L-0.2730,-0.1126 -0.2730,-0.1125 -0.2729,-0.1125 -0.2697,-0.1125 -0.2696,-0.1125 -0.2695,-0.1125 -0.2694,-0.1125 -0.2693,-0.1125 -0.2692,-0.1126 -0.2691,-0.1126 -0.2690,-0.1126 -0.2689,-0.1126 -0.2688,-0.1126 -0.2687,-0.1126 -0.2686,-0.1126 -0.2685,-0.1126 -0.2684,-0.1126 -0.2683,-0.1126 -0.2682,-0.1126 -0.2681,-0.1127 -0.2680,-0.1127 -0.2679,-0.1127 -0.2678,-0.1127 -0.2677,-0.1127 -0.2676,-0.1128 -0.2676,-0.1129 -0.2676,-0.1130 -0.2677,-0.1130 -0.2679,-0.1131 -0.2680,-0.1131 -0.2682,-0.1131 -0.2684,-0.1131 -0.2685,-0.1131 -0.2687,-0.1132 -0.2689,-0.1132 -0.2690,-0.1132 -0.2692,-0.1132 -0.2694,-0.1132 -0.2695,-0.1132 -0.2697,-0.1132 -0.2699,-0.1132 -0.2700,-0.1132 -0.2702,-0.1132 -0.2704,-0.1132 -0.2705,-0.1132 -0.2707,-0.1132 -0.2709,-0.1132 -0.2710,-0.1132 -0.2712,-0.1132 -0.2714,-0.1132 -0.2715,-0.1132 -0.2717,-0.1132 -0.2719,-0.1131 -0.2720,-0.1131 -0.2722,-0.1131 -0.2724,-0.1131 -0.2725,-0.1131 -0.2727,-0.1130 -0.2729,-0.1130 -0.2730,-0.1130 -0.2731,-0.1130 -0.2732,-0.1130 -0.2733,-0.1129 -0.2733,-0.1128 -0.2732,-0.1128 -0.2732,-0.1127 -0.2732,-0.1126 -0.2731,-0.1126  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2918,-0.1731 L-0.2920,-0.1730 -0.2922,-0.1729 -0.2924,-0.1728 -0.2927,-0.1728 -0.2929,-0.1727 -0.2931,-0.1726 -0.2933,-0.1726 -0.2935,-0.1725 -0.2938,-0.1725 -0.2940,-0.1724 -0.2942,-0.1724 -0.2945,-0.1724 -0.2947,-0.1724 -0.2949,-0.1724 -0.2952,-0.1724 -0.2954,-0.1724 -0.2956,-0.1724 -0.2959,-0.1725 -0.2961,-0.1725 -0.2963,-0.1726 -0.2965,-0.1726 -0.2968,-0.1727 -0.2970,-0.1728 -0.2972,-0.1728 -0.2974,-0.1729 -0.2976,-0.1730 -0.2978,-0.1731 -0.2980,-0.1732 -0.2982,-0.1734 -0.2984,-0.1735 -0.2986,-0.1736 -0.2988,-0.1738 -0.2988,-0.1746 -0.2988,-0.1747 -0.2987,-0.1747 -0.2986,-0.1748 -0.2969,-0.1748 -0.2964,-0.1753 -0.2964,-0.1758 -0.2969,-0.1760 -0.2970,-0.1760 -0.2970,-0.1761 -0.2971,-0.1761 -0.2971,-0.1762 -0.2970,-0.1763 -0.2965,-0.1766 -0.2964,-0.1766 -0.2964,-0.1767 -0.2963,-0.1767 -0.2962,-0.1767 -0.2961,-0.1767 -0.2961,-0.1768 -0.2960,-0.1768 -0.2934,-0.1768 -0.2933,-0.1768 -0.2933,-0.1767 -0.2932,-0.1767 -0.2931,-0.1767 -0.2930,-0.1767 -0.2930,-0.1766 -0.2929,-0.1766 -0.2924,-0.1763 -0.2923,-0.1763 -0.2923,-0.1762 -0.2923,-0.1761 -0.2924,-0.1760 -0.2929,-0.1758 -0.2929,-0.1753 -0.2924,-0.1748 -0.2905,-0.1748 -0.2905,-0.1736 -0.2905,-0.1735 -0.2906,-0.1735 -0.2906,-0.1734 -0.2906,-0.1733 -0.2906,-0.1732 -0.2906,-0.1731 -0.2907,-0.1730 -0.2907,-0.1729 -0.2907,-0.1728 -0.2908,-0.1727 -0.2909,-0.1726 -0.2909,-0.1725 -0.2910,-0.1724 -0.2910,-0.1723 -0.2911,-0.1723 -0.2911,-0.1722 -0.2912,-0.1721 -0.2913,-0.1721 -0.2913,-0.1720 -0.2914,-0.1719 -0.2915,-0.1719 -0.2916,-0.1718 -0.2917,-0.1717 -0.2918,-0.1717 -0.2919,-0.1716 -0.2920,-0.1716 -0.2921,-0.1716 -0.2921,-0.1715 -0.2922,-0.1715 -0.2923,-0.1715 -0.2924,-0.1714 -0.2925,-0.1714 -0.2926,-0.1714 -0.2927,-0.1714 -0.2928,-0.1714 -0.2929,-0.1714 -0.2930,-0.1714 -0.2960,-0.1714 -0.2961,-0.1714 -0.2962,-0.1714 -0.2963,-0.1714 -0.2964,-0.1714 -0.2965,-0.1714 -0.2966,-0.1714 -0.2966,-0.1715 -0.2967,-0.1715 -0.2968,-0.1715 -0.2969,-0.1715 -0.2970,-0.1716 -0.2971,-0.1716 -0.2972,-0.1716 -0.2973,-0.1716 -0.2974,-0.1716 -0.2975,-0.1715 -0.2976,-0.1715 -0.2977,-0.1715 -0.2978,-0.1715 -0.2979,-0.1715 -0.2980,-0.1715 -0.2981,-0.1715 -0.2982,-0.1715 -0.2983,-0.1716 -0.2984,-0.1716 -0.2984,-0.1717 -0.2985,-0.1717 -0.2985,-0.1718 -0.2986,-0.1719 -0.2987,-0.1720 -0.2987,-0.1721 -0.2987,-0.1722 -0.2987,-0.1723 -0.2987,-0.1724 -0.2987,-0.1725 -0.2987,-0.1726 -0.2987,-0.1727 -0.2986,-0.1728 -0.2986,-0.1729 -0.2985,-0.1729 -0.2984,-0.1729 -0.2984,-0.1728 -0.2983,-0.1728 -0.2982,-0.1727 -0.2980,-0.1726 -0.2978,-0.1726 -0.2976,-0.1725 -0.2974,-0.1724 -0.2972,-0.1723 -0.2969,-0.1722 -0.2967,-0.1722 -0.2965,-0.1721 -0.2963,-0.1721 -0.2961,-0.1720 -0.2959,-0.1720 -0.2957,-0.1720 -0.2955,-0.1720 -0.2952,-0.1720 -0.2950,-0.1719 -0.2948,-0.1719 -0.2946,-0.1719 -0.2944,-0.1720 -0.2942,-0.1720 -0.2939,-0.1720 -0.2937,-0.1720 -0.2935,-0.1721 -0.2933,-0.1721 -0.2931,-0.1722 -0.2929,-0.1722 -0.2927,-0.1723 -0.2925,-0.1724 -0.2923,-0.1724 -0.2921,-0.1725 -0.2919,-0.1726 -0.2917,-0.1727 -0.2916,-0.1727 -0.2916,-0.1728 -0.2916,-0.1729 -0.2916,-0.1730 -0.2916,-0.1731 -0.2917,-0.1731 -0.2918,-0.1731 M-0.2943,-0.1763 L-0.2951,-0.1763 -0.2952,-0.1763 -0.2952,-0.1762 -0.2953,-0.1762 -0.2954,-0.1762 -0.2955,-0.1762 -0.2955,-0.1761 -0.2956,-0.1761 -0.2956,-0.1760 -0.2957,-0.1760 -0.2957,-0.1759 -0.2957,-0.1758 -0.2958,-0.1758 -0.2958,-0.1757 -0.2958,-0.1756 -0.2958,-0.1755 -0.2958,-0.1754 -0.2958,-0.1753 -0.2958,-0.1752 -0.2957,-0.1752 -0.2957,-0.1751 -0.2957,-0.1750 -0.2956,-0.1750 -0.2956,-0.1749 -0.2955,-0.1749 -0.2954,-0.1748 -0.2953,-0.1748 -0.2952,-0.1748 -0.2951,-0.1748 -0.2943,-0.1748 -0.2942,-0.1748 -0.2941,-0.1748 -0.2940,-0.1748 -0.2939,-0.1749 -0.2938,-0.1749 -0.2938,-0.1750 -0.2937,-0.1750 -0.2937,-0.1751 -0.2937,-0.1752 -0.2936,-0.1752 -0.2936,-0.1753 -0.2936,-0.1754 -0.2936,-0.1755 -0.2936,-0.1756 -0.2936,-0.1757 -0.2936,-0.1758 -0.2937,-0.1759 -0.2937,-0.1760 -0.2938,-0.1760 -0.2938,-0.1761 -0.2939,-0.1761 -0.2939,-0.1762 -0.2940,-0.1762 -0.2941,-0.1762 -0.2942,-0.1762 -0.2942,-0.1763 -0.2943,-0.1763 M-0.2973,-0.1736 L-0.2972,-0.1736 -0.2972,-0.1735 -0.2971,-0.1735 -0.2970,-0.1735 -0.2968,-0.1735 -0.2967,-0.1735 -0.2965,-0.1734 -0.2964,-0.1734 -0.2962,-0.1734 -0.2960,-0.1734 -0.2959,-0.1734 -0.2957,-0.1734 -0.2955,-0.1733 -0.2954,-0.1733 -0.2952,-0.1733 -0.2950,-0.1733 -0.2949,-0.1733 -0.2947,-0.1733 -0.2945,-0.1733 -0.2944,-0.1733 -0.2942,-0.1733 -0.2940,-0.1733 -0.2939,-0.1733 -0.2937,-0.1733 -0.2935,-0.1733 -0.2934,-0.1733 -0.2932,-0.1733 -0.2930,-0.1733 -0.2929,-0.1733 -0.2927,-0.1734 -0.2925,-0.1734 -0.2924,-0.1734 -0.2922,-0.1734 -0.2920,-0.1734 -0.2919,-0.1735 -0.2917,-0.1735 -0.2916,-0.1735 -0.2916,-0.1736 -0.2916,-0.1737 -0.2916,-0.1738 -0.2917,-0.1738 -0.2918,-0.1738 -0.2919,-0.1738 -0.2920,-0.1738 -0.2920,-0.1739 -0.2921,-0.1739 -0.2922,-0.1739 -0.2923,-0.1739 -0.2924,-0.1739 -0.2925,-0.1739 -0.2926,-0.1739 -0.2927,-0.1739 -0.2928,-0.1739 -0.2929,-0.1739 -0.2929,-0.1740 -0.2930,-0.1740 -0.2931,-0.1740 -0.2932,-0.1740 -0.2933,-0.1740 -0.2934,-0.1740 -0.2935,-0.1740 -0.2936,-0.1740 -0.2937,-0.1740 -0.2969,-0.1740 -0.2970,-0.1740 -0.2970,-0.1739 -0.2971,-0.1739 -0.2972,-0.1739 -0.2972,-0.1738 -0.2972,-0.1737 -0.2973,-0.1737 -0.2973,-0.1736  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2951" cy="-0.1733" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2943,-0.1763 L-0.2951,-0.1763 -0.2952,-0.1763 -0.2952,-0.1762 -0.2953,-0.1762 -0.2954,-0.1762 -0.2955,-0.1762 -0.2955,-0.1761 -0.2956,-0.1761 -0.2956,-0.1760 -0.2957,-0.1760 -0.2957,-0.1759 -0.2957,-0.1758 -0.2958,-0.1758 -0.2958,-0.1757 -0.2958,-0.1756 -0.2958,-0.1755 -0.2958,-0.1754 -0.2958,-0.1753 -0.2958,-0.1752 -0.2957,-0.1752 -0.2957,-0.1751 -0.2957,-0.1750 -0.2956,-0.1750 -0.2956,-0.1749 -0.2955,-0.1749 -0.2954,-0.1748 -0.2953,-0.1748 -0.2952,-0.1748 -0.2951,-0.1748 -0.2943,-0.1748 -0.2942,-0.1748 -0.2941,-0.1748 -0.2940,-0.1748 -0.2939,-0.1749 -0.2938,-0.1749 -0.2938,-0.1750 -0.2937,-0.1750 -0.2937,-0.1751 -0.2937,-0.1752 -0.2936,-0.1752 -0.2936,-0.1753 -0.2936,-0.1754 -0.2936,-0.1755 -0.2936,-0.1756 -0.2936,-0.1757 -0.2936,-0.1758 -0.2937,-0.1759 -0.2937,-0.1760 -0.2938,-0.1760 -0.2938,-0.1761 -0.2939,-0.1761 -0.2939,-0.1762 -0.2940,-0.1762 -0.2941,-0.1762 -0.2942,-0.1762 -0.2942,-0.1763 -0.2943,-0.1763  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2973,-0.1736 L-0.2972,-0.1736 -0.2972,-0.1735 -0.2971,-0.1735 -0.2970,-0.1735 -0.2968,-0.1735 -0.2967,-0.1735 -0.2965,-0.1734 -0.2964,-0.1734 -0.2962,-0.1734 -0.2960,-0.1734 -0.2959,-0.1734 -0.2957,-0.1734 -0.2955,-0.1733 -0.2954,-0.1733 -0.2952,-0.1733 -0.2950,-0.1733 -0.2949,-0.1733 -0.2947,-0.1733 -0.2945,-0.1733 -0.2944,-0.1733 -0.2942,-0.1733 -0.2940,-0.1733 -0.2939,-0.1733 -0.2937,-0.1733 -0.2935,-0.1733 -0.2934,-0.1733 -0.2932,-0.1733 -0.2930,-0.1733 -0.2929,-0.1733 -0.2927,-0.1734 -0.2925,-0.1734 -0.2924,-0.1734 -0.2922,-0.1734 -0.2920,-0.1734 -0.2919,-0.1735 -0.2917,-0.1735 -0.2916,-0.1735 -0.2916,-0.1736 -0.2916,-0.1737 -0.2916,-0.1738 -0.2917,-0.1738 -0.2918,-0.1738 -0.2919,-0.1738 -0.2920,-0.1738 -0.2920,-0.1739 -0.2921,-0.1739 -0.2922,-0.1739 -0.2923,-0.1739 -0.2924,-0.1739 -0.2925,-0.1739 -0.2926,-0.1739 -0.2927,-0.1739 -0.2928,-0.1739 -0.2929,-0.1739 -0.2929,-0.1740 -0.2930,-0.1740 -0.2931,-0.1740 -0.2932,-0.1740 -0.2933,-0.1740 -0.2934,-0.1740 -0.2935,-0.1740 -0.2936,-0.1740 -0.2937,-0.1740 -0.2969,-0.1740 -0.2970,-0.1740 -0.2970,-0.1739 -0.2971,-0.1739 -0.2972,-0.1739 -0.2972,-0.1738 -0.2972,-0.1737 -0.2973,-0.1737 -0.2973,-0.1736  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2763,-0.1751 L-0.2763,-0.1743 -0.2765,-0.1741 -0.2767,-0.1740 -0.2768,-0.1738 -0.2770,-0.1737 -0.2772,-0.1736 -0.2774,-0.1734 -0.2776,-0.1733 -0.2779,-0.1732 -0.2781,-0.1731 -0.2783,-0.1730 -0.2785,-0.1730 -0.2787,-0.1729 -0.2789,-0.1728 -0.2792,-0.1728 -0.2794,-0.1727 -0.2796,-0.1727 -0.2799,-0.1726 -0.2801,-0.1726 -0.2803,-0.1726 -0.2806,-0.1726 -0.2808,-0.1726 -0.2810,-0.1726 -0.2813,-0.1726 -0.2815,-0.1726 -0.2817,-0.1727 -0.2820,-0.1727 -0.2822,-0.1728 -0.2824,-0.1728 -0.2826,-0.1729 -0.2829,-0.1730 -0.2831,-0.1730 -0.2833,-0.1731 -0.2834,-0.1731 -0.2835,-0.1731 -0.2835,-0.1730 -0.2835,-0.1729 -0.2835,-0.1728 -0.2835,-0.1727 -0.2834,-0.1727 -0.2832,-0.1726 -0.2830,-0.1725 -0.2828,-0.1724 -0.2826,-0.1724 -0.2824,-0.1723 -0.2822,-0.1722 -0.2820,-0.1722 -0.2818,-0.1721 -0.2816,-0.1721 -0.2814,-0.1720 -0.2812,-0.1720 -0.2809,-0.1720 -0.2807,-0.1720 -0.2805,-0.1719 -0.2803,-0.1719 -0.2801,-0.1719 -0.2799,-0.1720 -0.2796,-0.1720 -0.2794,-0.1720 -0.2792,-0.1720 -0.2790,-0.1720 -0.2788,-0.1721 -0.2786,-0.1721 -0.2784,-0.1722 -0.2781,-0.1722 -0.2779,-0.1723 -0.2777,-0.1724 -0.2775,-0.1725 -0.2773,-0.1726 -0.2771,-0.1726 -0.2769,-0.1727 -0.2768,-0.1728 -0.2767,-0.1728 -0.2767,-0.1729 -0.2766,-0.1729 -0.2765,-0.1729 -0.2765,-0.1728 -0.2764,-0.1727 -0.2764,-0.1726 -0.2764,-0.1725 -0.2764,-0.1724 -0.2764,-0.1723 -0.2764,-0.1722 -0.2764,-0.1721 -0.2764,-0.1720 -0.2765,-0.1719 -0.2766,-0.1718 -0.2766,-0.1717 -0.2767,-0.1717 -0.2767,-0.1716 -0.2768,-0.1716 -0.2769,-0.1715 -0.2770,-0.1715 -0.2771,-0.1715 -0.2772,-0.1715 -0.2773,-0.1715 -0.2774,-0.1715 -0.2775,-0.1715 -0.2776,-0.1715 -0.2777,-0.1716 -0.2778,-0.1716 -0.2779,-0.1716 -0.2780,-0.1716 -0.2781,-0.1716 -0.2782,-0.1715 -0.2783,-0.1715 -0.2784,-0.1715 -0.2785,-0.1715 -0.2785,-0.1714 -0.2786,-0.1714 -0.2787,-0.1714 -0.2788,-0.1714 -0.2789,-0.1714 -0.2790,-0.1714 -0.2791,-0.1714 -0.2821,-0.1714 -0.2822,-0.1714 -0.2823,-0.1714 -0.2824,-0.1714 -0.2825,-0.1714 -0.2826,-0.1714 -0.2827,-0.1714 -0.2828,-0.1714 -0.2829,-0.1715 -0.2830,-0.1715 -0.2831,-0.1715 -0.2832,-0.1716 -0.2833,-0.1716 -0.2834,-0.1717 -0.2835,-0.1717 -0.2836,-0.1718 -0.2837,-0.1718 -0.2837,-0.1719 -0.2838,-0.1720 -0.2839,-0.1720 -0.2839,-0.1721 -0.2840,-0.1721 -0.2841,-0.1722 -0.2841,-0.1723 -0.2842,-0.1724 -0.2843,-0.1725 -0.2843,-0.1726 -0.2843,-0.1727 -0.2844,-0.1727 -0.2844,-0.1728 -0.2844,-0.1729 -0.2845,-0.1730 -0.2845,-0.1731 -0.2845,-0.1732 -0.2845,-0.1733 -0.2845,-0.1734 -0.2846,-0.1734 -0.2846,-0.1753 -0.2827,-0.1753 -0.2822,-0.1758 -0.2822,-0.1763 -0.2827,-0.1765 -0.2827,-0.1766 -0.2828,-0.1766 -0.2828,-0.1767 -0.2828,-0.1768 -0.2827,-0.1768 -0.2822,-0.1771 -0.2821,-0.1771 -0.2821,-0.1772 -0.2820,-0.1772 -0.2819,-0.1772 -0.2818,-0.1772 -0.2818,-0.1773 -0.2817,-0.1773 -0.2791,-0.1773 -0.2790,-0.1773 -0.2790,-0.1772 -0.2789,-0.1772 -0.2788,-0.1772 -0.2787,-0.1772 -0.2787,-0.1771 -0.2786,-0.1771 -0.2781,-0.1768 -0.2780,-0.1767 -0.2780,-0.1766 -0.2781,-0.1766 -0.2781,-0.1765 -0.2787,-0.1763 -0.2787,-0.1758 -0.2782,-0.1753 -0.2765,-0.1753 -0.2764,-0.1752 -0.2763,-0.1752 -0.2763,-0.1751 M-0.2780,-0.1744 L-0.2781,-0.1744 -0.2781,-0.1745 -0.2782,-0.1745 -0.2814,-0.1745 -0.2815,-0.1745 -0.2816,-0.1745 -0.2817,-0.1745 -0.2818,-0.1745 -0.2819,-0.1745 -0.2820,-0.1745 -0.2821,-0.1745 -0.2822,-0.1744 -0.2823,-0.1744 -0.2824,-0.1744 -0.2825,-0.1744 -0.2826,-0.1744 -0.2827,-0.1744 -0.2828,-0.1744 -0.2829,-0.1744 -0.2830,-0.1744 -0.2831,-0.1744 -0.2831,-0.1743 -0.2832,-0.1743 -0.2833,-0.1743 -0.2834,-0.1743 -0.2834,-0.1742 -0.2835,-0.1742 -0.2835,-0.1741 -0.2835,-0.1740 -0.2835,-0.1739 -0.2835,-0.1738 -0.2834,-0.1737 -0.2832,-0.1737 -0.2831,-0.1736 -0.2829,-0.1736 -0.2827,-0.1736 -0.2826,-0.1736 -0.2824,-0.1736 -0.2822,-0.1735 -0.2821,-0.1735 -0.2819,-0.1735 -0.2817,-0.1735 -0.2816,-0.1735 -0.2814,-0.1735 -0.2812,-0.1735 -0.2811,-0.1735 -0.2809,-0.1735 -0.2807,-0.1735 -0.2806,-0.1735 -0.2804,-0.1735 -0.2802,-0.1735 -0.2801,-0.1735 -0.2799,-0.1735 -0.2797,-0.1735 -0.2796,-0.1735 -0.2794,-0.1736 -0.2792,-0.1736 -0.2791,-0.1736 -0.2789,-0.1736 -0.2787,-0.1736 -0.2786,-0.1736 -0.2784,-0.1737 -0.2782,-0.1737 -0.2781,-0.1737 -0.2780,-0.1737 -0.2779,-0.1737 -0.2779,-0.1738 -0.2778,-0.1738 -0.2778,-0.1739 -0.2778,-0.1740 -0.2778,-0.1741 -0.2779,-0.1741 -0.2779,-0.1742 -0.2779,-0.1743 -0.2780,-0.1743 -0.2780,-0.1744 M-0.2815,-0.1761 L-0.2815,-0.1760 -0.2815,-0.1759 -0.2815,-0.1758 -0.2815,-0.1757 -0.2814,-0.1757 -0.2814,-0.1756 -0.2814,-0.1755 -0.2813,-0.1755 -0.2813,-0.1754 -0.2812,-0.1754 -0.2811,-0.1753 -0.2810,-0.1753 -0.2809,-0.1753 -0.2808,-0.1753 -0.2800,-0.1753 -0.2799,-0.1753 -0.2798,-0.1753 -0.2797,-0.1753 -0.2796,-0.1754 -0.2795,-0.1754 -0.2795,-0.1755 -0.2794,-0.1755 -0.2794,-0.1756 -0.2794,-0.1757 -0.2793,-0.1757 -0.2793,-0.1758 -0.2793,-0.1759 -0.2793,-0.1760 -0.2793,-0.1761 -0.2793,-0.1762 -0.2793,-0.1763 -0.2794,-0.1763 -0.2794,-0.1764 -0.2794,-0.1765 -0.2795,-0.1765 -0.2795,-0.1766 -0.2796,-0.1766 -0.2796,-0.1767 -0.2797,-0.1767 -0.2798,-0.1767 -0.2799,-0.1767 -0.2799,-0.1768 -0.2800,-0.1768 -0.2808,-0.1768 -0.2809,-0.1768 -0.2809,-0.1767 -0.2810,-0.1767 -0.2811,-0.1767 -0.2812,-0.1767 -0.2812,-0.1766 -0.2813,-0.1766 -0.2813,-0.1765 -0.2814,-0.1765 -0.2814,-0.1764 -0.2814,-0.1763 -0.2815,-0.1763 -0.2815,-0.1762 -0.2815,-0.1761  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.2804" cy="-0.1738" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.2780,-0.1744 L-0.2781,-0.1744 -0.2781,-0.1745 -0.2782,-0.1745 -0.2814,-0.1745 -0.2815,-0.1745 -0.2816,-0.1745 -0.2817,-0.1745 -0.2818,-0.1745 -0.2819,-0.1745 -0.2820,-0.1745 -0.2821,-0.1745 -0.2822,-0.1744 -0.2823,-0.1744 -0.2824,-0.1744 -0.2825,-0.1744 -0.2826,-0.1744 -0.2827,-0.1744 -0.2828,-0.1744 -0.2829,-0.1744 -0.2830,-0.1744 -0.2831,-0.1744 -0.2831,-0.1743 -0.2832,-0.1743 -0.2833,-0.1743 -0.2834,-0.1743 -0.2834,-0.1742 -0.2835,-0.1742 -0.2835,-0.1741 -0.2835,-0.1740 -0.2835,-0.1739 -0.2835,-0.1738 -0.2834,-0.1737 -0.2832,-0.1737 -0.2831,-0.1736 -0.2829,-0.1736 -0.2827,-0.1736 -0.2826,-0.1736 -0.2824,-0.1736 -0.2822,-0.1735 -0.2821,-0.1735 -0.2819,-0.1735 -0.2817,-0.1735 -0.2816,-0.1735 -0.2814,-0.1735 -0.2812,-0.1735 -0.2811,-0.1735 -0.2809,-0.1735 -0.2807,-0.1735 -0.2806,-0.1735 -0.2804,-0.1735 -0.2802,-0.1735 -0.2801,-0.1735 -0.2799,-0.1735 -0.2797,-0.1735 -0.2796,-0.1735 -0.2794,-0.1736 -0.2792,-0.1736 -0.2791,-0.1736 -0.2789,-0.1736 -0.2787,-0.1736 -0.2786,-0.1736 -0.2784,-0.1737 -0.2782,-0.1737 -0.2781,-0.1737 -0.2780,-0.1737 -0.2779,-0.1737 -0.2779,-0.1738 -0.2778,-0.1738 -0.2778,-0.1739 -0.2778,-0.1740 -0.2778,-0.1741 -0.2779,-0.1741 -0.2779,-0.1742 -0.2779,-0.1743 -0.2780,-0.1743 -0.2780,-0.1744  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.2815,-0.1761 L-0.2815,-0.1760 -0.2815,-0.1759 -0.2815,-0.1758 -0.2815,-0.1757 -0.2814,-0.1757 -0.2814,-0.1756 -0.2814,-0.1755 -0.2813,-0.1755 -0.2813,-0.1754 -0.2812,-0.1754 -0.2811,-0.1753 -0.2810,-0.1753 -0.2809,-0.1753 -0.2808,-0.1753 -0.2800,-0.1753 -0.2799,-0.1753 -0.2798,-0.1753 -0.2797,-0.1753 -0.2796,-0.1754 -0.2795,-0.1754 -0.2795,-0.1755 -0.2794,-0.1755 -0.2794,-0.1756 -0.2794,-0.1757 -0.2793,-0.1757 -0.2793,-0.1758 -0.2793,-0.1759 -0.2793,-0.1760 -0.2793,-0.1761 -0.2793,-0.1762 -0.2793,-0.1763 -0.2794,-0.1763 -0.2794,-0.1764 -0.2794,-0.1765 -0.2795,-0.1765 -0.2795,-0.1766 -0.2796,-0.1766 -0.2796,-0.1767 -0.2797,-0.1767 -0.2798,-0.1767 -0.2799,-0.1767 -0.2799,-0.1768 -0.2800,-0.1768 -0.2808,-0.1768 -0.2809,-0.1768 -0.2809,-0.1767 -0.2810,-0.1767 -0.2811,-0.1767 -0.2812,-0.1767 -0.2812,-0.1766 -0.2813,-0.1766 -0.2813,-0.1765 -0.2814,-0.1765 -0.2814,-0.1764 -0.2814,-0.1763 -0.2815,-0.1763 -0.2815,-0.1762 -0.2815,-0.1761  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1855,-0.1758 L-0.1867,-0.1758 -0.1867,-0.1760 -0.1866,-0.1761 -0.1865,-0.1762 -0.1864,-0.1763 -0.1863,-0.1764 -0.1862,-0.1765 -0.1861,-0.1766 -0.1861,-0.1767 -0.1860,-0.1767 -0.1860,-0.1768 -0.1859,-0.1768 -0.1859,-0.1769 -0.1858,-0.1770 -0.1857,-0.1770 -0.1857,-0.1771 -0.1856,-0.1771 -0.1856,-0.1772 -0.1855,-0.1772 -0.1854,-0.1773 -0.1853,-0.1774 -0.1852,-0.1774 -0.1852,-0.1775 -0.1851,-0.1775 -0.1851,-0.1776 -0.1850,-0.1776 -0.1849,-0.1777 -0.1848,-0.1778 -0.1828,-0.1778 -0.1827,-0.1777 -0.1826,-0.1776 -0.1825,-0.1776 -0.1825,-0.1775 -0.1824,-0.1775 -0.1824,-0.1774 -0.1823,-0.1774 -0.1822,-0.1773 -0.1821,-0.1772 -0.1820,-0.1772 -0.1820,-0.1771 -0.1819,-0.1771 -0.1819,-0.1770 -0.1818,-0.1770 -0.1817,-0.1769 -0.1817,-0.1768 -0.1816,-0.1768 -0.1816,-0.1767 -0.1815,-0.1767 -0.1815,-0.1766 -0.1814,-0.1765 -0.1813,-0.1764 -0.1812,-0.1763 -0.1811,-0.1762 -0.1810,-0.1761 -0.1810,-0.1760 -0.1810,-0.1758 -0.1820,-0.1758 -0.1820,-0.1753 -0.1815,-0.1748 -0.1796,-0.1748 -0.1795,-0.1747 -0.1794,-0.1746 -0.1793,-0.1745 -0.1792,-0.1744 -0.1791,-0.1744 -0.1791,-0.1743 -0.1790,-0.1742 -0.1789,-0.1741 -0.1788,-0.1740 -0.1787,-0.1739 -0.1787,-0.1738 -0.1786,-0.1737 -0.1785,-0.1737 -0.1785,-0.1736 -0.1784,-0.1735 -0.1783,-0.1734 -0.1783,-0.1733 -0.1782,-0.1732 -0.1781,-0.1731 -0.1781,-0.1730 -0.1780,-0.1729 -0.1780,-0.1728 -0.1779,-0.1727 -0.1779,-0.1726 -0.1778,-0.1725 -0.1777,-0.1724 -0.1777,-0.1723 -0.1776,-0.1722 -0.1776,-0.1721 -0.1776,-0.1719 -0.1775,-0.1718 -0.1775,-0.1717 -0.1774,-0.1717 -0.1774,-0.1716 -0.1774,-0.1715 -0.1774,-0.1714 -0.1775,-0.1714 -0.1775,-0.1713 -0.1776,-0.1713 -0.1777,-0.1713 -0.1778,-0.1713 -0.1790,-0.1718 -0.1790,-0.1719 -0.1791,-0.1719 -0.1792,-0.1718 -0.1793,-0.1718 -0.1795,-0.1717 -0.1796,-0.1716 -0.1798,-0.1716 -0.1799,-0.1715 -0.1800,-0.1715 -0.1802,-0.1714 -0.1803,-0.1714 -0.1805,-0.1713 -0.1806,-0.1713 -0.1808,-0.1713 -0.1810,-0.1713 -0.1811,-0.1713 -0.1813,-0.1713 -0.1814,-0.1713 -0.1816,-0.1713 -0.1817,-0.1713 -0.1819,-0.1713 -0.1820,-0.1713 -0.1822,-0.1713 -0.1823,-0.1714 -0.1825,-0.1714 -0.1826,-0.1714 -0.1828,-0.1715 -0.1829,-0.1715 -0.1831,-0.1716 -0.1832,-0.1716 -0.1834,-0.1717 -0.1835,-0.1718 -0.1836,-0.1719 -0.1838,-0.1719 -0.1839,-0.1720 -0.1839,-0.1721 -0.1840,-0.1721 -0.1841,-0.1720 -0.1858,-0.1717 -0.1858,-0.1716 -0.1859,-0.1716 -0.1859,-0.1715 -0.1859,-0.1714 -0.1860,-0.1714 -0.1860,-0.1713 -0.1861,-0.1713 -0.1862,-0.1713 -0.1863,-0.1713 -0.1864,-0.1713 -0.1865,-0.1713 -0.1866,-0.1713 -0.1867,-0.1714 -0.1867,-0.1715 -0.1868,-0.1715 -0.1868,-0.1716 -0.1869,-0.1716 -0.1869,-0.1717 -0.1869,-0.1718 -0.1869,-0.1719 -0.1869,-0.1720 -0.1868,-0.1721 -0.1868,-0.1722 -0.1867,-0.1722 -0.1867,-0.1723 -0.1866,-0.1723 -0.1866,-0.1724 -0.1865,-0.1724 -0.1847,-0.1732 -0.1846,-0.1732 -0.1845,-0.1732 -0.1845,-0.1733 -0.1846,-0.1733 -0.1847,-0.1734 -0.1848,-0.1734 -0.1849,-0.1734 -0.1850,-0.1734 -0.1851,-0.1734 -0.1852,-0.1734 -0.1852,-0.1735 -0.1853,-0.1735 -0.1854,-0.1735 -0.1868,-0.1735 -0.1869,-0.1735 -0.1870,-0.1735 -0.1870,-0.1736 -0.1870,-0.1737 -0.1870,-0.1746 -0.1870,-0.1747 -0.1869,-0.1747 -0.1868,-0.1748 -0.1860,-0.1748 -0.1855,-0.1753 -0.1855,-0.1758 M-0.1846,-0.1763 L-0.1846,-0.1756 -0.1846,-0.1755 -0.1846,-0.1754 -0.1846,-0.1753 -0.1845,-0.1753 -0.1845,-0.1752 -0.1845,-0.1751 -0.1844,-0.1751 -0.1844,-0.1750 -0.1843,-0.1750 -0.1843,-0.1749 -0.1842,-0.1749 -0.1841,-0.1748 -0.1840,-0.1748 -0.1839,-0.1748 -0.1838,-0.1748 -0.1836,-0.1748 -0.1835,-0.1748 -0.1834,-0.1748 -0.1833,-0.1748 -0.1832,-0.1749 -0.1831,-0.1749 -0.1831,-0.1750 -0.1830,-0.1750 -0.1830,-0.1751 -0.1829,-0.1751 -0.1829,-0.1752 -0.1829,-0.1753 -0.1828,-0.1753 -0.1828,-0.1754 -0.1828,-0.1755 -0.1828,-0.1756 -0.1828,-0.1763 -0.1828,-0.1764 -0.1828,-0.1765 -0.1829,-0.1766 -0.1829,-0.1767 -0.1830,-0.1767 -0.1830,-0.1768 -0.1831,-0.1768 -0.1831,-0.1769 -0.1832,-0.1769 -0.1832,-0.1770 -0.1833,-0.1770 -0.1834,-0.1770 -0.1835,-0.1770 -0.1835,-0.1771 -0.1836,-0.1771 -0.1838,-0.1771 -0.1839,-0.1771 -0.1839,-0.1770 -0.1840,-0.1770 -0.1841,-0.1770 -0.1842,-0.1770 -0.1842,-0.1769 -0.1843,-0.1769 -0.1843,-0.1768 -0.1844,-0.1768 -0.1844,-0.1767 -0.1845,-0.1767 -0.1845,-0.1766 -0.1846,-0.1765 -0.1846,-0.1764 -0.1846,-0.1763 M-0.1800,-0.1729 L-0.1800,-0.1730 -0.1800,-0.1731 -0.1801,-0.1731 -0.1801,-0.1732 -0.1802,-0.1732 -0.1803,-0.1733 -0.1804,-0.1733 -0.1805,-0.1733 -0.1805,-0.1734 -0.1806,-0.1734 -0.1807,-0.1734 -0.1808,-0.1734 -0.1809,-0.1734 -0.1810,-0.1734 -0.1810,-0.1735 -0.1811,-0.1735 -0.1812,-0.1735 -0.1831,-0.1735 -0.1831,-0.1734 -0.1832,-0.1734 -0.1832,-0.1733 -0.1833,-0.1733 -0.1832,-0.1732 -0.1832,-0.1731 -0.1831,-0.1731 -0.1830,-0.1731 -0.1830,-0.1730 -0.1829,-0.1730 -0.1828,-0.1730 -0.1827,-0.1730 -0.1826,-0.1730 -0.1825,-0.1729 -0.1824,-0.1729 -0.1823,-0.1729 -0.1822,-0.1729 -0.1822,-0.1728 -0.1821,-0.1728 -0.1820,-0.1728 -0.1819,-0.1728 -0.1818,-0.1727 -0.1817,-0.1727 -0.1816,-0.1727 -0.1815,-0.1726 -0.1814,-0.1726 -0.1813,-0.1725 -0.1812,-0.1725 -0.1811,-0.1725 -0.1811,-0.1724 -0.1810,-0.1724 -0.1809,-0.1724 -0.1808,-0.1724 -0.1808,-0.1723 -0.1807,-0.1723 -0.1806,-0.1723 -0.1805,-0.1724 -0.1804,-0.1724 -0.1803,-0.1724 -0.1803,-0.1725 -0.1802,-0.1725 -0.1801,-0.1725 -0.1801,-0.1726 -0.1800,-0.1726 -0.1800,-0.1727 -0.1800,-0.1728 -0.1800,-0.1729  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.1821" cy="-0.1735" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.1846,-0.1763 L-0.1846,-0.1756 -0.1846,-0.1755 -0.1846,-0.1754 -0.1846,-0.1753 -0.1845,-0.1753 -0.1845,-0.1752 -0.1845,-0.1751 -0.1844,-0.1751 -0.1844,-0.1750 -0.1843,-0.1750 -0.1843,-0.1749 -0.1842,-0.1749 -0.1841,-0.1748 -0.1840,-0.1748 -0.1839,-0.1748 -0.1838,-0.1748 -0.1836,-0.1748 -0.1835,-0.1748 -0.1834,-0.1748 -0.1833,-0.1748 -0.1832,-0.1749 -0.1831,-0.1749 -0.1831,-0.1750 -0.1830,-0.1750 -0.1830,-0.1751 -0.1829,-0.1751 -0.1829,-0.1752 -0.1829,-0.1753 -0.1828,-0.1753 -0.1828,-0.1754 -0.1828,-0.1755 -0.1828,-0.1756 -0.1828,-0.1763 -0.1828,-0.1764 -0.1828,-0.1765 -0.1829,-0.1766 -0.1829,-0.1767 -0.1830,-0.1767 -0.1830,-0.1768 -0.1831,-0.1768 -0.1831,-0.1769 -0.1832,-0.1769 -0.1832,-0.1770 -0.1833,-0.1770 -0.1834,-0.1770 -0.1835,-0.1770 -0.1835,-0.1771 -0.1836,-0.1771 -0.1838,-0.1771 -0.1839,-0.1771 -0.1839,-0.1770 -0.1840,-0.1770 -0.1841,-0.1770 -0.1842,-0.1770 -0.1842,-0.1769 -0.1843,-0.1769 -0.1843,-0.1768 -0.1844,-0.1768 -0.1844,-0.1767 -0.1845,-0.1767 -0.1845,-0.1766 -0.1846,-0.1765 -0.1846,-0.1764 -0.1846,-0.1763  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1800,-0.1729 L-0.1800,-0.1730 -0.1800,-0.1731 -0.1801,-0.1731 -0.1801,-0.1732 -0.1802,-0.1732 -0.1803,-0.1733 -0.1804,-0.1733 -0.1805,-0.1733 -0.1805,-0.1734 -0.1806,-0.1734 -0.1807,-0.1734 -0.1808,-0.1734 -0.1809,-0.1734 -0.1810,-0.1734 -0.1810,-0.1735 -0.1811,-0.1735 -0.1812,-0.1735 -0.1831,-0.1735 -0.1831,-0.1734 -0.1832,-0.1734 -0.1832,-0.1733 -0.1833,-0.1733 -0.1832,-0.1732 -0.1832,-0.1731 -0.1831,-0.1731 -0.1830,-0.1731 -0.1830,-0.1730 -0.1829,-0.1730 -0.1828,-0.1730 -0.1827,-0.1730 -0.1826,-0.1730 -0.1825,-0.1729 -0.1824,-0.1729 -0.1823,-0.1729 -0.1822,-0.1729 -0.1822,-0.1728 -0.1821,-0.1728 -0.1820,-0.1728 -0.1819,-0.1728 -0.1818,-0.1727 -0.1817,-0.1727 -0.1816,-0.1727 -0.1815,-0.1726 -0.1814,-0.1726 -0.1813,-0.1725 -0.1812,-0.1725 -0.1811,-0.1725 -0.1811,-0.1724 -0.1810,-0.1724 -0.1809,-0.1724 -0.1808,-0.1724 -0.1808,-0.1723 -0.1807,-0.1723 -0.1806,-0.1723 -0.1805,-0.1724 -0.1804,-0.1724 -0.1803,-0.1724 -0.1803,-0.1725 -0.1802,-0.1725 -0.1801,-0.1725 -0.1801,-0.1726 -0.1800,-0.1726 -0.1800,-0.1727 -0.1800,-0.1728 -0.1800,-0.1729  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1848,-0.1421 L-0.1849,-0.1417 -0.1850,-0.1417 -0.1850,-0.1416 -0.1850,-0.1415 -0.1851,-0.1415 -0.1851,-0.1414 -0.1852,-0.1414 -0.1853,-0.1414 -0.1853,-0.1413 -0.1854,-0.1413 -0.1855,-0.1413 -0.1856,-0.1413 -0.1857,-0.1413 -0.1858,-0.1413 -0.1859,-0.1413 -0.1859,-0.1414 -0.1860,-0.1414 -0.1861,-0.1415 -0.1862,-0.1415 -0.1862,-0.1416 -0.1863,-0.1416 -0.1864,-0.1416 -0.1864,-0.1417 -0.1865,-0.1417 -0.1866,-0.1417 -0.1866,-0.1418 -0.1867,-0.1418 -0.1868,-0.1419 -0.1872,-0.1423 -0.1888,-0.1423 -0.1889,-0.1423 -0.1890,-0.1423 -0.1891,-0.1423 -0.1892,-0.1423 -0.1893,-0.1423 -0.1894,-0.1423 -0.1895,-0.1423 -0.1896,-0.1423 -0.1897,-0.1423 -0.1898,-0.1423 -0.1899,-0.1423 -0.1900,-0.1423 -0.1901,-0.1423 -0.1902,-0.1423 -0.1903,-0.1423 -0.1904,-0.1423 -0.1905,-0.1423 -0.1906,-0.1423 -0.1907,-0.1423 -0.1945,-0.1423 -0.1946,-0.1423 -0.1947,-0.1423 -0.1948,-0.1423 -0.1949,-0.1423 -0.1950,-0.1423 -0.1951,-0.1423 -0.1952,-0.1423 -0.1953,-0.1423 -0.1954,-0.1423 -0.1956,-0.1423 -0.1957,-0.1423 -0.1958,-0.1423 -0.1959,-0.1423 -0.1960,-0.1423 -0.1961,-0.1423 -0.1962,-0.1423 -0.1963,-0.1423 -0.1964,-0.1424 -0.1965,-0.1424 -0.1966,-0.1424 -0.1967,-0.1424 -0.1968,-0.1424 -0.1969,-0.1425 -0.1970,-0.1425 -0.1971,-0.1425 -0.1972,-0.1426 -0.1973,-0.1426 -0.1974,-0.1426 -0.1975,-0.1427 -0.1976,-0.1427 -0.1977,-0.1428 -0.1978,-0.1428 -0.1980,-0.1429 -0.1981,-0.1429 -0.1982,-0.1430 -0.1984,-0.1430 -0.1985,-0.1431 -0.1987,-0.1431 -0.1988,-0.1431 -0.1989,-0.1432 -0.1991,-0.1432 -0.1992,-0.1432 -0.1994,-0.1433 -0.1995,-0.1433 -0.1997,-0.1433 -0.1998,-0.1433 -0.1999,-0.1433 -0.2001,-0.1433 -0.2002,-0.1433 -0.2004,-0.1433 -0.2005,-0.1433 -0.2007,-0.1433 -0.2008,-0.1433 -0.2010,-0.1433 -0.2011,-0.1433 -0.2013,-0.1433 -0.2014,-0.1432 -0.2015,-0.1432 -0.2017,-0.1432 -0.2018,-0.1432 -0.2020,-0.1431 -0.2021,-0.1431 -0.2022,-0.1430 -0.2024,-0.1430 -0.2025,-0.1430 -0.2026,-0.1430 -0.2027,-0.1430 -0.2028,-0.1430 -0.2028,-0.1431 -0.2029,-0.1431 -0.2029,-0.1432 -0.2029,-0.1433 -0.2029,-0.1434 -0.2029,-0.1435 -0.2029,-0.1436 -0.2028,-0.1436 -0.2028,-0.1437 -0.2027,-0.1437 -0.2025,-0.1438 -0.2024,-0.1438 -0.2022,-0.1439 -0.2021,-0.1439 -0.2019,-0.1440 -0.2018,-0.1440 -0.2016,-0.1441 -0.2015,-0.1441 -0.2013,-0.1441 -0.2011,-0.1442 -0.2010,-0.1442 -0.2008,-0.1442 -0.2007,-0.1442 -0.2005,-0.1442 -0.2003,-0.1442 -0.2002,-0.1442 -0.2000,-0.1442 -0.1999,-0.1442 -0.1997,-0.1442 -0.1995,-0.1442 -0.1994,-0.1441 -0.1992,-0.1441 -0.1991,-0.1441 -0.1989,-0.1440 -0.1987,-0.1440 -0.1986,-0.1440 -0.1984,-0.1439 -0.1983,-0.1439 -0.1981,-0.1438 -0.1980,-0.1437 -0.1978,-0.1437 -0.1977,-0.1436 -0.1976,-0.1436 -0.1975,-0.1435 -0.1974,-0.1435 -0.1973,-0.1435 -0.1972,-0.1434 -0.1971,-0.1434 -0.1970,-0.1433 -0.1969,-0.1433 -0.1968,-0.1433 -0.1967,-0.1433 -0.1966,-0.1432 -0.1965,-0.1432 -0.1964,-0.1432 -0.1963,-0.1432 -0.1962,-0.1432 -0.1961,-0.1431 -0.1960,-0.1431 -0.1959,-0.1431 -0.1958,-0.1431 -0.1957,-0.1431 -0.1956,-0.1431 -0.1955,-0.1431 -0.1954,-0.1431 -0.1953,-0.1431 -0.1952,-0.1431 -0.1951,-0.1431 -0.1950,-0.1431 -0.1949,-0.1432 -0.1948,-0.1432 -0.1947,-0.1432 -0.1902,-0.1439 -0.1938,-0.1456 -0.1939,-0.1456 -0.1939,-0.1457 -0.1940,-0.1457 -0.1940,-0.1458 -0.1940,-0.1459 -0.1940,-0.1460 -0.1940,-0.1461 -0.1940,-0.1462 -0.1941,-0.1463 -0.1942,-0.1463 -0.1942,-0.1464 -0.1943,-0.1464 -0.1974,-0.1464 -0.1976,-0.1464 -0.1978,-0.1464 -0.1979,-0.1464 -0.1981,-0.1464 -0.1983,-0.1464 -0.1985,-0.1464 -0.1987,-0.1464 -0.1988,-0.1464 -0.1990,-0.1464 -0.1992,-0.1464 -0.1994,-0.1463 -0.1996,-0.1463 -0.1997,-0.1463 -0.1999,-0.1462 -0.2001,-0.1462 -0.2002,-0.1461 -0.2004,-0.1460 -0.2006,-0.1460 -0.2007,-0.1459 -0.2009,-0.1458 -0.2011,-0.1457 -0.2012,-0.1456 -0.2014,-0.1456 -0.2015,-0.1455 -0.2017,-0.1454 -0.2018,-0.1453 -0.2020,-0.1451 -0.2021,-0.1450 -0.2022,-0.1449 -0.2024,-0.1448 -0.2025,-0.1447 -0.2026,-0.1445 -0.2027,-0.1445 -0.2027,-0.1444 -0.2028,-0.1444 -0.2028,-0.1443 -0.2029,-0.1443 -0.2030,-0.1443 -0.2031,-0.1443 -0.2031,-0.1444 -0.2032,-0.1444 -0.2033,-0.1444 -0.2033,-0.1445 -0.2034,-0.1446 -0.2034,-0.1447 -0.2034,-0.1448 -0.2034,-0.1449 -0.2033,-0.1449 -0.2032,-0.1451 -0.2031,-0.1452 -0.2029,-0.1454 -0.2028,-0.1455 -0.2026,-0.1456 -0.2025,-0.1458 -0.2023,-0.1459 -0.2021,-0.1460 -0.2020,-0.1461 -0.2018,-0.1462 -0.2016,-0.1464 -0.2015,-0.1465 -0.2013,-0.1465 -0.2011,-0.1466 -0.2009,-0.1467 -0.2007,-0.1468 -0.2005,-0.1469 -0.2003,-0.1469 -0.2002,-0.1470 -0.2000,-0.1471 -0.1998,-0.1471 -0.1996,-0.1472 -0.1994,-0.1472 -0.1992,-0.1472 -0.1990,-0.1472 -0.1988,-0.1473 -0.1986,-0.1473 -0.1984,-0.1473 -0.1982,-0.1473 -0.1980,-0.1473 -0.1978,-0.1473 -0.1976,-0.1473 -0.1940,-0.1473 -0.1939,-0.1473 -0.1939,-0.1472 -0.1938,-0.1472 -0.1937,-0.1472 -0.1936,-0.1472 -0.1936,-0.1471 -0.1886,-0.1452 -0.1885,-0.1452 -0.1885,-0.1451 -0.1884,-0.1451 -0.1884,-0.1450 -0.1883,-0.1450 -0.1883,-0.1449 -0.1883,-0.1448 -0.1883,-0.1447 -0.1883,-0.1446 -0.1882,-0.1445 -0.1882,-0.1444 -0.1881,-0.1444 -0.1881,-0.1443 -0.1880,-0.1443 -0.1879,-0.1443 -0.1878,-0.1442 -0.1877,-0.1442 -0.1876,-0.1442 -0.1876,-0.1443 -0.1875,-0.1443 -0.1874,-0.1443 -0.1823,-0.1468 -0.1822,-0.1469 -0.1821,-0.1469 -0.1820,-0.1469 -0.1820,-0.1470 -0.1819,-0.1470 -0.1818,-0.1471 -0.1817,-0.1471 -0.1816,-0.1471 -0.1815,-0.1471 -0.1815,-0.1472 -0.1814,-0.1472 -0.1813,-0.1472 -0.1812,-0.1472 -0.1811,-0.1472 -0.1810,-0.1472 -0.1809,-0.1473 -0.1808,-0.1473 -0.1807,-0.1473 -0.1793,-0.1473 -0.1792,-0.1472 -0.1791,-0.1472 -0.1790,-0.1472 -0.1789,-0.1472 -0.1788,-0.1471 -0.1787,-0.1471 -0.1786,-0.1470 -0.1785,-0.1469 -0.1784,-0.1468 -0.1783,-0.1467 -0.1783,-0.1466 -0.1782,-0.1465 -0.1782,-0.1464 -0.1782,-0.1463 -0.1782,-0.1462 -0.1781,-0.1461 -0.1781,-0.1460 -0.1782,-0.1459 -0.1782,-0.1458 -0.1782,-0.1457 -0.1782,-0.1456 -0.1783,-0.1455 -0.1783,-0.1454 -0.1784,-0.1454 -0.1792,-0.1441 -0.1793,-0.1441 -0.1793,-0.1440 -0.1794,-0.1440 -0.1794,-0.1439 -0.1795,-0.1438 -0.1795,-0.1437 -0.1796,-0.1437 -0.1796,-0.1436 -0.1797,-0.1435 -0.1797,-0.1434 -0.1797,-0.1433 -0.1798,-0.1432 -0.1798,-0.1431 -0.1798,-0.1430 -0.1799,-0.1430 -0.1799,-0.1429 -0.1799,-0.1428 -0.1799,-0.1427 -0.1799,-0.1426 -0.1799,-0.1425 -0.1800,-0.1424 -0.1800,-0.1423 -0.1800,-0.1422 -0.1800,-0.1421 -0.1800,-0.1420 -0.1800,-0.1419 -0.1800,-0.1418 -0.1800,-0.1417 -0.1800,-0.1416 -0.1800,-0.1415 -0.1800,-0.1414 -0.1800,-0.1413 -0.1801,-0.1412 -0.1801,-0.1411 -0.1801,-0.1410 -0.1802,-0.1409 -0.1802,-0.1408 -0.1803,-0.1407 -0.1803,-0.1406 -0.1804,-0.1406 -0.1804,-0.1405 -0.1804,-0.1404 -0.1805,-0.1404 -0.1805,-0.1403 -0.1806,-0.1402 -0.1807,-0.1401 -0.1808,-0.1400 -0.1809,-0.1399 -0.1810,-0.1399 -0.1810,-0.1398 -0.1811,-0.1398 -0.1812,-0.1398 -0.1813,-0.1398 -0.1813,-0.1399 -0.1814,-0.1399 -0.1815,-0.1400 -0.1815,-0.1401 -0.1815,-0.1402 -0.1816,-0.1402 -0.1816,-0.1418 -0.1816,-0.1419 -0.1816,-0.1420 -0.1816,-0.1421 -0.1817,-0.1421 -0.1817,-0.1422 -0.1818,-0.1422 -0.1819,-0.1422 -0.1820,-0.1422 -0.1820,-0.1423 -0.1821,-0.1423 -0.1846,-0.1423 -0.1847,-0.1423 -0.1847,-0.1422 -0.1848,-0.1422 -0.1848,-0.1421 M-0.1811,-0.1436 L-0.1810,-0.1437 -0.1810,-0.1438 -0.1809,-0.1439 -0.1809,-0.1440 -0.1808,-0.1441 -0.1808,-0.1442 -0.1807,-0.1443 -0.1806,-0.1444 -0.1806,-0.1445 -0.1805,-0.1446 -0.1804,-0.1447 -0.1804,-0.1448 -0.1803,-0.1448 -0.1803,-0.1449 -0.1802,-0.1449 -0.1802,-0.1450 -0.1801,-0.1450 -0.1801,-0.1451 -0.1800,-0.1451 -0.1800,-0.1452 -0.1799,-0.1452 -0.1799,-0.1453 -0.1798,-0.1453 -0.1798,-0.1454 -0.1797,-0.1454 -0.1797,-0.1455 -0.1796,-0.1455 -0.1795,-0.1455 -0.1794,-0.1455 -0.1793,-0.1455 -0.1792,-0.1456 -0.1791,-0.1456 -0.1791,-0.1457 -0.1790,-0.1457 -0.1790,-0.1458 -0.1790,-0.1459 -0.1790,-0.1460 -0.1790,-0.1461 -0.1790,-0.1462 -0.1790,-0.1463 -0.1791,-0.1463 -0.1791,-0.1464 -0.1792,-0.1464 -0.1793,-0.1465 -0.1794,-0.1465 -0.1795,-0.1465 -0.1808,-0.1464 -0.1809,-0.1464 -0.1810,-0.1464 -0.1810,-0.1463 -0.1811,-0.1463 -0.1812,-0.1463 -0.1813,-0.1463 -0.1814,-0.1462 -0.1815,-0.1462 -0.1816,-0.1461 -0.1817,-0.1461 -0.1817,-0.1460 -0.1818,-0.1460 -0.1841,-0.1442 -0.1841,-0.1441 -0.1842,-0.1441 -0.1842,-0.1440 -0.1843,-0.1439 -0.1843,-0.1438 -0.1843,-0.1437 -0.1842,-0.1437 -0.1842,-0.1436 -0.1841,-0.1435 -0.1840,-0.1434 -0.1839,-0.1434 -0.1838,-0.1434 -0.1837,-0.1434 -0.1836,-0.1434 -0.1836,-0.1435 -0.1835,-0.1435 -0.1834,-0.1436 -0.1833,-0.1436 -0.1832,-0.1436 -0.1831,-0.1436 -0.1830,-0.1436 -0.1829,-0.1436 -0.1828,-0.1436 -0.1827,-0.1436 -0.1826,-0.1436 -0.1825,-0.1436 -0.1824,-0.1436 -0.1823,-0.1436 -0.1822,-0.1436 -0.1821,-0.1436 -0.1821,-0.1435 -0.1820,-0.1435 -0.1819,-0.1435 -0.1819,-0.1434 -0.1818,-0.1434 -0.1817,-0.1434 -0.1816,-0.1434 -0.1815,-0.1434 -0.1814,-0.1434 -0.1813,-0.1434 -0.1813,-0.1435 -0.1812,-0.1435 -0.1811,-0.1435 -0.1811,-0.1436  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.1815" cy="-0.1438" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" /><path d="M-0.1811,-0.1436 L-0.1810,-0.1437 -0.1810,-0.1438 -0.1809,-0.1439 -0.1809,-0.1440 -0.1808,-0.1441 -0.1808,-0.1442 -0.1807,-0.1443 -0.1806,-0.1444 -0.1806,-0.1445 -0.1805,-0.1446 -0.1804,-0.1447 -0.1804,-0.1448 -0.1803,-0.1448 -0.1803,-0.1449 -0.1802,-0.1449 -0.1802,-0.1450 -0.1801,-0.1450 -0.1801,-0.1451 -0.1800,-0.1451 -0.1800,-0.1452 -0.1799,-0.1452 -0.1799,-0.1453 -0.1798,-0.1453 -0.1798,-0.1454 -0.1797,-0.1454 -0.1797,-0.1455 -0.1796,-0.1455 -0.1795,-0.1455 -0.1794,-0.1455 -0.1793,-0.1455 -0.1792,-0.1456 -0.1791,-0.1456 -0.1791,-0.1457 -0.1790,-0.1457 -0.1790,-0.1458 -0.1790,-0.1459 -0.1790,-0.1460 -0.1790,-0.1461 -0.1790,-0.1462 -0.1790,-0.1463 -0.1791,-0.1463 -0.1791,-0.1464 -0.1792,-0.1464 -0.1793,-0.1465 -0.1794,-0.1465 -0.1795,-0.1465 -0.1808,-0.1464 -0.1809,-0.1464 -0.1810,-0.1464 -0.1810,-0.1463 -0.1811,-0.1463 -0.1812,-0.1463 -0.1813,-0.1463 -0.1814,-0.1462 -0.1815,-0.1462 -0.1816,-0.1461 -0.1817,-0.1461 -0.1817,-0.1460 -0.1818,-0.1460 -0.1841,-0.1442 -0.1841,-0.1441 -0.1842,-0.1441 -0.1842,-0.1440 -0.1843,-0.1439 -0.1843,-0.1438 -0.1843,-0.1437 -0.1842,-0.1437 -0.1842,-0.1436 -0.1841,-0.1435 -0.1840,-0.1434 -0.1839,-0.1434 -0.1838,-0.1434 -0.1837,-0.1434 -0.1836,-0.1434 -0.1836,-0.1435 -0.1835,-0.1435 -0.1834,-0.1436 -0.1833,-0.1436 -0.1832,-0.1436 -0.1831,-0.1436 -0.1830,-0.1436 -0.1829,-0.1436 -0.1828,-0.1436 -0.1827,-0.1436 -0.1826,-0.1436 -0.1825,-0.1436 -0.1824,-0.1436 -0.1823,-0.1436 -0.1822,-0.1436 -0.1821,-0.1436 -0.1821,-0.1435 -0.1820,-0.1435 -0.1819,-0.1435 -0.1819,-0.1434 -0.1818,-0.1434 -0.1817,-0.1434 -0.1816,-0.1434 -0.1815,-0.1434 -0.1814,-0.1434 -0.1813,-0.1434 -0.1813,-0.1435 -0.1812,-0.1435 -0.1811,-0.1435 -0.1811,-0.1436  " style="fill:rgb(200,200,240);opacity:0.5; stroke:black;stroke-width:0.00001mm">
                             <matprop type="cavity_10077-2" id="O-2000" lambda="0" eps="0.9" density="0"/>
                             <area value="0.01" />
                           </path><path d="M-0.1976,-0.1713 L0.0204,-0.1713 0.0204,-0.1473 -0.1976,-0.1473 -0.1976,-0.1713  " style="fill:rgb(200,240,200);stroke:black;stroke-width:0.00001mm">
                         <matprop type="const" id="O-1036" lambda="160" eps="0.9" density="2800"/>
                         <area value="0.002" />
                       </path>
                       <circle cx="-0.0886" cy="-0.1593" r="0.0005" style="fill:rgb(150,255,150); stroke:black;stroke-width:0.00001" />
  <g id="temperature">
<bcprop id="External" x="-0.3606" y="-0.1793" temp="273.15" rs="0.04" rel_img="SvgjsImage1089" rel_id="0" rel="min"></bcprop>
<bcprop id="External" x="-0.1796" y="-0.1793" temp="273.15" rs="0.04" rel_img="SvgjsImage1090" rel_id="1" rel="max"></bcprop>
<bcprop id="Interior" x="-0.2036" y="-0.1073" temp="293.15" rs="0.13" rel_img="SvgjsImage1091" rel_id="2" rel="min"></bcprop>
<bcprop id="Interior" x="-0.3606" y="-0.1073" temp="293.15" rs="0.13" rel_img="SvgjsImage1092" rel_id="3" rel="max"></bcprop>
  </g>
  <g id="collisions">
    <circle cx="-0.3146" cy="-0.1302" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3146" cy="-0.1314" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3191" cy="-0.1113" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3191" cy="-0.1120" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3160" cy="-0.1108" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3151" cy="-0.1108" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3534" cy="-0.1343" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3535" cy="-0.1340" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3501" cy="-0.1326" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3508" cy="-0.1338" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3243" cy="-0.1338" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3216" cy="-0.1340" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3217" cy="-0.1343" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3117" cy="-0.1414" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3117" cy="-0.1414" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3083" cy="-0.1400" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3090" cy="-0.1412" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3090" cy="-0.1412" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2883" cy="-0.1412" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2888" cy="-0.1404" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2848" cy="-0.1400" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2852" cy="-0.1407" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2746" cy="-0.1118" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2746" cy="-0.1118" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2730" cy="-0.1118" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2689" cy="-0.1108" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2666" cy="-0.1118" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2684" cy="-0.1118" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3508" cy="-0.1620" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3535" cy="-0.1617" r="0.0005" style="fill:rgb(200,200,255); stroke:black;stroke-width:0.00001" /><circle cx="-0.3534" cy="-0.1614" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3217" cy="-0.1614" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3216" cy="-0.1617" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3250" cy="-0.1631" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3243" cy="-0.1620" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2906" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2924" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2929" cy="-0.1758" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2970" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2986" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2986" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2627" cy="-0.1623" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2621" cy="-0.1634" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2625" cy="-0.1642" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2663" cy="-0.1634" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2053" cy="-0.1634" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2075" cy="-0.1642" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2091" cy="-0.1642" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2095" cy="-0.1634" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2089" cy="-0.1623" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2782" cy="-0.1753" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2765" cy="-0.1753" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2787" cy="-0.1763" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2822" cy="-0.1763" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2846" cy="-0.1753" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1796" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1810" cy="-0.1760" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1828" cy="-0.1778" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1848" cy="-0.1778" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1867" cy="-0.1758" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1868" cy="-0.1748" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2041" cy="-0.1258" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2050" cy="-0.1258" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2050" cy="-0.1108" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2041" cy="-0.1108" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2036" cy="-0.1073" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2036" cy="-0.1085" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2663" cy="-0.1409" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2659" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2642" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2625" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2621" cy="-0.1409" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2627" cy="-0.1420" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2089" cy="-0.1420" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2095" cy="-0.1409" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2091" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2074" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2057" cy="-0.1402" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2053" cy="-0.1409" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2059" cy="-0.1419" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2690" cy="-0.1150" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2690" cy="-0.1150" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2703" cy="-0.1150" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1888" cy="-0.1423" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1868" cy="-0.1419" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1871" cy="-0.1421" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1834" cy="-0.1423" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1821" cy="-0.1423" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1816" cy="-0.1418" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3090" cy="-0.1674" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3125" cy="-0.1685" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.3117" cy="-0.1672" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2856" cy="-0.1672" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2856" cy="-0.1672" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2890" cy="-0.1685" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2883" cy="-0.1674" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2930" cy="-0.1714" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2960" cy="-0.1714" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2808" cy="-0.1714" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2821" cy="-0.1714" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2668" cy="-0.1481" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2668" cy="-0.1481" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2671" cy="-0.1484" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2671" cy="-0.1487" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2671" cy="-0.1559" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.2671" cy="-0.1556" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1777" cy="-0.1713" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1814" cy="-0.1713" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1814" cy="-0.1713" r="0.0005" style="fill:rgb(200,200,255); stroke:black;stroke-width:0.00001" /><circle cx="-0.1864" cy="-0.1713" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1863" cy="-0.1713" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1976" cy="-0.1473" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1940" cy="-0.1473" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1940" cy="-0.1473" r="0.0005" style="fill:rgb(200,200,255); stroke:black;stroke-width:0.00001" /><circle cx="-0.1808" cy="-0.1473" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" /><circle cx="-0.1792" cy="-0.1473" r="0.0005" style="fill:rgb(255,200,200); stroke:black;stroke-width:0.00001" />
  </g>
  <g id="cavities">
    <path d="M-0.3143,-0.1302 L-0.3146,-0.1302 -0.3146,-0.1263 -0.3151,-0.1258 -0.3160,-0.1258 -0.3160,-0.1298 -0.3191,-0.1298 -0.3191,-0.1156 -0.3194,-0.1153 -0.3191,-0.1150 -0.3191,-0.1120 -0.3161,-0.1120 -0.3161,-0.1168 -0.3143,-0.1168 -0.3143,-0.1243 -0.3165,-0.1243 -0.3165,-0.1250 -0.3160,-0.1255 -0.3143,-0.1255 -0.3143,-0.1302  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.1810,-0.1778 L-0.1810,-0.1760 -0.1828,-0.1778 -0.1810,-0.1778  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.3186,-0.1108 L-0.3191,-0.1113 -0.3191,-0.1091 -0.3160,-0.1089 -0.3160,-0.1108 -0.3186,-0.1108  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.1848,-0.1778 L-0.1867,-0.1778 -0.1867,-0.1758 -0.1867,-0.1760 -0.1866,-0.1761 -0.1865,-0.1762 -0.1864,-0.1763 -0.1863,-0.1764 -0.1862,-0.1765 -0.1861,-0.1766 -0.1861,-0.1767 -0.1860,-0.1767 -0.1860,-0.1768 -0.1859,-0.1768 -0.1859,-0.1769 -0.1858,-0.1770 -0.1857,-0.1770 -0.1857,-0.1771 -0.1856,-0.1771 -0.1856,-0.1772 -0.1855,-0.1772 -0.1854,-0.1773 -0.1853,-0.1774 -0.1852,-0.1774 -0.1852,-0.1775 -0.1851,-0.1775 -0.1851,-0.1776 -0.1850,-0.1776 -0.1849,-0.1777 -0.1848,-0.1778  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2969,-0.1748 L-0.2970,-0.1748 -0.2965,-0.1753 -0.2965,-0.1758 -0.2977,-0.1758 -0.2977,-0.1778 -0.2920,-0.1778 -0.2920,-0.1758 -0.2929,-0.1758 -0.2924,-0.1760 -0.2923,-0.1761 -0.2923,-0.1762 -0.2923,-0.1763 -0.2924,-0.1763 -0.2929,-0.1766 -0.2930,-0.1766 -0.2930,-0.1767 -0.2931,-0.1767 -0.2932,-0.1767 -0.2933,-0.1767 -0.2933,-0.1768 -0.2934,-0.1768 -0.2960,-0.1768 -0.2961,-0.1768 -0.2961,-0.1767 -0.2962,-0.1767 -0.2963,-0.1767 -0.2964,-0.1767 -0.2964,-0.1766 -0.2965,-0.1766 -0.2970,-0.1763 -0.2971,-0.1762 -0.2971,-0.1761 -0.2970,-0.1761 -0.2970,-0.1760 -0.2969,-0.1760 -0.2964,-0.1758 -0.2964,-0.1753 -0.2969,-0.1748  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2822,-0.1763 L-0.2832,-0.1763 -0.2832,-0.1778 -0.2775,-0.1778 -0.2775,-0.1763 -0.2787,-0.1763 -0.2781,-0.1765 -0.2781,-0.1766 -0.2780,-0.1766 -0.2780,-0.1767 -0.2781,-0.1768 -0.2786,-0.1771 -0.2787,-0.1771 -0.2787,-0.1772 -0.2788,-0.1772 -0.2789,-0.1772 -0.2790,-0.1772 -0.2790,-0.1773 -0.2791,-0.1773 -0.2817,-0.1773 -0.2818,-0.1773 -0.2818,-0.1772 -0.2819,-0.1772 -0.2820,-0.1772 -0.2821,-0.1772 -0.2821,-0.1771 -0.2822,-0.1771 -0.2827,-0.1768 -0.2828,-0.1768 -0.2828,-0.1767 -0.2828,-0.1766 -0.2827,-0.1766 -0.2827,-0.1765 -0.2822,-0.1763  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2055,-0.1258 L-0.2050,-0.1258 -0.2050,-0.1298 -0.2081,-0.1298 -0.2081,-0.1186 -0.2084,-0.1183 -0.2081,-0.1180 -0.2081,-0.1091 -0.2050,-0.1089 -0.2050,-0.1108 -0.2052,-0.1108 -0.2052,-0.1105 -0.2052,-0.1104 -0.2053,-0.1104 -0.2054,-0.1104 -0.2055,-0.1104 -0.2056,-0.1104 -0.2058,-0.1107 -0.2059,-0.1107 -0.2059,-0.1108 -0.2059,-0.1109 -0.2059,-0.1110 -0.2060,-0.1110 -0.2060,-0.1120 -0.2030,-0.1120 -0.2028,-0.1120 -0.2028,-0.1119 -0.2027,-0.1119 -0.2026,-0.1119 -0.2025,-0.1119 -0.2024,-0.1118 -0.2023,-0.1118 -0.2022,-0.1117 -0.2021,-0.1116 -0.2020,-0.1115 -0.2020,-0.1114 -0.2019,-0.1114 -0.2019,-0.1113 -0.2018,-0.1112 -0.2018,-0.1111 -0.2018,-0.1110 -0.2018,-0.1109 -0.2018,-0.1108 -0.2018,-0.1090 -0.2017,-0.1089 -0.2017,-0.1088 -0.2017,-0.1087 -0.2016,-0.1086 -0.2015,-0.1086 -0.2015,-0.1085 -0.2014,-0.1085 -0.2013,-0.1085 -0.1848,-0.1085 -0.1846,-0.1085 -0.1845,-0.1085 -0.1844,-0.1085 -0.1843,-0.1085 -0.1842,-0.1085 -0.1841,-0.1086 -0.1840,-0.1086 -0.1839,-0.1086 -0.1838,-0.1087 -0.1837,-0.1087 -0.1836,-0.1088 -0.1836,-0.1089 -0.1835,-0.1089 -0.1834,-0.1090 -0.1833,-0.1090 -0.1833,-0.1091 -0.1832,-0.1092 -0.1831,-0.1093 -0.1830,-0.1094 -0.1830,-0.1095 -0.1829,-0.1096 -0.1829,-0.1097 -0.1829,-0.1098 -0.1828,-0.1099 -0.1828,-0.1100 -0.1828,-0.1101 -0.1828,-0.1102 -0.1828,-0.1103 -0.1828,-0.1104 -0.1828,-0.1105 -0.1828,-0.1226 -0.1828,-0.1228 -0.1828,-0.1229 -0.1828,-0.1230 -0.1828,-0.1231 -0.1829,-0.1232 -0.1829,-0.1233 -0.1829,-0.1234 -0.1830,-0.1235 -0.1830,-0.1236 -0.1831,-0.1237 -0.1832,-0.1238 -0.1833,-0.1239 -0.1833,-0.1240 -0.1834,-0.1240 -0.1835,-0.1241 -0.1836,-0.1242 -0.1837,-0.1243 -0.1838,-0.1243 -0.1839,-0.1244 -0.1840,-0.1244 -0.1841,-0.1244 -0.1842,-0.1245 -0.1843,-0.1245 -0.1844,-0.1245 -0.1845,-0.1245 -0.1846,-0.1245 -0.1847,-0.1246 -0.1848,-0.1246 -0.2072,-0.1246 -0.2073,-0.1246 -0.2074,-0.1246 -0.2075,-0.1246 -0.2075,-0.1247 -0.2076,-0.1247 -0.2076,-0.1248 -0.2077,-0.1248 -0.2077,-0.1249 -0.2077,-0.1250 -0.2077,-0.1251 -0.2078,-0.1251 -0.2077,-0.1252 -0.2077,-0.1253 -0.2077,-0.1254 -0.2076,-0.1255 -0.2059,-0.1273 -0.2051,-0.1273 -0.2055,-0.1258  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2689,-0.1108 L-0.2680,-0.1108 -0.2680,-0.1088 -0.2740,-0.1088 -0.2740,-0.1108 -0.2725,-0.1108 -0.2725,-0.1113 -0.2730,-0.1118 -0.2729,-0.1118 -0.2724,-0.1113 -0.2724,-0.1108 -0.2730,-0.1105 -0.2731,-0.1104 -0.2731,-0.1103 -0.2730,-0.1103 -0.2730,-0.1102 -0.2725,-0.1099 -0.2724,-0.1099 -0.2724,-0.1098 -0.2723,-0.1098 -0.2722,-0.1098 -0.2721,-0.1098 -0.2720,-0.1098 -0.2694,-0.1098 -0.2693,-0.1098 -0.2692,-0.1098 -0.2691,-0.1098 -0.2690,-0.1098 -0.2690,-0.1099 -0.2689,-0.1099 -0.2684,-0.1102 -0.2683,-0.1103 -0.2683,-0.1104 -0.2684,-0.1105 -0.2689,-0.1108  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.1867,-0.1418 L-0.1868,-0.1419 -0.1859,-0.1413 -0.1858,-0.1413 -0.1857,-0.1413 -0.1856,-0.1413 -0.1855,-0.1413 -0.1854,-0.1413 -0.1853,-0.1413 -0.1853,-0.1414 -0.1852,-0.1414 -0.1851,-0.1414 -0.1851,-0.1415 -0.1850,-0.1415 -0.1850,-0.1416 -0.1850,-0.1417 -0.1849,-0.1417 -0.1848,-0.1421 -0.1848,-0.1422 -0.1847,-0.1422 -0.1847,-0.1423 -0.1846,-0.1423 -0.1834,-0.1423 -0.1839,-0.1418 -0.1839,-0.1413 -0.1831,-0.1413 -0.1831,-0.1398 -0.1876,-0.1398 -0.1876,-0.1413 -0.1867,-0.1413 -0.1867,-0.1418  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2671,-0.1561 L-0.2671,-0.1559 -0.2670,-0.1559 -0.2670,-0.1560 -0.2669,-0.1561 -0.2668,-0.1561 -0.2667,-0.1561 -0.2664,-0.1559 -0.2664,-0.1558 -0.2663,-0.1558 -0.2662,-0.1557 -0.2662,-0.1556 -0.2661,-0.1556 -0.2661,-0.1555 -0.2661,-0.1554 -0.2661,-0.1553 -0.2661,-0.1552 -0.2661,-0.1546 -0.2661,-0.1545 -0.2661,-0.1544 -0.2661,-0.1543 -0.2662,-0.1543 -0.2662,-0.1542 -0.2663,-0.1542 -0.2664,-0.1541 -0.2665,-0.1541 -0.2666,-0.1541 -0.2689,-0.1541 -0.2690,-0.1541 -0.2691,-0.1541 -0.2691,-0.1542 -0.2712,-0.1553 -0.2712,-0.1554 -0.2713,-0.1554 -0.2714,-0.1554 -0.2715,-0.1554 -0.2716,-0.1554 -0.2717,-0.1553 -0.2718,-0.1553 -0.2718,-0.1552 -0.2719,-0.1551 -0.2719,-0.1550 -0.2719,-0.1549 -0.2720,-0.1526 -0.2720,-0.1525 -0.2720,-0.1524 -0.2720,-0.1523 -0.2720,-0.1522 -0.2721,-0.1522 -0.2721,-0.1521 -0.2721,-0.1520 -0.2720,-0.1520 -0.2720,-0.1519 -0.2720,-0.1518 -0.2720,-0.1517 -0.2720,-0.1516 -0.2719,-0.1493 -0.2719,-0.1492 -0.2719,-0.1491 -0.2718,-0.1490 -0.2718,-0.1489 -0.2717,-0.1489 -0.2716,-0.1488 -0.2715,-0.1488 -0.2714,-0.1488 -0.2713,-0.1488 -0.2712,-0.1488 -0.2712,-0.1489 -0.2691,-0.1500 -0.2691,-0.1501 -0.2690,-0.1501 -0.2689,-0.1501 -0.2666,-0.1501 -0.2665,-0.1501 -0.2664,-0.1501 -0.2663,-0.1501 -0.2663,-0.1500 -0.2662,-0.1500 -0.2662,-0.1499 -0.2661,-0.1499 -0.2661,-0.1498 -0.2661,-0.1497 -0.2661,-0.1496 -0.2661,-0.1490 -0.2661,-0.1489 -0.2661,-0.1488 -0.2661,-0.1487 -0.2661,-0.1486 -0.2662,-0.1486 -0.2662,-0.1485 -0.2663,-0.1484 -0.2664,-0.1484 -0.2664,-0.1483 -0.2667,-0.1481 -0.2668,-0.1481 -0.2653,-0.1481 -0.2652,-0.1481 -0.2651,-0.1481 -0.2651,-0.1482 -0.2650,-0.1482 -0.2649,-0.1483 -0.2649,-0.1484 -0.2648,-0.1484 -0.2648,-0.1485 -0.2648,-0.1486 -0.2648,-0.1556 -0.2648,-0.1557 -0.2648,-0.1558 -0.2649,-0.1558 -0.2649,-0.1559 -0.2649,-0.1560 -0.2650,-0.1560 -0.2651,-0.1560 -0.2651,-0.1561 -0.2652,-0.1561 -0.2653,-0.1561 -0.2671,-0.1561  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2036,-0.1085 L-0.2036,-0.1103 -0.2041,-0.1108 -0.2030,-0.1108 -0.2030,-0.1085 -0.2036,-0.1085  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2882,-0.1414 L-0.2883,-0.1412 -0.2885,-0.1415 -0.2894,-0.1415 -0.2917,-0.1397 -0.2918,-0.1396 -0.2919,-0.1396 -0.2919,-0.1395 -0.2920,-0.1395 -0.2921,-0.1395 -0.2921,-0.1394 -0.2922,-0.1394 -0.2923,-0.1394 -0.2923,-0.1393 -0.2924,-0.1393 -0.2925,-0.1393 -0.2926,-0.1393 -0.2927,-0.1393 -0.2928,-0.1393 -0.2929,-0.1393 -0.3047,-0.1393 -0.3048,-0.1393 -0.3049,-0.1393 -0.3050,-0.1393 -0.3051,-0.1393 -0.3051,-0.1394 -0.3052,-0.1394 -0.3053,-0.1394 -0.3053,-0.1395 -0.3080,-0.1415 -0.3088,-0.1415 -0.3090,-0.1412 -0.3091,-0.1414 -0.3091,-0.1415 -0.3092,-0.1415 -0.3092,-0.1416 -0.3092,-0.1417 -0.3092,-0.1418 -0.3092,-0.1419 -0.3093,-0.1420 -0.3093,-0.1433 -0.3093,-0.1435 -0.3093,-0.1436 -0.3093,-0.1437 -0.3093,-0.1438 -0.3093,-0.1439 -0.3093,-0.1440 -0.3094,-0.1442 -0.3094,-0.1443 -0.3094,-0.1444 -0.3094,-0.1445 -0.3095,-0.1446 -0.3095,-0.1447 -0.3096,-0.1447 -0.3096,-0.1448 -0.3096,-0.1449 -0.3097,-0.1450 -0.3097,-0.1451 -0.3098,-0.1452 -0.3099,-0.1453 -0.3099,-0.1454 -0.3100,-0.1455 -0.3101,-0.1455 -0.3101,-0.1456 -0.3102,-0.1457 -0.3103,-0.1458 -0.3103,-0.1459 -0.3104,-0.1459 -0.3105,-0.1460 -0.3106,-0.1461 -0.3107,-0.1461 -0.3107,-0.1462 -0.3122,-0.1472 -0.3123,-0.1473 -0.3124,-0.1473 -0.3124,-0.1474 -0.3125,-0.1475 -0.3125,-0.1476 -0.3126,-0.1476 -0.3126,-0.1477 -0.3126,-0.1478 -0.3126,-0.1479 -0.3126,-0.1480 -0.3127,-0.1480 -0.3127,-0.1533 -0.3126,-0.1533 -0.3126,-0.1534 -0.3126,-0.1535 -0.3126,-0.1536 -0.3125,-0.1536 -0.3124,-0.1537 -0.3123,-0.1537 -0.3122,-0.1537 -0.3122,-0.1538 -0.3047,-0.1538 -0.3046,-0.1538 -0.3045,-0.1538 -0.3044,-0.1538 -0.3043,-0.1539 -0.3042,-0.1540 -0.3042,-0.1541 -0.3042,-0.1542 -0.3042,-0.1543 -0.3042,-0.1544 -0.3042,-0.1545 -0.3043,-0.1546 -0.3044,-0.1547 -0.3045,-0.1547 -0.3046,-0.1547 -0.3046,-0.1548 -0.3047,-0.1548 -0.3122,-0.1548 -0.3123,-0.1548 -0.3124,-0.1548 -0.3124,-0.1549 -0.3125,-0.1549 -0.3126,-0.1550 -0.3126,-0.1551 -0.3126,-0.1552 -0.3127,-0.1553 -0.3127,-0.1605 -0.3126,-0.1605 -0.3126,-0.1606 -0.3126,-0.1607 -0.3126,-0.1608 -0.3126,-0.1609 -0.3125,-0.1609 -0.3125,-0.1610 -0.3125,-0.1611 -0.3124,-0.1611 -0.3124,-0.1612 -0.3123,-0.1612 -0.3123,-0.1613 -0.3122,-0.1613 -0.3107,-0.1623 -0.3106,-0.1625 -0.3105,-0.1625 -0.3104,-0.1626 -0.3103,-0.1627 -0.3102,-0.1628 -0.3101,-0.1629 -0.3101,-0.1630 -0.3100,-0.1630 -0.3099,-0.1631 -0.3099,-0.1632 -0.3098,-0.1633 -0.3097,-0.1634 -0.3097,-0.1635 -0.3096,-0.1636 -0.3096,-0.1637 -0.3096,-0.1638 -0.3095,-0.1639 -0.3095,-0.1640 -0.3094,-0.1641 -0.3094,-0.1642 -0.3094,-0.1643 -0.3094,-0.1644 -0.3093,-0.1645 -0.3093,-0.1646 -0.3093,-0.1647 -0.3093,-0.1648 -0.3093,-0.1649 -0.3093,-0.1650 -0.3093,-0.1651 -0.3093,-0.1652 -0.3093,-0.1665 -0.3092,-0.1666 -0.3092,-0.1667 -0.3092,-0.1668 -0.3092,-0.1669 -0.3092,-0.1670 -0.3091,-0.1670 -0.3091,-0.1671 -0.3090,-0.1674 -0.3088,-0.1671 -0.3080,-0.1671 -0.3056,-0.1689 -0.3055,-0.1689 -0.3054,-0.1689 -0.3054,-0.1690 -0.3053,-0.1690 -0.3052,-0.1691 -0.3051,-0.1691 -0.3050,-0.1691 -0.3050,-0.1692 -0.3049,-0.1692 -0.3048,-0.1692 -0.3047,-0.1692 -0.3046,-0.1692 -0.3045,-0.1693 -0.3044,-0.1693 -0.2929,-0.1693 -0.2928,-0.1693 -0.2927,-0.1692 -0.2926,-0.1692 -0.2925,-0.1692 -0.2924,-0.1692 -0.2923,-0.1692 -0.2923,-0.1691 -0.2922,-0.1691 -0.2921,-0.1691 -0.2920,-0.1690 -0.2919,-0.1690 -0.2919,-0.1689 -0.2918,-0.1689 -0.2917,-0.1689 -0.2894,-0.1671 -0.2885,-0.1671 -0.2884,-0.1671 -0.2883,-0.1671 -0.2883,-0.1672 -0.2883,-0.1673 -0.2883,-0.1674 -0.2882,-0.1671 -0.2882,-0.1670 -0.2881,-0.1670 -0.2881,-0.1669 -0.2881,-0.1668 -0.2881,-0.1667 -0.2881,-0.1666 -0.2881,-0.1665 -0.2881,-0.1652 -0.2880,-0.1650 -0.2880,-0.1649 -0.2880,-0.1648 -0.2880,-0.1647 -0.2880,-0.1646 -0.2880,-0.1645 -0.2880,-0.1644 -0.2879,-0.1643 -0.2879,-0.1642 -0.2879,-0.1641 -0.2878,-0.1640 -0.2878,-0.1639 -0.2877,-0.1638 -0.2877,-0.1637 -0.2877,-0.1636 -0.2876,-0.1635 -0.2876,-0.1634 -0.2875,-0.1633 -0.2874,-0.1632 -0.2874,-0.1631 -0.2873,-0.1630 -0.2872,-0.1630 -0.2872,-0.1629 -0.2871,-0.1628 -0.2870,-0.1627 -0.2869,-0.1626 -0.2868,-0.1625 -0.2867,-0.1625 -0.2866,-0.1624 -0.2866,-0.1623 -0.2851,-0.1613 -0.2850,-0.1613 -0.2850,-0.1612 -0.2849,-0.1612 -0.2849,-0.1611 -0.2848,-0.1611 -0.2848,-0.1610 -0.2848,-0.1609 -0.2847,-0.1609 -0.2847,-0.1608 -0.2847,-0.1607 -0.2847,-0.1606 -0.2847,-0.1605 -0.2847,-0.1553 -0.2847,-0.1552 -0.2847,-0.1551 -0.2847,-0.1550 -0.2848,-0.1549 -0.2849,-0.1549 -0.2849,-0.1548 -0.2850,-0.1548 -0.2851,-0.1548 -0.2852,-0.1548 -0.2927,-0.1548 -0.2927,-0.1547 -0.2928,-0.1547 -0.2929,-0.1547 -0.2930,-0.1546 -0.2931,-0.1545 -0.2931,-0.1544 -0.2931,-0.1543 -0.2932,-0.1543 -0.2931,-0.1542 -0.2931,-0.1541 -0.2931,-0.1540 -0.2930,-0.1539 -0.2929,-0.1538 -0.2928,-0.1538 -0.2927,-0.1538 -0.2852,-0.1538 -0.2851,-0.1538 -0.2851,-0.1537 -0.2850,-0.1537 -0.2849,-0.1537 -0.2848,-0.1536 -0.2847,-0.1536 -0.2847,-0.1535 -0.2847,-0.1534 -0.2847,-0.1533 -0.2847,-0.1480 -0.2847,-0.1479 -0.2847,-0.1478 -0.2847,-0.1477 -0.2847,-0.1476 -0.2848,-0.1476 -0.2848,-0.1475 -0.2849,-0.1474 -0.2849,-0.1473 -0.2850,-0.1473 -0.2851,-0.1472 -0.2866,-0.1462 -0.2867,-0.1461 -0.2868,-0.1460 -0.2869,-0.1459 -0.2870,-0.1459 -0.2870,-0.1458 -0.2871,-0.1457 -0.2872,-0.1456 -0.2872,-0.1455 -0.2873,-0.1455 -0.2874,-0.1454 -0.2874,-0.1453 -0.2875,-0.1452 -0.2876,-0.1451 -0.2876,-0.1450 -0.2877,-0.1449 -0.2877,-0.1448 -0.2877,-0.1447 -0.2878,-0.1447 -0.2878,-0.1446 -0.2879,-0.1445 -0.2879,-0.1444 -0.2879,-0.1443 -0.2880,-0.1442 -0.2880,-0.1440 -0.2880,-0.1439 -0.2880,-0.1438 -0.2880,-0.1437 -0.2880,-0.1436 -0.2880,-0.1435 -0.2880,-0.1434 -0.2881,-0.1433 -0.2881,-0.1420 -0.2881,-0.1419 -0.2881,-0.1418 -0.2881,-0.1417 -0.2881,-0.1416 -0.2881,-0.1415 -0.2882,-0.1415 -0.2882,-0.1414  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2086,-0.1425 L-0.2089,-0.1420 -0.2090,-0.1424 -0.2097,-0.1430 -0.2619,-0.1430 -0.2626,-0.1424 -0.2627,-0.1424 -0.2627,-0.1423 -0.2627,-0.1422 -0.2628,-0.1422 -0.2628,-0.1421 -0.2627,-0.1421 -0.2627,-0.1420 -0.2630,-0.1425 -0.2630,-0.1426 -0.2631,-0.1426 -0.2631,-0.1427 -0.2631,-0.1428 -0.2632,-0.1429 -0.2632,-0.1430 -0.2632,-0.1431 -0.2632,-0.1432 -0.2632,-0.1513 -0.2470,-0.1513 -0.2469,-0.1513 -0.2468,-0.1513 -0.2467,-0.1514 -0.2466,-0.1514 -0.2465,-0.1515 -0.2464,-0.1515 -0.2464,-0.1516 -0.2463,-0.1517 -0.2463,-0.1518 -0.2462,-0.1518 -0.2462,-0.1519 -0.2462,-0.1520 -0.2462,-0.1521 -0.2462,-0.1522 -0.2462,-0.1523 -0.2462,-0.1524 -0.2463,-0.1524 -0.2463,-0.1525 -0.2463,-0.1526 -0.2464,-0.1526 -0.2464,-0.1527 -0.2465,-0.1527 -0.2466,-0.1528 -0.2467,-0.1528 -0.2467,-0.1529 -0.2468,-0.1529 -0.2469,-0.1529 -0.2470,-0.1529 -0.2632,-0.1529 -0.2632,-0.1611 -0.2632,-0.1612 -0.2632,-0.1613 -0.2632,-0.1614 -0.2632,-0.1615 -0.2631,-0.1615 -0.2631,-0.1616 -0.2631,-0.1617 -0.2630,-0.1618 -0.2627,-0.1623 -0.2625,-0.1620 -0.2620,-0.1620 -0.2619,-0.1620 -0.2618,-0.1620 -0.2617,-0.1620 -0.2616,-0.1620 -0.2616,-0.1621 -0.2582,-0.1647 -0.2581,-0.1647 -0.2580,-0.1647 -0.2580,-0.1648 -0.2579,-0.1648 -0.2578,-0.1649 -0.2577,-0.1649 -0.2576,-0.1649 -0.2576,-0.1650 -0.2575,-0.1650 -0.2574,-0.1650 -0.2573,-0.1650 -0.2572,-0.1650 -0.2571,-0.1651 -0.2570,-0.1651 -0.2146,-0.1651 -0.2145,-0.1651 -0.2144,-0.1650 -0.2143,-0.1650 -0.2142,-0.1650 -0.2141,-0.1650 -0.2140,-0.1650 -0.2140,-0.1649 -0.2139,-0.1649 -0.2138,-0.1649 -0.2137,-0.1648 -0.2136,-0.1648 -0.2136,-0.1647 -0.2135,-0.1647 -0.2134,-0.1647 -0.2100,-0.1621 -0.2100,-0.1620 -0.2099,-0.1620 -0.2098,-0.1620 -0.2097,-0.1620 -0.2096,-0.1620 -0.2091,-0.1620 -0.2090,-0.1620 -0.2089,-0.1620 -0.2089,-0.1621 -0.2089,-0.1622 -0.2089,-0.1623 -0.2086,-0.1618 -0.2085,-0.1617 -0.2085,-0.1616 -0.2085,-0.1615 -0.2084,-0.1615 -0.2084,-0.1614 -0.2084,-0.1613 -0.2084,-0.1612 -0.2084,-0.1611 -0.2084,-0.1529 -0.2246,-0.1529 -0.2247,-0.1529 -0.2248,-0.1529 -0.2249,-0.1529 -0.2249,-0.1528 -0.2250,-0.1528 -0.2251,-0.1527 -0.2252,-0.1527 -0.2252,-0.1526 -0.2253,-0.1526 -0.2253,-0.1525 -0.2253,-0.1524 -0.2254,-0.1524 -0.2254,-0.1523 -0.2254,-0.1522 -0.2254,-0.1521 -0.2254,-0.1520 -0.2254,-0.1519 -0.2254,-0.1518 -0.2253,-0.1518 -0.2253,-0.1517 -0.2252,-0.1516 -0.2252,-0.1515 -0.2251,-0.1515 -0.2250,-0.1514 -0.2249,-0.1514 -0.2248,-0.1513 -0.2247,-0.1513 -0.2246,-0.1513 -0.2084,-0.1513 -0.2084,-0.1432 -0.2084,-0.1431 -0.2084,-0.1430 -0.2084,-0.1429 -0.2085,-0.1428 -0.2085,-0.1427 -0.2085,-0.1426 -0.2086,-0.1426 -0.2086,-0.1425  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.3242,-0.1340 L-0.3243,-0.1338 -0.3245,-0.1341 -0.3251,-0.1341 -0.3252,-0.1341 -0.3253,-0.1341 -0.3253,-0.1340 -0.3254,-0.1340 -0.3255,-0.1340 -0.3277,-0.1323 -0.3278,-0.1322 -0.3279,-0.1322 -0.3279,-0.1321 -0.3280,-0.1321 -0.3281,-0.1321 -0.3281,-0.1320 -0.3282,-0.1320 -0.3283,-0.1320 -0.3283,-0.1319 -0.3284,-0.1319 -0.3285,-0.1319 -0.3286,-0.1319 -0.3287,-0.1319 -0.3288,-0.1319 -0.3289,-0.1319 -0.3462,-0.1319 -0.3463,-0.1319 -0.3464,-0.1319 -0.3465,-0.1319 -0.3466,-0.1319 -0.3467,-0.1319 -0.3468,-0.1319 -0.3468,-0.1320 -0.3469,-0.1320 -0.3470,-0.1320 -0.3470,-0.1321 -0.3471,-0.1321 -0.3472,-0.1321 -0.3472,-0.1322 -0.3473,-0.1322 -0.3474,-0.1323 -0.3496,-0.1340 -0.3497,-0.1340 -0.3498,-0.1340 -0.3498,-0.1341 -0.3499,-0.1341 -0.3500,-0.1341 -0.3506,-0.1341 -0.3506,-0.1340 -0.3507,-0.1340 -0.3508,-0.1340 -0.3508,-0.1339 -0.3508,-0.1338 -0.3509,-0.1340 -0.3509,-0.1341 -0.3510,-0.1341 -0.3510,-0.1342 -0.3510,-0.1343 -0.3510,-0.1344 -0.3510,-0.1345 -0.3511,-0.1346 -0.3511,-0.1352 -0.3511,-0.1354 -0.3511,-0.1355 -0.3511,-0.1356 -0.3511,-0.1357 -0.3511,-0.1358 -0.3511,-0.1359 -0.3511,-0.1360 -0.3512,-0.1361 -0.3512,-0.1362 -0.3512,-0.1363 -0.3513,-0.1364 -0.3513,-0.1365 -0.3513,-0.1366 -0.3514,-0.1366 -0.3514,-0.1367 -0.3514,-0.1368 -0.3515,-0.1369 -0.3515,-0.1370 -0.3516,-0.1371 -0.3516,-0.1372 -0.3517,-0.1372 -0.3517,-0.1373 -0.3518,-0.1374 -0.3519,-0.1375 -0.3520,-0.1376 -0.3521,-0.1377 -0.3539,-0.1395 -0.3539,-0.1396 -0.3540,-0.1396 -0.3540,-0.1397 -0.3541,-0.1397 -0.3541,-0.1398 -0.3542,-0.1399 -0.3542,-0.1400 -0.3543,-0.1400 -0.3543,-0.1401 -0.3543,-0.1402 -0.3543,-0.1403 -0.3544,-0.1403 -0.3544,-0.1404 -0.3544,-0.1405 -0.3544,-0.1406 -0.3544,-0.1407 -0.3544,-0.1408 -0.3545,-0.1409 -0.3545,-0.1469 -0.3544,-0.1469 -0.3544,-0.1470 -0.3544,-0.1471 -0.3544,-0.1472 -0.3543,-0.1472 -0.3542,-0.1473 -0.3541,-0.1473 -0.3540,-0.1473 -0.3540,-0.1474 -0.3465,-0.1474 -0.3464,-0.1474 -0.3463,-0.1474 -0.3462,-0.1474 -0.3461,-0.1475 -0.3460,-0.1476 -0.3460,-0.1477 -0.3460,-0.1478 -0.3460,-0.1479 -0.3460,-0.1480 -0.3460,-0.1481 -0.3461,-0.1482 -0.3462,-0.1483 -0.3463,-0.1483 -0.3464,-0.1483 -0.3464,-0.1484 -0.3465,-0.1484 -0.3540,-0.1484 -0.3541,-0.1484 -0.3542,-0.1484 -0.3542,-0.1485 -0.3543,-0.1485 -0.3544,-0.1486 -0.3544,-0.1487 -0.3544,-0.1488 -0.3545,-0.1489 -0.3545,-0.1548 -0.3544,-0.1549 -0.3544,-0.1550 -0.3544,-0.1551 -0.3544,-0.1552 -0.3544,-0.1553 -0.3544,-0.1554 -0.3543,-0.1554 -0.3543,-0.1555 -0.3543,-0.1556 -0.3543,-0.1557 -0.3542,-0.1557 -0.3542,-0.1558 -0.3541,-0.1559 -0.3541,-0.1560 -0.3540,-0.1560 -0.3540,-0.1561 -0.3539,-0.1562 -0.3521,-0.1580 -0.3520,-0.1581 -0.3519,-0.1582 -0.3518,-0.1583 -0.3517,-0.1584 -0.3517,-0.1585 -0.3516,-0.1586 -0.3515,-0.1587 -0.3515,-0.1588 -0.3514,-0.1589 -0.3514,-0.1590 -0.3514,-0.1591 -0.3513,-0.1592 -0.3513,-0.1593 -0.3512,-0.1594 -0.3512,-0.1595 -0.3512,-0.1596 -0.3511,-0.1597 -0.3511,-0.1598 -0.3511,-0.1599 -0.3511,-0.1600 -0.3511,-0.1601 -0.3511,-0.1602 -0.3511,-0.1603 -0.3511,-0.1604 -0.3511,-0.1605 -0.3511,-0.1611 -0.3510,-0.1612 -0.3510,-0.1613 -0.3510,-0.1614 -0.3510,-0.1615 -0.3510,-0.1616 -0.3509,-0.1616 -0.3509,-0.1617 -0.3508,-0.1620 -0.3506,-0.1617 -0.3500,-0.1617 -0.3499,-0.1617 -0.3498,-0.1617 -0.3497,-0.1617 -0.3496,-0.1617 -0.3496,-0.1618 -0.3474,-0.1635 -0.3473,-0.1635 -0.3472,-0.1635 -0.3472,-0.1636 -0.3471,-0.1636 -0.3470,-0.1637 -0.3469,-0.1637 -0.3468,-0.1637 -0.3468,-0.1638 -0.3467,-0.1638 -0.3466,-0.1638 -0.3465,-0.1638 -0.3464,-0.1638 -0.3463,-0.1639 -0.3462,-0.1639 -0.3289,-0.1639 -0.3288,-0.1639 -0.3287,-0.1638 -0.3286,-0.1638 -0.3285,-0.1638 -0.3284,-0.1638 -0.3283,-0.1638 -0.3283,-0.1637 -0.3282,-0.1637 -0.3281,-0.1637 -0.3280,-0.1636 -0.3279,-0.1636 -0.3279,-0.1635 -0.3278,-0.1635 -0.3277,-0.1635 -0.3255,-0.1618 -0.3255,-0.1617 -0.3254,-0.1617 -0.3253,-0.1617 -0.3252,-0.1617 -0.3251,-0.1617 -0.3245,-0.1617 -0.3243,-0.1620 -0.3242,-0.1617 -0.3242,-0.1616 -0.3241,-0.1616 -0.3241,-0.1615 -0.3241,-0.1614 -0.3241,-0.1613 -0.3241,-0.1612 -0.3241,-0.1611 -0.3241,-0.1605 -0.3240,-0.1603 -0.3240,-0.1602 -0.3240,-0.1601 -0.3240,-0.1600 -0.3240,-0.1599 -0.3240,-0.1598 -0.3240,-0.1597 -0.3239,-0.1596 -0.3239,-0.1595 -0.3239,-0.1594 -0.3238,-0.1593 -0.3238,-0.1592 -0.3238,-0.1591 -0.3237,-0.1590 -0.3237,-0.1589 -0.3236,-0.1588 -0.3236,-0.1587 -0.3235,-0.1586 -0.3234,-0.1585 -0.3234,-0.1584 -0.3233,-0.1583 -0.3232,-0.1582 -0.3231,-0.1581 -0.3230,-0.1580 -0.3212,-0.1562 -0.3211,-0.1561 -0.3211,-0.1560 -0.3210,-0.1560 -0.3210,-0.1559 -0.3209,-0.1558 -0.3209,-0.1557 -0.3208,-0.1557 -0.3208,-0.1556 -0.3208,-0.1555 -0.3208,-0.1554 -0.3207,-0.1554 -0.3207,-0.1553 -0.3207,-0.1552 -0.3207,-0.1551 -0.3207,-0.1550 -0.3207,-0.1549 -0.3207,-0.1548 -0.3207,-0.1489 -0.3207,-0.1488 -0.3207,-0.1487 -0.3207,-0.1486 -0.3208,-0.1485 -0.3209,-0.1485 -0.3209,-0.1484 -0.3210,-0.1484 -0.3211,-0.1484 -0.3212,-0.1484 -0.3287,-0.1484 -0.3287,-0.1483 -0.3288,-0.1483 -0.3289,-0.1483 -0.3290,-0.1482 -0.3291,-0.1481 -0.3291,-0.1480 -0.3291,-0.1479 -0.3292,-0.1479 -0.3291,-0.1478 -0.3291,-0.1477 -0.3291,-0.1476 -0.3290,-0.1475 -0.3289,-0.1474 -0.3288,-0.1474 -0.3287,-0.1474 -0.3212,-0.1474 -0.3211,-0.1474 -0.3211,-0.1473 -0.3210,-0.1473 -0.3209,-0.1473 -0.3208,-0.1472 -0.3207,-0.1472 -0.3207,-0.1471 -0.3207,-0.1470 -0.3207,-0.1469 -0.3207,-0.1409 -0.3207,-0.1408 -0.3207,-0.1407 -0.3207,-0.1406 -0.3207,-0.1405 -0.3207,-0.1404 -0.3207,-0.1403 -0.3208,-0.1403 -0.3208,-0.1402 -0.3208,-0.1401 -0.3208,-0.1400 -0.3209,-0.1400 -0.3209,-0.1399 -0.3210,-0.1398 -0.3210,-0.1397 -0.3211,-0.1397 -0.3211,-0.1396 -0.3212,-0.1396 -0.3212,-0.1395 -0.3230,-0.1377 -0.3231,-0.1376 -0.3232,-0.1375 -0.3233,-0.1374 -0.3234,-0.1373 -0.3234,-0.1372 -0.3235,-0.1372 -0.3235,-0.1371 -0.3236,-0.1370 -0.3236,-0.1369 -0.3237,-0.1368 -0.3237,-0.1367 -0.3238,-0.1366 -0.3238,-0.1365 -0.3238,-0.1364 -0.3239,-0.1363 -0.3239,-0.1362 -0.3239,-0.1361 -0.3240,-0.1360 -0.3240,-0.1359 -0.3240,-0.1358 -0.3240,-0.1357 -0.3240,-0.1356 -0.3240,-0.1355 -0.3240,-0.1354 -0.3240,-0.1353 -0.3241,-0.1352 -0.3241,-0.1346 -0.3241,-0.1345 -0.3241,-0.1344 -0.3241,-0.1343 -0.3241,-0.1342 -0.3241,-0.1341 -0.3242,-0.1341 -0.3242,-0.1340  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.1850,-0.1258 L-0.2041,-0.1258 -0.2036,-0.1263 -0.2036,-0.1402 -0.2037,-0.1402 -0.2037,-0.1403 -0.2038,-0.1403 -0.2038,-0.1404 -0.2038,-0.1437 -0.2038,-0.1438 -0.2038,-0.1439 -0.2039,-0.1439 -0.2040,-0.1439 -0.2041,-0.1439 -0.2042,-0.1439 -0.2043,-0.1439 -0.2044,-0.1438 -0.2045,-0.1438 -0.2046,-0.1438 -0.2046,-0.1437 -0.2047,-0.1437 -0.2048,-0.1437 -0.2048,-0.1436 -0.2049,-0.1436 -0.2049,-0.1435 -0.2050,-0.1435 -0.2053,-0.1432 -0.2054,-0.1432 -0.2054,-0.1431 -0.2055,-0.1431 -0.2055,-0.1430 -0.2056,-0.1430 -0.2056,-0.1429 -0.2057,-0.1428 -0.2057,-0.1427 -0.2058,-0.1427 -0.2058,-0.1426 -0.2058,-0.1425 -0.2058,-0.1424 -0.2059,-0.1423 -0.2059,-0.1422 -0.2059,-0.1421 -0.2059,-0.1420 -0.2059,-0.1419 -0.2066,-0.1432 -0.2066,-0.1433 -0.2067,-0.1433 -0.2067,-0.1434 -0.2067,-0.1435 -0.2068,-0.1436 -0.2068,-0.1437 -0.2068,-0.1438 -0.2068,-0.1439 -0.2068,-0.1466 -0.2068,-0.1467 -0.2068,-0.1468 -0.2067,-0.1468 -0.2067,-0.1469 -0.2067,-0.1470 -0.2066,-0.1470 -0.2065,-0.1470 -0.2065,-0.1471 -0.2064,-0.1471 -0.2063,-0.1471 -0.2041,-0.1471 -0.2040,-0.1471 -0.2039,-0.1471 -0.2038,-0.1472 -0.2037,-0.1472 -0.2037,-0.1473 -0.2036,-0.1473 -0.2036,-0.1474 -0.2036,-0.1475 -0.2036,-0.1476 -0.2036,-0.1481 -0.2036,-0.1482 -0.2036,-0.1483 -0.2036,-0.1484 -0.2036,-0.1485 -0.2037,-0.1485 -0.2037,-0.1486 -0.2038,-0.1486 -0.2038,-0.1487 -0.2039,-0.1487 -0.2039,-0.1488 -0.2040,-0.1488 -0.2041,-0.1489 -0.2042,-0.1489 -0.2043,-0.1489 -0.2044,-0.1489 -0.2045,-0.1489 -0.2045,-0.1488 -0.2045,-0.1487 -0.2046,-0.1487 -0.2046,-0.1481 -0.2063,-0.1481 -0.2064,-0.1481 -0.2065,-0.1481 -0.2065,-0.1482 -0.2066,-0.1482 -0.2067,-0.1483 -0.2067,-0.1484 -0.2068,-0.1484 -0.2068,-0.1485 -0.2068,-0.1486 -0.2068,-0.1556 -0.2068,-0.1557 -0.2068,-0.1558 -0.2067,-0.1558 -0.2067,-0.1559 -0.2067,-0.1560 -0.2066,-0.1560 -0.2065,-0.1560 -0.2065,-0.1561 -0.2064,-0.1561 -0.2063,-0.1561 -0.2046,-0.1561 -0.2046,-0.1556 -0.2045,-0.1555 -0.2045,-0.1554 -0.2044,-0.1554 -0.2044,-0.1553 -0.2043,-0.1553 -0.2042,-0.1553 -0.2041,-0.1553 -0.2041,-0.1554 -0.2040,-0.1554 -0.2039,-0.1554 -0.2039,-0.1555 -0.2038,-0.1555 -0.2038,-0.1556 -0.2037,-0.1556 -0.2037,-0.1557 -0.2036,-0.1557 -0.2036,-0.1558 -0.2036,-0.1559 -0.2036,-0.1560 -0.2036,-0.1561 -0.2036,-0.1566 -0.2036,-0.1567 -0.2036,-0.1568 -0.2036,-0.1569 -0.2037,-0.1569 -0.2037,-0.1570 -0.2038,-0.1570 -0.2038,-0.1571 -0.2039,-0.1571 -0.2040,-0.1571 -0.2041,-0.1571 -0.2063,-0.1571 -0.2064,-0.1571 -0.2065,-0.1571 -0.2065,-0.1572 -0.2066,-0.1572 -0.2067,-0.1573 -0.2067,-0.1574 -0.2068,-0.1574 -0.2068,-0.1575 -0.2068,-0.1576 -0.2068,-0.1604 -0.2068,-0.1605 -0.2068,-0.1606 -0.2068,-0.1607 -0.2068,-0.1608 -0.2067,-0.1608 -0.2067,-0.1609 -0.2067,-0.1610 -0.2066,-0.1611 -0.2053,-0.1634 -0.2059,-0.1624 -0.2059,-0.1623 -0.2059,-0.1622 -0.2059,-0.1621 -0.2059,-0.1620 -0.2058,-0.1620 -0.2058,-0.1619 -0.2058,-0.1618 -0.2058,-0.1617 -0.2058,-0.1616 -0.2057,-0.1616 -0.2057,-0.1615 -0.2056,-0.1614 -0.2056,-0.1613 -0.2055,-0.1613 -0.2055,-0.1612 -0.2054,-0.1612 -0.2054,-0.1611 -0.2053,-0.1611 -0.2050,-0.1608 -0.2049,-0.1608 -0.2049,-0.1607 -0.2048,-0.1607 -0.2048,-0.1606 -0.2047,-0.1606 -0.2046,-0.1606 -0.2046,-0.1605 -0.2045,-0.1605 -0.2044,-0.1605 -0.2043,-0.1605 -0.2043,-0.1604 -0.2042,-0.1604 -0.2041,-0.1604 -0.2040,-0.1604 -0.2039,-0.1604 -0.2038,-0.1604 -0.2038,-0.1605 -0.2038,-0.1606 -0.2038,-0.1640 -0.2037,-0.1640 -0.2037,-0.1641 -0.2036,-0.1641 -0.2036,-0.1642 -0.2036,-0.1673 -0.2041,-0.1678 -0.2050,-0.1678 -0.2050,-0.1659 -0.2081,-0.1659 -0.2081,-0.1710 -0.2084,-0.1713 -0.2081,-0.1716 -0.2081,-0.1773 -0.2050,-0.1773 -0.2050,-0.1758 -0.2038,-0.1758 -0.2037,-0.1758 -0.2036,-0.1758 -0.2036,-0.1759 -0.2036,-0.1760 -0.2036,-0.1773 -0.2004,-0.1773 -0.2004,-0.1775 -0.1893,-0.1775 -0.1893,-0.1773 -0.1881,-0.1773 -0.1881,-0.1758 -0.1893,-0.1758 -0.1893,-0.1748 -0.1868,-0.1748 -0.1870,-0.1746 -0.1870,-0.1737 -0.1870,-0.1736 -0.1870,-0.1735 -0.1869,-0.1735 -0.1868,-0.1735 -0.1854,-0.1735 -0.1853,-0.1735 -0.1852,-0.1735 -0.1852,-0.1734 -0.1851,-0.1734 -0.1850,-0.1734 -0.1849,-0.1734 -0.1848,-0.1734 -0.1847,-0.1734 -0.1846,-0.1733 -0.1845,-0.1733 -0.1845,-0.1732 -0.1846,-0.1732 -0.1847,-0.1732 -0.1865,-0.1724 -0.1866,-0.1724 -0.1866,-0.1723 -0.1867,-0.1723 -0.1867,-0.1722 -0.1868,-0.1722 -0.1868,-0.1721 -0.1869,-0.1720 -0.1869,-0.1719 -0.1869,-0.1718 -0.1869,-0.1717 -0.1869,-0.1716 -0.1868,-0.1716 -0.1868,-0.1715 -0.1867,-0.1715 -0.1867,-0.1714 -0.1866,-0.1713 -0.1865,-0.1713 -0.1864,-0.1713 -0.1976,-0.1713 -0.1976,-0.1473 -0.2033,-0.1449 -0.2034,-0.1449 -0.2034,-0.1448 -0.2034,-0.1447 -0.2034,-0.1446 -0.2033,-0.1445 -0.2033,-0.1444 -0.2032,-0.1444 -0.2031,-0.1444 -0.2031,-0.1443 -0.2030,-0.1443 -0.2029,-0.1443 -0.2028,-0.1443 -0.2028,-0.1444 -0.2027,-0.1444 -0.2027,-0.1445 -0.2026,-0.1445 -0.2025,-0.1447 -0.2024,-0.1448 -0.2022,-0.1449 -0.2021,-0.1450 -0.2020,-0.1451 -0.2018,-0.1453 -0.2017,-0.1454 -0.2015,-0.1455 -0.2014,-0.1456 -0.2012,-0.1456 -0.2011,-0.1457 -0.2009,-0.1458 -0.2007,-0.1459 -0.2006,-0.1460 -0.2004,-0.1460 -0.2002,-0.1461 -0.2001,-0.1462 -0.1999,-0.1462 -0.1997,-0.1463 -0.1996,-0.1463 -0.1994,-0.1463 -0.1992,-0.1464 -0.1990,-0.1464 -0.1988,-0.1464 -0.1987,-0.1464 -0.1985,-0.1464 -0.1983,-0.1464 -0.1981,-0.1464 -0.1979,-0.1464 -0.1978,-0.1464 -0.1976,-0.1464 -0.1974,-0.1464 -0.1943,-0.1464 -0.1942,-0.1464 -0.1942,-0.1463 -0.1941,-0.1463 -0.1940,-0.1462 -0.1940,-0.1461 -0.1940,-0.1460 -0.1940,-0.1459 -0.1940,-0.1458 -0.1940,-0.1457 -0.1939,-0.1457 -0.1939,-0.1456 -0.1938,-0.1456 -0.1902,-0.1439 -0.1947,-0.1432 -0.1948,-0.1432 -0.1949,-0.1432 -0.1950,-0.1431 -0.1951,-0.1431 -0.1952,-0.1431 -0.1953,-0.1431 -0.1954,-0.1431 -0.1955,-0.1431 -0.1956,-0.1431 -0.1957,-0.1431 -0.1958,-0.1431 -0.1959,-0.1431 -0.1960,-0.1431 -0.1961,-0.1431 -0.1962,-0.1432 -0.1963,-0.1432 -0.1964,-0.1432 -0.1965,-0.1432 -0.1966,-0.1432 -0.1967,-0.1433 -0.1968,-0.1433 -0.1969,-0.1433 -0.1970,-0.1433 -0.1971,-0.1434 -0.1972,-0.1434 -0.1973,-0.1435 -0.1974,-0.1435 -0.1975,-0.1435 -0.1976,-0.1436 -0.1977,-0.1436 -0.1978,-0.1437 -0.1980,-0.1437 -0.1981,-0.1438 -0.1983,-0.1439 -0.1984,-0.1439 -0.1986,-0.1440 -0.1987,-0.1440 -0.1989,-0.1440 -0.1991,-0.1441 -0.1992,-0.1441 -0.1994,-0.1441 -0.1995,-0.1442 -0.1997,-0.1442 -0.1999,-0.1442 -0.2000,-0.1442 -0.2002,-0.1442 -0.2003,-0.1442 -0.2005,-0.1442 -0.2007,-0.1442 -0.2008,-0.1442 -0.2010,-0.1442 -0.2011,-0.1442 -0.2013,-0.1441 -0.2015,-0.1441 -0.2016,-0.1441 -0.2018,-0.1440 -0.2019,-0.1440 -0.2021,-0.1439 -0.2022,-0.1439 -0.2024,-0.1438 -0.2025,-0.1438 -0.2027,-0.1437 -0.2028,-0.1437 -0.2028,-0.1436 -0.2029,-0.1436 -0.2029,-0.1435 -0.2029,-0.1434 -0.2029,-0.1433 -0.2029,-0.1432 -0.2029,-0.1431 -0.2028,-0.1431 -0.2028,-0.1430 -0.2027,-0.1430 -0.2026,-0.1430 -0.2025,-0.1430 -0.2024,-0.1430 -0.2022,-0.1430 -0.2021,-0.1431 -0.2020,-0.1431 -0.2018,-0.1432 -0.2017,-0.1432 -0.2015,-0.1432 -0.2014,-0.1432 -0.2013,-0.1433 -0.2011,-0.1433 -0.2010,-0.1433 -0.2008,-0.1433 -0.2007,-0.1433 -0.2005,-0.1433 -0.2004,-0.1433 -0.2002,-0.1433 -0.2001,-0.1433 -0.1999,-0.1433 -0.1998,-0.1433 -0.1997,-0.1433 -0.1995,-0.1433 -0.1994,-0.1433 -0.1992,-0.1432 -0.1991,-0.1432 -0.1989,-0.1432 -0.1988,-0.1431 -0.1987,-0.1431 -0.1985,-0.1431 -0.1984,-0.1430 -0.1982,-0.1430 -0.1981,-0.1429 -0.1980,-0.1429 -0.1978,-0.1428 -0.1977,-0.1428 -0.1976,-0.1427 -0.1975,-0.1427 -0.1974,-0.1426 -0.1973,-0.1426 -0.1972,-0.1426 -0.1971,-0.1425 -0.1970,-0.1425 -0.1969,-0.1425 -0.1968,-0.1424 -0.1967,-0.1424 -0.1966,-0.1424 -0.1965,-0.1424 -0.1964,-0.1424 -0.1963,-0.1423 -0.1962,-0.1423 -0.1961,-0.1423 -0.1960,-0.1423 -0.1959,-0.1423 -0.1958,-0.1423 -0.1957,-0.1423 -0.1956,-0.1423 -0.1954,-0.1423 -0.1953,-0.1423 -0.1952,-0.1423 -0.1951,-0.1423 -0.1950,-0.1423 -0.1949,-0.1423 -0.1948,-0.1423 -0.1947,-0.1423 -0.1946,-0.1423 -0.1945,-0.1423 -0.1907,-0.1423 -0.1906,-0.1423 -0.1905,-0.1423 -0.1904,-0.1423 -0.1903,-0.1423 -0.1902,-0.1423 -0.1901,-0.1423 -0.1900,-0.1423 -0.1899,-0.1423 -0.1898,-0.1423 -0.1897,-0.1423 -0.1896,-0.1423 -0.1895,-0.1423 -0.1894,-0.1423 -0.1893,-0.1423 -0.1892,-0.1423 -0.1891,-0.1423 -0.1890,-0.1423 -0.1889,-0.1423 -0.1888,-0.1423 -0.1888,-0.1398 -0.1887,-0.1397 -0.1887,-0.1396 -0.1887,-0.1395 -0.1887,-0.1394 -0.1887,-0.1393 -0.1886,-0.1392 -0.1886,-0.1391 -0.1885,-0.1391 -0.1885,-0.1390 -0.1884,-0.1390 -0.1884,-0.1389 -0.1883,-0.1388 -0.1882,-0.1388 -0.1882,-0.1387 -0.1881,-0.1387 -0.1880,-0.1386 -0.1879,-0.1386 -0.1878,-0.1386 -0.1877,-0.1386 -0.1876,-0.1386 -0.1842,-0.1386 -0.1841,-0.1386 -0.1840,-0.1386 -0.1840,-0.1385 -0.1839,-0.1385 -0.1838,-0.1385 -0.1837,-0.1385 -0.1836,-0.1384 -0.1835,-0.1384 -0.1834,-0.1383 -0.1833,-0.1382 -0.1832,-0.1381 -0.1832,-0.1380 -0.1831,-0.1380 -0.1831,-0.1379 -0.1830,-0.1378 -0.1830,-0.1377 -0.1830,-0.1376 -0.1830,-0.1375 -0.1830,-0.1374 -0.1830,-0.1278 -0.1830,-0.1277 -0.1830,-0.1276 -0.1830,-0.1275 -0.1830,-0.1274 -0.1830,-0.1273 -0.1830,-0.1272 -0.1831,-0.1271 -0.1831,-0.1270 -0.1831,-0.1269 -0.1832,-0.1268 -0.1832,-0.1267 -0.1833,-0.1266 -0.1834,-0.1265 -0.1835,-0.1264 -0.1835,-0.1263 -0.1836,-0.1263 -0.1837,-0.1262 -0.1838,-0.1262 -0.1838,-0.1261 -0.1839,-0.1260 -0.1840,-0.1260 -0.1841,-0.1259 -0.1842,-0.1259 -0.1843,-0.1259 -0.1844,-0.1258 -0.1845,-0.1258 -0.1846,-0.1258 -0.1847,-0.1258 -0.1848,-0.1258 -0.1849,-0.1258 -0.1850,-0.1258  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.3214,-0.1348 L-0.3217,-0.1343 -0.3218,-0.1346 -0.3218,-0.1350 -0.3217,-0.1351 -0.3217,-0.1352 -0.3217,-0.1353 -0.3217,-0.1354 -0.3217,-0.1355 -0.3217,-0.1356 -0.3216,-0.1357 -0.3216,-0.1358 -0.3216,-0.1359 -0.3215,-0.1359 -0.3215,-0.1360 -0.3215,-0.1361 -0.3214,-0.1361 -0.3214,-0.1362 -0.3213,-0.1363 -0.3212,-0.1364 -0.3192,-0.1384 -0.3192,-0.1385 -0.3191,-0.1385 -0.3191,-0.1386 -0.3191,-0.1387 -0.3191,-0.1388 -0.3191,-0.1570 -0.3191,-0.1571 -0.3191,-0.1572 -0.3192,-0.1573 -0.3212,-0.1593 -0.3213,-0.1594 -0.3213,-0.1595 -0.3214,-0.1595 -0.3214,-0.1596 -0.3215,-0.1597 -0.3215,-0.1598 -0.3216,-0.1598 -0.3216,-0.1599 -0.3216,-0.1600 -0.3216,-0.1601 -0.3217,-0.1601 -0.3217,-0.1602 -0.3217,-0.1603 -0.3217,-0.1604 -0.3217,-0.1605 -0.3217,-0.1606 -0.3218,-0.1607 -0.3218,-0.1611 -0.3217,-0.1614 -0.3214,-0.1609 -0.3197,-0.1597 -0.3196,-0.1597 -0.3195,-0.1597 -0.3194,-0.1597 -0.3193,-0.1597 -0.3193,-0.1598 -0.3193,-0.1599 -0.3193,-0.1600 -0.3193,-0.1640 -0.3192,-0.1640 -0.3192,-0.1641 -0.3191,-0.1641 -0.3191,-0.1642 -0.3160,-0.1642 -0.3160,-0.1627 -0.3151,-0.1627 -0.3146,-0.1632 -0.3146,-0.1673 -0.3151,-0.1678 -0.3160,-0.1678 -0.3160,-0.1659 -0.3191,-0.1659 -0.3191,-0.1710 -0.3194,-0.1713 -0.3191,-0.1716 -0.3191,-0.1773 -0.3160,-0.1773 -0.3160,-0.1758 -0.3148,-0.1758 -0.3147,-0.1758 -0.3146,-0.1758 -0.3146,-0.1759 -0.3146,-0.1760 -0.3146,-0.1773 -0.3114,-0.1773 -0.3114,-0.1775 -0.3003,-0.1775 -0.3003,-0.1773 -0.2991,-0.1773 -0.2991,-0.1758 -0.3003,-0.1758 -0.3003,-0.1748 -0.2986,-0.1748 -0.2988,-0.1746 -0.2988,-0.1738 -0.2984,-0.1735 -0.2982,-0.1734 -0.2980,-0.1732 -0.2978,-0.1731 -0.2976,-0.1730 -0.2974,-0.1729 -0.2972,-0.1728 -0.2970,-0.1728 -0.2968,-0.1727 -0.2965,-0.1726 -0.2963,-0.1726 -0.2961,-0.1725 -0.2959,-0.1725 -0.2956,-0.1724 -0.2954,-0.1724 -0.2952,-0.1724 -0.2949,-0.1724 -0.2947,-0.1724 -0.2945,-0.1724 -0.2942,-0.1724 -0.2940,-0.1724 -0.2938,-0.1725 -0.2935,-0.1725 -0.2933,-0.1726 -0.2931,-0.1726 -0.2929,-0.1727 -0.2927,-0.1728 -0.2924,-0.1728 -0.2922,-0.1729 -0.2920,-0.1730 -0.2918,-0.1731 -0.2917,-0.1731 -0.2916,-0.1731 -0.2916,-0.1730 -0.2916,-0.1729 -0.2916,-0.1728 -0.2916,-0.1727 -0.2917,-0.1727 -0.2921,-0.1725 -0.2923,-0.1724 -0.2925,-0.1724 -0.2927,-0.1723 -0.2929,-0.1722 -0.2931,-0.1722 -0.2933,-0.1721 -0.2935,-0.1721 -0.2937,-0.1720 -0.2939,-0.1720 -0.2942,-0.1720 -0.2944,-0.1720 -0.2946,-0.1719 -0.2948,-0.1719 -0.2950,-0.1719 -0.2952,-0.1720 -0.2955,-0.1720 -0.2957,-0.1720 -0.2959,-0.1720 -0.2961,-0.1720 -0.2963,-0.1721 -0.2965,-0.1721 -0.2967,-0.1722 -0.2969,-0.1722 -0.2972,-0.1723 -0.2974,-0.1724 -0.2976,-0.1725 -0.2978,-0.1726 -0.2980,-0.1726 -0.2982,-0.1727 -0.2983,-0.1728 -0.2984,-0.1729 -0.2985,-0.1729 -0.2986,-0.1729 -0.2986,-0.1728 -0.2987,-0.1726 -0.2987,-0.1725 -0.2987,-0.1724 -0.2987,-0.1723 -0.2987,-0.1722 -0.2987,-0.1721 -0.2987,-0.1720 -0.2986,-0.1719 -0.2985,-0.1718 -0.2985,-0.1717 -0.2984,-0.1717 -0.2984,-0.1716 -0.2983,-0.1716 -0.2982,-0.1715 -0.2981,-0.1715 -0.2980,-0.1715 -0.2979,-0.1715 -0.2978,-0.1715 -0.2977,-0.1715 -0.2976,-0.1715 -0.2975,-0.1715 -0.2974,-0.1716 -0.2973,-0.1716 -0.2972,-0.1716 -0.2971,-0.1716 -0.2970,-0.1716 -0.2969,-0.1715 -0.2968,-0.1715 -0.2967,-0.1715 -0.2966,-0.1715 -0.2966,-0.1714 -0.2965,-0.1714 -0.2964,-0.1714 -0.2963,-0.1714 -0.2962,-0.1714 -0.2961,-0.1714 -0.2960,-0.1714 -0.3166,-0.1714 -0.3167,-0.1713 -0.3168,-0.1713 -0.3169,-0.1713 -0.3169,-0.1712 -0.3170,-0.1712 -0.3171,-0.1711 -0.3171,-0.1710 -0.3172,-0.1710 -0.3172,-0.1709 -0.3172,-0.1708 -0.3172,-0.1707 -0.3173,-0.1707 -0.3172,-0.1706 -0.3172,-0.1705 -0.3172,-0.1704 -0.3172,-0.1703 -0.3171,-0.1703 -0.3171,-0.1702 -0.3170,-0.1702 -0.3170,-0.1701 -0.3169,-0.1701 -0.3169,-0.1700 -0.3168,-0.1700 -0.3167,-0.1700 -0.3166,-0.1700 -0.3143,-0.1700 -0.3143,-0.1689 -0.3142,-0.1689 -0.3141,-0.1689 -0.3141,-0.1688 -0.3141,-0.1687 -0.3141,-0.1651 -0.3140,-0.1651 -0.3140,-0.1650 -0.3140,-0.1649 -0.3139,-0.1649 -0.3138,-0.1649 -0.3138,-0.1648 -0.3137,-0.1648 -0.3137,-0.1649 -0.3136,-0.1649 -0.3116,-0.1663 -0.3117,-0.1672 -0.3117,-0.1671 -0.3117,-0.1670 -0.3116,-0.1670 -0.3116,-0.1669 -0.3116,-0.1668 -0.3116,-0.1667 -0.3116,-0.1666 -0.3116,-0.1665 -0.3116,-0.1651 -0.3116,-0.1650 -0.3116,-0.1649 -0.3116,-0.1648 -0.3116,-0.1647 -0.3116,-0.1646 -0.3117,-0.1646 -0.3117,-0.1645 -0.3117,-0.1644 -0.3118,-0.1644 -0.3118,-0.1643 -0.3119,-0.1643 -0.3119,-0.1642 -0.3120,-0.1642 -0.3120,-0.1641 -0.3121,-0.1641 -0.3140,-0.1627 -0.3141,-0.1627 -0.3141,-0.1626 -0.3142,-0.1626 -0.3142,-0.1625 -0.3142,-0.1624 -0.3142,-0.1623 -0.3143,-0.1623 -0.3143,-0.1462 -0.3142,-0.1462 -0.3142,-0.1461 -0.3142,-0.1460 -0.3142,-0.1459 -0.3141,-0.1459 -0.3141,-0.1458 -0.3140,-0.1458 -0.3121,-0.1444 -0.3120,-0.1444 -0.3119,-0.1443 -0.3118,-0.1442 -0.3118,-0.1441 -0.3117,-0.1441 -0.3117,-0.1440 -0.3117,-0.1439 -0.3116,-0.1439 -0.3116,-0.1438 -0.3116,-0.1437 -0.3116,-0.1436 -0.3116,-0.1435 -0.3116,-0.1434 -0.3116,-0.1420 -0.3116,-0.1419 -0.3116,-0.1418 -0.3116,-0.1417 -0.3116,-0.1416 -0.3116,-0.1415 -0.3117,-0.1415 -0.3117,-0.1414 -0.3116,-0.1422 -0.3136,-0.1436 -0.3136,-0.1437 -0.3137,-0.1437 -0.3138,-0.1437 -0.3139,-0.1437 -0.3139,-0.1436 -0.3140,-0.1436 -0.3140,-0.1435 -0.3140,-0.1434 -0.3141,-0.1434 -0.3141,-0.1398 -0.3141,-0.1397 -0.3141,-0.1396 -0.3142,-0.1396 -0.3143,-0.1396 -0.3143,-0.1314 -0.3146,-0.1314 -0.3146,-0.1326 -0.3151,-0.1331 -0.3160,-0.1331 -0.3160,-0.1316 -0.3191,-0.1316 -0.3192,-0.1316 -0.3192,-0.1317 -0.3193,-0.1317 -0.3193,-0.1318 -0.3193,-0.1357 -0.3193,-0.1358 -0.3193,-0.1359 -0.3193,-0.1360 -0.3194,-0.1360 -0.3195,-0.1360 -0.3195,-0.1361 -0.3196,-0.1361 -0.3196,-0.1360 -0.3197,-0.1360 -0.3214,-0.1348  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" /><path d="M-0.2671,-0.1556 L-0.2671,-0.1554 -0.2671,-0.1553 -0.2671,-0.1552 -0.2672,-0.1552 -0.2672,-0.1551 -0.2673,-0.1551 -0.2688,-0.1551 -0.2715,-0.1567 -0.2716,-0.1567 -0.2716,-0.1568 -0.2717,-0.1568 -0.2717,-0.1569 -0.2718,-0.1569 -0.2718,-0.1570 -0.2718,-0.1571 -0.2718,-0.1572 -0.2716,-0.1613 -0.2716,-0.1614 -0.2715,-0.1614 -0.2715,-0.1615 -0.2715,-0.1616 -0.2714,-0.1616 -0.2714,-0.1617 -0.2713,-0.1617 -0.2712,-0.1617 -0.2711,-0.1618 -0.2681,-0.1618 -0.2681,-0.1628 -0.2711,-0.1628 -0.2712,-0.1628 -0.2712,-0.1627 -0.2713,-0.1627 -0.2714,-0.1627 -0.2715,-0.1627 -0.2716,-0.1627 -0.2716,-0.1626 -0.2717,-0.1626 -0.2718,-0.1626 -0.2719,-0.1625 -0.2720,-0.1625 -0.2720,-0.1624 -0.2721,-0.1624 -0.2721,-0.1623 -0.2722,-0.1623 -0.2722,-0.1622 -0.2723,-0.1622 -0.2723,-0.1621 -0.2724,-0.1620 -0.2724,-0.1619 -0.2725,-0.1618 -0.2725,-0.1617 -0.2725,-0.1616 -0.2726,-0.1615 -0.2726,-0.1614 -0.2726,-0.1613 -0.2730,-0.1526 -0.2730,-0.1525 -0.2730,-0.1524 -0.2730,-0.1523 -0.2730,-0.1522 -0.2731,-0.1522 -0.2731,-0.1521 -0.2731,-0.1520 -0.2730,-0.1520 -0.2730,-0.1519 -0.2730,-0.1518 -0.2730,-0.1517 -0.2730,-0.1516 -0.2726,-0.1429 -0.2726,-0.1428 -0.2726,-0.1427 -0.2725,-0.1426 -0.2725,-0.1425 -0.2725,-0.1424 -0.2724,-0.1423 -0.2724,-0.1422 -0.2723,-0.1421 -0.2723,-0.1420 -0.2722,-0.1420 -0.2722,-0.1419 -0.2721,-0.1419 -0.2721,-0.1418 -0.2720,-0.1418 -0.2720,-0.1417 -0.2719,-0.1417 -0.2718,-0.1417 -0.2718,-0.1416 -0.2717,-0.1416 -0.2716,-0.1416 -0.2716,-0.1415 -0.2715,-0.1415 -0.2714,-0.1415 -0.2713,-0.1415 -0.2712,-0.1415 -0.2711,-0.1415 -0.2681,-0.1415 -0.2681,-0.1425 -0.2711,-0.1425 -0.2712,-0.1425 -0.2713,-0.1425 -0.2714,-0.1425 -0.2714,-0.1426 -0.2715,-0.1426 -0.2715,-0.1427 -0.2715,-0.1428 -0.2716,-0.1428 -0.2716,-0.1429 -0.2718,-0.1470 -0.2718,-0.1471 -0.2718,-0.1472 -0.2718,-0.1473 -0.2717,-0.1473 -0.2717,-0.1474 -0.2716,-0.1474 -0.2716,-0.1475 -0.2715,-0.1475 -0.2688,-0.1491 -0.2673,-0.1491 -0.2672,-0.1491 -0.2671,-0.1490 -0.2671,-0.1489 -0.2671,-0.1487 -0.2671,-0.1488 -0.2672,-0.1489 -0.2673,-0.1489 -0.2674,-0.1489 -0.2675,-0.1489 -0.2676,-0.1488 -0.2677,-0.1488 -0.2677,-0.1487 -0.2678,-0.1487 -0.2678,-0.1486 -0.2679,-0.1486 -0.2679,-0.1485 -0.2680,-0.1485 -0.2680,-0.1484 -0.2680,-0.1483 -0.2680,-0.1482 -0.2680,-0.1481 -0.2681,-0.1481 -0.2681,-0.1476 -0.2680,-0.1476 -0.2680,-0.1475 -0.2680,-0.1474 -0.2680,-0.1473 -0.2679,-0.1473 -0.2679,-0.1472 -0.2678,-0.1472 -0.2677,-0.1471 -0.2676,-0.1471 -0.2653,-0.1471 -0.2652,-0.1471 -0.2651,-0.1471 -0.2651,-0.1470 -0.2650,-0.1470 -0.2649,-0.1470 -0.2649,-0.1469 -0.2649,-0.1468 -0.2648,-0.1468 -0.2648,-0.1467 -0.2648,-0.1466 -0.2648,-0.1439 -0.2648,-0.1438 -0.2648,-0.1437 -0.2648,-0.1436 -0.2649,-0.1435 -0.2649,-0.1434 -0.2649,-0.1433 -0.2650,-0.1433 -0.2650,-0.1432 -0.2663,-0.1409 -0.2657,-0.1419 -0.2657,-0.1420 -0.2657,-0.1421 -0.2657,-0.1422 -0.2657,-0.1423 -0.2658,-0.1424 -0.2658,-0.1425 -0.2658,-0.1426 -0.2658,-0.1427 -0.2659,-0.1427 -0.2659,-0.1428 -0.2660,-0.1429 -0.2660,-0.1430 -0.2661,-0.1430 -0.2661,-0.1431 -0.2662,-0.1431 -0.2662,-0.1432 -0.2663,-0.1432 -0.2666,-0.1435 -0.2667,-0.1435 -0.2667,-0.1436 -0.2668,-0.1436 -0.2668,-0.1437 -0.2669,-0.1437 -0.2670,-0.1437 -0.2670,-0.1438 -0.2671,-0.1438 -0.2672,-0.1438 -0.2673,-0.1439 -0.2674,-0.1439 -0.2675,-0.1439 -0.2676,-0.1439 -0.2677,-0.1439 -0.2678,-0.1439 -0.2678,-0.1438 -0.2678,-0.1437 -0.2679,-0.1437 -0.2679,-0.1404 -0.2679,-0.1403 -0.2679,-0.1402 -0.2680,-0.1402 -0.2681,-0.1402 -0.2681,-0.1296 -0.2678,-0.1293 -0.2681,-0.1290 -0.2681,-0.1165 -0.2703,-0.1165 -0.2703,-0.1150 -0.2720,-0.1150 -0.2721,-0.1150 -0.2722,-0.1150 -0.2722,-0.1149 -0.2723,-0.1149 -0.2724,-0.1149 -0.2725,-0.1149 -0.2726,-0.1149 -0.2727,-0.1149 -0.2727,-0.1148 -0.2728,-0.1148 -0.2729,-0.1148 -0.2730,-0.1148 -0.2730,-0.1147 -0.2731,-0.1147 -0.2732,-0.1147 -0.2733,-0.1147 -0.2735,-0.1148 -0.2736,-0.1148 -0.2737,-0.1148 -0.2738,-0.1149 -0.2739,-0.1149 -0.2740,-0.1148 -0.2741,-0.1148 -0.2742,-0.1148 -0.2743,-0.1148 -0.2743,-0.1147 -0.2744,-0.1147 -0.2744,-0.1146 -0.2745,-0.1146 -0.2745,-0.1145 -0.2746,-0.1145 -0.2746,-0.1144 -0.2747,-0.1143 -0.2747,-0.1142 -0.2747,-0.1141 -0.2747,-0.1140 -0.2747,-0.1139 -0.2747,-0.1138 -0.2747,-0.1137 -0.2747,-0.1136 -0.2746,-0.1135 -0.2745,-0.1135 -0.2745,-0.1134 -0.2744,-0.1134 -0.2744,-0.1135 -0.2743,-0.1135 -0.2740,-0.1137 -0.2738,-0.1138 -0.2736,-0.1139 -0.2734,-0.1139 -0.2732,-0.1140 -0.2730,-0.1141 -0.2728,-0.1142 -0.2725,-0.1142 -0.2723,-0.1143 -0.2721,-0.1143 -0.2719,-0.1143 -0.2717,-0.1144 -0.2715,-0.1144 -0.2713,-0.1144 -0.2710,-0.1144 -0.2708,-0.1144 -0.2706,-0.1144 -0.2704,-0.1144 -0.2702,-0.1144 -0.2700,-0.1144 -0.2697,-0.1144 -0.2695,-0.1143 -0.2693,-0.1143 -0.2691,-0.1142 -0.2689,-0.1142 -0.2687,-0.1141 -0.2685,-0.1140 -0.2683,-0.1140 -0.2681,-0.1139 -0.2679,-0.1138 -0.2677,-0.1137 -0.2676,-0.1137 -0.2676,-0.1136 -0.2676,-0.1135 -0.2676,-0.1134 -0.2677,-0.1134 -0.2677,-0.1133 -0.2678,-0.1133 -0.2682,-0.1135 -0.2684,-0.1136 -0.2687,-0.1137 -0.2689,-0.1137 -0.2691,-0.1138 -0.2693,-0.1139 -0.2695,-0.1139 -0.2698,-0.1140 -0.2700,-0.1140 -0.2702,-0.1140 -0.2705,-0.1141 -0.2707,-0.1141 -0.2709,-0.1141 -0.2712,-0.1141 -0.2714,-0.1140 -0.2716,-0.1140 -0.2718,-0.1140 -0.2721,-0.1140 -0.2723,-0.1139 -0.2725,-0.1139 -0.2727,-0.1138 -0.2730,-0.1137 -0.2732,-0.1136 -0.2734,-0.1136 -0.2736,-0.1135 -0.2738,-0.1134 -0.2740,-0.1133 -0.2742,-0.1131 -0.2744,-0.1130 -0.2746,-0.1129 -0.2748,-0.1128 -0.2748,-0.1120 -0.2746,-0.1118 -0.2754,-0.1118 -0.2754,-0.1093 -0.2831,-0.1093 -0.2831,-0.1202 -0.2834,-0.1205 -0.2831,-0.1208 -0.2831,-0.1274 -0.2834,-0.1277 -0.2831,-0.1280 -0.2831,-0.1290 -0.2834,-0.1293 -0.2831,-0.1296 -0.2831,-0.1396 -0.2832,-0.1396 -0.2832,-0.1397 -0.2832,-0.1398 -0.2833,-0.1398 -0.2833,-0.1434 -0.2833,-0.1435 -0.2833,-0.1436 -0.2834,-0.1436 -0.2834,-0.1437 -0.2835,-0.1437 -0.2836,-0.1437 -0.2837,-0.1437 -0.2837,-0.1436 -0.2857,-0.1422 -0.2857,-0.1421 -0.2857,-0.1420 -0.2857,-0.1419 -0.2857,-0.1418 -0.2857,-0.1417 -0.2857,-0.1416 -0.2857,-0.1415 -0.2856,-0.1415 -0.2856,-0.1414 -0.2852,-0.1407 -0.2858,-0.1420 -0.2858,-0.1434 -0.2857,-0.1435 -0.2857,-0.1436 -0.2857,-0.1437 -0.2857,-0.1438 -0.2857,-0.1439 -0.2856,-0.1439 -0.2856,-0.1440 -0.2856,-0.1441 -0.2855,-0.1441 -0.2855,-0.1442 -0.2854,-0.1443 -0.2853,-0.1444 -0.2852,-0.1444 -0.2833,-0.1458 -0.2832,-0.1458 -0.2832,-0.1459 -0.2831,-0.1459 -0.2831,-0.1460 -0.2831,-0.1461 -0.2831,-0.1462 -0.2831,-0.1623 -0.2831,-0.1624 -0.2831,-0.1625 -0.2831,-0.1626 -0.2832,-0.1626 -0.2832,-0.1627 -0.2833,-0.1627 -0.2852,-0.1641 -0.2853,-0.1641 -0.2853,-0.1642 -0.2854,-0.1642 -0.2854,-0.1643 -0.2855,-0.1643 -0.2855,-0.1644 -0.2856,-0.1644 -0.2856,-0.1645 -0.2856,-0.1646 -0.2857,-0.1646 -0.2857,-0.1647 -0.2857,-0.1648 -0.2857,-0.1649 -0.2857,-0.1650 -0.2858,-0.1651 -0.2858,-0.1665 -0.2857,-0.1666 -0.2857,-0.1667 -0.2857,-0.1668 -0.2857,-0.1669 -0.2857,-0.1670 -0.2856,-0.1670 -0.2856,-0.1671 -0.2856,-0.1672 -0.2857,-0.1663 -0.2837,-0.1649 -0.2836,-0.1649 -0.2836,-0.1648 -0.2835,-0.1648 -0.2835,-0.1649 -0.2834,-0.1649 -0.2833,-0.1649 -0.2833,-0.1650 -0.2833,-0.1651 -0.2833,-0.1687 -0.2832,-0.1687 -0.2832,-0.1688 -0.2832,-0.1689 -0.2831,-0.1689 -0.2831,-0.1700 -0.2808,-0.1700 -0.2808,-0.1714 -0.2791,-0.1714 -0.2790,-0.1714 -0.2789,-0.1714 -0.2788,-0.1714 -0.2787,-0.1714 -0.2786,-0.1714 -0.2785,-0.1714 -0.2785,-0.1715 -0.2784,-0.1715 -0.2783,-0.1715 -0.2782,-0.1715 -0.2781,-0.1716 -0.2780,-0.1716 -0.2779,-0.1716 -0.2778,-0.1716 -0.2776,-0.1715 -0.2775,-0.1715 -0.2774,-0.1715 -0.2773,-0.1715 -0.2772,-0.1715 -0.2771,-0.1715 -0.2770,-0.1715 -0.2769,-0.1715 -0.2768,-0.1716 -0.2767,-0.1716 -0.2767,-0.1717 -0.2766,-0.1717 -0.2766,-0.1718 -0.2765,-0.1719 -0.2764,-0.1720 -0.2764,-0.1721 -0.2764,-0.1722 -0.2764,-0.1723 -0.2764,-0.1724 -0.2764,-0.1725 -0.2764,-0.1726 -0.2764,-0.1727 -0.2765,-0.1728 -0.2765,-0.1729 -0.2766,-0.1729 -0.2767,-0.1729 -0.2767,-0.1728 -0.2768,-0.1728 -0.2771,-0.1726 -0.2773,-0.1726 -0.2775,-0.1725 -0.2777,-0.1724 -0.2779,-0.1723 -0.2781,-0.1722 -0.2784,-0.1722 -0.2786,-0.1721 -0.2788,-0.1721 -0.2790,-0.1720 -0.2792,-0.1720 -0.2794,-0.1720 -0.2796,-0.1720 -0.2799,-0.1720 -0.2801,-0.1719 -0.2803,-0.1719 -0.2805,-0.1719 -0.2807,-0.1720 -0.2809,-0.1720 -0.2812,-0.1720 -0.2814,-0.1720 -0.2816,-0.1721 -0.2818,-0.1721 -0.2820,-0.1722 -0.2822,-0.1722 -0.2824,-0.1723 -0.2826,-0.1724 -0.2828,-0.1724 -0.2830,-0.1725 -0.2832,-0.1726 -0.2834,-0.1727 -0.2835,-0.1727 -0.2835,-0.1728 -0.2835,-0.1729 -0.2835,-0.1730 -0.2835,-0.1731 -0.2834,-0.1731 -0.2833,-0.1731 -0.2829,-0.1730 -0.2826,-0.1729 -0.2824,-0.1728 -0.2822,-0.1728 -0.2820,-0.1727 -0.2817,-0.1727 -0.2815,-0.1726 -0.2813,-0.1726 -0.2810,-0.1726 -0.2808,-0.1726 -0.2806,-0.1726 -0.2803,-0.1726 -0.2801,-0.1726 -0.2799,-0.1726 -0.2796,-0.1727 -0.2794,-0.1727 -0.2792,-0.1728 -0.2789,-0.1728 -0.2787,-0.1729 -0.2785,-0.1730 -0.2783,-0.1730 -0.2781,-0.1731 -0.2779,-0.1732 -0.2776,-0.1733 -0.2774,-0.1734 -0.2772,-0.1736 -0.2770,-0.1737 -0.2768,-0.1738 -0.2767,-0.1740 -0.2765,-0.1741 -0.2763,-0.1743 -0.2763,-0.1751 -0.2765,-0.1753 -0.2761,-0.1753 -0.2761,-0.1773 -0.2681,-0.1773 -0.2681,-0.1642 -0.2680,-0.1642 -0.2680,-0.1641 -0.2679,-0.1641 -0.2679,-0.1640 -0.2679,-0.1606 -0.2678,-0.1606 -0.2678,-0.1605 -0.2678,-0.1604 -0.2677,-0.1604 -0.2676,-0.1604 -0.2675,-0.1604 -0.2674,-0.1604 -0.2673,-0.1604 -0.2673,-0.1605 -0.2672,-0.1605 -0.2671,-0.1605 -0.2670,-0.1605 -0.2670,-0.1606 -0.2669,-0.1606 -0.2668,-0.1606 -0.2668,-0.1607 -0.2667,-0.1607 -0.2667,-0.1608 -0.2666,-0.1608 -0.2663,-0.1611 -0.2662,-0.1611 -0.2662,-0.1612 -0.2661,-0.1612 -0.2661,-0.1613 -0.2660,-0.1613 -0.2660,-0.1614 -0.2659,-0.1615 -0.2659,-0.1616 -0.2658,-0.1616 -0.2658,-0.1617 -0.2658,-0.1618 -0.2658,-0.1619 -0.2658,-0.1620 -0.2657,-0.1620 -0.2657,-0.1621 -0.2657,-0.1622 -0.2657,-0.1623 -0.2657,-0.1624 -0.2663,-0.1634 -0.2650,-0.1611 -0.2649,-0.1610 -0.2649,-0.1609 -0.2649,-0.1608 -0.2648,-0.1608 -0.2648,-0.1607 -0.2648,-0.1606 -0.2648,-0.1605 -0.2648,-0.1604 -0.2648,-0.1576 -0.2648,-0.1575 -0.2648,-0.1574 -0.2649,-0.1574 -0.2649,-0.1573 -0.2650,-0.1572 -0.2651,-0.1572 -0.2651,-0.1571 -0.2652,-0.1571 -0.2653,-0.1571 -0.2676,-0.1571 -0.2677,-0.1571 -0.2678,-0.1571 -0.2678,-0.1570 -0.2679,-0.1570 -0.2679,-0.1569 -0.2680,-0.1569 -0.2680,-0.1568 -0.2680,-0.1567 -0.2680,-0.1566 -0.2681,-0.1566 -0.2681,-0.1561 -0.2680,-0.1560 -0.2680,-0.1559 -0.2680,-0.1558 -0.2680,-0.1557 -0.2679,-0.1557 -0.2679,-0.1556 -0.2678,-0.1556 -0.2678,-0.1555 -0.2677,-0.1555 -0.2677,-0.1554 -0.2676,-0.1554 -0.2675,-0.1554 -0.2675,-0.1553 -0.2674,-0.1553 -0.2673,-0.1553 -0.2672,-0.1553 -0.2672,-0.1554 -0.2671,-0.1555 -0.2671,-0.1556  " style="fill:rgb(240,200,200);opacity:0.7;stroke:black;stroke-width:0.0001" />
  </g>
  </g>
  </svg>
`

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
  someSvg
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
