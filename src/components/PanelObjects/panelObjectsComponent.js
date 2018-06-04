import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelObjects.css'
import sceneService from '../../services/sceneService'
import MaterialComponent from '../Material/materrialComponentContainer'
import Calculate from '../CalculatePrice/calculatePriceComponentContainer'

export default class PanelObjectsComponent extends Component {
  shouldComponentUpdate (nextProps) {
    return (this.props.editor.scene !== nextProps.editor.scene) ||
      (nextProps.editor.scene && nextProps.editor.scene.children !== this.props.editor.scene.children) ||
      (this.props.editor.isEdit !== nextProps.editor.isEdit) ||
      (this.props.activeObject !== nextProps.activeObject)
  }

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

  edit = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {id}}} = event
    const {scene} = this.props.editor
    if (scene) {
      let object = scene.getObjectById(parseInt(id, 10))
      this.props.isEdit(!this.props.editor.isEdit, this.props.editor, object)
    }
  }

  toggleObject = event => {
    let {currentTarget: {dataset: {id}}} = event
    const {scene} = this.props.editor
    let object = scene.getObjectById(parseInt(id, 10))
    this.props.toggleObject(object !== this.props.activeObject ? object : null)
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
              <div className={`item ${this.props.activeObject === object ? 'active' : ''}`}
                   key={idx}
                   data-id={object.id}
                   onClick={this.toggleObject}
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
          {this.props.activeObject && <MaterialComponent />}
          {this.props.activeObject &&
          (!this.props.editor.isEdit && <button onClick={this.edit} data-id={this.props.activeObject.id} className='btn-edit' />)
          }
          {objects && objects.children.length > 0 && <Calculate />}
        </div>
      </div>
    )
  }

  static propTypes = {
    editor: PropTypes.shape({
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object,
      isEdit: PropTypes.bool
    })
  }
}
