import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './Selection.css';

export default class SelectionComponent extends Component {
  onMouseMove = event => {
    if (this.props.active) {
      this.props.onMouseMove(event, this.props.editor);
    }
  };

  render() {
    let { style } = this.props;

    return <div id="selection" onMouseMove={this.onMouseMove} style={style} />;
  }

  static propTypes = {
    active: PropTypes.bool.isRequired,
    style: PropTypes.shape({
      left: PropTypes.number.isRequired,
      top: PropTypes.number.isRequired,
      width: PropTypes.number.isRequired,
      height: PropTypes.number.isRequired,
      display: PropTypes.string.isRequired
    }),
    onMouseMove: PropTypes.func,
    editor: PropTypes.object
  };
}
