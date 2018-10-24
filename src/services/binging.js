import { closestPoint, isPoint } from './editObject'
import * as THREE from '../extend/THREE'

export const binding = (click, scene, camera, renderer) => {
  if (click.activeEntities.length) {
    const pOnLine = pointOnLine(click.point, click.activeEntities[0])
    if (pOnLine) {
      click.point = pOnLine
      click.binding = 'pointOnLine'
    }

    const crossing = crossingPoint(click.point, click.activeEntities[0])
    if (crossing) {
      click.point = crossing
      click.binding = 'crossing'
    }

    const middle = midline(click.point, click.activeEntities[0])
    if (middle) {
      click.point = middle
      click.binding = 'midline'
    }
  }

  if (!click.binding) {
    const grid = gridPoint(click.point, scene)
    if (grid) {
      click.point = grid
      click.binding = 'gridPoint'
    }
  }

  if (click.binding) {
    viewBindingPoint(click.point, scene, camera, renderer)
  } else {
    removeBindingView(scene)
  }
  renderer.render(scene, camera)
  return {...click}
}

let crossingPoint = (pointMouse, line, entrainment = 0.05) => {
  try {
    if (line.type !== 'Points' && pointMouse) {
      entrainment *= 10
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

let pointOnLine = (point, line) => {
  let result = null
  if (line.type !== 'Points' || line.parent.name !== 'BindingPoint') {
    if ((line.geometry.vertices[1].y).toFixed(12) - (line.geometry.vertices[0].y).toFixed(12) === 0) {
      result = {
        x: point.x,
        y: line.geometry.vertices[0].y
      }
    } else if ((line.geometry.vertices[1].x).toFixed(12) - (line.geometry.vertices[0].x).toFixed(12) === 0) {
      result = {
        x: line.geometry.vertices[0].x,
        y: point.y
      }
    } else {
      /**
       * y = kx + b
       * k = (y2 - y1) / (x2 - x1) => (x1, y1) first line point, (x2, y2) second line point,
       * k1 = -1/ k2 => Perpendicular
       * b = y - kx
       * y1 = k1 * x1 + b1
       * y2 = k2 * x2 + b2
       * point intersects y1 & y2 :
       * pointX = (b2 - b1) / (k1 - k2)
       * pointY = k1 * ((b2 - b1) / (k1 - k2)) + b1
       */
      const kLine = (line.geometry.vertices[1].y - line.geometry.vertices[0].y) /
        (line.geometry.vertices[1].x - line.geometry.vertices[0].x)
      const bLine = line.geometry.vertices[0].y - kLine * line.geometry.vertices[0].x
      const kLinePerpendicular = -1 / kLine
      const bLinePerpendicular = point.y - kLinePerpendicular * point.x
      result = {
        x: (bLinePerpendicular - bLine) / (kLine - kLinePerpendicular),
        y: kLine * (bLinePerpendicular - bLine) / (kLine - kLinePerpendicular) + bLine
      }
    }
  }
  return result
}

let gridPoint = (point, scene) => {
  let gridPoints = scene.getObjectByName('GridLayer').children[0]

  if (gridPoints && gridPoints.type === 'Points') {
    let index = closestPoint(gridPoints.geometry.vertices, point)
    return gridPoints.geometry.vertices[index]
  }
}

let viewBindingPoint = (point, scene) => {
  const radius = 0.5
  removeBindingView(scene)

  let geometryArc = new THREE.CircleGeometry(radius, 32, 0, 2 * Math.PI)
  geometryArc.vertices[0] = geometryArc.vertices[32]
  let material = new THREE.LineBasicMaterial({color: 0xf45642})
  material.opacity = 0.5
  material.transparent = true
  let arc = new THREE.Line(geometryArc, material)
  arc.position.x = point.x
  arc.position.y = point.y

  let geometryLine1 = new THREE.Geometry()
  let geometryLine2 = new THREE.Geometry()
  geometryLine1.vertices.push(new THREE.Vector3(point.x, point.y + 2 * radius, 0))
  geometryLine1.vertices.push(new THREE.Vector3(point.x, point.y - 2 * radius, 0))
  geometryLine2.vertices.push(new THREE.Vector3(point.x + 2 * radius, point.y, 0))
  geometryLine2.vertices.push(new THREE.Vector3(point.x - 2 * radius, point.y, 0))
  let line1 = new THREE.Line(geometryLine1, material)
  let line2 = new THREE.Line(geometryLine2, material)

  let bindingPoint = new THREE.Object3D()
  bindingPoint.name = 'BindingPoint'
  bindingPoint.add(line1)
  bindingPoint.add(line2)
  bindingPoint.add(arc)
  let helpLayer = scene.getObjectByName('HelpLayer')
  helpLayer.add(bindingPoint)
}

let removeBindingView = (scene) => {
  let pointScene = scene.getObjectByName('BindingPoint')
  if (pointScene) {
    pointScene.parent.remove(pointScene)
  }
}

let midline = (pointMouse, line, entrainment = 0.5) => {
  let midPoint
  if (line.geometry instanceof THREE.CircleGeometry) {
    const angle = line.geometry.parameters.thetaStart + line.geometry.parameters.thetaLength / 2
    midPoint = {
      x: line.position.x + line.geometry.parameters.radius * Math.cos(angle),
      y: line.position.y + line.geometry.parameters.radius * Math.sin(angle)
    }
    return midPoint

  } else if (line.geometry instanceof THREE.Geometry) {
     midPoint = {
      x: (line.geometry.vertices[0].x + line.geometry.vertices[1].x) / 2,
      y: (line.geometry.vertices[0].y + line.geometry.vertices[1].y) / 2
    }
    if (isPoint(pointMouse, entrainment, midPoint)){
       return midPoint
    }
  }
}
