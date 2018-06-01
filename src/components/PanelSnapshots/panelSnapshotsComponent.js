import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelSnapshots.css'
import { Button, Modal, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap'

export default class PanelSnapshotsComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      title: '',
      show: false
    }
  }

  handleClose = () => {
    this.setState({show: false})
  }

  handleShow = () => {
    this.setState({show: true})
  }

  handleChange = (event) => {
    const name = event.target.name
    this.setState({[name]: event.target.value})
  }

  addSnapshot = () => {
    const snapshot = {
      title: this.state.title,
      scene: this.props.scene
    }
    this.props.addSnapshot(snapshot, this.props.project._key)
    this.handleClose()
  }

  loadSnapshot = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {key}}} = event
    this.props.loadSnapshot(key, this.props.cadCanvas)
  }

  deleteSnapshot = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {key}}} = event
    this.props.deleteSnapshot(key)
  }

  render () {
    const snapshots = this.props.project.snapshots

    return (
      <div id='snapshots'>
        <div className='content'>
          {snapshots ? snapshots.map(snapshot => (
              <div className='item' key={snapshot._key} data-key={snapshot._key} onClick={this.loadSnapshot}>{snapshot.title}
                <button className='un-select' data-key={snapshot._key} onClick={this.deleteSnapshot} />
              </div>)) :
            <div>No snapshot </div>}
        </div>

        <Button onClick={this.handleShow}>add snapshot</Button>

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Add new snapshot</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <FormGroup controlId="formControlsText">
                <ControlLabel>Snapshot title</ControlLabel>
                <FormControl
                  type="text"
                  name="title"
                  autoFocus
                  placeholder="Enter title"
                  onChange={this.handleChange}/>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.addSnapshot}>Save</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

  // static propTypes = {
  //   editor: PropTypes.shape({
  //     scene: PropTypes.object,
  //     camera: PropTypes.object,
  //     renderer: PropTypes.object
  //   })
  // }
}
