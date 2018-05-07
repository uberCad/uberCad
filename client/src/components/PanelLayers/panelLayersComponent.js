import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelLayers.css'
import sceneService from '../../services/sceneService'

export default class PanelLayersComponent extends Component {
  onChangeVisible = ({currentTarget: {checked, dataset: {id}}}) => {
    const {scene} = this.props.editor
    if (scene) {
      let layer = scene.getObjectById(parseInt(id, 10))
      this.props.toggleVisible(layer, checked, this.props.editor)
    }
  }

  showAll = () => {
    this.props.showAll(this.props.editor)
  }

  shouldComponentUpdate (nextProps) {
    return (this.props.editor.scene !== nextProps.editor.scene) ||
      (nextProps.editor.scene && nextProps.editor.scene.children !== this.props.editor.scene.children)
  }

  render () {
    console.debug('render:', this)

    const {scene} = this.props.editor
    let layers
    if (scene) {
      layers = sceneService.getLayers(scene)
    }

    return (
      <div id='panel-layers'>
        <div className='content'>
          {layers
            ? layers.children.filter(layer => layer.children.length).map((layer, idx) => (
              <div className='item'
                key={idx}
              >
                <input type='checkbox' data-id={layer.id}
                  title='Visibility'
                  checked={layer.visible}
                  onChange={this.onChangeVisible}
                />
                {layer.name}
                <span>{layer.children.length}</span>
              </div>
            ))
            : (
              <span>No layers</span>
            )
          }
        </div>
        <div className='toolbar'>
          {/* {activeEntities.length > 1 && ( */}
          {/* <button onClick={this.groupEntities} */}
          {/* className="group" */}
          {/* title="Group to object" */}
          {/* /> */}
          {/* )} */}
          <button onClick={this.showAll}
            className='show-all'
            title='Show all'
          />
        </div>
      </div>
    )
  }

  static propTypes = {
    editor: PropTypes.shape({
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object
    })
  }
}
