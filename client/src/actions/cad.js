import DxfParser from 'dxf-parser'
import dxfService from './../services/dxfService'
import { spinnerShow, spinnerHide } from './spinner'

export const CAD_PARSE_DXF = 'CAD_PARSE_DXF'
export const CAD_DRAW_DXF = 'CAD_DRAW_DXF'


export const PROJECT_FETCH_BEGIN = 'PROJECT_FETCH_BEGIN'
export const PROJECT_FETCH_SUCCESS = 'PROJECT_FETCH_SUCCESS'
export const PROJECT_FETCH_FAILURE = 'PROJECT_FETCH_FAILURE'

export const drawDxf = (data, container) => {
  let cadCanvas = new dxfService.Viewer(data, container);
  let scene = cadCanvas.getScene();
  let camera = cadCanvas.getCamera();
  let renderer = cadCanvas.getRenderer();

  container.appendChild(renderer.domElement)

  return dispatch => dispatch({
    type: CAD_DRAW_DXF,
    payload: {
      scene,
      camera,
      renderer,
      cadCanvas
    }
  })
}






export const parseDxf = dxf => {
  let parser = new DxfParser()
  return dispatch => dispatch({
    type: CAD_PARSE_DXF,
    payload: {
      parsedData: parser.parseSync(dxf)
    }
  })
}

export const requestProject = (id, preloadedProject) => ({
  type: PROJECT_FETCH_BEGIN,
  payload: {id, preloadedProject}
})

export const receiveProject = (id, project) => {
  return {
    type: PROJECT_FETCH_SUCCESS,
    payload: {
      id,
      project,
      receivedAt: Date.now()
    }
  }
}

export const receiveProjectError = (id, error) => ({
  type: PROJECT_FETCH_FAILURE,
  payload: {
    id,
    error
  }
})

export const fetchDxf = (url, id, preloadedProject) => dispatch => {
  dispatch(spinnerShow())
  dispatch(requestProject(id, preloadedProject))
  return fetch(url)
    .then(handleErrors)
    .then(res => res.json())
    .then(json => {
      dispatch(spinnerHide())
      return dispatch(receiveProject(id, json.project))
    })
    .catch(error => {
      dispatch(receiveProjectError(id, error))
      dispatch(spinnerHide())
    })
}

// Handle HTTP errors since fetch won't.
function handleErrors (response) {
  if (!response.ok) {
    throw Error(response.statusText)
  }
  return response
}
