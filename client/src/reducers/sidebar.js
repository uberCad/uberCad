import update from 'immutability-helper'

import {
  SIDEBAR_TOGGLE, TOGGLE_TAB
} from '../actions/sidebar'

let initialState = {
  active: true,
  panels: [
    [
      {
        title: 'Active entities',
        component: 'PanelActiveEntities',
        active: true
      },
      {
        title: 'Layers',
        component: 'PanelLayers',
        active: false
      },
    ],
    [
      {
        title: 'Objects',
        component: 'PanelObjects',
        active: false
      },
      {
        title: 'Edit',
        component: 'PanelEdit',
        active: false
      },
    ],
    [
      {
        title: 'Snapshots',
        component: 'PanelSnapshots',
        active: true
      },
    ]

  ]
}

const options = (state = initialState, action) => {
  switch (action.type) {
    case SIDEBAR_TOGGLE:
      return {
        ...state,
        active: action.payload.active
      }
    case TOGGLE_TAB:
      let active = false

      try {
        state.panels.forEach((panel, panelIdx )=> {
          panel.forEach((tab, tabIdx) => {
            if (panelIdx === action.payload.panelIdx) {
              if (tabIdx === action.payload.tabIdx) {
                tab.active = !tab.active
              } else {
                tab.active = false
              }
            }

            if (tab.active) {
              active = true
            }
          })
        })



        if (!state.active) {
          active = true
        }

      } catch (e) {}

      return update(state, {
        panels: {$set: [...state.panels]},
        active: {$set: active}
      })
    default:
      return state
  }
}

export default options
