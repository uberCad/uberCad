import * as uuid from 'uuid';
import * as THREE from '../extend/THREE';
import * as KMeans from '../../node_modules/kmeans-js/kMeans';
import sceneService from './sceneService';
import Path from '../classes/Path';
import arrayUtils from './arrayUtils';
import helpLayerService from './helpLayerService';
import {
  changeArcGeometry as changGeomEditObj,
  circleIntersectionAngle as circlInterAngle
} from '../services/editObject';

let buildEdgeModel = (object, threshold = 0.000001, mode, index) => {
  // skip zero length lines
  let entities = skipZeroLines([...object.children], threshold);
  let vertices = getVertices(entities);
  let regions = [];

  // check for intersections
  entities.forEach(entityToCheck => {
    delete entityToCheck.userData.noIntersections;
    if (mode !== 'Free space') {
      entities.forEach(entity => {
        if (entity === entityToCheck || entity.userData.noIntersections) {
          return;
        }

        if (
          !(entity.geometry instanceof THREE.CircleGeometry) &&
          !(entityToCheck.geometry instanceof THREE.CircleGeometry)
        ) {
          // line to line
          const intersectionResult = linesIntersect(
            entity.geometry.vertices[0],
            entity.geometry.vertices[1],
            entityToCheck.geometry.vertices[0],
            entityToCheck.geometry.vertices[1],
            0
          );
          if (intersectionResult && intersectionResult.isIntersects) {
            if (
              entity.geometry.vertices[0].distanceTo(
                entityToCheck.geometry.vertices[0]
              ) > threshold &&
              entity.geometry.vertices[0].distanceTo(
                entityToCheck.geometry.vertices[1]
              ) > threshold &&
              entity.geometry.vertices[1].distanceTo(
                entityToCheck.geometry.vertices[0]
              ) > threshold &&
              entity.geometry.vertices[1].distanceTo(
                entityToCheck.geometry.vertices[1]
              ) > threshold
            ) {
              console.error('INTERSECTION', entityToCheck, entity);

              let error = new Error('There are entities intersected in object');
              error.userData = {
                error: 'intersection',
                type: 'line to line',
                msg: 'There are entities intersected in object',
                entities: [entityToCheck, entity]
              };
              throw error;
            }
          }
        } else if (
          entity.geometry instanceof THREE.CircleGeometry &&
          entityToCheck.geometry instanceof THREE.CircleGeometry
        ) {
          // arc to arc
          const intersectionResult = arcsIntersect(entity, entityToCheck, mode);
          if (intersectionResult) {
            // alert('ARC INTERSECTION!!! YEAH!!!');

            const arc1v1 = new THREE.Vector3(0, 0, 0);
            arc1v1.addVectors(
              intersectionResult.arc1.geometry.vertices[0],
              intersectionResult.arc1.position
            );

            const arc1v2 = new THREE.Vector3(0, 0, 0);
            arc1v2.addVectors(
              intersectionResult.arc1.geometry.vertices[
              intersectionResult.arc1.geometry.vertices.length - 1
                ],
              intersectionResult.arc1.position
            );

            const arc2v1 = new THREE.Vector3(0, 0, 0);
            arc2v1.addVectors(
              intersectionResult.arc2.geometry.vertices[0],
              intersectionResult.arc2.position
            );

            const arc2v2 = new THREE.Vector3(0, 0, 0);
            arc2v2.addVectors(
              intersectionResult.arc2.geometry.vertices[
              intersectionResult.arc2.geometry.vertices.length - 1
                ],
              intersectionResult.arc2.position
            );

            if (
              arc1v1.distanceTo(intersectionResult.intersectPoint) > threshold &&
              arc1v2.distanceTo(intersectionResult.intersectPoint) > threshold &&
              arc2v1.distanceTo(intersectionResult.intersectPoint) > threshold &&
              arc2v2.distanceTo(intersectionResult.intersectPoint) > threshold
            ) {
              console.error('INTERSECTION', entityToCheck, entity);
              // console.warn(entity.geometry.vertices[0], entity.geometry.vertices[1], entityToCheck.geometry.vertices[0], entityToCheck.geometry.vertices[1]);
              // [entityToCheck, entity]

              let error = new Error('There are entities intersected in object');
              error.userData = {
                error: 'intersection',
                type: 'arc to arc',
                msg: 'There are entities intersected in object',
                entities: [entityToCheck, entity]
              };
              throw error;

              // throw  {
              //   error: 'intersection',
              //   type: 'arc to arc',
              //   msg: 'There are entities intersected in object',
              //   entities: [entityToCheck, entity]
              // }
            }
          }
        } else {
          // line to arc
          let arc, line;

          if (entity.geometry instanceof THREE.CircleGeometry) {
            arc = entity;
            line = entityToCheck;
          } else {
            arc = entityToCheck;
            line = entity;
          }

          if (lineArcIntersect(line, arc)) {
            // possibly intersection. check for threshold

            const arc1v1 = new THREE.Vector3(0, 0, 0);
            arc1v1.addVectors(arc.geometry.vertices[0], arc.position);

            const arc1v2 = new THREE.Vector3(0, 0, 0);
            arc1v2.addVectors(
              arc.geometry.vertices[arc.geometry.vertices.length - 1],
              arc.position
            );

            const line1v1 = line.geometry.vertices[0].clone();

            const line1v2 = line.geometry.vertices[1].clone();

            if (
              arc1v1.distanceTo(line1v1) > threshold &&
              arc1v1.distanceTo(line1v2) > threshold &&
              arc1v2.distanceTo(line1v1) > threshold &&
              arc1v2.distanceTo(line1v2) > threshold
            ) {
              console.error('INTERSECTION', entityToCheck, entity);
              const error = new Error('There are entities intersected in object');
              error.userData = {
                error: 'intersection',
                type: 'line to arc',
                msg: 'There are entities intersected in object',
                entities: [arc, line]
              };
              throw error;
            }
          }
        }
      });
    }

    entityToCheck.userData.noIntersections = true;
  });

  let prevEntitiesCount = -1;
  do {
    regions.forEach(region => {
      region.path.forEach(vertex => {
        const idx = entities.indexOf(vertex.parent);
        if (idx > -1) {
          entities.splice(idx, 1);
        }
      });
    });

    const startVertex = vertices.find(v => entities.indexOf(v.parent) >= 0);

    if (prevEntitiesCount !== entities.length) {
      prevEntitiesCount = entities.length;
    } else {
      const error = new Error('Not all entities in use!');
      error.userData = {
        error: 'unused entities',
        msg: 'Not all entities in use!',
        entities: entities
      };
      throw error;
    }

    if (entities.length) {
      // do this crap to add toJSON to this object, which also have array prototype
      // also there is Object.defineProperty to hide length from Object.keys (by default there is no such property in vanilla array)
      const path = new Path();
      Object.defineProperty(path, 'length', {
        enumerable: false,
        writable: true
      });
      const resBuildChain = buildChain(vertices, startVertex, threshold, mode);
      if (resBuildChain) {
        path.push(...resBuildChain);
        // let path = new Path(buildChain(vertices, startVertex, threshold))

        const area = pathArea(path);
        regions.push({
          path,
          area,
          areaAbsolute: area,
          boundingBox: buildBoundingBox(path)
        });
      }
    }
  } while (entities.length);

  if (regions.length) {
    // make outer region clockwise. other regions counterclockwise
    let outerRegion = regions[0];
    regions.forEach(region => {
      if (region.boundingBox.area > outerRegion.boundingBox.area) {
        outerRegion = region;
      }
    });

    // set outer region first
    regions.unshift(...regions.splice(regions.indexOf(outerRegion), 1));

    let innerArea = 0;
    regions.forEach((region, idx) => {
      if (idx) {
        innerArea += region.areaAbsolute;
      }
    });
    regions[0].area -= innerArea;

    regions.forEach(region => {
      if (isClockwise(region.path)) {
        if (region === outerRegion) {
          // make outer region counterclockwise
          region.path.reverse();
        }
      } else {
        // counterclockwise

        if (region !== outerRegion) {
          // make inner region clockwise
          region.path.reverse();
        }
      }
    });
  }

  // // console.log('regions', regions);

  let pathD = '';
  const subRegionsPathD = [];
  const vertexList = [];
  const insidePoint = getInsidePoint(regions);
  regions.forEach((region, idx) => {
    const last = region.path[region.path.length - 1];
    let lastVertex = `${(last.x / 1000).toFixed(4)},${(last.y / 1000).toFixed(
      4
    )}`;
    let p = `M${lastVertex} L`;
    region.path.forEach(v => {
      let vertex = `${(v.x / 1000).toFixed(4)},${(v.y / 1000).toFixed(4)}`;
      if (vertex !== lastVertex && vertexList.indexOf(vertex) < 0) {
        p += `${vertex} `;
        lastVertex = vertex;
        vertexList.push(vertex);
      }
    });
    pathD += p;
    if (idx) {
      subRegionsPathD.push(p);
    }
  });

  const viewBox = {
    x: (Math.min(...vertices.map(v => v.x)) / 1000).toFixed(4),
    y: (Math.min(...vertices.map(v => v.y)) / 1000).toFixed(4),
    width: (
      (Math.max(...vertices.map(v => v.x)) -
        Math.min(...vertices.map(v => v.x))) /
      1000
    ).toFixed(4),
    height: (
      (Math.max(...vertices.map(v => v.y)) -
        Math.min(...vertices.map(v => v.y))) /
      1000
    ).toFixed(4)
  };
  return {
    regions, // outer region goes first
    svgData: {
      viewBox,
      pathD,
      subRegionsPathD,
      insidePoint
    }
  };
};

let rotatePoint = (center, angle, point) => {
  let s = Math.sin(angle);
  let c = Math.cos(angle);

  // translate point back to origin:
  // let x = point.x - center.x
  // let y = point.y - center.y

  let x = point.x;
  let y = point.y;

  // rotate point
  let xNew = x * c - y * s;
  let yNew = x * s + y * c;

  // // console.log('rotatePoint', x, y, xNew, yNew, point, center)

  // return new THREE.Vector3(xNew + center.x, yNew + center.y, 0)
  // return new THREE.Vector3(xNew + 10, yNew + 10, 0)
  return new THREE.Vector3(xNew, yNew, 0);
};

/**
 * @deprecated use editObject.js
 * @param arcGeometry
 * @param parameters
 * @returns {CircleGeometry}
 */
let changeArcGeometry = (arcGeometry, parameters) => {
  arcGeometry.dispose();
  let geometry = new THREE.CircleGeometry(
    parameters.radius,
    32,
    parameters.thetaStart,
    parameters.thetaLength
  );
  geometry.vertices.shift();
  return geometry;
};

let buildChain = (
  vertices,
  startVertex,
  threshold = 0.000001,
  mode = 'standart',
  vertex,
  path = []
) => {
  if (!vertex) {
    vertex = startVertex;
  }

  let entity = vertex.parent;
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc

    let v = new THREE.Vector3(0, 0, 0);
    v.addVectors(entity.geometry.vertices[0], entity.position);

    let vertices = [...entity.geometry.vertices];
    if (vertex.distanceTo(v) > threshold) {
      // reverse order
      vertices.reverse();
    }

    vertices.forEach((v, idx, array) => {
      if (idx >= array.length - 1) {
        // skip last element
        return;
      }
      let vertice = new THREE.Vector3(0, 0, 0);
      vertice.parent = entity;
      path.push(vertice.addVectors(v, entity.position));
    });
  } else {
    // line
    path.push(vertex);
  }

  let anotherVertex = vertices.find(
    item => item.parent === vertex.parent && item !== vertex
  );

  let nearestVertex;
  let distances = [];
  vertices.forEach(v => {
    if (v === anotherVertex) {
      return false;
    }
    distances.push({
      vertex: v,
      distance: anotherVertex.distanceTo(v)
    });
  });

  // get closest vertex
  let minDistance = distances.pop();
  distances.forEach(distance => {
    if (distance.distance < minDistance.distance) {
      minDistance = distance;
    }
  });

  if (minDistance.distance > threshold && mode !== 'Free space') {
    let error = new Error('Interruption detected. Operation canceled');
    error.userData = {
      error: 'interruption',
      type: `interruption`,
      msg: 'Interruption detected. Operation canceled',
      entity: vertex.parent,
      minDistance: minDistance,
      entities: [vertex.parent, minDistance.vertex.parent],
      // vertices: [minDistance.vertex, new THREE.Vector3(-200,-150,0)]
      vertices: [vertex, minDistance.vertex]
    };

    console.error(error.userData);
    throw error;
  }

  nearestVertex = minDistance.vertex;

  if (anotherVertex === startVertex || nearestVertex === startVertex) {
    return path;
  }

  return buildChain(
    vertices.filter(v => v !== anotherVertex && v !== nearestVertex),
    startVertex,
    threshold,
    mode,
    nearestVertex,
    path
  );
};

