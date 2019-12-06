import React, { Component } from 'react';
import gif from './spinner.gif';
import './Spinner.css';
import PropTypes from 'prop-types';

export default class SpinnerComponent extends Component {
  render() {
    const { active } = this.props;
    return (
      <div
        id="spinner"
        style={{
          backgroundImage: `url('${gif}')`,
          display: active ? 'block' : 'none'
        }}
      />
    );
  }

  static propTypes = {
    active: PropTypes.bool
  };
}
