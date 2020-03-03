import * as THREE from '../extend/THREE';
import sceneService from "./sceneService";

export const load = () => {};

export const save = (container) => {
    return {
        title: "cad loader",
        version: 1,
        data: {
            layers: exportLayers(container),
            objects: exportObjects(container)
        },
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
            object,
            id: object.id,
            name: object.name,
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

                //TODO make deep copy of edgeModel, and override custom Path
                let a = {
                    regions: [],
                    svgData: {}
                };

                result[key] = userData[key];
            } break;
            // case 'material': {
            //     result[key] = userData[key];
            // } break;
            // case 'info': {
            //     result[key] = userData[key];
            // } break;

            default:
                result[key] = userData[key];
        }
    });

    return result;
}

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
        material: {
            color: exportColor(primitive.material.color)
        }
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