let buildBoundingBox = vertices => {
  let boundingBox = {
    x1: Math.min(...vertices.map(v => v.x)),
    y1: Math.min(...vertices.map(v => v.y)),
    x2: Math.max(...vertices.map(v => v.x)),
    y2: Math.max(...vertices.map(v => v.y))
  };
  boundingBox.area = Math.abs(
    (boundingBox.x1 - boundingBox.x2) * (boundingBox.y1 - boundingBox.y2)
  );
  return boundingBox;
};

let isClockwise = vertices => {
  let sum = 0;

  if (vertices) {
    let prevVertex = vertices[vertices.length - 1];

    vertices.forEach(vertex => {
      sum += (vertex.x - prevVertex.x) * (vertex.y + prevVertex.y);
      prevVertex = vertex;
    });
  }

  return sum > 0;
};

let getInsidePoint = (regions, threshold) => {
  let farestPoint = false;

  if (regions.length) {
    let path = regions[0].path;
    let width =
      Math.max(...path.map(v => v.x)) - Math.min(...path.map(v => v.x));
    let height =
      Math.max(...path.map(v => v.y)) - Math.min(...path.map(v => v.y));
    let minDistanceFromBorder = threshold || Math.min(width, height) / 100;
    let points = [];
    let firstPoint = path[0];

    let entities = [];
    path.forEach(vertex => {
      if (!entities.includes(vertex.parent)) {
        entities.push(vertex.parent);
      }
    });

    let bestPoints = 0;
    for (let i = 0; i < 3; i++) {
      let attempts = 0;
      while (points.length < i * 3 + 3 || attempts < 20) {
        let secondPoint = path[parseInt(Math.random() * path.length, 10)];

        let midPoint = {
          x: (firstPoint.x + secondPoint.x) / 2,
          y: (firstPoint.y + secondPoint.y) / 2,
          z: 0
        };

        if (insidePolygon(path, midPoint)) {
          // try to do it simplest way...
          let minDistance = 999999999; // or Infinity
          for (let entity of entities) {
            let distance = distanceToEntity(midPoint, entity);
            if (distance < minDistance) {
              minDistance = distance;
            }
          }
          points.push({
            minDistance,
            point: midPoint
          });

          if (minDistance > minDistanceFromBorder) {
            bestPoints++;
          }
          if (bestPoints >= 2) {
            // if there are 2+ points, select one farest from border (that far enough: 10000*threshold)
            let maxDistance = 0;

            for (let point of points) {
              if (point.minDistance > maxDistance) {
                maxDistance = point.minDistance;
                farestPoint = point.point;
              }
            }

            // if there are no vertex further than 10000*threshold, scripts after that cycle find farest
            return farestPoint;
          }
        }
        attempts++;
      }
      firstPoint = path[parseInt(Math.random() * path.length, 10)];
    }

    if (points.length) {
      let maxDistance = 0;
      points.forEach(point => {
        if (point.minDistance > maxDistance) {
          maxDistance = point.minDistance;
          farestPoint = point.point;
        }
      });
    }

    return farestPoint;
  }
};
const getObjectOuterEntities = object => {
  const arrayOfEntities = [];
  object.userData.edgeModel.regions[0].path.forEach(vertex => {
    if (!arrayOfEntities.includes(vertex.parent)) {
      arrayOfEntities.push(vertex.parent);
    }
  });
  return arrayOfEntities;
};
const getCollisionPoints = (objects, threshold = 0.000001) => {
  const collisionPoints = [];
  // if object bounding boxes intersect or tangent then
  //     find intersections between object
  //     find tangent points between objects
  //     find new regions

  objects.forEach(object => {
    // if (object.name !== 'obj5' && object.name !== 'obj3') {
    //   return;
    // }
    object.userData.checkedIntersection = true;

    const objectOuterEntities = getObjectOuterEntities(object);
    // filter, to process collided objects once
    objects
      .filter(obj => {
        return (
          // todo перша приблуда яку треба юзати при переміщені об'єкта при вставкі isBoundingBoxesCollide
          // check current element with first if both got checkedIntersection also if there boundingBoxes got same points
          !obj.userData.checkedIntersection &&
          isBoundingBoxesCollide(
            object.userData.edgeModel.regions[0].boundingBox,
            obj.userData.edgeModel.regions[0].boundingBox,
            threshold
          )
        );
      })
      .forEach(obj => {
        // check for intersections between object
        // entity to entity
        const objOuterEntities = getObjectOuterEntities(obj);
        // check for intersections
        objectOuterEntities.forEach(entityObject => {
          objOuterEntities.forEach(entityObj => {
            const info = entitiesIntersectInfo(
              entityObject,
              entityObj,
              threshold
            );
            if (info) {
              if (info.points) {
                // new result type
                info.points.forEach(point => {
                  collisionPoints.push({
                    id: collisionPoints.length,
                    type: info.type,
                    isIntersects: info.isIntersects,
                    color: new THREE.Color(
                      `${Math.floor(Math.random() * 16777215).toString(16)}`
                    ),
                    point: point.point,
                    distance: point.distance,
                    entities: info.entities,
                    ids: info.ids
                  });
                });
              } else {
                info.id = collisionPoints.length;
                collisionPoints.push(info);
              }
            }
          });
        });
      });
  });

  objects.forEach(object => {
    delete object.userData.checkedIntersection;
  });

  return collisionPoints;
};

let insidePolygon = (polygon = [], vertex) => {
  // There must be at least 3 vertices in polygon[]
  if (polygon.length < 3) {
    return false;
  }

  // Create a point for line segment from p to infinite
  let extreme = {
    x: 99999999999,
    y: vertex.y + 9999999999
  };

  // Count intersections of the above line with sides of polygon
  let count = 0;

  for (let i = 0; i < polygon.length; i++) {
    let next = (i + 1) % polygon.length;

    // Check if the line segment from 'vertex' to 'extreme' intersects
    // with the line segment from 'polygon[i]' to 'polygon[next]'
    let intersectResult = linesIntersect(
      polygon[i],
      polygon[next],
      vertex,
      extreme
    );
    if (intersectResult.isIntersects) {
      for (let point of intersectResult.points) {
        if (point.distance === 0) {
          count++;
        }
      }
      // If the point 'p' is colinear with line segment 'i-next',
      // then check if it lies on segment. If it lies, return true,
      // otherwise false
      if (intersectResult.type === 'collinear') {
        return true;
      }
    }
  }

  // Return true if count is odd, false otherwise
  return count % 2 === 1;
};

let lineArcIntersectNew = (line, arc, threshold = 0) => {
  // http://mathworld.wolfram.com/Circle-LineIntersection.html
  // http://csharphelper.com/blog/2014/09/determine-where-a-line-intersects-a-circle-in-c/

  let result = {
    type: 'none',
    isIntersects: false,
    points: [],
    arc,
    line
  };

  // point = {
  //   point,
  //   distance,
  //   arcAngle
  // }

  let x1 = line.geometry.vertices[0].x;
  let y1 = line.geometry.vertices[0].y;
  let x2 = line.geometry.vertices[1].x;
  let y2 = line.geometry.vertices[1].y;

  let cx = arc.position.x;
  let cy = arc.position.y;
  let r = arc.geometry.parameters.radius;

  let dx = x2 - x1;
  let dy = y2 - y1;

  let A = dx * dx + dy * dy;
  let B = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
  let C = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

  let delta = B * B - 4 * A * C;

  /**
   * delta < 0 - no intersections
   * delta == 0 - 1 intersection, tangency
   * delta > 0 - 2 intersections
   */

  if (delta > 0) {
    // Two solutions.
    result.type = 'intersect';
    let t = (-B + Math.sqrt(delta)) / (2 * A);
    result.points.push({
      point: {
        x: x1 + t * dx,
        y: y1 + t * dy
      },
      distance: 0
    });
    t = (-B - Math.sqrt(delta)) / (2 * A);
    result.points.push({
      point: {
        x: x1 + t * dx,
        y: y1 + t * dy
      },
      distance: 0
    });
  } else if (
    delta === 0 ||
    distanceToLine(arc.position, line) - r <= threshold
  ) {
    // One solution.
    let t = -B / (2 * A);

    result.type = 'tangent';
    result.points.push({
      point: {
        x: x1 + t * dx,
        y: y1 + t * dy
      },
      distance: distanceToLine(arc.position, line) - r
    });
  } else {
    // delta < 0 - no solutions
  }

  result.points = result.points.filter(pointToCheck => {
    // check if intersectionPoint on line segment
    if (
      !isBetween(
        line.geometry.vertices[0],
        line.geometry.vertices[1],
        pointToCheck.point,
        threshold
      )
    ) {
      return false;
    }

    let arcAngle = circleIntersectionAngle(pointToCheck.point, arc.position, r);
    pointToCheck.arcAngle = arcAngle;

    // fix problem when thetaStart + thetaLength > 2pi AND arcAngle < thetastart
    if (
      arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength >
      Math.PI * 2
    ) {
      if (arc.geometry.parameters.thetaStart > arcAngle) {
        arcAngle += Math.PI * 2;
      }
    }

    if (
      arcAngle >= arc.geometry.parameters.thetaStart &&
      arcAngle <=
        arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength
    ) {
      return true;
    }

    // no intersection, but beginning or ending near intersection point
    try {
      getVertices(arc).forEach(v => {
        let distance = v.distanceTo(pointToCheck.point);
        if (distance < threshold) {
          pointToCheck.distance = distance;
          throw new Error('so close to intersection point');
        }
      });
    } catch (e) {
      return true;
    }
    return false;
  });

  if (result.points.length) {
    result.isIntersects = true;
  } else {
    result.type = 'none';
  }

  return result;
};

