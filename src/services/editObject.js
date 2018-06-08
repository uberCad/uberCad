import * as THREE from '../extend/THREE'

let setColor = function (entity, bgColor, objName, objColor) {
  entity.children.forEach(function (entity) {
    if (entity.children.length > 0) {
      setColor(entity, bgColor, objName, objColor)
    } else {
      if (entity.type === 'Line' && entity.children.length === 0) {
        if (entity.parent.name === objName) {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone()
          }
          entity.material.color.set(objColor)
        } else {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone()
          }
          entity.material.color.set(bgColor)
        }
      }
    }
  })
}

let setOriginalColor = (entity) => {
  let firstColor //set color first line for created new line, arc
  entity.children.forEach(function (entity) {
    if (entity.children.length > 0) {
      setOriginalColor(entity)
    } else {
      if (entity.type === 'Line' &&
        entity.children.length === 0) {
        if (entity.userData.originalColor) {
          firstColor = firstColor ? firstColor : entity.userData.originalColor
          entity.material.color.set(entity.userData.originalColor)
        } else {
          entity.material.color.set(firstColor)
        }
      }
    }
  })
}

let addHelpPoints = (object, scene, radiusPoint) => {
  let helpLayer = scene.getObjectByName('HelpLayer')
  let pointGeometry = new THREE.CircleGeometry(radiusPoint, 32, 0, 2 * Math.PI)
  pointGeometry.vertices.shift()
  let pointMaterial = new THREE.LineBasicMaterial({color: 0xcccccc, opacity: 0.8, transparent: true})

  if (object.geometry.type === 'Geometry') {

    let point1 = new THREE.Line(pointGeometry, pointMaterial)
    point1.position.x = object.geometry.vertices[0].x
    point1.position.y = object.geometry.vertices[0].y
    point1.name = 'point1'

    let point2 = new THREE.Line(pointGeometry, pointMaterial)
    point2.position.x = object.geometry.vertices[1].x
    point2.position.y = object.geometry.vertices[1].y
    point2.name = 'point2'

    helpLayer.add(point1, point2)
  } else if (object.geometry.type === 'CircleGeometry') {
    let pointCenter = new THREE.Line(pointGeometry, pointMaterial)
    let pointStart = new THREE.Line(pointGeometry, pointMaterial)
    let pointEnd = new THREE.Line(pointGeometry, pointMaterial)
    let pointRadius = new THREE.Line(pointGeometry, pointMaterial)
    pointCenter.name = 'Center'
    pointStart.name = 'Start'
    pointEnd.name = 'End'
    pointRadius.name = 'Radius'

    pointStart.position.x = object.position.x + object.geometry.vertices[0].x
    pointStart.position.y = object.position.y + object.geometry.vertices[0].y
    pointEnd.position.x = object.position.x + object.geometry.vertices[object.geometry.vertices.length - 1].x
    pointEnd.position.y = object.position.y + object.geometry.vertices[object.geometry.vertices.length - 1].y
    pointCenter.position.x = object.position.x
    pointCenter.position.y = object.position.y
    pointRadius.position.x = object.position.x + object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].x
    pointRadius.position.y = object.position.y + object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].y

    helpLayer.add(pointCenter, pointStart, pointEnd, pointRadius)
  }
}

let getScale = (camera) => {
  let scale = camera.zoom
  scale = scale >= 1 ? (1.5 / scale) : scale * 2
  return scale
}

let setLine = (line, scene) => {
  line.name = ''
  scene.getObjectByName('HelpLayer').children = []
  line.material.color.set(0x00ff00)
  return {}
}

let closestPoint = (arr, c) => {
  let index
  arr.forEach(function (item) {
    item.distance = Math.sqrt((item.x - c.x) * (item.x - c.x) + (item.y - c.y) * (item.y - c.y))
  })
  let compare = (a, b) => {
    if (a.distance > b.distance) return 1
    if (a.distance < b.distance) return -1
  }
  let arrSorted = arr.slice().sort(compare)
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].distance === arrSorted[0].distance) {
      index = i
    }
  }
  return index
}

let isPoint = (a, r, rCenter) => {
  let rXy = Math.sqrt((rCenter.x - a.x) * (rCenter.x - a.x) + (rCenter.y - a.y) * (rCenter.y - a.y))
  return rXy <= r
}

let startPointIndex = (line, mousePoint, scale = 1) => {
  if (line.geometry.type === 'Geometry') {
    let index = closestPoint(
      line.geometry.vertices,
      mousePoint
    )
    const isSelectPoint = isPoint(
      line.geometry.vertices[index],
      scale,
      mousePoint)
    return isSelectPoint ? index : null
  }
  else {
    if (line.geometry.type === 'CircleGeometry') {

      let rPosition = line.position
      let thetaStart = {
        x: line.geometry.vertices[0].x + rPosition.x,
        y: line.geometry.vertices[0].y + rPosition.y
      }
      let thetaLength = {
        x: line.geometry.vertices[line.geometry.vertices.length - 1].x + rPosition.x,
        y: line.geometry.vertices[line.geometry.vertices.length - 1].y + rPosition.y
      }
      let radius = {
        x: line.geometry.vertices[(line.geometry.vertices.length - 1) / 2].x + rPosition.x,
        y: line.geometry.vertices[(line.geometry.vertices.length - 1) / 2].y + rPosition.y
      }

      let arrPoint = []
      arrPoint.push(rPosition, thetaStart, thetaLength, radius)

      let index = closestPoint(arrPoint, mousePoint)

      const isSelectPoint = isPoint(
        arrPoint[index],
        scale,
        mousePoint)

      return isSelectPoint ? index : null

      // $scope.editor.editMode.circle.helpStart = $scope.editor.editMode.circle.thetaStart;
      // $scope.editor.editMode.circle.helpLength = $scope.editor.editMode.circle.thetaLength;
    }
  }
}

