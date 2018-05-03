export const SIDEBAR_TOGGLE = 'SIDEBAR_TOGGLE'
export const TOGGLE_TAB = 'TOGGLE_TAB'

export const toggleSidebar = (active, editor) => {
  return dispatch => {
    dispatch({
      type: SIDEBAR_TOGGLE,
      payload: {
        active
      }
    })

    if (editor) {
      setTimeout(() => {
        try {
          let container = editor.renderer.domElement.parentNode
          let width = container.clientWidth
          let height = container.clientHeight
          editor.cadCanvas.resize(width, height)
        } catch (e) {}
      })
    }
  }
}

export const toggleTab = (panelIdx, tabIdx) => {
  return dispatch => {
    dispatch({
      type: TOGGLE_TAB,
      payload: {
        panelIdx,
        tabIdx
      }
    })
  }
}