let lineArcIntersect = (line, arc, threshold = 0) => {
  // https://bl.ocks.org/milkbread/11000965

  // http://www.analyzemath.com/Calculators/Circle_Line.html
  // circle (x - h)^2 + (y - k)^2 = r^2
  // line y = m*x + b

  let x1 = line.geometry.vertices[0].x;
  let y1 = line.geometry.vertices[0].y;
  let x2 = line.geometry.vertices[1].x;
  let y2 = line.geometry.vertices[1].y;

  let m = (y2 - y1) / (x2 - x1);
  let b = y1 - m * x1;

  let h = arc.position.x;
  let k = arc.position.y;
  let r = arc.geometry.parameters.radius;

  let A = 1 + m * m;
  let B = -2 * h + 2 * m * b - 2 * k * m;
  let C = h * h + b * b + k * k - 2 * k * b - r * r;
  let delta = B * B - 4 * A * C;

  if (delta < 0 && delta + threshold >= 0) {
    delta = 0;
  }

  if (delta >= 0) {
    let x1 = (-B + Math.sqrt(delta)) / (2 * A);
    let x2 = (-B - Math.sqrt(delta)) / (2 * A);
    let y1 = m * x1 + b;
    let y2 = m * x2 + b;

    let intersectPoint1 = new THREE.Vector3(x1, y1, 0);
    let intersectPoint2 = new THREE.Vector3(x2, y2, 0);

    let arcAngle1 = circleIntersectionAngle(intersectPoint1, arc.position, r);
    let arcAngle2 = circleIntersectionAngle(intersectPoint2, arc.position, r);

    if (
      !isBetween(
        line.geometry.vertices[0],
        line.geometry.vertices[1],
        intersectPoint1,
        threshold
      )
    ) {
      intersectPoint1 = null;
    }

    if (
      !isBetween(
        line.geometry.vertices[0],
        line.geometry.vertices[1],
        intersectPoint2,
        threshold
      )
    ) {
      intersectPoint2 = null;
    }

    // fix problem when thetaStart + thetaLength > 2pi AND arcAngle < thetastart
    if (
      arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength >
      Math.PI * 2
    ) {
      if (arc.geometry.parameters.thetaStart > arcAngle1) {
        arcAngle1 += Math.PI * 2;
      }
      if (arc.geometry.parameters.thetaStart > arcAngle2) {
        arcAngle2 += Math.PI * 2;
      }
    }

    // todo: handle tangent line to arc

    if (
      intersectPoint1 &&
      arcAngle1 >= arc.geometry.parameters.thetaStart &&
      arcAngle1 <=
        arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength
    ) {
      return {
        mode: 'intersection',
        intersectPoint: intersectPoint1,
        arc: arc,
        line: line,
        arcAngle: arcAngle1,
        distance: 0
      };
    }

    if (
      intersectPoint2 &&
      arcAngle2 >= arc.geometry.parameters.thetaStart &&
      arcAngle2 <=
        arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength
    ) {
      return {
        mode: 'intersection',
        intersectPoint: intersectPoint2,
        arc: arc,
        line: line,
        arcAngle: arcAngle2,
        distance: 0
      };
    }

    // in case of threshold-error
    if (threshold) {
      let arc1v1 = new THREE.Vector3(0, 0, 0);
      arc1v1.addVectors(arc.geometry.vertices[0], arc.position);

      let arc1v2 = new THREE.Vector3(0, 0, 0);
      arc1v2.addVectors(
        arc.geometry.vertices[arc.geometry.vertices.length - 1],
        arc.position
      );

      if (intersectPoint1) {
        let distance = Math.min(
          arc1v1.distanceTo(intersectPoint1),
          arc1v2.distanceTo(intersectPoint1)
        );
        if (distance < threshold) {
          return {
            mode: 'intersection',
            intersectPoint: intersectPoint1,
            arc: arc,
            line: line,
            arcAngle: arcAngle1,
            distance
          };
        }
      }

      if (intersectPoint2) {
        let distance = Math.min(
          arc1v1.distanceTo(intersectPoint2),
          arc1v2.distanceTo(intersectPoint2)
        );
        if (distance < threshold) {
          return {
            mode: 'intersection',
            intersectPoint: intersectPoint2,
            arc: arc,
            line: line,
            arcAngle: arcAngle2,
            distance
          };
        }
      }
    }
  } else {
    // no intersection
  }
  return false;
};

let arcsIntersect = (arc1, arc2, mode) => {
  // http://www.ambrsoft.com/TrigoCalc/Circles2/circle2intersection/CircleCircleIntersection.htm

  let x1 = arc1.position.x; // a
  let y1 = arc1.position.y; // b
  let x2 = arc2.position.x; // c
  let y2 = arc2.position.y; // d
  //
  // let x1 = 3, //a
  //     y1 = 3, //b
  //     x2 = 6, //c
  //     y2 = 3; //d

  let r1 = arc1.geometry.parameters.radius;
  let r2 = arc2.geometry.parameters.radius;

  // let a = 3, b = 3, c = 6, d = 3;
  // let r1 = 3, r2 = 3;

  // Distance between two circles centers
  let D = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

  // Conditions for intersection between two circles
  if (D < r1 + r2 && D > Math.abs(r1 - r2)) {
    // intersection of two circles

    // intersection coordinates
    let z =
      Math.sqrt(
        (D + r1 + r2) * (D + r1 - r2) * (D - r1 + r2) * (-D + r1 + r2)
      ) / 4;

    let intersectPoint1 = new THREE.Vector3(
      (x1 + x2) / 2 +
        ((x2 - x1) * (r1 * r1 - r2 * r2)) / (2 * D * D) +
        (2 * z * (y1 - y2)) / (D * D),
      (y1 + y2) / 2 +
        ((y2 - y1) * (r1 * r1 - r2 * r2)) / (2 * D * D) -
        (2 * z * (x1 - x2)) / (D * D),
      0
    );

    let intersectPoint2 = new THREE.Vector3(
      (x1 + x2) / 2 +
        ((x2 - x1) * (r1 * r1 - r2 * r2)) / (2 * D * D) -
        (2 * z * (y1 - y2)) / (D * D),
      (y1 + y2) / 2 +
        ((y2 - y1) * (r1 * r1 - r2 * r2)) / (2 * D * D) +
        (2 * z * (x1 - x2)) / (D * D),
      0
    );

    // let angle = circleIntersectionAngle(intersectPoint1, arc1.position, r1);
    // // console.log({angle}, angle/ Math.PI * 180);

    let arc1angle1 = circleIntersectionAngle(
      intersectPoint1,
      arc1.position,
      r1
    );
    let arc1angle2 = circleIntersectionAngle(
      intersectPoint2,
      arc1.position,
      r1
    );
    let arc2angle1 = circleIntersectionAngle(
      intersectPoint1,
      arc2.position,
      r2
    );
    let arc2angle2 = circleIntersectionAngle(
      intersectPoint2,
      arc2.position,
      r2
    );

    // fix problem when thetaStart + thetaLength > 2pi AND arcAngle < thetastart
    if (
      arc1.geometry.parameters.thetaStart +
        arc1.geometry.parameters.thetaLength >
      Math.PI * 2
    ) {
      if (arc1.geometry.parameters.thetaStart > arc1angle1) {
        arc1angle1 += Math.PI * 2;
      }
      if (arc1.geometry.parameters.thetaStart > arc1angle2) {
        arc1angle2 += Math.PI * 2;
      }
    }

    if (
      arc2.geometry.parameters.thetaStart +
        arc2.geometry.parameters.thetaLength >
      Math.PI * 2
    ) {
      if (arc2.geometry.parameters.thetaStart > arc2angle1) {
        arc2angle1 += Math.PI * 2;
      }
      if (arc2.geometry.parameters.thetaStart > arc2angle2) {
        arc2angle2 += Math.PI * 2;
      }
    }

    if (
      arc1angle1 >= arc1.geometry.parameters.thetaStart &&
      arc1angle1 <=
        arc1.geometry.parameters.thetaStart +
          arc1.geometry.parameters.thetaLength &&
      arc2angle1 >= arc2.geometry.parameters.thetaStart &&
      arc2angle1 <=
        arc2.geometry.parameters.thetaStart +
          arc2.geometry.parameters.thetaLength
    ) {
      return {
        mode: 'intersection',
        intersectPoint: intersectPoint1,
        arc1: arc1,
        arc2: arc2,
        arc1angle: arc1angle1,
        arc2angle: arc2angle1
      };
    }

    if (
      arc1angle2 >= arc1.geometry.parameters.thetaStart &&
      arc1angle2 <=
        arc1.geometry.parameters.thetaStart +
          arc1.geometry.parameters.thetaLength &&
      arc2angle2 >= arc2.geometry.parameters.thetaStart &&
      arc2angle2 <=
        arc2.geometry.parameters.thetaStart +
          arc2.geometry.parameters.thetaLength
    ) {
      return {
        mode: 'intersection',
        intersectPoint: intersectPoint2,
        arc1: arc1,
        arc2: arc2,
        arc1angle: arc1angle2,
        arc2angle: arc2angle2
      };
      // alert('intersection of arcs!!!');
    }
  } else if (D === r1 + r2 || Math.abs(r1 - r2) === D) {
    console.warn('Two circles tangency');

    // let x = ((a-c) * (r1*r1-r2*r2)) / (2*(Math.pow(c-a,2)+ Math.pow(d-b,2))) - (a + c) / 2;

    // let x = ((a - c) * (r1 * r1 - r2 * r2)) / (2 * (Math.pow(c - a, 2) + Math.pow(d - b, 2))) - (a + c) / 2;
    // let y = ((b - d) * (r1 * r1 - r2 * r2)) / (2 * (Math.pow(c - a, 2) + Math.pow(d - b, 2))) - (d + b) / 2;
    // // console.log({x, y});
    // TODO handle arcs tagnency
    if (mode !== 'Free space') {
      window.alert('arcs tagnency. How to handle?');
    }
    // calculate tangency point
  } else {
    // console.warn('no intersection');
    return false;
  }
};

const getVertices = (entities, allVertices = false) => {
  if (!Array.isArray(entities)) {
    entities = [entities];
  }

  let vertices = [];
  entities.forEach(entity => {
    if (entity.geometry instanceof THREE.CircleGeometry) {
      // arc
      if (allVertices) {
        entity.geometry.vertices.forEach(v => {
          const vertex = new THREE.Vector3(0, 0, 0);
          vertex.parent = entity;
          vertices.push(vertex.addVectors(v, entity.position));
        });
      } else {
        let vertex = new THREE.Vector3(0, 0, 0);
        vertex.parent = entity;
        vertices.push(
          vertex.addVectors(entity.geometry.vertices[0], entity.position)
        );
        vertex = new THREE.Vector3(0, 0, 0);
        vertex.parent = entity;
        vertices.push(
          vertex.addVectors(
            entity.geometry.vertices[entity.geometry.vertices.length - 1],
            entity.position
          )
        );
      }
    } else {
      // line
      entity.geometry.vertices.forEach(src => {
        const vertex = new THREE.Vector3(src.x, src.y, 0);
        vertex.parent = entity;
        vertices.push(vertex);
      });
    }
  });
  return vertices;
};

let distanceToLine = (vertex, line, method = 0) => {
  // debugger;
  // за схожим принципом вираховуємо відстань до найближчого баундінг боса обєкта, потім до найближчої лінії
  // calculate distance to finite line segment

  let x1 = line.geometry.vertices[0].x;
  let y1 = line.geometry.vertices[0].y;
  let x2 = line.geometry.vertices[1].x;
  let y2 = line.geometry.vertices[1].y;

  let distanceToLine = distanceToLineSegment(
    x1,
    y1,
    x2,
    y2,
    vertex.x,
    vertex.y
  );
  if (method === 0) {
    return distanceToLine;
  } else if (method === 1) {
    if (distanceToLine === 0) {
      // debugger;
      let lineLength = getDistance(
        line.geometry.vertices[0],
        line.geometry.vertices[1]
      );
      let distanceToPoint0 = getDistance(line.geometry.vertices[0], vertex);
      let distanceToPoint1 = getDistance(vertex, line.geometry.vertices[1]);
      if (lineLength - distanceToPoint0 - distanceToPoint1 < 0.00001) {
        return distanceToLine;
      } else {
        debugger;
        if (distanceToPoint0 > distanceToPoint1) {
          return distanceToPoint1;
        } else {
          return distanceToPoint0;
        }
      }
    } else {
      return distanceToLine;
    }
  }
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
};

