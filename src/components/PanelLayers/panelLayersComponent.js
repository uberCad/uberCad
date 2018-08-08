import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelLayers.css'
import sceneService from '../../services/sceneService'
import { FormattedMessage } from 'react-intl'

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

  // shouldComponentUpdate (nextProps) {
  //   return (this.props.editor.scene !== nextProps.editor.scene) ||
  //     (nextProps.editor.scene && nextProps.editor.scene.children !== this.props.editor.scene.children) ||
  //     (nextProps.activeLayer !== this.props.activeLayer)
  // }

  toggleLayer = event => {
    let {currentTarget: {dataset: {id}}} = event
    const {scene} = this.props.editor
    let layer = scene.getObjectById(parseInt(id, 10))
    console.log(layer)
    this.props.toggleLayer(this.props.editor, layer !== this.props.activeLayer ? layer : null)
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
              <div className={`item ${this.props.activeLayer === layer ? 'active' : ''}`}
                   key={idx}
                   data-id={layer.id}
                   onClick={this.toggleLayer}
              >
                <FormattedMessage id='panelLayer.checkboxVisibility' defaultMessage='Visibility'>
                  {value =>
                    <input type='checkbox' data-id={layer.id}
                           title={value}
                           checked={layer.visible}
                           onChange={this.onChangeVisible}
                    />
                  }
                </FormattedMessage>
                {layer.name}
                <span>{layer.children.length}</span>
              </div>
            ))
            : (
              <FormattedMessage id='panelLayer.noLayers' defaultMessage='No layers'/>
            )
          }
        </div>
        <div className='toolbar'>
          <FormattedMessage id='panelLayer.showAll' defaultMessage='Show all'>
            {value =>
              <button onClick={this.showAll}
                      className='show-all'
                      title={value}
              />
            }
          </FormattedMessage>

        </div>
      </div>
    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    editor: PropTypes.shape({
      scene: PropTypes.object,
      camera: PropTypes.object,
      renderer: PropTypes.object
    })
  }
}
