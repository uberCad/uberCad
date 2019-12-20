import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  MEASUREMENT_ANGLE,
  MEASUREMENT_LINE,
  MEASUREMENT_POINT,
  MEASUREMENT_RADIAL
} from '../../../actions/measurement';
import './Measument.css';

export default class measurementComponent extends Component {
  onChangeMode = ({ currentTarget: { value } }) => {
    this.props.setSelectMode(value);
  };

  render() {
    const { measurementMode } = this.props;
    return (
      <div className="tools-measurement">
        <label>Measurement: </label>
        <label>
          <input
            type="radio"
            className="point"
            title="Point coordinate"
            value={MEASUREMENT_POINT}
            checked={measurementMode === MEASUREMENT_POINT}
            onChange={this.onChangeMode}
          />
        </label>
        <label>
          <input
            type="radio"
            className="line"
            title="Measurement line"
            value={MEASUREMENT_LINE}
            checked={measurementMode === MEASUREMENT_LINE}
            onChange={this.onChangeMode}
          />
        </label>
        <label>
          <input
            type="radio"
            className="radial"
            title="Measurement radial"
            value={MEASUREMENT_RADIAL}
            checked={measurementMode === MEASUREMENT_RADIAL}
            onChange={this.onChangeMode}
          />
        </label>
        <label>
          <input
            type="radio"
            className="angle"
            title="Measurement angle"
            value={MEASUREMENT_ANGLE}
            checked={measurementMode === MEASUREMENT_ANGLE}
            onChange={this.onChangeMode}
          />
        </label>
      </div>
    );
  }

  static propTypes = {
    measurementMode: PropTypes.string.isRequired,
    setSelectMode: PropTypes.func
  };
}
