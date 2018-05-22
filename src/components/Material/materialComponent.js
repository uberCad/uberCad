import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, FormControl, Form, FormGroup, ListGroup } from 'react-bootstrap'
import './Material.css'

export default class MaterialComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      show: false,
      searchQuery: ''
    }
  }

  handleClose = () => {
    this.setState({show: false})
  }

  handleShow = () => {
    this.setState({show: true})
    if (this.props.materials.length === 0) {
      this.props.loadMaterials()
    }
  }

  handleSearch = (event) => {
    this.setState({
      searchQuery: event.target.value.toLowerCase()
    })
  }

  choose = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {dbKey}}} = event
    const material = this.props.materials.find(item => item._key === dbKey)
    this.props.setMaterial(material, this.props.activeObject)
    this.handleClose()
  }

  render () {
    const MaterialComponent = ({dbKey, name, density, lambda, epsilon, color}) => {
      let bgcolor = {backgroundColor: color.toString()}
      return (
        <li className="list-group-flush" data-db-key={dbKey} onClick={this.choose}>
          <h4>{name}</h4>
          <span>Density: {density}</span>
          <span>Lambda: {lambda}</span>
          <span>Epsilon: {epsilon}</span>
          <span className="color" style={bgcolor}></span>
        </li>
      )
    }

    const {materials} = this.props

    return (
      <div className="material">

        <button onClick={this.handleShow} title='Set material' className='add-material' />

        <Modal show={this.state.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Choose material</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <FormGroup controlId="formControlsText">
                <FormControl
                  type="text"
                  name="title"
                  placeholder="Life search ..."
                  onChange={this.handleSearch}
                  autoFocus
                />
                <FormControl.Feedback/>
              </FormGroup>
            </Form>

            <ListGroup componentClass='ul' className='materials-list'>
              {materials &&
              materials.filter(material => {
                const searchName = `${material.name} ${material.density} ${material.epsilon} ${material.lambda}`.toLowerCase()

                return searchName.includes(this.state.searchQuery)
              }).slice(0, this.state.searchQuery ? 30 : 10).map((material) =>
                <MaterialComponent key={material._key}
                                   name={material.name}
                                   density={material.density}
                                   lambda={material.lambda}
                                   epsilon={material.epsilon}
                                   color={material.color}
                                   dbKey={material._key}
                />
              )}
            </ListGroup>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleClose}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }

  static propTypes = {
    scene: PropTypes.object,
    materials: PropTypes.array,
    activeObject: PropTypes.object
  }
}
