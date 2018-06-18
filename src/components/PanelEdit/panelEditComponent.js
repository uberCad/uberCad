import React, { Component } from 'react'
import './PanelEdit.css'
import PropTypes from 'prop-types'

// eslint-disable-next-line
import Worker from 'worker-loader!../../workers/worker.js'

export default class PanelEditComponent extends Component {

  newLine = () => {
    if (this.props.editMode.editObject.id) this.props.newLine()
  }

  cancelNewLine = () => {
    this.props.cancelNewLine(this.props.editor)
  }

  worker = () => {
    if (window.Worker) {
      console.log('worker works in this window...')
      const worker = new Worker()
      worker.postMessage({a: 4000})
      worker.onmessage = function (event) {}
      worker.addEventListener("message", function (event) {
        console.log('message from worker, event.data= ', event.data)
      })
      // worker.terminate()
    }
  }

  render () {
    const {activeLine, isNewLine, isNewCurve} = this.props.editMode
    return (
      <div id='panel-edit'>
        <div className='content'>
          <h5>Title: {this.props.editMode.editObject.name}</h5>
          <h5> Active line: {activeLine.uuid}</h5>
          {activeLine.geometry && (activeLine.geometry.type === 'CircleGeometry' &&
            <div>
              <div>radius: {activeLine.geometry.parameters.radius}</div>
              <div>thetaLength: {activeLine.geometry.parameters.thetaLength}</div>
              <div>thetaStart: {activeLine.geometry.parameters.thetaStart}</div>
            </div>)}
        </div>

        <div className='toolbar'>
          { !isNewLine ? <button className='new-line' title='New line' onClick={this.newLine} />
            : <button className='new-line active' title='Cancel new line' onClick={this.cancelNewLine} />
          }
          { !isNewCurve ? <button className='new-curve ' title='New curve' />
            : <button className='new-curve active' title='Cencel new curve' />
          }
          <button onClick={this.worker}>test worker</button>
        </div>
      </div>
    )
  }

  static propTypes = {
    editMode: PropTypes.object,
    editor: PropTypes.object
  }
}
