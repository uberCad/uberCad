import React, {Component} from 'react'
import logo from './logo.svg'
import './App.css'
import {Link, Route, Switch, Redirect} from 'react-router-dom'
import Home from './components/Home/Home'
import Demo from './components/Demo/Demo'

import Counter from './components/Counter/counterComponentContainer'

class App extends Component {
  render () {
    return (
      <div className='App'>
        <header className='App-header'>
          <img src={logo} className='App-logo' alt='logo' />
          <nav>
            <Link to='/'>Home</Link>
            <Link to='/demo'>Demo</Link>
          </nav>
          <h1 className='App-title'>Welcome to React</h1>
        </header>
        <div>
          <Counter />
        </div>

        <div className='content'>
          <Switch>
            <Route path='/' exact component={Home} />
            <Route path='/demo' component={Demo} />
            <Route path='*' render={() => {
              return (
                <Redirect to='/' />
              )
            }}
            />
          </Switch>
        </div>
        <footer>
                    &copy; 2018 - GeekHub JS
        </footer>
      </div>
    )
  }
}

export default App
