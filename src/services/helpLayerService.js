import * as THREE from '../extend/THREE';

let highlightVertex = (vertices, editor, timeout = 0, radius = 10) => {
  let { cadCanvas } = editor;

  let helpLayer = cadCanvas.getHelpLayer();
  let vertexHighlighters = [];

  let pointGeometry = new THREE.CircleGeometry(radius, 20);
  pointGeometry.vertices.shift();

  pointGeometry.vertices.push(pointGeometry.vertices[0]);

  let pointMaterial = new THREE.LineBasicMaterial({
    color: 0xff4444
  });

  vertices.forEach((vertex, idx) => {
    let point = new THREE.Line(pointGeometry, pointMaterial);
    point.position.x = vertex.x;
    point.position.y = vertex.y;
    point.name = `vertexHighlighter${idx}`;
    vertexHighlighters.push(point);
  });

  helpLayer.add(...vertexHighlighters);

  if (timeout) {
    setTimeout(() => {
      helpLayer.remove(...vertexHighlighters);
      cadCanvas.render();
    }, timeout);
  }
};

export default {
  highlightVertex
};
