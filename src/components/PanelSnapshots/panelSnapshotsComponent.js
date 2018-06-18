import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './PanelSnapshots.css'
import { Button, Modal, Form, FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import { FormattedMessage } from 'react-intl'

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
          {snapshots.length ? snapshots.map(snapshot => (
            <div className='item' key={snapshot._key} data-key={snapshot._key}
              onClick={this.loadSnapshot}>{snapshot.title}
              <button className='un-select' data-key={snapshot._key} onClick={this.deleteSnapshot} />
            </div>))
            : (<FormattedMessage id='panelSnapshots.noSnapshot' defaultMessage='No snapshot' />)
          }
        </div>
        <div className='toolbar'>
          <FormattedMessage id='panelSnapshots.btnTitleAdd' defaultMessage='Add snapshot'>
            {value =>
              <button onClick={this.handleShow} className='add' title={value} />
            }
          </FormattedMessage>
        </div>
        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <FormattedMessage id='panelSnapshots.modal.title' defaultMessage='Add new snapshot'>
              {value => <Modal.Title>{value}</Modal.Title>}
            </FormattedMessage>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <FormGroup controlId='formControlsText'>
                <FormattedMessage id='panelSnapshots.modal.inputLabel' defaultMessage='Snapshot title'>
                  {value => <ControlLabel>{value}</ControlLabel>}
                </FormattedMessage>
                <FormattedMessage id='panelSnapshots.modal.inputPlaceholder' defaultMessage='Enter title'>
                  {value =>
                    <FormControl
                      type='text'
                      name='title'
                      autoFocus
                      placeholder={value}
                      onChange={this.handleChange} />
                  }
                </FormattedMessage>
              </FormGroup>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <FormattedMessage id='btn.save' defaultMessage='Save'>
              {value => <Button onClick={this.addSnapshot}>{value}</Button>}
            </FormattedMessage>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

  static propTypes = {
    lang: PropTypes.string.isRequired,
    project: PropTypes.object.isRequired,
    scene: PropTypes.object,
    cadCanvas: PropTypes.object,
    addSnapshot: PropTypes.func.isRequired,
    deleteSnapshot: PropTypes.func.isRequired,
    loadSnapshot: PropTypes.func.isRequired
  }
}