let distanceToArc = (vertex, arc) => {
  // https://bl.ocks.org/milkbread/11000965

  // http://www.analyzemath.com/Calculators/Circle_Line.html
  // circle (x - h)^2 + (y - k)^2 = r^2
  // line y = m*x + b

  let x1 = vertex.x;
  let y1 = vertex.y;
  let x2 = arc.position.x;
  let y2 = arc.position.y;

  let m = (y2 - y1) / (x2 - x1);
  let b = y1 - m * x1;

  let h = arc.position.x;
  let k = arc.position.y;
  let r = arc.geometry.parameters.radius;

  let A = 1 + m * m;
  let B = -2 * h + 2 * m * b - 2 * k * m;
  let C = h * h + b * b + k * k - 2 * k * b - r * r;
  let delta = B * B - 4 * A * C;

  if (delta >= 0) {
    let x1 = (-B + Math.sqrt(delta)) / (2 * A);
    let x2 = (-B - Math.sqrt(delta)) / (2 * A);
    let y1 = m * x1 + b;
    let y2 = m * x2 + b;

    let intersectPoint1 = new THREE.Vector3(x1, y1, 0);
    let intersectPoint2 = new THREE.Vector3(x2, y2, 0);

    let arcAngle1 = circleIntersectionAngle(intersectPoint1, arc.position, r);
    let arcAngle2 = circleIntersectionAngle(intersectPoint2, arc.position, r);

    // fix problem when thetaStart + thetaLength > 2pi AND arcAngle < thetastart
    if (
      arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength >
      Math.PI * 2
    ) {
      if (arc.geometry.parameters.thetaStart > arcAngle1) {
        arcAngle1 += Math.PI * 2;
      }
      if (arc.geometry.parameters.thetaStart > arcAngle2) {
        arcAngle2 += Math.PI * 2;
      }
    }

    // todo: handle tangent line to arc

    let intersect1Distance = null;
    let intersect2Distance = null;

    if (
      arcAngle1 >= arc.geometry.parameters.thetaStart &&
      arcAngle1 <=
        arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength
    ) {
      intersect1Distance = intersectPoint1.distanceTo(vertex);
    }

    if (
      arcAngle2 >= arc.geometry.parameters.thetaStart &&
      arcAngle2 <=
        arc.geometry.parameters.thetaStart + arc.geometry.parameters.thetaLength
    ) {
      intersect2Distance = intersectPoint2.distanceTo(vertex);
    }

    if (intersect1Distance || intersect2Distance) {
      return (
        (intersect1Distance &&
          intersect2Distance &&
          Math.min(intersect1Distance, intersect2Distance)) ||
        intersect1Distance ||
        intersect2Distance
      );
    }

    // in case of no-intersection get distance to nearest arc-endpoint
    let arc1v1 = new THREE.Vector3(0, 0, 0);
    arc1v1.addVectors(arc.geometry.vertices[0], arc.position);

    let arc1v2 = new THREE.Vector3(0, 0, 0);
    arc1v2.addVectors(
      arc.geometry.vertices[arc.geometry.vertices.length - 1],
      arc.position
    );

    return Math.min(arc1v1.distanceTo(vertex), arc1v2.distanceTo(vertex));
  } else {
    // no intersection
  }
  return false;
};

function distanceToLineSegment(lx1, ly1, lx2, ly2, px, py) {
  // source from https://github.com/scottglz/distance-to-line-segment/blob/master/index.js

  let ldx = lx2 - lx1;
  let ldy = ly2 - ly1;
  let lineLengthSquared = ldx * ldx + ldy * ldy;
  let t; // t===0 at line pt 1 and t ===1 at line pt 2

  if (!lineLengthSquared) {
    // 0-length line segment. Any t will return same result
    t = 0;
  } else {
    t = ((px - lx1) * ldx + (py - ly1) * ldy) / lineLengthSquared;

    if (t < 0) {
      t = 0;
    } else if (t > 1) {
      t = 1;
    }
  }

  let lx = lx1 + t * ldx;
  let ly = ly1 + t * ldy;
  let dx = px - lx;
  let dy = py - ly;
  return Math.sqrt(dx * dx + dy * dy);
}

let distanceToEntity = (vertex, entity) => {
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // get distance to arc
    return distanceToArc(vertex, entity);
  } else {
    // get distance to line
    let v0 = entity.geometry.vertices[0];
    let v1 = entity.geometry.vertices[entity.geometry.vertices.length - 1];
    return distanceToLineSegment(v0.x, v0.y, v1.x, v1.y, vertex.x, vertex.y);
  }
};

// todo дубль функциї   circleIntersectionAngle as circlInterAngle} from '../services/editObject';
function circleIntersectionAngle(vertex, circle, radius) {
  let projectionLine = Math.abs(vertex.x - circle.x);
  let angle = Math.acos(projectionLine / radius);
  // // console.log({q}, Math.acos(q/r1), Math.acos(q/r1) / Math.PI * 180);
  if (vertex.x < circle.x && vertex.y < circle.y) {
    // III quadrant
    angle += Math.PI;
  } else if (vertex.x < circle.x && vertex.y > circle.y) {
    // II quadrant
    angle = Math.PI - angle;
  } else if (vertex.x > circle.x && vertex.y < circle.y) {
    // IV quadrant
    angle = 2 * Math.PI - angle;
  } else {
    // in I quadrant
    // ok
  }
  return angle;
}

/**
 *
 * @param entities []
 * @param threshold number
 * @return []
 */
const skipZeroLines = (entities, threshold = 0.000001) => {
  // console.log(threshold);
  // filter and remove zero lines
  return entities.filter(entity => {
    if (
      !(entity.geometry instanceof THREE.CircleGeometry) &&
      entity.geometry.vertices.length === 2
    ) {
      return (
        entity.geometry.vertices[0].distanceTo(entity.geometry.vertices[1]) >
        threshold
      );
    }
    return true;
  });
};

function getFirstVertex(entity) {
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    let vertex = new THREE.Vector3(0, 0, 0);
    return vertex.addVectors(entity.geometry.vertices[0], entity.position);
  } else {
    // line?
    return entity.geometry.vertices[0];
  }
}

function getAnotherVertex(entity, vertex) {
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

  let anotherVertex = vertices[0];
  let distance = vertex.distanceTo(anotherVertex);

  vertices.forEach(v => {
    if (vertex.distanceTo(v) > distance) {
      anotherVertex = v;
      distance = vertex.distanceTo(v);
    }
  });

  return anotherVertex;
}

const linesIntersect = (a, b, c, d, threshold = 0.0001, debug = false) => {
  if (debug) {
    console.warn('linesIntersect', 'debug');
  }
  const result = {
    type: 'none',
    isIntersects: false,
    points: []
  };
  // https://web.archive.org/web/20120303204205/http://local.wasp.uwa.edu.au:80/~pbourke/geometry/lineline2d/
  const denominator = (d.y - c.y) * (b.x - a.x) - (d.x - c.x) * (b.y - a.y);
  const numerator1 = (d.x - c.x) * (a.y - c.y) - (d.y - c.y) * (a.x - c.x);
  const numerator2 = (b.x - a.x) * (a.y - c.y) - (b.y - a.y) * (a.x - c.x);

  if (denominator === 0 || Math.abs(denominator) < 0.0000001) {
    // lines are parallel or collinear
    result.type =
      numerator1 === 0 && numerator2 === 0 ? 'collinear' : 'parallel';
    result.points = getPointsWithDistance(a, b, c, d, 2, 0.1);
    result.isIntersects = result.points.length > 0;
    return result;
  }

  const uA = numerator1 / denominator;
  const uB = numerator2 / denominator;

  if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
    result.type = 'intersecting';
    result.isIntersects = true;
    result.points = [
      {
        distance: 0,
        point: {
          x: a.x + uA * (b.x - a.x),
          y: a.y + uA * (b.y - a.y)
        }
      }
    ];
    return result;
  } else if (threshold > 0) {
    // not intersected, but check if intersection point is closer than threshold
    result.points = getPointsWithDistance(a, b, c, d, 1, threshold);
    if (result.points.length) {
      result.type = 'intersecting';
      result.isIntersects = true;
      return result;
    }
  }
  return result;
};

const getPointsWithDistance = (a, b, c, d, spliceLimit, threshold) => {
  return [
    {
      point: a,
      distance: distanceToLine(a, { geometry: { vertices: [c, d] } })
    },
    {
      point: b,
      distance: distanceToLine(b, { geometry: { vertices: [c, d] } })
    },
    {
      point: c,
      distance: distanceToLine(c, { geometry: { vertices: [a, b] } })
    },
    {
      point: d,
      distance: distanceToLine(d, { geometry: { vertices: [a, b] } })
    }
  ]
    .sort((a, b) => {
      if (a.distance > b.distance) return 1;
      if (a.distance < b.distance) return -1;
      return 0;
    })
    .splice(0, spliceLimit)
    .filter(point => point.distance <= threshold);
};

let getDistance = (a, b) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

let isBetween = (a, b, c, threshold = 0) => {
  // return getDistance(a, c) + getDistance(c, b) === getDistance(a, b);
  return (
    Math.abs(getDistance(a, c) + getDistance(c, b) - getDistance(a, b)) <=
    threshold
  );

  // return getDistance(a, c) + getDistance(c, b) === getDistance(a, b);
};
// check if point in the area of object +/- threshold value
const pointInBox = (point, box, threshold = 0.000001) => {
  return (
    point.x >= box.x1 - threshold &&
    point.x <= box.x2 + threshold &&
    point.y >= box.y1 - threshold &&
    point.y <= box.y2 + threshold
  );
};
// check points between 2 different objects
// TODO; optimize that with array
const isBoundingBoxesCollide = (
  boundingBox1,
  boundingBox2,
  threshold = 0.000001
) => {
  return (
    pointInBox(
      { x: boundingBox1.x1, y: boundingBox1.y1 },
      boundingBox2,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox1.x1, y: boundingBox1.y2 },
      boundingBox2,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox1.x2, y: boundingBox1.y1 },
      boundingBox2,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox1.x2, y: boundingBox1.y2 },
      boundingBox2,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox2.x1, y: boundingBox2.y1 },
      boundingBox1,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox2.x1, y: boundingBox2.y2 },
      boundingBox1,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox2.x2, y: boundingBox2.y1 },
      boundingBox1,
      threshold
    ) ||
    pointInBox(
      { x: boundingBox2.x2, y: boundingBox2.y2 },
      boundingBox1,
      threshold
    )
  );
};

const entitiesIntersectInfo = (
  entity1,
  entity2,
  threshold = 0.000001,
  debug = false
) => {
  if (
    !(entity1.geometry instanceof THREE.CircleGeometry) &&
    !(entity2.geometry instanceof THREE.CircleGeometry)
  ) {
    const intersectionResult = linesIntersect(
      entity1.geometry.vertices[0],
      entity1.geometry.vertices[1],
      entity2.geometry.vertices[0],
      entity2.geometry.vertices[1],
      threshold,
      debug
    );
    if (intersectionResult.isIntersects) {
      return {
        type: intersectionResult.type,
        isIntersects: intersectionResult.isIntersects,
        points: intersectionResult.points,
        entities: [entity1, entity2],
        ids: [entity1.id, entity2.id]
      };
    }
  } else if (
    entity1.geometry instanceof THREE.CircleGeometry &&
    entity2.geometry instanceof THREE.CircleGeometry
  ) {
    // arc to arc
    const intersectionResult = arcsIntersect(entity1, entity2);
    if (intersectionResult) {
      const arc1v1 = new THREE.Vector3(0, 0, 0);
      arc1v1.addVectors(
        intersectionResult.arc1.geometry.vertices[0],
        intersectionResult.arc1.position
      );

      const arc1v2 = new THREE.Vector3(0, 0, 0);
      arc1v2.addVectors(
        intersectionResult.arc1.geometry.vertices[
          intersectionResult.arc1.geometry.vertices.length - 1
        ],
        intersectionResult.arc1.position
      );

      const arc2v1 = new THREE.Vector3(0, 0, 0);
      arc2v1.addVectors(
        intersectionResult.arc2.geometry.vertices[0],
        intersectionResult.arc2.position
      );

      const arc2v2 = new THREE.Vector3(0, 0, 0);
      arc2v2.addVectors(
        intersectionResult.arc2.geometry.vertices[
          intersectionResult.arc2.geometry.vertices.length - 1
        ],
        intersectionResult.arc2.position
      );

      if (
        arc1v1.distanceTo(intersectionResult.intersectPoint) > threshold &&
        arc1v2.distanceTo(intersectionResult.intersectPoint) > threshold &&
        arc2v1.distanceTo(intersectionResult.intersectPoint) > threshold &&
        arc2v2.distanceTo(intersectionResult.intersectPoint) > threshold
      ) {
        return {
          isIntersects: true,
          point: intersectionResult.intersectPoint,
          distance: 0,
          entities: [entity1, entity2],
          ids: [entity1.id, entity2.id]
        };
      }
    }
  } else {
    // line to arc
    let arc;
    let line;

    if (entity1.geometry instanceof THREE.CircleGeometry) {
      arc = entity1;
      line = entity2;
    } else {
      arc = entity2;
      line = entity1;
    }

    const intersectionResult = lineArcIntersectNew(line, arc, threshold);
    if (intersectionResult.isIntersects) {
      // possibly intersection. check for threshold
      return {
        isIntersects: intersectionResult.isIntersects,
        type: intersectionResult.type,
        points: intersectionResult.points,
        entities: [arc, line],
        ids: [arc.id, line.id]
      };
    }
  }

  return false;
};

