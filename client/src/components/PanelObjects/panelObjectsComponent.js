import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelObjects.css'
import sceneService from '../../services/sceneService'

export default class PanelObjectsComponent extends Component {
  onChangeVisible = ({currentTarget: {checked, dataset: {id}}}) => {
    const {scene} = this.props.editor
    if (scene) {
      let layer = scene.getObjectById(parseInt(id, 10))
      this.props.toggleVisible(layer, checked, this.props.editor)
    }
  }

  combineEdgeModels = () => {
    this.props.combineEdgeModels(this.props.editor)
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
    let objects
    if (scene) {
      objects = sceneService.getObjects(scene)
    }

    return (
      <div id='panel-layers'>
        <div className='content'>
          {objects
            ? objects.children.map((object, idx) => (
              <div className='item'
                key={idx}
              >
                <input type='checkbox' data-id={object.id}
                  title='Visibility'
                  checked={object.visible}
                  onChange={this.onChangeVisible}
                />
                {object.name}
                <span>{object.children.length}</span>
              </div>
            ))
            : (
              <span>No objects</span>
            )
          }
        </div>
        <div className='toolbar'>
          {objects && objects.children.length > 1 && (
            <button onClick={this.combineEdgeModels}
              className='combine'
              title='Combine edge models'
            />
          )}
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
