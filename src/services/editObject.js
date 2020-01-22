import * as THREE from '../extend/THREE';

let setColor = function(entity, bgColor, objId, objColor) {
  entity.children.forEach(function(entity) {
    if (entity.children.length > 0) {
      setColor(entity, bgColor, objId, objColor);
    } else {
      if (entity.type === 'Line' && entity.children.length === 0) {
        if (entity.parent.id === objId || entity.id === objId) {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone();
          }
          entity.material.color.set(objColor);
        } else {
          if (!entity.userData.originalColor) {
            entity.userData.originalColor = entity.material.color.clone();
          }
          entity.material.color.set(bgColor);
        }
      }
    }
  });
};

let setOriginalColor = entity => {
  entity.children.forEach(function(entity) {
    if (entity.children.length > 0) {
      setOriginalColor(entity);
    } else {
      if (entity.type === 'Line' && entity.children.length === 0) {
        // set color first line for created new line, arc
        let firstColor;
        if (entity.userData.originalColor) {
          firstColor = !firstColor ? entity.userData.originalColor : firstColor;
          entity.material.color.set(entity.userData.originalColor);
        } else {
          entity.material.color.set(firstColor);
        }
      }
    }
  });
};

let addHelpPoints = (object, scene, radiusPoint) => {
  let helpLayer = scene.getObjectByName('HelpLayer');
  let pointGeometry = new THREE.CircleGeometry(radiusPoint, 32, 0, 2 * Math.PI);
  pointGeometry.vertices.shift();
  let pointMaterial = new THREE.LineBasicMaterial({
    color: 0xcccccc,
    opacity: 0.8,
    transparent: true
  });

  if (object.geometry.type === 'Geometry') {
    let point1 = new THREE.Line(pointGeometry, pointMaterial);
    point1.position.x = object.geometry.vertices[0].x;
    point1.position.y = object.geometry.vertices[0].y;
    point1.name = 'point1';

    let point2 = new THREE.Line(pointGeometry, pointMaterial);
    point2.position.x = object.geometry.vertices[1].x;
    point2.position.y = object.geometry.vertices[1].y;
    point2.name = 'point2';

    helpLayer.add(point1, point2);
  } else if (object.geometry.type === 'CircleGeometry') {
    let pointCenter = new THREE.Line(pointGeometry, pointMaterial);
    let pointStart = new THREE.Line(pointGeometry, pointMaterial);
    let pointEnd = new THREE.Line(pointGeometry, pointMaterial);
    let pointRadius = new THREE.Line(pointGeometry, pointMaterial);
    pointCenter.name = 'Center';
    pointStart.name = 'Start';
    pointEnd.name = 'End';
    pointRadius.name = 'Radius';

    pointStart.position.x = object.position.x + object.geometry.vertices[0].x;
    pointStart.position.y = object.position.y + object.geometry.vertices[0].y;
    pointEnd.position.x =
      object.position.x +
      object.geometry.vertices[object.geometry.vertices.length - 1].x;
    pointEnd.position.y =
      object.position.y +
      object.geometry.vertices[object.geometry.vertices.length - 1].y;
    pointCenter.position.x = object.position.x;
    pointCenter.position.y = object.position.y;
    pointRadius.position.x =
      object.position.x +
      object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].x;
    pointRadius.position.y =
      object.position.y +
      object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].y;

    helpLayer.add(pointCenter, pointStart, pointEnd, pointRadius);
  }
};

let getScale = camera => {
  let scale = camera.zoom;
  scale = scale >= 1 ? 1 / scale : scale * 2;
  scale = scale > 0.5 ? 0.5 : scale;
  return scale;
};

let unselectLine = (line, scene) => {
  line.name = '';
  scene.getObjectByName('HelpLayer').children = [];
  line.material.color.set(0x00ff00);
  return {};
};

let closestPoint = (arr, c) => {
  let index;
  arr.forEach(function(item) {
    item.distance = Math.sqrt(
      (item.x - c.x) * (item.x - c.x) + (item.y - c.y) * (item.y - c.y)
    );
  });
  let compare = (a, b) => {
    if (a.distance > b.distance) return 1;
    if (a.distance < b.distance) return -1;
  };
  let arrSorted = arr.slice().sort(compare);
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].distance === arrSorted[0].distance) {
      index = i;
    }
  }
  return index;
};

let isPoint = (a, r, rCenter) => {
  let rXy = Math.sqrt(
    (rCenter.x - a.x) * (rCenter.x - a.x) +
      (rCenter.y - a.y) * (rCenter.y - a.y)
  );
  return rXy <= r;
};