const filterCollisionPoints = (collisionPoints, threshold = 0.000001) => {
  const goodCp = [];

  console.log('__________________TEST_________________', collisionPoints);
  collisionPoints.forEach(collisionPoint => {
    // debugger;
    collisionPoint.entities.forEach((entity, index) => {
      for (let isLast = 0; isLast <= 1; isLast++) {
        // only first and last vertex need
        const vertex = fixArcVertex(
          entity.geometry.vertices[
            (entity.geometry.vertices.length - 1) * isLast
          ],
          entity
        );

        if (getDistance(vertex, collisionPoint.point) < threshold) {
          continue;
        }

        let isGood = true;

        // // console.log({entity});
        // debugger;

        let objOuterEntities = [];
        collisionPoint.entities.forEach(entityToCheck => {
          if (entityToCheck === entity) {
            return;
          }

          if (
            entityToCheck.parent &&
            entityToCheck.parent.userData &&
            entityToCheck.parent.userData.edgeModel
          ) {
            entityToCheck.parent.userData.edgeModel.regions[0].path.forEach(
              vertex => {
                if (!objOuterEntities.includes(vertex.parent)) {
                  objOuterEntities.push(vertex.parent);
                }
              }
            );
          } else {
            console.error('bad container');
          }
        });

        objOuterEntities.forEach(entityToCheck => {
          if (distanceToEntity(vertex, entityToCheck) < threshold) {
            isGood = false;
          }
        });

        if (isGood) {
          if (!goodCp.includes(collisionPoint)) {
            goodCp.push(collisionPoint);
          }
        }
      }
    });
  });
  return goodCp;
};

const filterOverlappingCollisionPoints = (
  collisionPoints,
  threshold = 0.000001
) => {
  const uniqueCollisionPoints = [];

  // collisionPoints.forEach(collisionPoint => {
  //   try {
  //     uniqueCollisionPoints.forEach(uniqueCollisionPoint => {
  //       if (
  //         getDistance(collisionPoint.point, uniqueCollisionPoint.point) <
  //         threshold
  //       ) {
  //         throw new Error('point is overlapping');
  //       }
  //     });
  //     // if no-throw, then cp is unique
  //     uniqueCollisionPoints.push(collisionPoint);
  //   } catch (e) {
  //     // point is overlapping
  //   }
  // });

  collisionPoints.forEach(collisionPoint => {
    if (
      uniqueCollisionPoints.findIndex(
        uniqueCollisionPoint =>
          getDistance(collisionPoint.point, uniqueCollisionPoint.point) <
          threshold
      )
    ) {
      uniqueCollisionPoints.push(collisionPoint);
    }
  });

  return uniqueCollisionPoints;
};

let fixArcVertex = (vertex, entity) => {
  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    let v = new THREE.Vector3(0, 0, 0);
    v.addVectors(vertex, entity.position);
    vertex = v;
  }
  return vertex;
};

let filterCollisionPointsWithSharedEntities = (
  collisionPoints,
  threshold = 0.000001
) => {
  let chunks = [];

  collisionPoints.forEach(collisionPoint => {
    if (collisionPoint.inChunk) {
      return;
    }

    let chunk = [collisionPoint];
    collisionPoint.inChunk = true;

    // find collisionPoints with shared entities
    collisionPoints.forEach(checkCp => {
      if (checkCp.inChunk) {
        return;
      }

      // one of the entities shared (check if array intersects)
      if (
        collisionPoint.entities.filter(n => checkCp.entities.includes(n)).length
      ) {
        chunk.push(checkCp);
        checkCp.inChunk = true;
      }
    });
    chunks.push(chunk);
  });
  collisionPoints.forEach(collisionPoint => {
    delete collisionPoint.inChunk;
  });

  let betterCollisionPoints = [];
  chunks.forEach(chunk => {
    if (!chunk.length) {
      return;
    }

    if (chunk.length === 1) {
      betterCollisionPoints.push(chunk.pop());
      return;
    }

    // chunk

    // find shared entity
    let sharedEntity = chunk[0].entities.find(en =>
      chunk[1].entities.includes(en)
    );

    // find which vertex of sharedEntity further from another object
    let anotherObject = getParentObject(
      chunk[0].entities.find(en => en !== sharedEntity)
    );

    let objOuterEntities = [];
    anotherObject.userData.edgeModel.regions[0].path.forEach(vertex => {
      if (!objOuterEntities.includes(vertex.parent)) {
        objOuterEntities.push(vertex.parent);
      }
    });

    let distances = [];
    for (let isLast = 0; isLast <= 1; isLast++) {
      // only first and last vertex need
      let vertex = fixArcVertex(
        sharedEntity.geometry.vertices[
          (sharedEntity.geometry.vertices.length - 1) * isLast
        ],
        sharedEntity
      );

      distances.push({
        vertex,
        minDistance: 99999999999
      });

      objOuterEntities.forEach(entityToCheck => {
        let distance = distanceToEntity(vertex, entityToCheck);
        if (distance < distances[isLast].minDistance) {
          distances[isLast].minDistance = distance;
        }
      });
    }

    // sort: further vertex first
    distances.sort((a, b) => {
      return a.minDistance < b.minDistance;
    });

    // console.error({distances})

    distances.forEach(distance => {
      if (distance.minDistance > threshold) {
        let furtherVertex = distance.vertex;

        // get nearest collisionPoint to further vertex (of shared entity)
        let distancesToCollisionPoints = [];
        chunk.forEach(collisionPoint => {
          distancesToCollisionPoints.push({
            collisionPoint,
            distance: getDistance(collisionPoint.point, furtherVertex)
          });
        });

        // nearest first
        distancesToCollisionPoints.sort((a, b) => {
          return a.distance > b.distance;
        });

        // console.error('distancesToCollisionPoints', distancesToCollisionPoints);
        betterCollisionPoints.push(
          distancesToCollisionPoints[0].collisionPoint
        );
      }
    });
  });

  return betterCollisionPoints;
};

let getParentObject = entity => {
  if (entity.type === 'Group') {
    return entity;
  }

  if (entity.parent) {
    return getParentObject(entity.parent);
  }

  return undefined;
};

let generateCollisionBranches = (collisionPoints, threshold) => {
  let branches = [];
  let collisionMembers = [];

  collisionPoints.forEach(collisionPoint => {
    collisionPoint.entities.forEach(entity => {
      if (!collisionMembers.includes(entity)) {
        collisionMembers.push(entity);
      }
    });
  });

  collisionPoints.forEach(collisionPoint => {
    branches.push({
      startPoint: collisionPoint,
      branches: getCollisionPointBranches(
        collisionPoint,
        collisionMembers,
        collisionPoints,
        threshold
      )
    });
    // collisionPoint.processed = true;
  });

  return branches;
};

let getCollisionPointBranches = (
  collisionPoint,
  collisionMembers = [],
  collisionPoints = [],
  threshold,
  startEntity,
  currentObject,
  deep = 0,
  parentBranch = null
) => {
  // collisionPoint.processed = true;

  //todo туточки строіться branches, а знього збирається paths. Для того щоб розібратись з paths треба розковиряти цю функцию

  if (deep > 0) {
    // debugger;
  }

  if (deep > 20) {
    return [];
  }

  let currentStartEntity = collisionPoint.entities[0];
  let startObject = getParentObject(currentStartEntity);
  if (currentObject === startObject) {
    currentStartEntity = collisionPoint.entities[1];
    startObject = getParentObject(currentStartEntity);
  }

  if (!startEntity) {
    startEntity = currentStartEntity;
  }

  let branches = [];

  // get nearest vertice in outer region (outer region always with index 0)
  let path = startObject.userData.edgeModel.regions[0].path;

  for (let direction = 0; direction <= 1; direction++) {
    // debugger;

    let iterator = vertexIterator(path, collisionPoint, direction);

    let branchPath = [];
    let vertex = iterator.next();
    while (!vertex.done) {
      // // console.log('VERTEX ITERATOR', vertex);

      branchPath.push(vertex.value);

      if (collisionMembers.includes(vertex.value.parent)) {
        let nextCollisionPoint = ((collisionPoints, vertex) => {
          let nextCollisionPoints = collisionPoints.filter(cp => {
            return cp.entities.includes(vertex.parent);
          });
          if (nextCollisionPoints.length === 1) {
            return nextCollisionPoints.pop();
          }

          let result = {
            collisionPoint: undefined,
            minDistance: undefined
          };

          nextCollisionPoints.forEach(collisionPoint => {
            let minDistance = getDistance(collisionPoint.point, vertex);
            if (
              result.minDistance === undefined ||
              minDistance < result.minDistance
            ) {
              result = {
                minDistance,
                collisionPoint
              };
            }
          });

          return result.collisionPoint;
        })(collisionPoints, vertex.value);

        // if collision point is between 2 latest points in chain, then remove latest, and put collisionPoint coordinates instead
        if (nextCollisionPoint.entities.includes(startEntity)) {
          // // console.log('LOOPED', nextCollisionPoint, startEntity);

          // branchPath.pop();

          branches.push({
            collisionPoint: nextCollisionPoint,
            path: branchPath,
            branches: [],
            parent: parentBranch
          });
          break;
        } else {
          let tmpParentBranch = parentBranch;

          try {
            while (tmpParentBranch) {
              if (tmpParentBranch.collisionPoint === nextCollisionPoint) {
                throw new Error('Collision point already in chain');
              }
              tmpParentBranch = tmpParentBranch.parent;
            }

            let branch = {
              collisionPoint: nextCollisionPoint,
              path: branchPath,
              // branches: 'getCollisionPointBranches(nextCollisionPoint, startEntity, deep + 1)',
              parent: parentBranch
            };
            branch.branches = getCollisionPointBranches(
              nextCollisionPoint,
              collisionMembers,
              collisionPoints,
              threshold,
              startEntity,
              startObject,
              deep + 1,
              branch
            );

            branches.push(branch);
          } catch (e) {
            // point already in chain... skip
          }
        }

        nextCollisionPoint.processed = true;

        // nextCollisionPoints.forEach(nextCollisionPoint => {
        //     nextCollisionPoint.processed = true;
        // });

        break;
      }
      vertex = iterator.next();
    }
  }

  return branches;
};

let vertexIterator = function* iterator(
  path,
  collisionPoint,
  reverse = false,
  threshold = 0.000001
) {
  yield {
    // ...collisionPoint.point, // babel still not recognizes spread operator((
    x: collisionPoint.point.x,
    y: collisionPoint.point.y,
    z: collisionPoint.point.z,
    parent: null
  };

  let startVertex = path.find(vertex => {
    return collisionPoint.entities.includes(vertex.parent);
  });
  let previousEntity = startVertex.parent;

  let startIdx = path.indexOf(startVertex);
  if (startIdx >= 0) {
    // debugger;

    for (let i = 1; i < path.length; i++) {
      let vertex = path[getIdx(startIdx, i, reverse)];
      let nextEntity = vertex.parent;
      // debugger;
      // get shared vertex

      if (nextEntity === previousEntity) {
        yield vertex;
      } else {
        let sharedVertex = getSharedVertex(previousEntity, nextEntity);
        if (sharedVertex) {
          yield sharedVertex;
        }
      }

      previousEntity = nextEntity;
    }
  }

  function getSharedVertex(entityPrev, entityNext) {
    let [entityPrev1, entityPrev2] = getVertices([entityPrev]);
    let [entityNext1, entityNext2] = getVertices([entityNext]);

    if (
      getDistance(entityNext1, entityPrev1) < threshold ||
      getDistance(entityNext1, entityPrev2) < threshold
    ) {
      return {
        x: entityNext1.x,
        y: entityNext1.y,
        z: entityNext1.z,
        parent: entityNext
      };
    } else if (
      getDistance(entityNext2, entityPrev1) < threshold ||
      getDistance(entityNext2, entityPrev2) < threshold
    ) {
      return {
        x: entityNext2.x,
        y: entityNext2.y,
        z: entityNext2.z,
        parent: entityNext
      };
    }

    return false;
  }

  function getIdx(startIdx, i, reverse) {
    let idx;
    if (reverse) {
      idx = startIdx - i;
      if (idx < 0) {
        idx = path.length + idx;
      }
    } else {
      idx = (startIdx + i) % path.length;
    }
    return idx;
  }
};

