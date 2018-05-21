import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, FormControl, Form, FormGroup, ListGroup } from 'react-bootstrap'
import './Material.css'

export default class MaterialComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      show: false,
      displayedMaterials: []
    }
  }

  componentDidMount () {
    this.setState({
      displayedMaterials: this.props.materials.slice(0, 10)
    })
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
    const searchQuery = event.target.value.toLowerCase()
    const displayedMaterials = this.props.materials.filter((el) => {
      const searchName = el.name.toLowerCase()
      return searchName.indexOf(searchQuery) !== -1
    })
    this.setState({
      displayedMaterials: displayedMaterials
    })
  }

  choose = (event) => {
    event.stopPropagation()
    let {currentTarget: {dataset: {idx}}} = event
    const scene = this.props.scene
    let object = scene.getObjectById(parseInt(this.props.objectId, 10))
    object.userData.material = this.state.displayedMaterials[idx]
    this.handleClose()
  }

  render () {

    const MaterialComponent = ({idx, name, density, lambda, epsilon, color}) => {
      let bgcolor = {backgroundColor: color.toString()}
      return (
        <li className="list-group-flush" data-idx={idx} onClick={this.choose}>
          <h4>{name}</h4>
          <span>Density: {density}</span>
          <span>Lambda: {lambda}</span>
          <span>Epsilon: {epsilon}</span>
          <span className="color" style={bgcolor}></span>
        </li>
      )
    }
    const materials = this.state.displayedMaterials

    return (
      <div className="material">

        <span onClick={this.handleShow}>Set material</span>

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
                />
                <FormControl.Feedback/>
              </FormGroup>
            </Form>

            <ListGroup componentClass="ul" className="materials-list">
              {materials &&
              materials.map((material, idx) =>
                <MaterialComponent key={material._key}
                                   name={material.name}
                                   density={material.density}
                                   lambda={material.lambda}
                                   epsilon={material.epsilon}
                                   color={material.color}
                                   idx={idx}
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
    objectId: PropTypes.number
  }
}