let startPointIndex = (line, mousePoint, scale = 1) => {
  if (line.geometry.type === 'Geometry') {
    let index = closestPoint(line.geometry.vertices, mousePoint);
    const isSelectPoint = isPoint(
      line.geometry.vertices[index],
      scale,
      mousePoint
    );
    return isSelectPoint ? index : null;
  } else {
    if (line.geometry.type === 'CircleGeometry') {
      let rPosition = line.position;
      let thetaStart = {
        x: line.geometry.vertices[0].x + rPosition.x,
        y: line.geometry.vertices[0].y + rPosition.y
      };
      let thetaLength = {
        x:
          line.geometry.vertices[line.geometry.vertices.length - 1].x +
          rPosition.x,
        y:
          line.geometry.vertices[line.geometry.vertices.length - 1].y +
          rPosition.y
      };
      let radius = {
        x:
          line.geometry.vertices[(line.geometry.vertices.length - 1) / 2].x +
          rPosition.x,
        y:
          line.geometry.vertices[(line.geometry.vertices.length - 1) / 2].y +
          rPosition.y
      };

      let arrPoint = [];
      arrPoint.push(rPosition, thetaStart, thetaLength, radius);

      let index = closestPoint(arrPoint, mousePoint);

      const isSelectPoint = isPoint(arrPoint[index], scale, mousePoint);

      return isSelectPoint ? index : null;

      // $scope.editor.editMode.circle.helpStart = $scope.editor.editMode.circle.thetaStart;
      // $scope.editor.editMode.circle.helpLength = $scope.editor.editMode.circle.thetaLength;
    }
  }
};

let changeGeometry = (line, index, point, scene) => {
  if (line.geometry.type === 'Geometry') {
    line.geometry.vertices[index].x = point.x;
    line.geometry.vertices[index].y = point.y;
    line.geometry.verticesNeedUpdate = true;
    line.computeLineDistances();
    line.geometry.computeBoundingSphere();

    // change circle point
    let point1 = scene.getObjectByName('point1');
    let point2 = scene.getObjectByName('point2');
    if (point1 && point2) {
      point1.position.x = line.geometry.vertices[0].x;
      point1.position.y = line.geometry.vertices[0].y;
      point2.position.x = line.geometry.vertices[1].x;
      point2.position.y = line.geometry.vertices[1].y;
    }
  } else {
    if (line.geometry.type === 'CircleGeometry') {
      let changedGeometry = {
        radius: 0,
        thetaStart: 0,
        thetaLength: 0,

        helpLength: line.userData.helpGeometry.helpLength,
        helpStart: line.userData.helpGeometry.helpStart,
        overpastAngle: line.userData.helpGeometry.overpastAngle,
        pastDeltaLength: line.userData.helpGeometry.pastDeltaLength,
        mouseAngles: line.userData.helpGeometry.mouseAngles
      };

      line.userData.helpGeometry = changedGeometry;

      if (index === 0) {
        // *index === 0 move center arc
        line.position.x = point.x;
        line.position.y = point.y;
      } else {
        if (index === 1) {
          changedGeometry = editThetaStart(point, line);

          changedGeometry.radius = radiusArc(point, line);
          line.userData.helpGeometry = changedGeometry;
        } else if (index === 2) {
          changedGeometry = editThetaLenght(point, line);

          changedGeometry.radius = radiusArc(point, line);
          line.userData.helpGeometry = changedGeometry;
        } else if (index === 3) {
          // *index === 3 change radius arc
          changedGeometry.radius = radiusArc(point, line);
          changedGeometry.thetaStart = line.geometry.parameters.thetaStart;
          changedGeometry.thetaLength = line.geometry.parameters.thetaLength;
        }
        line.geometry = changeArcGeometry(line.geometry, changedGeometry);
      }
      circleHelpPoint(line, scene);
    }
  }
};

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

let radiusArc = (point, line) =>
  Math.sqrt(
    (line.position.x - point.x) * (line.position.x - point.x) +
      (line.position.y - point.y) * (line.position.y - point.y)
  );

