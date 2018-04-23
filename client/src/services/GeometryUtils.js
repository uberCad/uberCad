import * as THREE from '../extend/THREE'

let distanceToLine = (vertex, line) => {
  // calculate distance to finite line segment

  let x1 = line.geometry.vertices[0].x
  let y1 = line.geometry.vertices[0].y
  let x2 = line.geometry.vertices[1].x
  let y2 = line.geometry.vertices[1].y

  return distanceToLineSegment(x1, y1, x2, y2, vertex.x, vertex.y)

  // old version calculates distance to infinite line in both directions.

  // //line equation y = mx + b
  // // also - Ax + By + C = 0 (will be used)
  //
  // // https://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
  //
  // let a, b, c;
  //
  // if (x1 !== x2) {
  //     let m = (y2 - y1) / (x2 - x1);
  //     let B = y1 - m * x1;
  //
  //     //y = mx + b;
  //     // Ax + By + C = 0
  //
  //     a = m;
  //     b = -1;
  //     c = B;
  // } else {
  //     a = 1;
  //     b = 0;
  //     c = -x1;
  // }
  //
  // return Math.abs((a*vertex.x + b*vertex.y + c)/Math.sqrt(Math.pow(a,2) + Math.pow(b,2)));
}

let distanceToArc = (vertex, arc) => {
  // https://bl.ocks.org/milkbread/11000965

  // http://www.analyzemath.com/Calculators/Circle_Line.html
  // circle (x - h)^2 + (y - k)^2 = r^2
  // line y = m*x + b

  let x1 = vertex.x
  let y1 = vertex.y
  let x2 = arc.position.x
  let y2 = arc.position.y

  let m = (y2 - y1) / (x2 - x1)
  let b = y1 - m * x1

  let h = arc.position.x
  let k = arc.position.y
  let r = arc.geometry.parameters.radius

  let A = 1 + m * m
  let B = -2 * h + 2 * m * b - 2 * k * m
  let C = h * h + b * b + k * k - 2 * k * b - r * r
  let delta = B * B - 4 * A * C

  if (delta >= 0) {
    let x1 = (-B + Math.sqrt(delta)) / (2 * A)
    let x2 = (-B - Math.sqrt(delta)) / (2 * A)
    let y1 = m * x1 + b
    let y2 = m * x2 + b

    let intersectPoint1 = new THREE.Vector3(x1, y1, 0)
    let intersectPoint2 = new THREE.Vector3(x2, y2, 0)

    let arcAngle1 = circleIntersectionAngle(intersectPoint1, arc.position, r)
    let arcAngle2 = circleIntersectionAngle(intersectPoint2, arc.position, r)

    // fix problem when thetaStart + thetaLength > 2pi AND arcAngle < thetastart
    if (arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength > Math.PI * 2) {
      if (arc.geometry.parameters.thetaStart > arcAngle1) {
        arcAngle1 += Math.PI * 2
      }
      if (arc.geometry.parameters.thetaStart > arcAngle2) {
        arcAngle2 += Math.PI * 2
      }
    }

    // todo: handle tangent line to arc

    let intersect1Distance = null
    let intersect2Distance = null

    if (arcAngle1 >= arc.geometry.parameters.thetaStart && arcAngle1 <= arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength) {
      intersect1Distance = intersectPoint1.distanceTo(vertex)
    }

    if (arcAngle2 >= arc.geometry.parameters.thetaStart && arcAngle2 <= arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength) {
      intersect2Distance = intersectPoint2.distanceTo(vertex)
    }

    if (intersect1Distance || intersect2Distance) {
      return (intersect1Distance && intersect2Distance && Math.min(intersect1Distance, intersect2Distance)) || intersect1Distance || intersect2Distance
    }

    // in case of no-intersection get distance to nearest arc-endpoint
    let arc1v1 = new THREE.Vector3(0, 0, 0)
    arc1v1.addVectors(arc.geometry.vertices[0], arc.position)

    let arc1v2 = new THREE.Vector3(0, 0, 0)
    arc1v2.addVectors(arc.geometry.vertices[arc.geometry.vertices.length - 1], arc.position)

    return Math.min(arc1v1.distanceTo(vertex), arc1v2.distanceTo(vertex))
  } else {
    // no intersection
  }
  return false
}

function distanceToLineSegment (lx1, ly1, lx2, ly2, px, py) {
  // source from https://github.com/scottglz/distance-to-line-segment/blob/master/index.js

  let ldx = lx2 - lx1,
    ldy = ly2 - ly1,
    lineLengthSquared = ldx * ldx + ldy * ldy,
    t // t===0 at line pt 1 and t ===1 at line pt 2

  if (!lineLengthSquared) {
    // 0-length line segment. Any t will return same result
    t = 0
  } else {
    t = ((px - lx1) * ldx + (py - ly1) * ldy) / lineLengthSquared

    if (t < 0) { t = 0 } else if (t > 1) { t = 1 }
  }

  let lx = lx1 + t * ldx,
    ly = ly1 + t * ldy,
    dx = px - lx,
    dy = py - ly
  return Math.sqrt(dx * dx + dy * dy)
}

function circleIntersectionAngle (vertex, circle, radius) {
  let projectionLine = Math.abs(vertex.x - circle.x)
  let angle = Math.acos(projectionLine / radius)
  // console.log({q}, Math.acos(q/r1), Math.acos(q/r1) / Math.PI * 180);
  if (vertex.x < circle.x && vertex.y < circle.y) {
    // III quadrant
    angle += Math.PI
  } else if (vertex.x < circle.x && vertex.y > circle.y) {
    // II quadrant
    angle = Math.PI - angle
  } else if (vertex.x > circle.x && vertex.y < circle.y) {
    // IV quadrant
    angle = 2 * Math.PI - angle
  } else {
    // in I quadrant
    // ok
  }
  return angle
}

/**
 *
 * @param entities []
 * @param threshold number
 * @return []
 */
function skipZeroLines (entities, threshold) {
  // filter and remove zero lines like that:
  // entity.geometry.vertices = [
  //     THREE.Vector3 {x: -323.9003129597497, y: -131.8572032025505, z: 0},
  //     THREE.Vector3 {x: -323.9003129597497, y: -131.8572032025505, z: 0}
  // ]

  return entities.filter(entity => {
    if (!(entity.geometry instanceof THREE.CircleGeometry) && entity.geometry.vertices.length === 2) {
      return (entity.geometry.vertices[0].distanceTo(entity.geometry.vertices[1]) > threshold)
    }
    return true
  })
}

function getFirstVertex (entity) {
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    let vertex = new THREE.Vector3(0, 0, 0)
    return vertex.addVectors(entity.geometry.vertices[0], entity.position)
  } else {
    // line?
    return entity.geometry.vertices[0]
  }
}

function getAnotherVertex (entity, vertex) {
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

  let anotherVertex = vertices[0]
  let distance = vertex.distanceTo(anotherVertex)

  vertices.forEach(v => {
    if (vertex.distanceTo(v) > distance) {
      anotherVertex = v
      distance = vertex.distanceTo(v)
    }
  })

  return anotherVertex
}

export default {
  distanceToLine,
  distanceToArc,
  skipZeroLines,
  getFirstVertex,
  getAnotherVertex
}