let queueIterator = function* iterator(queue = []) {
  let endQueue = [];

  for (let item of queue) {
    let addToEndQueue = yield item;
    if (addToEndQueue) {
      endQueue.push(addToEndQueue);
    }
  }

  for (let item of endQueue) {
    yield item;
  }
};

let generateAllPaths = branches => {
  function generatePaths(
    branch,
    branchId,
    startPoint,
    path = [],
    collisionPoints = []
  ) {
    if (!startPoint) {
      startPoint = branch.startPoint;
    }

    if (
      branch.collisionPoint &&
      !collisionPoints.includes(branch.collisionPoint)
    ) {
      collisionPoints.push(branch.collisionPoint);
    }

    branch.branches.forEach(childBranch => {
      let nextPath = path.concat(childBranch.path);

      if (childBranch.collisionPoint === startPoint) {
        paths.push({
          path: nextPath,
          branchId,
          collisionPoints: collisionPoints.concat([startPoint]),
          pathId: paths.length
        });
      } else {
        generatePaths(
          childBranch,
          branchId,
          startPoint,
          nextPath,
          collisionPoints.concat([])
        );
      }
    });
  }

  let paths = [];
  branches.forEach((branch, branchId) => {
    generatePaths(branch, branchId);
  });

  return paths;
};

// let checkCavity = (cavityToCheck, usedCollisionPoints = [], threshold, minCavityArea = 0.02) => {
let checkCavity = (
  cavityToCheck,
  usedCollisionPoints = [],
  threshold,
  minCavityArea = 1
) => {
  let result = {
    cavity: cavityToCheck,
    valid: false,
    needToCheckAgain: false,
    error: ''
  };

  let objects = [];

  cavityToCheck.collisionPoints.forEach(collisionPoint => {
    collisionPoint.entities.forEach(entity => {
      let object = getParentObject(entity);
      if (!objects.includes(object)) {
        objects.push(object);
      }
    });
  });

  try {
    /// /////// if collision points has been already used, skip this path.
    if (
      cavityToCheck.collisionPoints.some(collisionPoint =>
        usedCollisionPoints.includes(collisionPoint)
      )
    ) {
      throw new Error('collision point already used in another cavity');
    }

    objects.forEach(object => {
      object.userData.edgeModel.regions.forEach((region, idx) => {
        if (idx) {
          // inner regions
          region.path.forEach(vertex => {
            if (insidePolygon(cavityToCheck.path, vertex)) {
              throw new Error(
                'inner region intersects with "cavity". bad cavity'
              );
            }
          });
        }
      });

      // check if cavity intersects/contains object
      // check if object's insidePoint lies on cavity
      if (
        insidePolygon(
          cavityToCheck.path,
          object.userData.edgeModel.svgData.insidePoint
        )
      ) {
        throw new Error(
          `object's insidePoint intersects with "cavity". probably, cavity covered region`
        );
      }
    });

    // this operation is slower, so it putted after check if inner region intersected to cavity
    if (selfIntersects(cavityToCheck.path, threshold)) {
      throw new Error('cavity has bad path (self intersects)');
    }

    // check if cavity not too small
    if (!isEnoughVertices(cavityToCheck, threshold)) {
      throw new Error(
        'bad cavity, a lot of same vertices. probably rounding error'
      );
    }

    if (pathArea(cavityToCheck.path) < minCavityArea) {
      // CameraUtils.previewPathInConsole(cavityToCheck.path);
      // console.warn('cavityToCheck (low area)', cavityToCheck, pathArea(cavityToCheck.path));

      result.needToCheckAgain = true;
      throw new Error('area to small, move this cavity to end of queue');
    }

    result.valid = true;

    // cavities.push(cavityToCheck);
    // usedCollisionPoints.push(...cavityToCheck.collisionPoints);
  } catch (e) {
    // e.getMessa
    result.error = e.message;
    // inner region intersects with 'cavity'. bad cavity
  }

  return result;
};

let selfIntersects = (region, threshold = 0.000001) => {
  for (let segmentId = 0; segmentId < region.length; segmentId++) {
    let segmentA = region[segmentId];
    let segmentB = region[(segmentId + 1) % region.length];

    if (getDistance(segmentA, segmentB) < threshold) {
      continue;
    }

    for (
      let checkSegmentId = segmentId + 1;
      checkSegmentId < region.length;
      checkSegmentId++
    ) {
      let checkSegmentA = region[checkSegmentId];
      let checkSegmentB = region[(checkSegmentId + 1) % region.length];

      if (getDistance(checkSegmentA, checkSegmentB) < threshold) {
        continue;
      }

      if (
        getDistance(segmentB, checkSegmentA) < threshold ||
        getDistance(segmentA, checkSegmentB) < threshold
      ) {
        // one point of segment is close to another segment
        continue;
      }

      return linesIntersect(
        segmentA,
        segmentB,
        checkSegmentA,
        checkSegmentB,
        threshold
      ).isIntersects;
    }
  }

  return false;
};

let isEnoughVertices = (cavity, threshold) => {
  let path = [];
  cavity.path.forEach(v => {
    let prevVertex = path.length
      ? path[path.length - 1]
      : cavity.path[cavity.path.length - 1];
    let distance = getDistance(v, prevVertex);
    if (distance < threshold) {
      // if current and next vertices close to each other, than skip one of them
      return false;
    }
    path.push(v);
  });

  // if (path.length >= 3) {
  //     // console.log('CAVITY', cavity, cavity.path, path)
  // }

  // CameraUtils.previewPathInConsole(path);
  // console.warn('PATH AREA', pathArea(path))

  return path.length >= 3;
};

let pathArea = path => {
  let sumX = 0;
  let sumY = 0;
  for (let i = 1; i < path.length; i++) {
    sumX += path[i - 1].x * path[i].y;
    sumY += path[i].x * path[i - 1].y;
  }
  return Math.abs((sumX - sumY) / 2);
};

let calcArea = entities => {
  return pathArea(getSerialVertices(entities));
};

let calcLength = entities => {
  let total = 0;
  entities.forEach(entity => {
    entity.computeLineDistances();
    total +=
      entity.geometry.lineDistances[entity.geometry.lineDistances.length - 1];
  });
  return total;
};

let calcSize = entities => {
  let init = false;
  let left, top, right, bottom;

  entities.forEach(entity => {
    getVertices(entity, true).forEach(vertex => {
      if (!init) {
        init = true;
        left = right = vertex.x;
        top = bottom = vertex.y;
      }
      if (left < vertex.x) {
        left = vertex.x;
      }
      if (right > vertex.x) {
        right = vertex.x;
      }
      if (top < vertex.y) {
        top = vertex.y;
      }
      if (bottom > vertex.y) {
        bottom = vertex.y;
      }
    });
  });

  // ACHTUNG!
  // swap width and height

  return new THREE.Vector2(Math.abs(top - bottom), Math.abs(left - right));
};

function vertexInArea(vertex, area) {
  return (
    vertex.x >= Math.min(area.x1, area.x2) &&
    vertex.x <= Math.max(area.x1, area.x2) &&
    vertex.y >= Math.min(area.y1, area.y2) &&
    vertex.y <= Math.max(area.y1, area.y2)
  );
}

function getSerialVerticesFromOrderedEntities(
  orderedEntities = [],
  threshold = 0.001
) {
  orderedEntities = skipZeroLines(orderedEntities, threshold);

  let result = [];

  if (orderedEntities.length < 2) {
    return getVertices(orderedEntities);
  }

  // find vertex that closest to next entity
  let minDistance = Infinity;
  let vertex = null;
  let verticesFirstEntity = getVertices(orderedEntities[0]);
  getVertices(orderedEntities[1]).forEach(vertexNextEntity => {
    verticesFirstEntity.forEach(vertexFirstEntity => {
      let distance = getDistance(vertexFirstEntity, vertexNextEntity);
      if (distance < minDistance) {
        minDistance = distance;
        vertex = vertexFirstEntity;
      }
    });
  });
  result.push(vertex);

  // find vertex from entity that further from last vertex in result[]
  for (let e = 1; e < orderedEntities.length; e++) {
    let lastVertex = result[result.length - 1];
    let vertex = null;

    let vertices = getVertices(orderedEntities[e]);
    let maxDistance = 0;
    for (let v = 0; v < vertices.length; v++) {
      let distance = getDistance(lastVertex, vertices[v]);
      if (distance > maxDistance) {
        maxDistance = distance;
        vertex = vertices[v];
      }
    }

    if (!vertex) {
      let vertices = getVertices(orderedEntities[e]);
      let maxDistance = 0;
      for (let v = 0; v < vertices.length; v++) {
        let distance = getDistance(lastVertex, vertices[v]);
        if (distance > maxDistance) {
          maxDistance = distance;
          vertex = vertices[v];
        }
      }
    }

    result.push(vertex);
  }
  return result;
}

function getSerialVertices(entities, threshold = 0.001) {
  function buildChain(entities, vertices, currentEntity, vertex, stopVertex) {
    // // console.log('buildChain. ENTITIES:', entities, 'VERTICES:', vertices, 'CURRENT_ENTITY', currentEntity, 'VERTEX', vertex, 'STOP_VERTEX', stopVertex);
    if (!currentEntity) {
      if (entities.length) {
        currentEntity = entities[0];
        stopVertex = getFirstVertex(currentEntity);

        stopVertex.entity = currentEntity;

        vertex = stopVertex;
        vertices.push(stopVertex);

        if (entities.length === 1) {
          // polygon
          return currentEntity.geometry.vertices;
        }
      } else {
        return vertices;
      }
    }

    vertex = getAnotherVertex(currentEntity, vertex);
    vertex.entity = currentEntity;

    // if current vertex is closely to stopVertex than finish
    if (vertex.distanceTo(stopVertex) < threshold) {
      // // console.log('FIRED STOP VERTEX');
      return vertices;
    }

    // find entity (not current)
    let distances = [];
    entities.forEach(entity => {
      if (entity === currentEntity) {
        return false;
      }

      getVertices(entity).forEach(v => {
        distances.push({
          entity: entity,
          vertex,
          v,
          distance: vertex.distanceTo(v)
        });
      });
    });

    // get closest vertex
    let minDistance = distances.pop();
    distances.forEach(distance => {
      if (distance.distance < minDistance.distance) {
        // if (distance.distance < minDistance.distance) {
        minDistance = distance;
      }
    });

    vertices.push(vertex);
    return buildChain(
      entities,
      vertices,
      minDistance.entity,
      minDistance.v,
      stopVertex
    );
  }

  return buildChain(entities, []);
}

function entityIntersectArea(entity, area) {
  // // console.log('ENTITY', entity, 'AREA', area);
  // console.count(entity.geometry.type);

  if (entity.geometry instanceof THREE.CircleGeometry) {
    // arc
    try {
      entity.geometry.vertices.forEach((vertex, idx) => {
        // TODO optimize code
        // skip even vertex for calculation speed. I think three is possibility to check evert fifth vertex...
        if (
          idx % 2 === 1 &&
          vertexInArea(
            new THREE.Vector3(0, 0, 0).addVectors(vertex, entity.position),
            area
          )
        ) {
          throw new Error('true');
        }
      });
    } catch (e) {
      return true;
    }

    return false;
  } else {
    // // console.log('LINE', entity);

    // check if any vertex in selected area;
    try {
      entity.geometry.vertices.forEach(vertex => {
        if (vertexInArea(vertex, area)) {
          throw new Error('true');
        }
      });
    } catch (e) {
      return true;
    }

    // check if line intersect area
    try {
      let prevVertex;

      entity.geometry.vertices.forEach(vertex => {
        if (prevVertex) {
          // // console.log(area);
          // x1,y1 - x2,y1
          // x1,y1 - x1,y2
          // x1,y2 - x2,y2
          // x2,y1 - x2,y2
          if (
            linesIntersect(
              prevVertex,
              vertex,
              new THREE.Vector3(area.x1, area.y1, 0),
              new THREE.Vector3(area.x2, area.y1, 0)
            ).isIntersects ||
            linesIntersect(
              prevVertex,
              vertex,
              new THREE.Vector3(area.x1, area.y1, 0),
              new THREE.Vector3(area.x1, area.y2, 0)
            ).isIntersects ||
            linesIntersect(
              prevVertex,
              vertex,
              new THREE.Vector3(area.x1, area.y2, 0),
              new THREE.Vector3(area.x2, area.y2, 0)
            ).isIntersects ||
            linesIntersect(
              prevVertex,
              vertex,
              new THREE.Vector3(area.x2, area.y1, 0),
              new THREE.Vector3(area.x2, area.y2, 0)
            ).isIntersects
          ) {
            throw new Error('true');
          }
        }
        prevVertex = vertex;
      });
    } catch (e) {
      return true;
    }

    return false;
  }

  // alert('Unexpected geometry @ThreeDxf.entityIntersectArea()');
}

