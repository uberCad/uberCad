import DxfParser from 'dxf-parser';
import * as THREE from '../extend/THREE';
import sceneService from './sceneService';
import GeometryUtils from './GeometryUtils';
import Stats from 'stats.js';
import { OrthographicControls } from '../classes/OrthographicControls';
import throttle from 'lodash/throttle';

export function parseDxf(dxf) {
  let parser = new DxfParser();
  return parser.parseSync(dxf);
}

/**
 * Viewer class for a dxf object.
 * @param {Object} data - the dxf object
 * @param {Object} container - the parent element to which we attach the rendering canvas
 * @param {Object} snapshot - prepared data
 * @param {Object} font - a font loaded with THREE.FontLoader
 * @constructor
 */
export function Viewer(data = null, container, snapshot = null, font, editor) {
  let scene = editor ? editor.scene : new THREE.Scene();
  let check = name => {
    for (let i = 0; i <= editor.scene.children.length; i++) {
      if (editor.scene.children[i].name == name) {
        return editor.scene.children[i];
      }
    }
  };
  let layersEntity = editor ? check('Layers') : addContainer('Layers');
  let objectsEntity = editor ? check('Objects') : addContainer('Objects');
  let helpLayer = editor ? check('HelpLayer') : addContainer('HelpLayer');
  // todo питання під ким має бути newLineLayer
  let newLineLayer = editor
    ? check('newLineLayer')
    : addContainer('newLineLayer');
  if (editor) {
    editor.activeEntities.forEach(line => {
      line.material.color = line.userData.originalColor;
    });
    editor.editMode.activeLine.lines = [];
  }

  if (data) {
    createLineTypeShaders(data);

    let layers = {};
    Object.keys(data.tables.layer.layers).forEach(layerName => {
      layers[layerName] = new THREE.Object3D();
      layers[layerName].name = layerName;
      layers[layerName].userData['container'] = true;
    });

    let i, entity, obj;
    for (i = 0; i < data.entities.length; i++) {
      entity = data.entities[i];

      if (entity.type === 'DIMENSION') {
        //todo review block build. disassemble to primitives
        if (entity.block) {
          let block = data.blocks[entity.block];
          if (!block) {
            console.error('Missing referenced block "' + entity.block + '"');
            continue;
          }
          for (let j = 0; j < block.entities.length; j++) {
            obj = drawEntity(block.entities[j], data);
            //todo maybe add here if (obj) statement
          }
        } else {
          console.log('WARNING: No block for DIMENSION entity');
        }
      } else {
        obj = drawEntity(entity, data);
      }

      if (obj) {
        if (Array.isArray(obj)) {
          while (obj.length) {
            let object = obj.pop();
            layers[entity.layer].add(object);
          }
        } else {
          layers[entity.layer].add(obj);
        }
        // scene.add(obj);
      }
      obj = null;
    }
    let activeLine = editor ? editor.editMode.activeLine.lines : [];
    Object.keys(data.tables.layer.layers).forEach(layerName => {
      let layer = layers[layerName];
      layersEntity.add(layer);
      console.log(layer);
      layer.children.forEach(line => {
        activeLine[activeLine.length] = line;
      });
    });
  }

  if (snapshot) {
    scene.remove(layersEntity); //empty layers container
    let loader = new THREE.ObjectLoader();

    //hack for LegacyJSONLoader
    //todo rewrite import/export, and make internal format specification
    window.THREE = THREE;
    layersEntity = loader.parse(JSON.parse(snapshot.layers));
    sceneService.fixSceneAfterImport(layersEntity);
    scene.add(layersEntity);

    snapshot.objects.forEach(item => {
      const object = loader.parse(JSON.parse(item.parameters));
      sceneService.fixSceneAfterImport(object);
      objectsEntity.add(object);
    });

    GeometryUtils.fixObjectsPaths(scene);
  }

  // Create scene from dxf object (data)
  let dims = {
    min: { x: false, y: false, z: false },
    max: { x: false, y: false, z: false }
  };
  let bbox = new THREE.Box3().setFromObject(scene);
  if (bbox.min.x && (dims.min.x === false || dims.min.x > bbox.min.x))
    dims.min.x = bbox.min.x;
  if (bbox.min.y && (dims.min.y === false || dims.min.y > bbox.min.y))
    dims.min.y = bbox.min.y;
  if (bbox.min.z && (dims.min.z === false || dims.min.z > bbox.min.z))
    dims.min.z = bbox.min.z;
  if (bbox.max.x && (dims.max.x === false || dims.max.x < bbox.max.x))
    dims.max.x = bbox.max.x;
  if (bbox.max.y && (dims.max.y === false || dims.max.y < bbox.max.y))
    dims.max.y = bbox.max.y;
  if (bbox.max.z && (dims.max.z === false || dims.max.z < bbox.max.z))
    dims.max.z = bbox.max.z;

  let width = container.clientWidth;
  let height = container.clientHeight;
  let aspectRatio = width / height;

  let upperRightCorner = { x: dims.max.x, y: dims.max.y };
  let lowerLeftCorner = { x: dims.min.x, y: dims.min.y };

  // Figure out the current viewport extents
  let vpWidth = upperRightCorner.x - lowerLeftCorner.x;
  let vpHeight = upperRightCorner.y - lowerLeftCorner.y;
  let center = {
    x: vpWidth / 2 + lowerLeftCorner.x,
    y: vpHeight / 2 + lowerLeftCorner.y
  };

  // Fit all objects into current ThreeDXF viewer
  let extentsAspectRatio = Math.abs(vpWidth / vpHeight);
  if (aspectRatio > extentsAspectRatio) {
    vpWidth = vpHeight * aspectRatio;
  } else {
    vpHeight = vpWidth / aspectRatio;
  }

  let viewPort = {
    bottom: -vpHeight / 2,
    left: -vpWidth / 2,
    top: vpHeight / 2,
    right: vpWidth / 2,
    center: {
      x: center.x,
      y: center.y
    }
  };

  let camera = new THREE.OrthographicCamera(
    viewPort.left,
    viewPort.right,
    viewPort.top,
    viewPort.bottom,
    -10000,
    19000
  );
  camera.position.z = 10;
  camera.position.x = viewPort.center.x;
  camera.position.y = viewPort.center.y;

  // let renderer = (this.renderer = new THREE.WebGLRenderer());
  let renderer = (this.renderer = new THREE.WebGLRenderer({
    antialias: true,
  }));


  renderer.setSize(width, height);
  renderer.setClearColor(0xfffffff, 1);

  let controls = new OrthographicControls(camera, container);

  this.render = function() {
    renderer.render(scene, camera);
  };

  if (process.env.NODE_ENV === 'development') {
    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    this.render = function() {
      stats.begin();
      renderer.render(scene, camera);
      stats.end();
    };
  }

  this.render = throttle(this.render, 16); // 1000ms / 60frames = 16.6666667 ms

  controls.addEventListener('change', this.render);
  this.render();

  this.getControls = () => controls;

  this.resize = function(width, height) {
    let originalWidth = renderer.domElement.width;
    let originalHeight = renderer.domElement.height;

    let hscale = width / originalWidth;
    let vscale = height / originalHeight;

    camera.top = vscale * camera.top;
    camera.bottom = vscale * camera.bottom;
    camera.left = hscale * camera.left;
    camera.right = hscale * camera.right;

    renderer.setSize(width, height);
    renderer.setClearColor(0xfffffff, 1);
    camera.updateProjectionMatrix();
    this.render();
  };

  function addContainer(name) {
    let container = new THREE.Object3D();
    container.name = name;
    container.userData['container'] = true;
    scene.add(container);
    return container;
  }

  function drawEntity(entity, data) {
    let mesh;
    if (entity.type === 'CIRCLE' || entity.type === 'ARC') {
      mesh = drawCircle(entity, data, true);
    } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
      mesh = drawPolyLine(entity, data);
    } else if (entity.type === 'LINE') {
      mesh = drawLine(entity, data);
    }

    // else if (
    //   entity.type === 'LWPOLYLINE' ||
    //   entity.type === 'LINE' ||
    //   entity.type === 'POLYLINE'
    // ) {
    //   mesh = drawLine(entity, data);
    // }
    else if (entity.type === 'TEXT') {
      mesh = drawText(entity, data);
    } else if (entity.type === 'SOLID') {
      mesh = drawSolid(entity, data);
    } else if (entity.type === 'POINT') {
      mesh = drawPoint(entity, data);
    } else if (entity.type === 'INSERT') {
      mesh = drawBlock(entity, data, true);
    } else if (entity.type === 'SPLINE') {
      mesh = drawSpline(entity, data);
    } else if (entity.type === 'MTEXT') {
      mesh = drawMtext(entity, data);
    } else if (entity.type === 'ELLIPSE') {
      mesh = drawEllipse(entity, data);
    }

    // todo REVIEW IT
    // else if (entity.type === 'DIMENSION') {
    //   var dimTypeEnum = entity.dimensionType & 7;
    //   if (dimTypeEnum === 0) {
    //     mesh = drawDimension(entity, data);
    //   } else {
    //     console.log('Unsupported Dimension type: ' + dimTypeEnum);
    //   }
    // }
    else {
      console.log('Unsupported Entity Type: ' + entity.type);
    }
    return mesh;
  }

  function drawEllipse(entity, data) {
    let color = getColor(entity, data);

    let xrad = Math.sqrt(
      Math.pow(entity.majorAxisEndPoint.x, 2) +
        Math.pow(entity.majorAxisEndPoint.y, 2)
    );
    let yrad = xrad * entity.axisRatio;
    let rotation = Math.atan2(
      entity.majorAxisEndPoint.y,
      entity.majorAxisEndPoint.x
    );

    let curve = new THREE.EllipseCurve(
      entity.center.x,
      entity.center.y,
      xrad,
      yrad,
      entity.startAngle,
      entity.endAngle,
      false, // Always counterclockwise
      rotation
    );

    let points = curve.getPoints(50);
    let geometry = new THREE.BufferGeometry().setFromPoints(points);
    let material = new THREE.LineBasicMaterial({ linewidth: 1, color: color });

    // Create the final object to add to the scene
    return new THREE.Line(geometry, material);
  }

  function drawMtext(entity, data) {
    let color = getColor(entity, data);

    let geometry = new THREE.TextGeometry(entity.text, {
      font: font,
      size: entity.height * (4 / 5),
      height: 1
    });
    let material = new THREE.MeshBasicMaterial({ color: color });
    let text = new THREE.Mesh(geometry, material);

    // Measure what we rendered.
    let measure = new THREE.Box3();
    measure.setFromObject(text);

    let textWidth = measure.max.x - measure.min.x;

    // If the text ends up being wider than the box, it's supposed
    // to be multiline. Doing that in threeJS is overkill.
    if (textWidth > entity.width) {
      console.log("Can't render this multipline MTEXT entity, sorry.", entity);
      return undefined;
    }

    text.position.z = 0;
    switch (entity.attachmentPoint) {
      case 1:
        // Top Left
        text.position.x = entity.position.x;
        text.position.y = entity.position.y - entity.height;
        break;
      case 2:
        // Top Center
        text.position.x = entity.position.x - textWidth / 2;
        text.position.y = entity.position.y - entity.height;
        break;
      case 3:
        // Top Right
        text.position.x = entity.position.x - textWidth;
        text.position.y = entity.position.y - entity.height;
        break;

      case 4:
        // Middle Left
        text.position.x = entity.position.x;
        text.position.y = entity.position.y - entity.height / 2;
        break;
      case 5:
        // Middle Center
        text.position.x = entity.position.x - textWidth / 2;
        text.position.y = entity.position.y - entity.height / 2;
        break;
      case 6:
        // Middle Right
        text.position.x = entity.position.x - textWidth;
        text.position.y = entity.position.y - entity.height / 2;
        break;

      case 7:
        // Bottom Left
        text.position.x = entity.position.x;
        text.position.y = entity.position.y;
        break;
      case 8:
        // Bottom Center
        text.position.x = entity.position.x - textWidth / 2;
        text.position.y = entity.position.y;
        break;
      case 9:
        // Bottom Right
        text.position.x = entity.position.x - textWidth;
        text.position.y = entity.position.y;
        break;

      default:
        return undefined;
    }

    return text;
  }

  function drawSpline(entity, data) {
    let color = getColor(entity, data);

    let points = entity.controlPoints.map(function(vec) {
      return new THREE.Vector2(vec.x, vec.y);
    });

    let interpolatedPoints = [];
    let curve;
    if (entity.degreeOfSplineCurve === 2 || entity.degreeOfSplineCurve === 3) {
      for (let i = 0; i + 2 < points.length; i = i + 2) {
        if (entity.degreeOfSplineCurve === 2) {
          curve = new THREE.QuadraticBezierCurve(
            points[i],
            points[i + 1],
            points[i + 2]
          );
        } else {
          curve = new THREE.QuadraticBezierCurve3(
            points[i],
            points[i + 1],
            points[i + 2]
          );
        }
        interpolatedPoints.push.apply(interpolatedPoints, curve.getPoints(50));
      }
    } else {
      curve = new THREE.SplineCurve(points);
      interpolatedPoints = curve.getPoints(100);
    }

    let geometry = new THREE.BufferGeometry().setFromPoints(interpolatedPoints);
    let material = new THREE.LineBasicMaterial({ linewidth: 1, color: color });
    return new THREE.Line(geometry, material);
  }

  function drawPolyLine(entity, data) {
    let vertices = entity.vertices;
    let entities = [];

    for (let i = 0; i < vertices.length; i++) {
      let startPoint = vertices[i];
      let endPoint = i + 1 < vertices.length ? vertices[i + 1] : vertices[0];

      if (startPoint.bulge) {
        // circle geometry

        let p1 = new THREE.Vector3(startPoint.x, startPoint.y, 0);
        let p2 = new THREE.Vector3(endPoint.x, endPoint.y, 0);
        let arc = GeometryUtils.bugleToArc(p1, p2, startPoint.bulge);
        let subEntity = Object.assign({}, entity);
        subEntity = Object.assign(subEntity, arc);
        entities.push(
          drawCircle(
            Object.assign(subEntity, {
              shape: false,
              type: 'ARC'
            }),
            data
          )
        );
      } else {
        // unfortunately babel not correctly works with spread operator
        // entities.push(drawLine({...entity, vertices: [startPoint, endPoint]}, data));

        let subEntity = Object.assign({}, entity);
        entities.push(
          drawLine(
            Object.assign(subEntity, {
              vertices: [
                new THREE.Vector3(startPoint.x, startPoint.y, 0),
                new THREE.Vector3(endPoint.x, endPoint.y, 0)
              ],
              shape: false
            }),
            data
          )
        );
      }
    }

    return entities;
  }

  function drawLine(entity, data) {
    let geometry = new THREE.Geometry();
    let color = getColor(entity, data);
    let material,
      lineType,
      vertex,
      startPoint,
      endPoint,
      bulgeGeometry,
      bulge,
      i,
      line;

    // create geometry
    for (i = 0; i < entity.vertices.length; i++) {
      if (entity.vertices[i].bulge) {
        bulge = entity.vertices[i].bulge;
        startPoint = entity.vertices[i];
        endPoint =
          i + 1 < entity.vertices.length
            ? entity.vertices[i + 1]
            : geometry.vertices[0];

        bulgeGeometry = new THREE.BulgeGeometry(startPoint, endPoint, bulge);

        geometry.vertices.push.apply(geometry.vertices, bulgeGeometry.vertices);
      } else {
        vertex = entity.vertices[i];
        geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, 0));
      }
    }
    if (entity.shape) geometry.vertices.push(geometry.vertices[0]);

    // set material
    if (entity.lineType) {
      lineType = data.tables.lineType.lineTypes[entity.lineType];
    }

    if (lineType && lineType.pattern && lineType.pattern.length !== 0) {
      material = new THREE.LineDashedMaterial({
        color: color,
        gapSize: 4,
        dashSize: 4
      });
    } else {
      material = new THREE.LineBasicMaterial({ linewidth: 1, color: color });
    }

    // if(lineType && lineType.pattern && lineType.pattern.length !== 0) {

    //           geometry.computeLineDistances();

    //           // Ugly hack to add diffuse to this. Maybe copy the uniforms object so we
    //           // don't add diffuse to a material.
    //           lineType.material.uniforms.diffuse = { type: 'c', value: new THREE.Color(color) };

    // 	material = new THREE.ShaderMaterial({
    // 		uniforms: lineType.material.uniforms,
    // 		vertexShader: lineType.material.vertexShader,
    // 		fragmentShader: lineType.material.fragmentShader
    // 	});
    // }else {
    // 	material = new THREE.LineBasicMaterial({ linewidth: 1, color: color });
    // }

    line = new THREE.Line(geometry, material);
    return line;
  }

  function drawCircle(entity, data) {
    let geometry, material, circle;

    geometry = new THREE.CircleGeometry(
      entity.radius,
      32,
      entity.startAngle,
      entity.angleLength
    );
    geometry.vertices.shift();

    material = new THREE.LineBasicMaterial({ color: getColor(entity, data) });

    circle = new THREE.Line(geometry, material);
    circle.position.x = entity.center.x;
    circle.position.y = entity.center.y;
    circle.position.z = entity.center.z;

    return circle;
  }

  //TODO Review if we have some caveats using non CircleGeometry
  // function drawArc(entity, data) {
  //   var startAngle, endAngle;
  //   if (entity.type === 'CIRCLE') {
  //     startAngle = entity.startAngle || 0;
  //     endAngle = startAngle + 2 * Math.PI;
  //   } else {
  //     startAngle = entity.startAngle;
  //     endAngle = entity.endAngle;
  //   }
  //
  //   var curve = new THREE.ArcCurve(0, 0, entity.radius, startAngle, endAngle);
  //
  //   var points = curve.getPoints(32);
  //   var geometry = new THREE.BufferGeometry().setFromPoints(points);
  //
  //   var material = new THREE.LineBasicMaterial({
  //     color: getColor(entity, data)
  //   });
  //
  //   var arc = new THREE.Line(geometry, material);
  //   arc.position.x = entity.center.x;
  //   arc.position.y = entity.center.y;
  //   arc.position.z = entity.center.z;
  //
  //   return arc;
  // }

  function drawSolid(entity, data) {
    let geometry = new THREE.Geometry();
    let material, vertices;

    vertices = geometry.vertices;
    vertices.push(
      new THREE.Vector3(
        entity.points[0].x,
        entity.points[0].y,
        entity.points[0].z
      )
    );
    vertices.push(
      new THREE.Vector3(
        entity.points[1].x,
        entity.points[1].y,
        entity.points[1].z
      )
    );
    vertices.push(
      new THREE.Vector3(
        entity.points[2].x,
        entity.points[2].y,
        entity.points[2].z
      )
    );
    vertices.push(
      new THREE.Vector3(
        entity.points[3].x,
        entity.points[3].y,
        entity.points[3].z
      )
    );

    // Calculate which direction the points are facing (clockwise or counter-clockwise)
    let vector1 = new THREE.Vector3();
    let vector2 = new THREE.Vector3();
    vector1.subVectors(vertices[1], vertices[0]);
    vector2.subVectors(vertices[2], vertices[0]);
    vector1.cross(vector2);

    // If z < 0 then we must draw these in reverse order
    if (vector1.z < 0) {
      geometry.faces.push(new THREE.Face3(2, 1, 0));
      geometry.faces.push(new THREE.Face3(2, 3, 1));
    } else {
      geometry.faces.push(new THREE.Face3(0, 1, 2));
      geometry.faces.push(new THREE.Face3(1, 3, 2));
    }

    material = new THREE.MeshBasicMaterial({ color: getColor(entity, data) });

    return new THREE.Mesh(geometry, material);
  }

  function drawText(entity, data) {
    let geometry, material, text;

    if (!font)
      return console.warn(
        'Text is not supported without a Three.js font loaded with THREE.FontLoader! Load a font of your choice and pass this into the constructor. See the sample for this repository or Three.js examples at http://threejs.org/examples/?q=text#webgl_geometry_text for more details.'
      );

    geometry = new THREE.TextGeometry(entity.text, {
      font: font,
      height: 0,
      size: entity.textHeight || 12
    });

    if (entity.rotation) {
      let zRotation = (entity.rotation * Math.PI) / 180;
      geometry.rotateZ(zRotation);
    }

    material = new THREE.MeshBasicMaterial({ color: getColor(entity, data) });

    text = new THREE.Mesh(geometry, material);
    text.position.x = entity.startPoint.x;
    text.position.y = entity.startPoint.y;
    text.position.z = entity.startPoint.z;

    return text;
  }

  function drawPoint(entity, data) {
    let geometry, material, point;

    geometry = new THREE.Geometry();

    geometry.vertices.push(
      new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z)
    );

    // TODO: could be more efficient. PointCloud per layer?

    let numPoints = 1;

    let color = getColor(entity, data);
    let colors = new Float32Array(numPoints * 3);
    colors[0] = color.r;
    colors[1] = color.g;
    colors[2] = color.b;

    geometry.colors = colors;
    geometry.computeBoundingBox();

    material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: THREE.VertexColors
    });
    point = new THREE.Points(geometry, material);
    scene.add(point);
  }

  //todo review WTF is this function?
  // function drawDimension(entity, data) {
  //   var block = data.blocks[entity.block];
  //
  //   if (!block || !block.entities) return null;
  //
  //   var group = new THREE.Object3D();
  //   // if(entity.anchorPoint) {
  //   //     group.position.x = entity.anchorPoint.x;
  //   //     group.position.y = entity.anchorPoint.y;
  //   //     group.position.z = entity.anchorPoint.z;
  //   // }
  //
  //   for (var i = 0; i < block.entities.length; i++) {
  //     var childEntity = drawEntity(block.entities[i], data, group);
  //     if (childEntity) group.add(childEntity);
  //   }
  //
  //   return group;
  // }

  function drawBlock(entity, data, returnArray = false) {
    let block = data.blocks[entity.name];

    if (!block.entities) return null;

    let group = new THREE.Object3D();

    if (entity.xScale) group.scale.x = entity.xScale;
    if (entity.yScale) group.scale.y = entity.yScale;

    for (let i = 0; i < block.entities.length; i++) {
      let childEntity = drawEntity(block.entities[i], data, group);
      if (childEntity) {
        group.add(childEntity);
      }
    }

    if (entity.rotation) {
      if (!returnArray) {
        group.rotation.z = (entity.rotation * Math.PI) / 180;
      } else {
        // find center
        // debugger
        // TODO implement entities rotation here
        group.children.forEach(children => {
          if (children.geometry instanceof THREE.CircleGeometry) {
            let newPosition = GeometryUtils.rotatePoint(
              entity.position,
              (entity.rotation * Math.PI) / 180,
              children.position
            );
            children.position.x = newPosition.x;
            children.position.y = newPosition.y;
            children.geometry.parameters.thetaStart +=
              (entity.rotation * Math.PI) / 180;
            children.geometry = GeometryUtils.changeArcGeometry(
              children.geometry,
              children.geometry.parameters
            );
          } else {
            // console.log('line', children, children.geometry, children.geometry.vertices)
            children.geometry.vertices = children.geometry.vertices.map(
              vertex =>
                GeometryUtils.rotatePoint(
                  entity.position,
                  (entity.rotation * Math.PI) / 180,
                  vertex
                )
            );
          }
        });
      }
    }

    if (entity.position) {
      // console.log('POSITION', entity.position)
      group.position.x = entity.position.x;
      group.position.y = entity.position.y;
      group.position.z = entity.position.z;

      if (returnArray) {
        group.children.forEach(children => {
          if (children.geometry instanceof THREE.CircleGeometry) {
            children.position.x += group.position.x;
            children.position.y += group.position.y;
            children.position.z += group.position.z;
          } else {
            children.geometry.vertices.forEach(v => {
              v.x += group.position.x;
              v.y += group.position.y;
              v.z += group.position.z;
            });
          }
        });
      }
    }

    if (returnArray) {
      return group.children;
    }

    return group;
  }

  function getColor(entity, data) {
    let color = 0x000000; // default
    if (entity.color) color = entity.color;
    else if (
      data.tables &&
      data.tables.layer &&
      data.tables.layer.layers[entity.layer]
    ) {
      color = data.tables.layer.layers[entity.layer].color;
    }

    if (color == null || color === 0xffffff) {
      color = 0x000000;
    }
    return color;
  }

  function createLineTypeShaders(data) {
    let ltype, type;
    if (!data.tables || !data.tables.lineType) return;
    let ltypes = data.tables.lineType.lineTypes;

    for (type in ltypes) {
      ltype = ltypes[type];
      if (!ltype.pattern) continue;
      ltype.material = createDashedLineShader(ltype.pattern);
    }
  }

  function createDashedLineShader(pattern) {
    let i;
    let dashedLineShader = {};
    let totalLength = 0.0;

    for (i = 0; i < pattern.length; i++) {
      totalLength += Math.abs(pattern[i]);
    }

    dashedLineShader.uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib['common'],
      THREE.UniformsLib['fog'],

      {
        pattern: { type: 'fv1', value: pattern },
        patternLength: { type: 'f', value: totalLength }
      }
    ]);

    dashedLineShader.vertexShader = [
      'attribute float lineDistance;',

      'varying float vLineDistance;',

      THREE.ShaderChunk['color_pars_vertex'],

      'void main() {',

      THREE.ShaderChunk['color_vertex'],

      'vLineDistance = lineDistance;',

      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

      '}'
    ].join('\n');

    dashedLineShader.fragmentShader = [
      'uniform vec3 diffuse;',
      'uniform float opacity;',

      'uniform float pattern[' + pattern.length + '];',
      'uniform float patternLength;',

      'varying float vLineDistance;',

      THREE.ShaderChunk['color_pars_fragment'],
      THREE.ShaderChunk['fog_pars_fragment'],

      'void main() {',

      'float pos = mod(vLineDistance, patternLength);',

      'for ( int i = 0; i < ' + pattern.length + '; i++ ) {',
      'pos = pos - abs(pattern[i]);',
      'if( pos < 0.0 ) {',
      'if( pattern[i] > 0.0 ) {',
      'gl_FragColor = vec4(1.0, 0.0, 0.0, opacity );',
      'break;',
      '}',
      'discard;',
      '}',

      '}',

      THREE.ShaderChunk['color_fragment'],
      THREE.ShaderChunk['fog_fragment'],

      '}'
    ].join('\n');

    return dashedLineShader;
  }

  this.getScene = () => scene;
  this.setScene = newScene => {
    scene = newScene;
    this.render();
  };
  this.getCamera = () => camera;
  this.getRenderer = () => renderer;
  this.getLayers = () => layersEntity;
  this.getObjects = () => objectsEntity;
  this.getHelpLayer = () => helpLayer;
  this.getNewLineLayer = () => newLineLayer;
}
