import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelObjects.css'
import sceneService from '../../services/sceneService'
import MaterialComponent from '../Material/materrialComponentContainer'
import Calculate from '../CalculatePrice/calculatePriceComponentContainer'
import { FormattedMessage } from 'react-intl'

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
                <FormattedMessage id='panelObject.checkboxVisibility' defaultMessage='Visibility'>
                  {value =>
                    <input type='checkbox' data-id={object.id}
                      title={value}
                      checked={object.visible}
                      onChange={this.onChangeVisible}
                    />
                  }
                </FormattedMessage>

                {object.name}
                <span>{object.children.length}</span>
              </div>
            ))
            : (
              <FormattedMessage id='panelObject.noObjects' defaultMessage='No objects' />
            )
          }
        </div>
        <div className='toolbar'>
          {objects && objects.children.length > 1 && (
            <FormattedMessage id='panelObject.combineEdgeModels' defaultMessage='Combine edge models'>
              {value =>
                <button onClick={this.combineEdgeModels}
                  className='combine'
                  title={value}
                />
              }
            </FormattedMessage>
          )}
          <FormattedMessage id='panelObject.showAll' defaultMessage='Show all'>
            {value =>
              <button onClick={this.showAll}
                className='show-all'
                title={value}
              />
            }
          </FormattedMessage>
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
    lang: PropTypes.string.isRequired,
    editor: PropTypes.shape({
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object,
      isEdit: PropTypes.bool
    })
  }
}
