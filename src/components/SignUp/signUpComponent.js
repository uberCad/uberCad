import React, { Component } from 'react'
import { Row, Col, Button, Form, FormGroup, ControlLabel, Alert } from 'react-bootstrap'

export default class SignUpComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      name: '',
      password: '',
      errorMessage: ''
    }
  }

  register = () => {
    this.props.register({
        username: this.state.name,
        password: this.state.password
      },
      this.props.history
    )
      .then(res => {
        if (res) {
          this.setState({errorMessage: res})
        }
      })
  }

  render () {
    return (
      <Row className='container'>
        <Form>
          <Row>
            <Col smOffset={4} sm={6}>
              <h3>Sign Up</h3>
              <FormGroup
                controlId='formBasicText'
                validationState={this.getValidationState()}
              >
                <div className='input-group-login'>
                  <ControlLabel className='label'>Username</ControlLabel>
                  <input
                    id={'name'}
                    name='name'
                    className='input form-control'
                    type='text'
                    value={this.state.name}
                    placeholder='Enter your username'
                    onChange={this.handleChange}
                  />
                </div>
                <div className='input-group-login'>
                  <ControlLabel className='label'>Password</ControlLabel>
                  <input
                    id='password'
                    name='password'
                    className='input form-control'
                    type='password'
                    value={this.state.password}
                    placeholder='Enter your password'
                    onChange={this.handleChange}
                  />
                </div>

                {this.state.errorMessage &&
                  <Alert bsStyle="danger">
                    <strong>Error!</strong> {this.state.errorMessage}
                  </Alert>}

              </FormGroup>
              <Button className='' onClick={this.register}>Sign Up ...</Button>
            </Col>
          </Row>
        </Form>

      </Row>
    )
  }

  getValidationState () {
    const nameLength = this.state.name.length
    const passwordLength = this.state.password.length
    if ((nameLength < 1) || (passwordLength < 1)) {
      return 'error'
    }
    return null
  }

  handleChange = (event) => {
    const name = event.target.name
    const value = event.target.value
    this.setState({
      [name]: value
    })
  }
}
