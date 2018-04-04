import {spinnerShow, spinnerHide} from './spinner'

export const FETCH_PROJECTS_BEGIN = 'FETCH_PROJECTS_BEGIN';
export const FETCH_PROJECTS_SUCCESS = 'FETCH_PROJECTS_SUCCESS';
export const FETCH_PROJECTS_FAILURE = 'FETCH_PROJECTS_FAILURE';


export const fetchProjectsBegin = () => {
    console.log('fetchProjectsBegin()')
    return {
        type: FETCH_PROJECTS_BEGIN
    }
}

export const fetchProjectsSuccess = items => {
    console.error('fetchProjectsSuccess()', items)
    return {
        type: FETCH_PROJECTS_SUCCESS,
        payload: {items}
    }
}

export const fetchProjectsError = error => {
    console.log('fetchProjectsError()', error)
    return {
        type: FETCH_PROJECTS_FAILURE,
        payload: {error}
    }
}

export function fetchProjects() {
    return dispatch => {
        dispatch(spinnerShow());
        dispatch(fetchProjectsBegin());
        return fetch("/api/projects")
            .then(handleErrors)
            .then(res => res.json())
            .then(json => {
                dispatch(fetchProjectsSuccess(json.projects));
                dispatch(spinnerHide());
                return json.projects;
            })
            .catch(error => {
                dispatch(fetchProjectsError(error))
                dispatch(spinnerHide());
            });
    };
}

// Handle HTTP errors since fetch won't.
function handleErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
