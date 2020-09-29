import api from './apiService';

interface IObjectElement {
  title: string;
  parameters: string;
}
// TODO: create types for functions and responses
export default class snapshotService {
  static createSnapshot(snapshot: any, projectKey: string): Promise<any> {
    const layers = JSON.stringify(
      snapshot.scene.getObjectByName('Layers').toJSON()
    );
    const objects = snapshot.scene.getObjectByName('Objects');
    const objs: Array<IObjectElement> = [];
    objects.children.forEach((item: any) => {
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
    return api
      .post(`/snapshot/add/${projectKey}`, options)
      .catch(console.error);
  }

  static getSnapshotScene(snapshotKey: string): Promise<any> {
    return api
      .get(`/snapshot/${snapshotKey}`)
      .then(res => res)
      .catch(console.error);
  }

  static getObjectSnapshot(key: string): Promise<any> {
    return api
      .get(`/snapshot/object/${key}`)
      .then(res => res)
      .catch(console.error);
  }

  static delSnapshot(snapshotKey: string): Promise<any> {
    return api
      .delete(`/snapshot/${snapshotKey}`)
      .then(res => res)
      .catch(console.error);
  }
}