let editThetaLenght = (mousePoint, line) => {
  let result = {};

  let helpStart =
    line.userData.helpGeometry && line.userData.helpGeometry.helpStart
      ? line.userData.helpGeometry.helpStart
      : line.geometry.parameters.thetaStart;
  let helpLength =
    line.userData.helpGeometry && line.userData.helpGeometry.helpLength
      ? line.userData.helpGeometry.helpLength
      : line.geometry.parameters.thetaLength;
  let thetaLength =
    line.userData.helpGeometry && line.userData.helpGeometry.thetaLength
      ? line.userData.helpGeometry.thetaLength
      : line.geometry.parameters.thetaLength;
  let pastDeltaLength =
    line.userData.helpGeometry && line.userData.helpGeometry.pastDeltaLength
      ? line.userData.helpGeometry.pastDeltaLength
      : -0.1;
  let overpastAngle =
    line.userData.helpGeometry && line.userData.helpGeometry.overpastAngle
      ? line.userData.helpGeometry.overpastAngle
      : 0;
  let mouseAngles =
    line.userData.helpGeometry && line.userData.helpGeometry.mouseAngles
      ? line.userData.helpGeometry.mouseAngles
      : [line.geometry.parameters.thetaStart];
  let isOnClock = arr => {
    return arr[0] < arr[1];
  };
  let angle = circleIntersectionAngle(
    {
      x: mousePoint.x,
      y: mousePoint.y
    },
    line.position
  );
  mouseAngles.unshift(angle);
  let onClock = isOnClock(mouseAngles);
  result.mouseAngles = mouseAngles;
  let start1 = helpStart;
  let deltaLength;

  if (start1 < angle && overpastAngle >= 0 && pastDeltaLength >= -0.1) {
    deltaLength = angle - start1;
    overpastAngle = angle;
  } else if (overpastAngle > 2 * Math.PI - 0.1) {
    deltaLength = 2 * Math.PI + angle - start1;
  } else if (start1 > angle) {
    if (onClock && thetaLength < 0.01) {
      deltaLength = angle - start1;
      helpLength = deltaLength;
    } else if (helpLength > 0.01) {
      deltaLength = angle - start1 + 2 * Math.PI;
    } else {
      deltaLength = angle - start1;
    }
    overpastAngle = angle;
  } else if (start1 < angle) {
    deltaLength = angle - start1 - 2 * Math.PI;
    deltaLength =
      Math.abs(deltaLength) > 2 * Math.PI
        ? (deltaLength % 2) * Math.PI
        : deltaLength;
  }

  result.overpastAngle = overpastAngle;
  result.pastDeltaLength = deltaLength;
  result.helpLength = helpLength;
  result.helpStart = helpStart;
  result.thetaLength = thetaLength;

  // length < 0
  result =
    deltaLength < 0
      ? {
          ...result,
          thetaStart: start1 + deltaLength,
          thetaLength: -deltaLength
        }
      : {
          ...result,
          thetaStart: start1,
          thetaLength: deltaLength
        };
  // start < 0
  result.thetaStart =
    result.thetaStart < 0 ? result.thetaStart + 2 * Math.PI : result.thetaStart;
  return result;
};

let editThetaStart = (mousePoint, line) => {
  let helpLength = line.userData.helpGeometry.helpLength;
  let helpStart = line.userData.helpGeometry.helpStart;
  let pastDeltaLength = line.userData.helpGeometry.pastDeltaLength;
  let overpastAngle = line.userData.helpGeometry.overpastAngle;

  let deltaLength;
  let result = {};
  let angle = circleIntersectionAngle(
    {
      x: mousePoint.x,
      y: mousePoint.y
    },
    line.position
  );
  // q => angle between 0/2Pi and point ThetaLength
  let q;
  if (helpLength < 0) {
    q = helpStart + helpLength;
    overpastAngle = q - helpLength;
  } else {
    q = Math.abs(helpStart) + Math.abs(helpLength);
    q = q < 2 * Math.PI ? q : q - 2 * Math.PI;
  }

  if (helpStart < 0) {
    q = helpStart + helpLength;
  }

  if (q <= angle && overpastAngle > 0 && pastDeltaLength > -0.1) {
    deltaLength = angle - q;
    overpastAngle = angle;
  } else if (overpastAngle > 2 * Math.PI - 0.1) {
    deltaLength = 2 * Math.PI + angle - q;
  } else if (q > angle) {
    deltaLength = angle - q;
    overpastAngle = angle;
  } else if (q < angle) {
    deltaLength = angle - q - 2 * Math.PI;
  }

  result.overpastAngle = overpastAngle;
  result.pastDeltaLength = deltaLength;
  result.helpLength = helpLength;
  result.helpStart = helpStart;

  // length < 0
  result =
    deltaLength < 0
      ? {
          ...result,
          thetaStart: q + deltaLength,
          thetaLength: -deltaLength
        }
      : {
          ...result,
          thetaStart: q,
          thetaLength: deltaLength
        };

  // start < 0
  result.thetaStart =
    result.thetaStart < 0 ? result.thetaStart + 2 * Math.PI : result.thetaStart;
  return result;
};

