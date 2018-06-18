import React, { Component } from 'react'
import UserService from '../../services/UserService'
import { Row, Col, Button, Form, FormGroup, ControlLabel, Alert } from 'react-bootstrap'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'

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
              <FormattedMessage id='userLogin.title' defaultMessage='Log In'>
                {value => <h3>{value}</h3>}
              </FormattedMessage>

              <a href='https://github.com/login/oauth/authorize?scope=user:email&client_id=3b1d468a19661c8789c4'>
                <span className='fa fa-github' /> GitHub</a>
              <hr />
              <FormattedMessage id='userLogin.description' defaultMessage='Register Username & Password'>
                {value => <h5>{value}</h5>}
              </FormattedMessage>
              <FormGroup
                controlId='formBasicText'
                validationState={this.getValidationState()}
              >
                <div className='input-group-login'>
                  <FormattedMessage id='userLogin.labelUserName' defaultMessage='Username'>
                    {value => <ControlLabel className='label'>{value}</ControlLabel>}
                  </FormattedMessage>
                  <FormattedMessage id='userLogin.userNamePlaceholder' defaultMessage='Enter your username'>
                    {value =>
                      <input
                        id={'name'}
                        name='name'
                        className='input form-control'
                        type='text'
                        value={this.state.name}
                        placeholder={value}
                        onChange={this.handleChange}
                      />
                    }
                  </FormattedMessage>

                </div>
                <div className='input-group-login'>
                  <FormattedMessage id='userLogin.labelPassword' defaultMessage='Password'>
                    {value => <ControlLabel className='label'>{value}</ControlLabel>}
                  </FormattedMessage>
                  <FormattedMessage id='userLogin.passwordPlaceholder' defaultMessage='Enter your password'>
                    {value =>
                      <input
                        id='password'
                        name='password'
                        className='input form-control'
                        type='password'
                        value={this.state.password}
                        placeholder={value}
                        onChange={this.handleChange}
                      />
                    }
                  </FormattedMessage>
                </div>

                {this.state.errorMessage &&
                <Alert bsStyle='danger'>
                  <strong>Error!</strong> {this.state.errorMessage}
                </Alert>}

              </FormGroup>
              <FormattedMessage id='userLogin.btnSignIn' defaultMessage='Sign in ...'>
                {value => <Button onClick={this.authorize}>{value}</Button>}
              </FormattedMessage>
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

  static propTypes = {
    lang: PropTypes.string.isRequired,
    setUserName: PropTypes.func.isRequired,
    authorize: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired
  }
}
