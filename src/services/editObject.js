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
  let firstColor; //set color first line for created new line, arc
  entity.children.forEach(function (entity) {
    if (entity.children.length > 0) {
      setOriginalColor(entity)
    } else {
      if (entity.type === 'Line' &&
        entity.children.length === 0) {
        if (entity.userData.originalColor) {
          firstColor = firstColor ? firstColor : entity.userData.originalColor;
          entity.material.color.set(entity.userData.originalColor);
        } else {
          entity.material.color.set(firstColor);
        }
      }
    }
  })
}

let addHelpPoints = (object, scene, radiusPoint) => {
  let helpLayer = scene.getObjectByName("HelpLayer");
  let pointGeometry = new THREE.CircleGeometry(radiusPoint, 32, 0, 2 * Math.PI);
  pointGeometry.vertices.shift();
  let pointMaterial = new THREE.LineBasicMaterial({color: 0xcccccc, opacity: 0.8, transparent: true});

  if (object.geometry.type === "Geometry") {

    let point1 = new THREE.Line(pointGeometry, pointMaterial);
    point1.position.x = object.geometry.vertices[0].x;
    point1.position.y = object.geometry.vertices[0].y;
    point1.name = "point1";

    let point2 = new THREE.Line(pointGeometry, pointMaterial);
    point2.position.x = object.geometry.vertices[1].x;
    point2.position.y = object.geometry.vertices[1].y;
    point2.name = "point2";

    helpLayer.add(point1, point2);
  } else if (object.geometry.type === "CircleGeometry") {
    let pointCenter = new THREE.Line(pointGeometry, pointMaterial);
    let pointStart = new THREE.Line(pointGeometry, pointMaterial);
    let pointEnd = new THREE.Line(pointGeometry, pointMaterial);
    let pointRadius = new THREE.Line(pointGeometry, pointMaterial);
    pointCenter.name = "Center";
    pointStart.name = "Start";
    pointEnd.name = "End";
    pointRadius.name = "Radius";

    pointStart.position.x = object.position.x + object.geometry.vertices[0].x;
    pointStart.position.y = object.position.y + object.geometry.vertices[0].y;
    pointEnd.position.x = object.position.x + object.geometry.vertices[object.geometry.vertices.length - 1].x;
    pointEnd.position.y = object.position.y + object.geometry.vertices[object.geometry.vertices.length - 1].y;
    pointCenter.position.x = object.position.x;
    pointCenter.position.y = object.position.y;
    pointRadius.position.x = object.position.x + object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].x;
    pointRadius.position.y = object.position.y + object.geometry.vertices[(object.geometry.vertices.length - 1) / 2].y;

    helpLayer.add(pointCenter, pointStart, pointEnd, pointRadius);
  }
}

let getScale = (camera) => {
  let scale = camera.zoom
  scale = scale >= 1 ? (1.5 / scale) : scale * 2
  return scale
}

export {
  setColor,
  setOriginalColor,
  addHelpPoints,
  getScale
}