let circleIntersectionAngle = (vertex, circle) => {
  let catheterX = Math.abs(vertex.x - circle.x);
  let catheterY = Math.abs(vertex.y - circle.y);
  let angle = Math.atan(catheterY / catheterX);

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
    //in I quadrant
    //ok
  }
  return angle;
};

// change circle help point
let circleHelpPoint = (arc, scene) => {
  try {
    let center = scene.getObjectByName('Center');
    let start = scene.getObjectByName('Start');
    let end = scene.getObjectByName('End');
    let radius = scene.getObjectByName('Radius');

    center.position.x = arc.position.x;
    center.position.y = arc.position.y;
    start.position.x = arc.position.x + arc.geometry.vertices[0].x;
    start.position.y = arc.position.y + arc.geometry.vertices[0].y;
    end.position.x =
      arc.position.x +
      arc.geometry.vertices[arc.geometry.vertices.length - 1].x;
    end.position.y =
      arc.position.y +
      arc.geometry.vertices[arc.geometry.vertices.length - 1].y;

    radius.position.x =
      arc.position.x +
      (arc.geometry.vertices[(arc.geometry.vertices.length - 1) / 2].x ||
        arc.geometry.vertices[16].x);
    radius.position.y =
      arc.position.y +
      (arc.geometry.vertices[(arc.geometry.vertices.length - 1) / 2].y ||
        arc.geometry.vertices[16].y);
  } catch (e) {
    console.error('error = ', e);
  }
};

let crossingPoint = (pointMouse, activeEntities, entrainment = 0.05) => {
  try {
    if (activeEntities.length > 0 && pointMouse) {
      entrainment *= 10;
      let line;
      activeEntities.forEach(function(entity) {
        if (
          !line &&
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
          line = entity;
        }
      });
      if (line) {
        if (line.geometry.type === 'Geometry') {
          let index = closestPoint(line.geometry.vertices, pointMouse);
          let p = isPoint(
            pointMouse,
            entrainment,
            line.geometry.vertices[index]
          );
          if (p)
            return {
              x: line.geometry.vertices[index].x,
              y: line.geometry.vertices[index].y
            };
        } else if (line.geometry.type === 'CircleGeometry') {
          let point0 = {};
          let point1 = {};
          point0.x = line.geometry.vertices[0].x + line.position.x;
          point0.y = line.geometry.vertices[0].y + line.position.y;
          point1.x =
            line.geometry.vertices[line.geometry.vertices.length - 1].x +
            line.position.x;
          point1.y =
            line.geometry.vertices[line.geometry.vertices.length - 1].y +
            line.position.y;
          let points = [point0, point1];

          let index = closestPoint(points, pointMouse);
          let p = isPoint(pointMouse, entrainment, points[index]);
          if (p)
            return {
              x: points[index].x,
              y: points[index].y
            };
        }
      }
    }
    return false;
  } catch (e) {
    console.error('closestPoint error ', e);
  }
};

let createLine = (point0, point1) => {
  if (
    (point0.x || point0.x === 0) &&
    (point0.y || point0.y === 0) &&
    (point1.x || point1.x === 0) &&
    (point1.y || point1.y === 0)
  ) {
    let geometryLine = new THREE.Geometry();
    geometryLine.vertices.push(new THREE.Vector3(point0.x, point0.y, 0));
    geometryLine.vertices.push(new THREE.Vector3(point1.x, point1.y, 0));
    //create a blue LineBasicMaterial
    let materialLine = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    let line = new THREE.Line(geometryLine, materialLine);
    line.name = 'newLine';
    return line;
  } else {
    console.error(
      'New Line Error. Missing all points to create line \n point0 = ',
      point0,
      'point1 = ',
      point1
    );
  }
};

let helpArc = radius => {
  let geometryArc = new THREE.CircleGeometry(radius, 32, 0, 2 * Math.PI);
  geometryArc.vertices.shift();
  let materialArc = new THREE.LineBasicMaterial({ color: 0xcccccc });
  materialArc.opacity = 0.5;
  materialArc.transparent = true;
  let helpLine = new THREE.Line(geometryArc, materialArc);
  helpLine.name = 'helpLine';
  return helpLine;
};

let newArc = (radius, thetaStart, thetaLength) => {
  let geometryArc = new THREE.CircleGeometry(
    radius,
    32,
    thetaStart,
    thetaLength
  );
  geometryArc.vertices.shift();
  let materialArc = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  let line = new THREE.Line(geometryArc, materialArc);
  line.name = 'newLine';
  return line;
};

