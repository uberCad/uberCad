import React, { Component } from 'react'
// import PropTypes from 'prop-types'
import './Selection.css'

export default class SelectionComponent extends Component {
  onMouseMove = (event) => {
    if (this.props.active) {
      this.props.onMouseMove(event, this.props.editor)
    }
  }

  onMouseUp = (event) => {
    this.props.onMouseUp(event, this.props.editor)
  }

  render () {
    let {style} = this.props.editor.selection

    return (
      <div id='selection'
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
        style={style}
      />
    )
  }

  // static propTypes = {
  //   tool: PropTypes.string.isRequired,
  //   editMode: PropTypes.shape({
  //     isEdit: PropTypes.bool.isRequired
  //   }),
  //
  //   selectMode: PropTypes.string.isRequired,
  //   singleLayerSelect: PropTypes.bool.isRequired,
  //   threshold: PropTypes.number.isRequired
  // }
}