function getRegionClusters(path, amount = 3) {
  let data = path.map(dot => {
    return [dot.x, dot.y];
  });

  let km = new KMeans({
    K: amount
  });

  km.maxIterations = amount > 3 ? amount * 100 : 300;

  km.cluster(data);
  while (km.step()) {
    km.findClosestCentroids();
    km.moveCentroids();
    if (km.hasConverged() || km.currentIteration > km.maxIterations) {
      break;
    }
  }
  // // console.log('Finished in:', km.currentIteration, ' iterations');
  // // console.log(km.centroids, km.clusters);
  return km;
}

function getObjectInfo(object) {
  let res = getRegionClusters(object.userData.edgeModel.regions[0].path);

  let heaviestClusters = res.centroids
    .map((centroid, idx) => {
      return {
        centroid,
        weight: res.clusters[idx].length
      };
    })
    .sort((a, b) => a.weight < b.weight)
    .splice(0, 2)
    .map(heaviestCluster => {
      return {
        x: heaviestCluster.centroid[0],
        y: heaviestCluster.centroid[1]
      };
    });

  // CameraUtils.previewPathInConsole(object.userData.edgeModel.regions[0].path, heaviestClusters)

  // width is where two legs oriented. if polyamide rotated - get orientation by heaviest clusters (possibly legs)
  let inversedWidth =
    Math.abs(heaviestClusters[0].y - heaviestClusters[1].y) >
    Math.abs(heaviestClusters[0].x - heaviestClusters[1].x);

  object.userData.edgeModel.regions.forEach(region => {
    let vertices = region.path;

    let minX, minY, maxX, maxY;
    let sumX = 0;
    let sumY = 0;
    let multipleIdx = 0;
    for (let i = 0; i < vertices.length; i++) {
      if (
        minX === undefined &&
        minY === undefined &&
        maxX === undefined &&
        maxY === undefined
      ) {
        minX = maxX = vertices[i].x;
        minY = maxY = vertices[i].y;
      }
      if (vertices[i].x < minX) {
        minX = vertices[i].x;
      }
      if (vertices[i].y < minY) {
        minY = vertices[i].y;
      }
      if (vertices[i].x > maxX) {
        maxX = vertices[i].x;
      }
      if (vertices[i].y > maxY) {
        maxY = vertices[i].y;
      }

      multipleIdx = i + 1;
      if (multipleIdx >= vertices.length) {
        multipleIdx = 0;
      }
      sumX += vertices[i].x * vertices[multipleIdx].y;
      sumY += vertices[multipleIdx].x * vertices[i].y;
    }

    if (inversedWidth) {
      region.width = Math.abs(maxY - minY);
      region.height = Math.abs(maxX - minX);
    } else {
      region.width = Math.abs(maxX - minX);
      region.height = Math.abs(maxY - minY);
    }

    region.area = Math.abs((sumY - sumX) / 2);
  });

  let innerArea = 0;
  object.userData.edgeModel.regions.forEach((region, idx) => {
    if (idx) {
      innerArea += region.area;
    }
  });

  if (object.userData.edgeModel.regions.length) {
    object.userData.edgeModel.regions[0].area -= innerArea;
  }

  return object.userData.edgeModel.regions.map(region => {
    return {
      region,
      area: region.area
    };
  });
}

let angle = (p1, p2) => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

let polar = (p1, phi, dist) => {
  // This function (polar) returns the point at an angle (in radians) and distance from a given point
  // http://www.afralisp.net/reference/autolisp-functions.php#P

  let x = p1.x + dist * Math.cos(phi);
  let y = p1.y + dist * Math.sin(phi);

  return new THREE.Vector3(x, y, 0);
};

let bugleToArc = (p1, p2, bulge) => {
  // http://www.afralisp.net/autolisp/tutorials/polyline-bulges-part-1.php
  // https://github.com/vasnake/dwg2csv/blob/master/extra/autocad.bulge/convertbulge.py

  let chord = getDistance(p1, p2);
  let angleLength = Math.atan(bulge) * 4;
  // height of the arc
  let sagitta = (chord / 2) * Math.abs(bulge);
  let radius = (Math.pow(chord / 2, 2) + Math.pow(sagitta, 2)) / (2 * sagitta);

  // let radius = 0;
  // if (angleLength !== 0) {
  //     radius = (chord/2.0) / Math.sin(Math.abs(angleLength/2.0))
  // }

  let theta = 4.0 * Math.atan(Math.abs(bulge));
  let gamma = (Math.PI - theta) / 2.0;
  let phi = angle(p1, p2) + gamma * Math.sign(bulge);
  let center = polar(p1, phi, radius);
  let startAngle = Math.acos(((p1.x - center.x) / radius).toFixed(10));
  if (Math.sign(p1.y - center.y) < 0) {
    startAngle = 2.0 * Math.PI - startAngle;
  }

  return {
    angleLength: angleLength,
    center: center,
    endAngle: startAngle + angleLength,
    radius: radius,
    startAngle: startAngle
  };
};

let fixObjectsPaths = scene => {
  sceneService.getObjects(scene, true).forEach(object => {
    if (
      object &&
      object.userData &&
      object.userData.edgeModel &&
      object.userData.edgeModel.regions
    ) {
      object.userData.edgeModel.regions.forEach(region => {
        if (region.path) {
          let path = new Path();
          Object.defineProperty(path, 'length', {
            enumerable: false,
            writable: true
          });
          path.push(...region.path);
          region.path = path;
          region.path.forEach(v => {
            if (v.parentUuid) {
              v.parent = scene.getObjectByProperty('uuid', v.parentUuid);
              delete v.parentUuid;
            }
          });
        }
      });
    }
  });
};

let getThermalPoints = scene => {
  let leftTop, leftBottom, rightTop, rightBottom;

  // hot2: new THREE.Vector3(0,0,0),
  // cold1: new THREE.Vector3(0,0,0),
  // cold2: new THREE.Vector3(0,0,0)

  let objects = sceneService.getObjects(scene, true);

  objects.forEach(object => {
    if (
      object &&
      object.userData &&
      object.userData.edgeModel &&
      object.userData.edgeModel.regions
    ) {
      let region = object.userData.edgeModel.regions[0];
      if (region) {
        let { boundingBox } = region;

        if (!leftTop || !leftBottom || !rightTop || !rightBottom) {
          leftTop = {
            boundingBox,
            region
          };
          leftBottom = {
            boundingBox,
            region
          };
          rightTop = {
            boundingBox,
            region
          };
          rightBottom = {
            boundingBox,
            region
          };
        }
        if (
          boundingBox.x1 <= leftTop.boundingBox.x1 &&
          boundingBox.y1 <= leftTop.boundingBox.y1
        ) {
          leftTop.boundingBox = boundingBox;
          leftTop.region = region;
        }
        if (
          boundingBox.x1 <= leftBottom.boundingBox.x1 &&
          boundingBox.y2 >= leftBottom.boundingBox.y2
        ) {
          leftBottom.boundingBox = boundingBox;
          leftBottom.region = region;
        }
        if (
          boundingBox.x2 >= rightTop.boundingBox.x2 &&
          boundingBox.y1 <= rightTop.boundingBox.y1
        ) {
          rightTop.boundingBox = boundingBox;
          rightTop.region = region;
        }
        if (
          boundingBox.x2 >= rightBottom.boundingBox.x2 &&
          boundingBox.y2 >= rightBottom.boundingBox.y2
        ) {
          rightBottom.boundingBox = boundingBox;
          rightBottom.region = region;
        }
      }
    }
  });

  if (leftTop && leftBottom && rightTop && rightBottom) {
    leftTop.region.path.forEach(vertex => {
      if (!leftTop.vertex) {
        leftTop.vertex = vertex;
      }

      if (vertex.x <= leftTop.vertex.x && vertex.y <= leftTop.vertex.y) {
        leftTop.vertex = vertex;
      }
    });

    leftBottom.region.path.forEach(vertex => {
      if (!leftBottom.vertex) {
        leftBottom.vertex = vertex;
      }

      if (vertex.x <= leftBottom.vertex.x && vertex.y >= leftBottom.vertex.y) {
        leftBottom.vertex = vertex;
      }
    });

    rightTop.region.path.forEach(vertex => {
      if (!rightTop.vertex) {
        rightTop.vertex = vertex;
      }

      if (vertex.x >= rightTop.vertex.x && vertex.y <= rightTop.vertex.y) {
        rightTop.vertex = vertex;
      }
    });

    rightBottom.region.path.forEach(vertex => {
      if (!rightBottom.vertex) {
        rightBottom.vertex = vertex;
      }

      if (
        vertex.x >= rightBottom.vertex.x &&
        vertex.y >= rightBottom.vertex.y
      ) {
        rightBottom.vertex = vertex;
      }
    });

    return {
      cold1: leftTop.vertex,
      cold2: rightTop.vertex,
      hot1: leftBottom.vertex,
      hot2: rightBottom.vertex
    };
  }

  // , leftBottom, rightTop, rightBottom

  return false;
};

//todo review with all cases (line + line, circle + line)
let angleBetweenLines = (a, b, option = 'radian') => {
  let A, B, A1, B1, lengthA1, lengthB1, scalarAB1, fi1;
  A = {
    x: a.geometry.vertices[1].x - a.geometry.vertices[0].x,
    y: a.geometry.vertices[1].y - a.geometry.vertices[0].y,
    z: a.geometry.vertices[1].z - a.geometry.vertices[0].z
  };
  B = {
    x: b.geometry.vertices[1].x - b.geometry.vertices[0].x,
    y: b.geometry.vertices[1].y - b.geometry.vertices[0].y,
    z: b.geometry.vertices[1].z - b.geometry.vertices[0].z
  };

  if (a.geometry instanceof THREE.CircleGeometry) {
    A1 = {
      x:
        a.geometry.vertices[a.geometry.vertices.length - 2].x -
        a.geometry.vertices[a.geometry.vertices.length - 1].x,
      y:
        a.geometry.vertices[a.geometry.vertices.length - 2].y -
        a.geometry.vertices[a.geometry.vertices.length - 1].y,
      z:
        a.geometry.vertices[a.geometry.vertices.length - 2].z -
        a.geometry.vertices[a.geometry.vertices.length - 1].z
    };
    lengthA1 = Math.sqrt(A1.x * A1.x + A1.y * A1.y + A1.z * A1.z);
    scalarAB1 = A1.x * B.x + A1.y * B.y + A1.z * B.z;
  }

  if (b.geometry instanceof THREE.CircleGeometry) {
    B1 = {
      x:
        b.geometry.vertices[b.geometry.vertices.length - 2].x -
        b.geometry.vertices[b.geometry.vertices.length - 1].x,
      y:
        b.geometry.vertices[b.geometry.vertices.length - 2].y -
        b.geometry.vertices[b.geometry.vertices.length - 1].y,
      z:
        b.geometry.vertices[b.geometry.vertices.length - 2].z -
        b.geometry.vertices[b.geometry.vertices.length - 1].z
    };
    lengthB1 = Math.sqrt(B1.x * B1.x + B1.y * B1.y + B1.z * B1.z);
    scalarAB1 = A.x * B1.x + A.y * B1.y + A.z * B1.z;
  }

  const lengthA = Math.sqrt(A.x * A.x + A.y * A.y + A.z * A.z);
  const lengthB = Math.sqrt(B.x * B.x + B.y * B.y + B.z * B.z);
  const scalarAB = A.x * B.x + A.y * B.y + A.z * B.z;
  const fi = Math.acos(scalarAB / (lengthA * lengthB));

  if (lengthA1 && scalarAB1) {
    fi1 = Math.acos(scalarAB1 / (lengthA1 * lengthB));
  } else if (lengthB1 && scalarAB1) {
    fi1 = Math.acos(scalarAB1 / (lengthA * lengthB1));
  } else {
    fi1 = Math.PI - fi;
  }
  if (option === 'degree') {
    //return fi in degree, 1 rad = 180°/π = 57.295779513°
    return [(fi * 180) / Math.PI, (fi1 * 180) / Math.PI];
  } else {
    //return fi in radian
    return [fi, fi1];
  }
};

