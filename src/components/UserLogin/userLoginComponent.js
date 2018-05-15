import React, { Component } from 'react'
import UserService from '../../services/UserService'



import { Row, Col, Button, Form, FormGroup, ControlLabel, Alert } from 'react-bootstrap'

export default class UserLoginComponent extends Component {

  constructor (props) {
    super(props)
    this.state = {
      name: '',
      password: '',
      errorMessage: ''
    }
  }

  componentDidMount () {
    const sid = this.props.match.params.sid
    const userName = this.props.match.params.userName
    if (sid && userName) {
      UserService.updateSid(sid)
      this.props.setUserName(userName)
      this.props.history.push('/')
    }
  }

  authorize = () => {
    this.props.authorize(this.state.name, this.state.password, this.props.history)
      .then(res => {
        if (res) {
          this.setState({errorMessage: res})
        }
      })
  }

  logout = () => {
    console.log('this.props.history ', this.props.history)
    this.props.logout(this.props.history)
  }

  render () {

    return (
      <Row className='container'>
        <Form>
          <Row>
            <Col smOffset={4} sm={6}>
              <h3>Log In</h3>
              Via <a href='https://github.com/login/oauth/authorize?scope=user:email&client_id=3b1d468a19661c8789c4'>
                <span className='fa fa-github'> </span>GitHub</a>

                <h5>
                  Via register Username & Password
                </h5>
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
              <Button className='' onClick={this.authorize}>Sign in ...</Button>

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
    this.setState({[name]: value})
  }
}