let clone = (obj, name) => {
  let object = new THREE.Group();
  obj.children.forEach(item => {
    let cloneGeometry, line;
    const cloneMaterial = item.material.clone();
    if (item.geometry.type === 'Geometry') {
      cloneGeometry = item.geometry.clone();
      line = new THREE.Line(cloneGeometry, cloneMaterial);
    } else if (item.geometry.type === 'CircleGeometry') {
      cloneGeometry = new THREE.CircleGeometry(
        item.geometry.parameters.radius,
        item.geometry.parameters.segments,
        item.geometry.parameters.thetaStart,
        item.geometry.parameters.thetaLength
      );
      cloneGeometry.vertices.shift();
      line = new THREE.Line(cloneGeometry, cloneMaterial);
      line.position.set(item.position.x, item.position.y, item.position.z);
      line.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
    }
    line.userData = item.userData;
    object.add(line);
  });
  object.name = !name ? obj.name + '_copy' : name;
  object.userData = obj.userData;
  return object;
};

let fixPosition = object => {
  object.children.forEach(line => {
    if (line.geometry instanceof THREE.Geometry) {
      line.geometry.vertices.forEach(vertex => {
        vertex.x = vertex.x + object.position.x;
        vertex.y = vertex.y + object.position.y;
        vertex.z = vertex.z + object.position.z;
      });
      line.geometry.verticesNeedUpdate = true;
      line.computeLineDistances();
      line.geometry.computeBoundingSphere();
    } else if (line.geometry instanceof THREE.CircleGeometry) {
      line.position.set(
        line.position.x + object.position.x,
        line.position.y + object.position.y,
        line.position.z + object.position.z
      );
    }
  });
  object.position.set(0, 0, 0);
  return object;
};

let mirrorObject = (object, option) => {
  let box = new THREE.BoxHelper(object, 0xffff00);
  object.children.forEach(line => {
    if (line.geometry.type === 'Geometry') {
      line.geometry.vertices.forEach(vertex => {
        if (option === 'OX') {
          vertex.y = -vertex.y + 2 * box.geometry.boundingSphere.center.y;
        } else if (option === 'OY') {
          vertex.x = -vertex.x + 2 * box.geometry.boundingSphere.center.x;
        }
      });
      line.geometry.verticesNeedUpdate = true;
      line.computeLineDistances();
      line.geometry.computeBoundingSphere();
    } else if (line.geometry instanceof THREE.CircleGeometry) {
      if (option === 'OX') {
        line.rotation.x = line.rotation.x === Math.PI ? 0 : Math.PI;
        line.position.set(
          line.position.x,
          -line.position.y + 2 * box.geometry.boundingSphere.center.y,
          line.position.z
        );
      } else if (option === 'OY') {
        line.rotation.y = line.rotation.y === Math.PI ? 0 : Math.PI;
        line.position.set(
          -line.position.x + 2 * box.geometry.boundingSphere.center.x,
          line.position.y,
          line.position.z
        );
      }
    }
  });
  return object;
};

let rotationPoint = (vertex, center, angle) => {
  const r = Math.sqrt(
    (vertex.x - center.x) * (vertex.x - center.x) +
      (vertex.y - center.y) * (vertex.y - center.y)
  );
  const alpha = circleIntersectionAngle(vertex, center) + angle;
  vertex.x = r * Math.cos(alpha) + center.x;
  vertex.y = r * Math.sin(alpha) + center.y;
  return vertex;
};

let addMaterialBackgroundShape = (object) => {
  let oldMeshes = [];
  object.traverse(child => {
    if (child instanceof THREE.Mesh) {
        oldMeshes.push(child);
    }
  });

  oldMeshes.forEach(mesh => {
    object.remove(mesh);
  });

    object.userData.edgeModel.regions.forEach((region, idx) => {
        let shape = region.path.map(
            vertex => new THREE.Vector2(vertex.x, vertex.y)
        );
        shape = new THREE.Shape(shape);

        var geometry = new THREE.ShapeBufferGeometry(shape);
        var color = idx
            ? new THREE.Color(0xffffff)
            : new THREE.Color(object.userData.material.color);
        var material = new THREE.MeshLambertMaterial({
            color: color,
            emissive: color
        });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.translateZ(-10);
        object.add(mesh);
    });
};

export {
  setColor,
  setOriginalColor,
  addHelpPoints,
  getScale,
  unselectLine,
  startPointIndex,
  changeGeometry,
  crossingPoint,
  createLine,
  helpArc,
  newArc,
  circleIntersectionAngle,
  editThetaLenght,
  clone,
  fixPosition,
  mirrorObject,
  rotationPoint,
  changeArcGeometry,
  addMaterialBackgroundShape
};
