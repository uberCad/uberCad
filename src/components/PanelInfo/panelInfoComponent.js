import React, { Component } from 'react'
import './PanelInfo.css'
import PropTypes from 'prop-types'
import GeometryUtils from '../../services/GeometryUtils'

export default class PanelInfoComponent extends Component {
  getInfo = () => {
    let object = this.props.editObject
    if (object.id) {
      const geometry = GeometryUtils.getObjectInfo(this.props.editObject)
      let data = {
        area: geometry[0].region.area,
        height: geometry[0].region.height,
        width: geometry[0].region.width,
        type: geometry.length > 1 ? 2 : 1,
        weight: object.userData.material ? object.userData.material.density * geometry[0].region.area / 1000000 : null
      }
      this.props.editObject.userData.info = data
      return data
    }
  }

  render () {
    const editObject = this.props.editObject
    const info = (editObject.userData && editObject.userData.info) ? editObject.userData.info : this.getInfo()
    return (
      <div id='panel-info'>
        {editObject.name ?
          <div className='content'>
            <h5>Title: {this.props.editObject.name}</h5>

            <div>Material: {editObject.userData.material ? editObject.userData.material.name
              : <span className='warning'>No set meterial for this object.</span>}</div>

            {editObject.userData.info && (
              <div>
                <div>Width: {info.width.toFixed(4)} mm</div>
                <div>Height: {info.height.toFixed(4)} mm</div>
                <div>Area: {info.area.toFixed(4)} mm2</div>
                <div>
                  Weight: {info.weight ? info.weight.toFixed(4)
                    : <span className='warning'>Set material first</span>} kg/m
                </div>
                <div>Type: {info.type}</div>
              </div>
            )}

          </div>
          : <div>No select object</div>
        }
      </div>
    )
  }

  static propTypes = {
    editObject: PropTypes.object
  }
}
