import React, {Component} from 'react'

export default class Home extends Component {
  constructor (props) {
    super(props)

    this.state = {
      users: []
    }
  }

  componentDidMount () {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        this.setState({
          users: data.users
        })
      })
  }

  render () {
    return (
      <div>
        <h3>Hello</h3>
        <p>users from our server</p>
        <ul>
          {
            this.state.users.map(user => (
              <li key={user.id}>{user.username}</li>
            ))
          }
        </ul>
      </div>
    )
  }
}
