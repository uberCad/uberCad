import update from 'immutability-helper'

import {
  SIDEBAR_TOGGLE, TOGGLE_TAB
} from '../actions/sidebar'
import { PANEL_OBJECTS_TOGGLE } from '../actions/panelObjects'
import { LOCALE_SET } from '../actions/locale'

let initialState = {
  active: true,
  activeObject: null,
  panels: [
    [
      {
        title_en: 'Active entities',
        title_ru: 'Выбраные сущности',
        title: 'Active entities',
        component: 'PanelActiveEntities',
        active: true
      },
      {
        title_en: 'Layers',
        title_ru: 'Слои',
        title: 'Layers',
        component: 'PanelLayers',
        active: false
      }
    ],
    [
      {
        title_en: 'Objects',
        title_ru: 'Объекты',
        title: 'Objects',
        component: 'PanelObjects',
        active: false
      },
      {
        title_en: 'Edit',
        title_ru: 'Редактирование',
        title: 'Edit',
        component: 'PanelEdit',
        active: false
      }
    ],
    [
      {
        title_en: 'Snapshots',
        title_ru: 'Снимки',
        title: 'Snapshots',
        component: 'PanelSnapshots',
        active: true
      }
    ]
  ]
}

const options = (state = initialState, action) => {
  switch (action.type) {
    case PANEL_OBJECTS_TOGGLE:
      return {
        ...state,
        activeObject: action.payload.activeObject
      }
    case SIDEBAR_TOGGLE:
      return {
        ...state,
        active: action.payload.active
      }

    case LOCALE_SET:
      state.panels.forEach(panel => {
        panel.forEach(tab => {
          tab.title = tab['title_' + action.payload.lang]
        })
      })
      return update(state, {
        panels: {$set: [...state.panels]}
      })
    case TOGGLE_TAB:
      let active = false

      try {
        state.panels.forEach((panel, panelIdx) => {
          panel.forEach((tab, tabIdx) => {
            if (panelIdx === action.payload.panelIdx) {
              if (tabIdx === action.payload.tabIdx) {
                tab.active = state.active ? !tab.active : true
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
