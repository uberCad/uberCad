import update from 'immutability-helper';

import {
  PROJECT_FETCH_BEGIN,
  PROJECT_FETCH_SUCCESS,
  PROJECT_FETCH_FAILURE,
  PROJECT_RENAME,
  PROJECT_RENAME_SAVE,
  PROJECT_SNAPSHOT_RENAME,
  PROJECT_SNAPSHOT_RENAME_SAVE,
  PROJECT_ARCHIVE
} from '../actions/project';

import { SNAPSHOT_ADD, SNAPSHOT_DELETE } from '../actions/panelSnapshots';

let initialState = {
  loading: false,
  id: null,
  project: null,
  error: null,
  lastUpdated: null
};

const project = (state = initialState, action) => {
  switch (action.type) {
    case PROJECT_ARCHIVE:
      return update(state, {
        project: {
          status: { $set: action.payload.status }
        }
      });
    case PROJECT_SNAPSHOT_RENAME_SAVE:
      return update(state, {
        project: {
          snapshots: { $merge: action.payload.snapshot }
        }
      });
    case PROJECT_SNAPSHOT_RENAME:
      return update(state, {
        project: {
          snapshots: { $merge: action.payload.snapshot }
        }
      });

    case PROJECT_RENAME_SAVE:
      return update(state, {
        project: {
          title: { $set: action.payload.title }
        }
      });
    case PROJECT_RENAME:
      return update(state, {
        project: {
          title: { $set: action.payload.title }
        }
      });

    case SNAPSHOT_ADD:
      return update(state, {
        project: {
          snapshots: { $push: [action.payload.snapshot] }
        }
      });
    case SNAPSHOT_DELETE: {
      let index;
      state.project.snapshots.forEach((item, i) => {
        if (item._key === action.payload.snapshotKey) {
          index = i;
        }
      });
      return update(state, {
        project: {
          snapshots: { $splice: [[index, 1]] }
        }
      });
    }
    case PROJECT_FETCH_BEGIN: {
      let preloadedProject = action.payload.preloadedProject;

      return {
        ...state,
        id: action.payload.id,
        loading: true,
        ...(preloadedProject && { project: preloadedProject })
      };
    }
    case PROJECT_FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        project: action.payload.project,
        lastUpdated: action.payload.receivedAt
      };
    case PROJECT_FETCH_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload.error
      };
    default:
      return state;
  }
};

export default project;