let scale = (object, scale) => {
  object.children.map(item => {
    if (item.geometry instanceof THREE.CircleGeometry) {
      item.geometry.parameters.radius = item.geometry.parameters.radius * scale;
      item.geometry = changeArcGeometry(
        item.geometry,
        item.geometry.parameters
      );
      item.position.x = item.position.x * scale;
      item.position.y = item.position.y * scale;
      item.position.z = item.position.z * scale;
    } else if (item.geometry instanceof THREE.Geometry) {
      item.geometry.vertices.forEach(vertex => {
        vertex.x = vertex.x * scale;
        vertex.y = vertex.y * scale;
        vertex.z = vertex.z * scale;
        item.geometry.verticesNeedUpdate = true;
        item.computeLineDistances();
        item.geometry.computeBoundingSphere();
      });
    }
    return item;
  });
  return object;
};

let distanseToLinePoint = (line, point) => {
  return (
    Math.abs(
      (line.geometry.vertices[1].y - line.geometry.vertices[0].y) * point.x -
        (line.geometry.vertices[1].x - line.geometry.vertices[0].x) * point.y +
        line.geometry.vertices[1].x * line.geometry.vertices[0].y -
        line.geometry.vertices[1].y * line.geometry.vertices[0].x
    ) /
    Math.sqrt(
      (line.geometry.vertices[1].y - line.geometry.vertices[0].y) *
        (line.geometry.vertices[1].y - line.geometry.vertices[0].y) +
        (line.geometry.vertices[1].x - line.geometry.vertices[0].x) *
          (line.geometry.vertices[1].x - line.geometry.vertices[0].x)
    )
  );
};

let pointIntersect = (a, b, c, d) => {
  let T = {};
  T.x =
    -(
      (a.x * b.y - b.x * a.y) * (d.x - c.x) -
      (c.x * d.y - d.x * c.y) * (b.x - a.x)
    ) /
    ((a.y - b.y) * (d.x - c.x) - (c.y - d.y) * (b.x - a.x));
  T.y = ((c.y - d.y) * -T.x - (c.x * d.y - d.x * c.y)) / (d.x - c.x);
  return T;
};

let getBoundingBox = objects => {
  if (!Array.isArray(objects)) {
    objects = [objects];
  }

  let boundingBoxes = [];

  objects.forEach(object => {
    let boundingBox;
    if (object instanceof THREE.Vector3) {
      boundingBox = {
        min: new THREE.Vector3().copy(object),
        max: new THREE.Vector3().copy(object)
      };
    }

    if (object instanceof THREE.Line) {
      if (object.geometry instanceof THREE.CircleGeometry) {
        //arc
        boundingBox = getArcBoundingBox(object);
      } else {
        // line
        object.geometry.computeBoundingBox();
        boundingBox = object.geometry.boundingBox;
      }
    }
    if (object instanceof THREE.Object3D) {
      object = new THREE.BoxHelper(object, 0xffff00);

      object.geometry.computeBoundingBox();
      boundingBox = object.geometry.boundingBox;
    }
    boundingBoxes.push(boundingBox);
  });

  if (boundingBoxes.length) {
    // merge boundingBoxes
    let finalBoundingBox = boundingBoxes[0];

    for (let i = 1; i < boundingBoxes.length; i++) {
      if (boundingBoxes[i].min.x < finalBoundingBox.min.x)
        finalBoundingBox.min.x = boundingBoxes[i].min.x;
      if (boundingBoxes[i].min.y < finalBoundingBox.min.y)
        finalBoundingBox.min.y = boundingBoxes[i].min.y;
      if (boundingBoxes[i].max.x > finalBoundingBox.max.x)
        finalBoundingBox.max.x = boundingBoxes[i].max.x;
      if (boundingBoxes[i].max.y > finalBoundingBox.max.y)
        finalBoundingBox.max.y = boundingBoxes[i].max.y;
    }

    let center = new THREE.Vector3(
      (finalBoundingBox.min.x + finalBoundingBox.max.x) / 2,
      (finalBoundingBox.min.y + finalBoundingBox.max.y) / 2,
      0
    );

    let width = finalBoundingBox.max.x - finalBoundingBox.min.x,
      height = finalBoundingBox.max.y - finalBoundingBox.min.y;

    return {
      min: finalBoundingBox.min,
      max: finalBoundingBox.max,
      center,
      width,
      height,
      aspectRatio: width / height
    };
  }

  return false;
};

let getArcBoundingBox = arc => {
  // put up to 4 vertexes on pi/2 angle
  // also add arcStart and arcFinish points
  // calculate bounding box, based on vertices (from 2 up to 6)

  let { x, y } = arc.position;
  let { radius, thetaStart, thetaLength } = arc.geometry.parameters;

  let arcStart = new THREE.Vector3(
    x + radius * Math.cos(thetaStart),
    y + radius * Math.sin(thetaStart),
    0
  );

  let arcFinish = new THREE.Vector3(
    x + radius * Math.cos(thetaStart + thetaLength),
    y + radius * Math.sin(thetaStart + thetaLength),
    0
  );

  let vertices = [arcStart, arcFinish];
  //find closest start angle
  let angle = Math.ceil(thetaStart / (Math.PI / 2)) * (Math.PI / 2);
  while (angle < thetaStart + thetaLength) {
    vertices.push(
      new THREE.Vector3(
        x + radius * Math.cos(angle),
        y + radius * Math.sin(angle),
        0
      )
    );
    angle += Math.PI / 2;
  }

  //find the bounding box;
  let min = new THREE.Vector3(vertices[0].x, vertices[0].y, 0),
    max = new THREE.Vector3(vertices[0].x, vertices[0].y, 0);
  vertices.forEach(vertex => {
    if (vertex.x < min.x) min.x = vertex.x;
    if (vertex.y < min.y) min.y = vertex.y;
    if (vertex.x > max.x) max.x = vertex.x;
    if (vertex.y > max.y) max.y = vertex.y;
  });

  let center = new THREE.Vector3((min.x + max.x) / 2, (min.y + max.y) / 2, 0);

  let width = max.x - min.x,
    height = max.y - min.y;

  return {
    min,
    max,
    center,
    width,
    height,
    aspectRatio: width / height
  };
};

let computeBoundingBoxAdditionalInfo = boundingBox => {
  boundingBox.center = new THREE.Vector3(
    (boundingBox.min.x + boundingBox.max.x) / 2,
    (boundingBox.min.y + boundingBox.max.y) / 2,
    0
  );

  boundingBox.width = boundingBox.max.x - boundingBox.min.x;
  boundingBox.height = boundingBox.max.y - boundingBox.min.y;

  boundingBox.center = new THREE.Vector3(
    (boundingBox.min.x + boundingBox.max.x) / 2,
    (boundingBox.min.y + boundingBox.max.y) / 2,
    0
  );

  boundingBox.aspectRatio = boundingBox.width / boundingBox.height;
};

function getPathVariants(node) {
  let result = [];

  if (!node.next.length) {
    result.push([node.entity]);
  } else {
    node.next.forEach(nextNode => {
      getPathVariants(nextNode).forEach(path => {
        result.push(path.concat(node.entity));
      });
    });
  }
  return result;
}

function filterSelfIntersectingPaths(paths = []) {
  let result = [];

  //get paths with similar vertices set
  while (paths.length) {
    let path = paths.pop();
    let pairs = [];
    paths.forEach(item => {
      if (arrayUtils.isEqual(path, item)) {
        pairs.push(item);
        paths.splice(paths.indexOf(item), 1);
      }
    });
    let maxPath = path;
    let maxPathArea = pathArea(path);
    pairs.forEach(item => {
      let area = pathArea(item);
      if (area > maxPathArea) {
        maxPathArea = area;
        maxPath = paths;
      }
    });
    result.push(maxPath);
  }

  return result;
}

const newCurve = (center, radius, startPoint, endPoint) => {
  let curveParam = {
    newCurveCenter: center,
    thetaStart: circlInterAngle(startPoint, center),
    thetaLength:
      2 *
      Math.acos(
        getDistance(center, {
          x: (startPoint.x + endPoint.x) / 2,
          y: (startPoint.y + endPoint.y) / 2
        }) / radius
      ),
    radius: radius
  };
  let materialLine = new THREE.LineBasicMaterial({
    color: 0x00ff00
  });
  let changedGeometry = {
    radius: curveParam.radius,
    thetaStart: curveParam.thetaStart,
    thetaLength: curveParam.thetaLength
  };
  let copyCircleGeometry = changGeomEditObj({ 0: 'copy' }, changedGeometry);
  let copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
  copyCircle.position.x = center.x;
  copyCircle.position.y = center.y;

  let pointCircleEnd = {
    x:
      copyCircle.position.x +
      copyCircle.geometry.vertices[copyCircle.geometry.vertices.length - 1].x,
    y:
      copyCircle.position.y +
      copyCircle.geometry.vertices[copyCircle.geometry.vertices.length - 1].y
  };
  let pointCircleStart = {
    x: copyCircle.position.x + copyCircle.geometry.vertices[0].x,
    y: copyCircle.position.y + copyCircle.geometry.vertices[0].y
  };
  let endA = helpLayerService.lengthLine(startPoint, pointCircleEnd);
  let startA = helpLayerService.lengthLine(startPoint, pointCircleStart);
  let endC = helpLayerService.lengthLine(endPoint, pointCircleEnd);
  let startC = helpLayerService.lengthLine(endPoint, pointCircleStart);

  if (!(startA < 1e-3 && endC < 1e-3) || (endA < 1e-3 && startC < 1e-3)) {
    // debugger;
    changedGeometry = {
      radius: curveParam.radius,
      thetaStart: circlInterAngle(endPoint, center),
      thetaLength: curveParam.thetaLength
    };
    copyCircleGeometry = changGeomEditObj({ 0: 'copy' }, changedGeometry);
    copyCircle = new THREE.Line(copyCircleGeometry, materialLine);
    copyCircle.position.x = curveParam.newCurveCenter.x;
    copyCircle.position.y = curveParam.newCurveCenter.y;
  }
  // debugger;
  copyCircle.userData.originalColor = copyCircle.material.color.clone();
  copyCircle.userData.id = uuid.v4();
  return copyCircle;
};

export default {
  newCurve,
  entitiesIntersectInfo,
  distanceToLine,
  distanceToArc,
  skipZeroLines,
  getFirstVertex,
  getAnotherVertex,
  linesIntersect,
  getDistance,
  isBetween,
  buildEdgeModel,
  getCollisionPoints,
  filterOverlappingCollisionPoints,
  filterCollisionPoints,
  filterCollisionPointsWithSharedEntities,
  generateCollisionBranches,
  generateAllPaths,
  queueIterator,
  checkCavity,
  calcLength,
  calcArea,
  pathArea,
  calcSize,
  vertexInArea,
  entityIntersectArea,
  insidePolygon,
  bugleToArc,
  getObjectInfo,
  fixObjectsPaths,
  getThermalPoints,
  rotatePoint,
  changeArcGeometry,
  angleBetweenLines,
  scale,
  distanceToEntity,
  distanseToLinePoint,
  pointIntersect,
  arcsIntersect,
  getVertices,
  getSerialVertices,
  getSerialVerticesFromOrderedEntities,
  getArcBoundingBox,
  getBoundingBox,
  buildBoundingBox,
  computeBoundingBoxAdditionalInfo,
  getPathVariants,
  filterSelfIntersectingPaths,
  getRegionClusters
};
