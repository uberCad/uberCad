import api from './apiService';

export default class snapshotService {
  static createSnapshot(snapshot, projectKey) {
    const layers = JSON.stringify(
      snapshot.scene.getObjectByName('Layers').toJSON()
    );
    const objects = snapshot.scene.getObjectByName('Objects');
    let objs = [];
    objects.children.forEach(item => {
      objs.push({
        title: item.name,
        parameters: JSON.stringify(item.toJSON())
      });
    });
    console.log('layers size', `${(layers.length / 1024).toFixed(2)} kb`);
    console.log(
      'objs size',
      `${(JSON.stringify(objs).length / 1024).toFixed(2)} kb`
    );
    const options = {
      data: {
        title: snapshot.title,
        objects: objs,
        layers
      }
    };
    return api.post(`/api/add-snapshot/${projectKey}`, options).then(res => {
      return res;
    });
  }

  static getSnapshots(projectKey) {
    return api.get(`/api/get-snapshots/${projectKey}`).then(res => {
      return res;
    });
  }

  static getSnapshotScene(snapshotKey) {
    return api.get(`/api/snapshot/${snapshotKey}`).then(res => {
      return res;
    });
  }

  static getObjectSnapshot(key) {
    return api.get(`/api/object-snapshot/${key}`).then(res => {
      return res;
    });
  }

  static delSnapshot(snapshotKey) {
    return api.delete(`/api/snapshot/${snapshotKey}`).then(res => {
      return res;
    });
  }
}
