import React, { Component } from 'react';
import './PanelEdit.css';
import PropTypes from 'prop-types';

export default class PanelEditComponent extends Component {
  newLine = () => {
    if (this.props.editMode.editObject.id) this.props.newLine();
  };

  cancelNewLine = () => {
    this.props.cancelNewLine(this.props.editor);
  };

  newCurve = () => {
    if (this.props.editMode.editObject.id) this.props.newCurve();
  };

  cancelNewCurve = () => {
    this.props.cancelNewCurve(this.props.editor);
  };

  deleteLine = () => {
    this.props.deleteLine(this.props.editor, this.props.editMode.activeLine);
  };

  clone = () => {
    this.props.cloneActive(true);
  };
  cancelClone = () => {
    this.props.cancelClone(
      this.props.editor,
      this.props.editMode.clone.cloneObject
    );
  };

  mirrorOx = () => {
    this.props.mirror(this.props.editMode.editObject, this.props.editor, 'OX');
  };

  mirrorOy = () => {
    this.props.mirror(this.props.editMode.editObject, this.props.editor, 'OY');
  };

  rotation = () => {
    this.props.rotationActive(
      this.props.editMode.rotation.active,
      this.props.editMode.editObject
    );
  };

  rotationSave = () => {
    this.props.rotationSave();
  };

  scale = () => {
    this.props.scaleActive(this.props.editMode.editObject);
  };

  scaleSave = () => {
    this.props.scaleSave();
  };

  render() {
    const { activeLine, isNewLine, isNewCurve } = this.props.editMode;
    const clone = this.props.editMode.clone.active;
    const move = this.props.editMode.move.active;
    const rotation = this.props.editMode.rotation.active;
    const scale = this.props.editMode.scale.active;
    const editObject = this.props.editMode.editObject;
    return (
      <div id="panel-edit">
        <div className="content">
          <h5>Title: {this.props.editMode.editObject.name}</h5>
          {activeLine.uuid && (
            <div className="line">
              Active line: {activeLine.uuid}
              <button
                className="del-line"
                onClick={this.deleteLine}
                title="Delete line"
              />
            </div>
          )}
          {activeLine.geometry &&
            activeLine.geometry.type === 'CircleGeometry' && (
              <div>
                <div>id: {activeLine.id}</div>
                <div>radius: {activeLine.geometry.parameters.radius}</div>
                <div>
                  thetaLength: {activeLine.geometry.parameters.thetaLength}
                </div>
                <div>
                  thetaStart: {activeLine.geometry.parameters.thetaStart}
                </div>
              </div>
            )}
        </div>

        {editObject.id && (
          <div className="toolbar">
            {!isNewLine ? (
              <button
                className="new-line"
                title="New line"
                onClick={this.newLine}
              />
            ) : (
              <button
                className="new-line active"
                title="Cancel new line"
                onClick={this.cancelNewLine}
              />
            )}
            {!isNewCurve ? (
              <button
                onClick={this.newCurve}
                className="new-curve "
                title="New curve"
              />
            ) : (
              <button
                onClick={this.cancelNewCurve}
                className="new-curve active"
                title="Cencel new curve"
              />
            )}
            {!clone ? (
              <button
                onClick={this.clone}
                className="clone"
                title="Clone object"
              />
            ) : (
              <button
                onClick={this.cancelClone}
                className="clone active"
                title="Cancel clone object"
              />
            )}
            {!move ? (
              <button
                onClick={() => {
                  this.props.moveActive(editObject);
                }}
                className="move"
                title="Move object"
              />
            ) : (
              <button
                onClick={() => {
                  this.props.cancelMove();
                }}
                className="move active"
                title="Cancel move object"
              />
            )}
            <button
              onClick={this.mirrorOx}
              className="mirror-h"
              title="Mirroring OX"
            />
            <button
              onClick={this.mirrorOy}
              className="mirror-v"
              title="Mirroring OY"
            />
            {!rotation ? (
              <button
                onClick={this.rotation}
                className="rotation"
                title="Rotation"
              />
            ) : (
              <button
                onClick={this.rotationSave}
                className="rotation active"
                title="Save rotation"
              />
            )}
            {!scale ? (
              <button onClick={this.scale} className="scale" title="Scale" />
            ) : (
              <button
                onClick={this.scaleSave}
                className="scale active"
                title="Save scale"
              />
            )}
          </div>
        )}
      </div>
    );
  }

  static propTypes = {
    editMode: PropTypes.object,
    editor: PropTypes.object,

    newLine: PropTypes.func,
    cancelNewLine: PropTypes.func,
    newCurve: PropTypes.func,
    cancelNewCurve: PropTypes.func,
    deleteLine: PropTypes.func,
    cancelClone: PropTypes.func,
    cloneActive: PropTypes.func,
    mirror: PropTypes.func,
    moveActive: PropTypes.func,
    cancelMove: PropTypes.func,
    rotationActive: PropTypes.func,
    rotationSave: PropTypes.func,
    scaleActive: PropTypes.func,
    scaleSave: PropTypes.func
  };
}
