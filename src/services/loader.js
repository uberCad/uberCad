import * as THREE from '../extend/THREE';

const load = () => {};

const save = (container) => {
    return {
        title: "cad loader",
        version: 1,
        data: {
            layers: [

            ],
            objects: [

            ]
        }
    }
};

export {
    load,
    save
}