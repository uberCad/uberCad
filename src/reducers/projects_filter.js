// import update from 'immutability-helper'

import { PROJECTS_SELECT_FILTER } from '../actions/projects_filter';

const projectsFilter = (state = 'all', action) => {
  switch (action.type) {
    case PROJECTS_SELECT_FILTER:
      return action.payload.filter;
    default:
      return state;
  }
};

export default projectsFilter;
