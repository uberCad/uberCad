import React, { Component } from 'react'
import './PanelInfo.css'
import PropTypes from 'prop-types'
import GeometryUtils from '../../services/GeometryUtils'
import { MEASUREMENT_ANGLE, MEASUREMENT_LINE, MEASUREMENT_POINT } from '../../actions/measurement'

export default class PanelInfoComponent extends Component {
  getInfo = () => {
    let object = this.props.activeObject
    if (object.id) {
      const geometry = GeometryUtils.getObjectInfo(object)
      let data = {
        area: geometry[0].region.area,
        height: geometry[0].region.height,
        width: geometry[0].region.width,
        type: geometry.length > 1 ? 2 : 1,
        weight: object.userData.material ? object.userData.material.density * geometry[0].region.area / 1000000 : null
      }
      this.props.activeObject.userData.info = data
      return data
    }
  }

  render () {
    const {selectMode, measurement} = this.props
    const object = this.props.activeObject
    let info
    if (object && object.name) {
      info = (object.userData && object.userData.info) ? object.userData.info : this.getInfo()
    }
    return (
      <div id='panel-info'>
        {(object && object.name) ? (
          <div className='content'>
            <h5>Title: {object.name}</h5>

            <div>Material: {object.userData.material ? object.userData.material.name
              : <span className='warning'>No set meterial for this object.</span>}</div>

            {object.userData.info && (
              <div>
                <div>Width: {info.width.toFixed(4)} mm</div>
                <div>Height: {info.height.toFixed(4)} mm</div>
                <div>Area: {info.area.toFixed(4)} mm2</div>
                <div>
                  Weight: {info.weight ? info.weight.toFixed(4)
                  : <span className='warning'>Set material first and calculate Weight(Price)</span>} kg/m
                </div>
                <div>Type: {info.type}</div>
              </div>
            )}

          </div>) : null
        }

        {selectMode === MEASUREMENT_POINT && <div>
          <h4>Measurement point</h4>
          <p>X: {measurement.point ? measurement.point.x : 'Chose point'}</p>
          <p>Y: {measurement.point ? measurement.point.y : 'Chose point'}</p>
        </div>}

        {selectMode === MEASUREMENT_LINE && <div>
          <h4>Measurement line</h4>
          {measurement.line.first ?
            <p>
              <b>X1</b>: {measurement.line.first.x.toFixed(5)}&nbsp;
              <b>Y1</b>: {measurement.line.first.y.toFixed(5)}
            </p>
            : <p>Chose first point</p>}

          {measurement.line.second ?
            <p>
              <b>X2</b>: {measurement.line.second.x.toFixed(5)}&nbsp;
              <b>Y2</b>: {measurement.line.second.y.toFixed(5)}
            </p>
            : <p>Chose second point</p>}

          {measurement.line.distance ?
            <p>
              <b>Distance</b>: {measurement.line.distance.toFixed(5)}
            </p>
            : null}

        </div>}

        {selectMode === MEASUREMENT_ANGLE && <div>
          <h4>Measurement angle</h4>
          {(measurement.angle.firstLine && measurement.angle.firstLine.id) ?
            <p>First:&nbsp;
              <b>id: </b>: {measurement.angle.firstLine.id}&nbsp;
              <b>Parent:</b>: {measurement.angle.firstLine.parent.name}
            </p>
            : <p>Chose first line</p>}

          {(measurement.angle.secondLine && measurement.angle.secondLine.id)  ?
            <p>Second:&nbsp;
              <b>id: </b>: {measurement.angle.secondLine.id}&nbsp;
              <b>Parent:</b>: {measurement.angle.secondLine.parent.name}
            </p>
            : <p>Chose second line</p>}

          {(measurement.angle.angleValue || measurement.angle.angleValue === 0) ?
            <p>
              <b>Angle: </b>{measurement.angle.angleValue.toFixed(5)} degree
            </p>
            : null}
        </div>}

      </div>)
  }

  static propTypes = {
    activeObject: PropTypes.object,
    measurement: PropTypes.object,
    selectMode: PropTypes.string
  }
}
