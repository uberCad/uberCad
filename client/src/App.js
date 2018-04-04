import React, {Component} from 'react'

import {Route, Switch, Redirect} from 'react-router-dom'
import Header from './components/Header/headerComponentContainer'
import Projects from './components/Projects/projectsListComponentContainer'

import Spinner from './components/Spinner/spinnerComponentContainer'
// import Home from './components/Home/Home'
// import Demo from './components/Demo/Demo'


import Counter from './components/Counter/counterComponentContainer'


class App extends Component {
  render () {
    return (
      <div className='uberCad'>
        <Header />
        <div className='content'>
          <Switch>
            <Route path='/' exact component={Projects} />
            <Route path='/demo' component={Counter} />
            <Route path='*' render={() => {
              return (
                <Redirect to='/' />
              )
            }}
            />
          </Switch>
        </div>
        <Spinner />
      </div>
    )
  }
}

export default App
