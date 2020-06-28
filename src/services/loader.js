import * as THREE from '../extend/THREE';
import sceneService from "./sceneService";
import arrayUtils from "./arrayUtils";

const CAD_LOADER = "cad loader";

export const parse = (data) => {
    console.log(data);

    if (data.title === CAD_LOADER) {
        //full drawing data

        //new scene

    } else {
        if (Array.isArray(data)) {
            //array of objects or layers
            return parseContainer(data);
        } else {
            return parseObject(data);
            //single object or layer
        }
    }
};

// Layers or Objects
const parseContainer = data => {
    let container = new THREE.Object3D();
    let type;
    data.forEach(child => {
        container.add(parseObject(child));
        type = child.type;
    });

    if (type) {
        container.name = type === "Layer" ? "Layers" : "Objects";
    }
    return container;
};

const parseObject = obj => {
    let container = new THREE.Object3D();
    container.name = obj.name;
    // container.id = obj.id;
    container.userData = obj.userData;
    obj.children.forEach(child => {
        container.add(parsePrimitive(child));
    });
    return container;
};

const parsePrimitive = primitive => {
    return primitive.type === "Arc" ? parseArc(primitive) : parseLine(primitive);
};

const parseArc = data => {
    //todo id/uuid
    //todo userData

    let geometry, material, circle;
    let color = new THREE.Color(data.color.r, data.color.g, data.color.b);

    geometry = new THREE.CircleGeometry(
        data.geometry.radius,
        32,
        data.geometry.thetaStart,
        data.geometry.thetaLength
    );
    geometry.vertices.shift();

    material = new THREE.LineBasicMaterial({ color });

    circle = new THREE.Line(geometry, material);
    circle.position.x = data.geometry.position.x;
    circle.position.y = data.geometry.position.y;
    circle.position.z = data.geometry.position.z;
    circle.name = data.name;
    return circle;
};

const parseLine = data => {
    //todo userData
    //todo id/uuid

    let geometry = new THREE.Geometry();
    let color = new THREE.Color(data.color.r, data.color.g, data.color.b);
    let material,
        vertex;

    for (let i = 0; i < data.geometry.vertices.length; i++) {
        vertex = data.geometry.vertices[i];
        geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, 0));
    }

    material = new THREE.LineBasicMaterial({ linewidth: 1, color: color });
    let line = new THREE.Line(geometry, material);
    line.name = data.name;
    return line;
};




export const serialize = (container) => {
    return {
        title: CAD_LOADER,
        version: 1,
        layers: exportLayers(container),
        objects: exportObjects(container),
        settings: {}
    }
};

const exportLayers = scene => {
    let result = [];
    let layers = sceneService.getLayers(scene).children;

    layers.forEach(layer => {
        result.push({
            id: layer.id,
            name: layer.name,
            type: 'Layer',
            userData: exportUserData(layer),
            children: layer.children.map(child => exportPrimitive(child))
        })
    });

    return result;
};

const exportObjects = scene => {
  let result = [];
    let objects = sceneService.getObjects(scene, true);

    objects.forEach(object => {
        result.push({
            id: object.id,
            name: object.name,
            type: 'Object',
            userData: exportUserData(object),
            children: object.children.map(child => exportPrimitive(child))
        })
    });

    return result;
};

const exportUserData = object => {
    let result = {};
    const { userData } = object;

    Object.keys(userData).forEach(key => {
        switch (key) {
            case 'edgeModel': {
                // There is Path obj in each region. Make JSON.stringify to convert paren line obj to id
                result[key] = JSON.parse(JSON.stringify(userData[key]));
                // or deep copy
            } break;
            default:
                result[key] = userData[key];
        }
    });

    return result;
};

// line or arc
const exportPrimitive = primitive => {
    const isArc = primitive.geometry instanceof THREE.CircleGeometry;

    let result = {
        id: primitive.id,
        name: primitive.name,
        type: (isArc ? "Arc" : "Line"),
        // children?
        userData: exportUserData(primitive),
        // geometry,
        color: exportColor(primitive.material.color)
    };

    if (isArc) {
        result.geometry = {
            position: exportVertex(primitive.position),
            radius: primitive.geometry.parameters.radius,
            thetaStart: primitive.geometry.parameters.thetaStart,
            thetaLength: primitive.geometry.parameters.thetaLength
        };
    } else {
        //line
        result.geometry = {
            vertices: primitive.geometry.vertices.map(vertex => exportVertex(vertex))
        }
    }

    return result;
};

const exportVertex = vertex => {
    return {...vertex};
};

const exportColor = color => {
    return {...color}
};