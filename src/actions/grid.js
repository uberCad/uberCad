import * as THREE from '../extend/THREE'

export const GRID_VIEW = 'GRID_VIEW'
export const GRID_STEP = 'GRID_STEP'

let createGrid = (step, scene) => {
  let geometry = new THREE.Geometry()
  let box = new THREE.BoxHelper(scene, 0xffff00)
  const centerX = Number((box.geometry.boundingSphere.center.x).toFixed(0))
  const centerY = Number((box.geometry.boundingSphere.center.y).toFixed(0))
  const radius = Number((box.geometry.boundingSphere.radius).toFixed(0))
  for (let i = centerX - 2 * radius; i <= 2 * radius + centerX; i += step) {
    for (let j = centerY - radius; j <= radius + centerY; j += step) {
      geometry.vertices.push(new THREE.Vector3(i, j, 0))
    }
  }
   let material = new THREE.PointsMaterial({size: 0.05, color: new THREE.Color(0x222222)})
  return new THREE.Points(geometry, material)
}

export const show = (editor, view, step) => {
  let {scene, camera, renderer} = editor
  let gridLayer = scene.getObjectByName('GridLayer')
  gridLayer.children = []
  if (!view) {
    gridLayer.add(createGrid(step, scene))
  }
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: GRID_VIEW,
      payload: {view: !view}
    })
  }
}

export const setStep = (editor, view, step) => {
  let {scene, camera, renderer} = editor
  step = Number(step)
  step = step <= 0 ? 1 : step
  let gridLayer = scene.getObjectByName('GridLayer')
  gridLayer.children = []
  if (view) {
    gridLayer.add(createGrid(step, scene))
  }
  renderer.render(scene, camera)
  return dispatch => {
    dispatch({
      type: GRID_STEP,
      payload: {step}
    })
  }
}
