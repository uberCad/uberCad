import api from './apiService'

export default class snapshotService {
  static createSnapshot (snapshot, projectKey) {
    const scene = JSON.stringify(snapshot.scene.toJSON())
    const options = {
      data: {
        title: snapshot.title,
        scene
      }
    }
    return api.post(`/api/add-snapshot/${projectKey}`, options)
      .then(res => {
        return res
      })
  }

  static getSnapshots (projectKey) {
    return api.get(`/api/get-snapshots/${projectKey}`)
      .then(res => {
        console.log(res)
        return res
      })
  }

  static getSnapshotScene (snapshotKey) {
    return api.get(`/api/snapshot/${snapshotKey}`)
      .then(res => {
        console.log(res)
        return res.scene
      })
  }

  static delSnapshot (snapshotKey) {
    return api.get(`/api/del-snapshot/${snapshotKey}`)
      .then(res => {
        return res
      })
  }
}