let changeGeometry = (line, index, point, scene) => {
  if (line.geometry.type === 'Geometry') {
    line.geometry.vertices[index].x = point.x
    line.geometry.vertices[index].y = point.y
    line.geometry.verticesNeedUpdate = true
    line.computeLineDistances()
    line.geometry.computeBoundingSphere()

    // change circle point
    let point1 = scene.getObjectByName('point1')
    let point2 = scene.getObjectByName('point2')
    point1.position.x = line.geometry.vertices[0].x
    point1.position.y = line.geometry.vertices[0].y
    point2.position.x = line.geometry.vertices[1].x
    point2.position.y = line.geometry.vertices[1].y
  } else {
    if (line.geometry.type === 'CircleGeometry') {
      if (index === 0) {
        line.position.x = point.x
        line.position.y = point.y
        circleHelpPoint(line, scene)
      }
      // else if (index === 1) {
      //   let theta = $scope.editThetaStart(clickResult.point);
      //     $scope.changeRadiusArc(clickResult.point);
      //   }
        // $scope.editor.editMode.circle.thetaStart = theta.start;
        // $scope.editor.editMode.circle.thetaLength = theta.length;

      }
      // else if ($scope.editor.editMode.index === 2) {
    //     let theta;
    //     if (crossingPoint) {
    //       theta = $scope.editThetaLenght(crossingPoint.point);
    //       $scope.changeRadiusArc(crossingPoint.point);
    //       $scope.pointInfoActive();
    //       $scope.editor.pointInfo.element.style.color = "red";
    //       $scope.pointInfoMove("Arc Crossing Point");
    //
    //     } else {
    //       $scope.pointInfoNone();
    //       theta = $scope.editThetaLenght(clickResult.point);
    //       $scope.changeRadiusArc(clickResult.point);
    //     }
    //     $scope.editor.editMode.circle.thetaStart = theta.start;
    //     $scope.editor.editMode.circle.thetaLength = theta.length;
    //
    //   } else if ($scope.editor.editMode.index === 3) {
    //     if (crossingPoint) {
    //       $scope.changeRadiusArc(crossingPoint.point);
    //       $scope.pointInfoActive();
    //       $scope.editor.pointInfo.element.style.color = "red";
    //       $scope.pointInfoMove("Crossing Point");
    //     } else {
    //       $scope.pointInfoNone();
    //       $scope.changeRadiusArc(clickResult.point);
    //     }
    //   }
    //   $scope.setGeometry($scope.editor.editMode.circle);
    // }
  }
}

let   circleHelpPoint =(arc, scene) => {
  let center = scene.getObjectByName('Center')
  let start = scene.getObjectByName('Start')
  let end = scene.getObjectByName('End')
  let radius = scene.getObjectByName('Radius')

  center.position.x = arc.position.x
  center.position.y = arc.position.y
  start.position.x = arc.position.x + arc.geometry.vertices[0].x
  start.position.y = arc.position.y + arc.geometry.vertices[0].y
  end.position.x = arc.position.x + arc.geometry.vertices[arc.geometry.vertices.length - 1].x
  end.position.y = arc.position.y + arc.geometry.vertices[arc.geometry.vertices.length - 1].y
  radius.position.x = arc.position.x + arc.geometry.vertices[(arc.geometry.vertices.length - 1) / 2].x
  radius.position.y = arc.position.y + arc.geometry.vertices[(arc.geometry.vertices.length - 1) / 2].y
}

let crossingPoint = (pointMouse, activeEntities, entrainment = 0.05) => {
  try {
    if (activeEntities.length > 0 && pointMouse) {
      entrainment *= 10
      let line
      activeEntities.forEach(function (entity) {
        if (!line &&
          entity.name !== 'ActiveLine' &&
          entity.name !== 'point1' &&
          entity.name !== 'point2' &&
          entity.name !== 'Center' &&
          entity.name !== 'Start' &&
          entity.name !== 'End' &&
          entity.name !== 'Radius' &&
          entity.name !== 'newLine' &&
          entity.name !== 'helpLine'
        ) {
          line = entity
        }
      })
      if (line) {
        if (line.geometry.type === 'Geometry') {
          let index = closestPoint(line.geometry.vertices, pointMouse)
          let p = isPoint(pointMouse, entrainment, line.geometry.vertices[index])
          if (p) return {
            x: line.geometry.vertices[index].x,
            y: line.geometry.vertices[index].y
          }
        } else if (line.geometry.type === 'CircleGeometry') {
          let point0 = {}
          let point1 = {}
          point0.x = line.geometry.vertices[0].x + line.position.x
          point0.y = line.geometry.vertices[0].y + line.position.y
          point1.x = line.geometry.vertices[line.geometry.vertices.length - 1].x + line.position.x
          point1.y = line.geometry.vertices[line.geometry.vertices.length - 1].y + line.position.y
          let points = [point0, point1]

          let index = closestPoint(points, pointMouse)
          let p = isPoint(pointMouse, entrainment, points[index])
          if (p) return {
            x: points[index].x,
            y: points[index].y
          }
        }
      }
    }
    return false
  } catch (e) {
    console.error('closestPoint error ', e)
  }
}

export {
  setColor,
  setOriginalColor,
  addHelpPoints,
  getScale,
  setLine,
  startPointIndex,
  changeGeometry,
  crossingPoint
}
