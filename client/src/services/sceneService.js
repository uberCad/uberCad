import * as THREE from '../extend/THREE'
import ArrayUtils from './arrayUtils'
import GeometryUtils from './GeometryUtils'

let onClick = (event, scene, camera) => {
  let result = {
    point: undefined, //new THREE.Vector3
    activeEntities: []
  };
  let canvas = event.target.tagName === "CANVAS" && event.target;
  if (!canvas) {
    return;
  }

  let canvasOffset = getOffset(canvas);

  let rayCaster = new THREE.Raycaster(); // create once
  let mouse = new THREE.Vector3((event.pageX - canvasOffset.left) / (canvas.clientWidth - 1) * 2 - 1, -((event.pageY - canvasOffset.top) / (canvas.clientHeight - 1)) * 2 + 1, 0);
  rayCaster.setFromCamera(mouse, camera);

  //get mouse coordinates
  mouse.unproject(camera);
  result.point = mouse;

  rayCaster.intersectObjects(scene.children, true).forEach(intersection => {
    if (result.activeEntities.indexOf(intersection.object) < 0) {
      result.activeEntities.push(intersection.object);
    }
  });

  result.activeEntities.forEach(function (line) {
    if (line.geometry.type === "Geometry") {
      line.userData.mouseDistance = GeometryUtils.distanceToLine(result.point, line);
    } else if (line.geometry.type === "CircleGeometry") {
      line.userData.mouseDistance = GeometryUtils.distanceToArc(result.point, line);
    }
  });
  let compare = (a, b) => {
    if (a.userData.mouseDistance > b.userData.mouseDistance) return 1;
    if (a.userData.mouseDistance < b.userData.mouseDistance) return -1;
  };
  result.activeEntities.sort(compare);

  return result;
}

let doSelection = (selectResult, editor) => {
  highlightEntities(editor, true, undefined, false);
  switch (editor.options.selectMode) {
    case 'new': {
      editor.activeEntities = selectResult;
    }
      break;
    case 'add': {
      editor.activeEntities = ArrayUtils.union(editor.activeEntities, selectResult);
    }
      break;
    case 'sub': {
      editor.activeEntities = ArrayUtils.subtract(editor.activeEntities, selectResult);
    }
      break;
    case 'intersect': {
      editor.activeEntities = ArrayUtils.intersection(editor.activeEntities, selectResult);
    }
      break;
  }
  highlightEntities(editor);

  return editor.activeEntities;
}

let render = (editor) => {
  let {renderer, scene, camera} = editor;
  renderer.render(scene, camera);
}

let highlightEntities = (editor, restoreColor = false, color = 0x0000FF, doRender = true) => {
  let entities = editor.activeEntities;
  entities.forEach(entity => {
    //upd color
    if (restoreColor) {
      delete entity.userData.showInTop;
      if (entity.userData.originalColor) {
        entity.material.color = entity.userData.originalColor;
        delete entity.userData.originalColor;
      }
    } else {
      if (!entity.userData.originalColor) {
        entity.userData.originalColor = entity.material.color;
      }
      entity.material.color = new THREE.Color(color);
    }
    // entity.geometry.computeLineDistances();
    entity.material.needUpdate = true;
  });
  if (doRender) {
    render(editor);
  }
}


export default {
  onClick,
  doSelection,
  highlightEntities,
  render

}


function getOffset(elem) {
  let offset = null;
  if (elem) {
    offset = {left: 0, top: 0};
    do {
      offset.top += elem.offsetTop;
      offset.left += elem.offsetLeft;
      elem = elem.offsetParent;
    } while (elem);
  }
  return offset;
}