import React, {Component} from 'react'

import {Route, Switch, Redirect} from 'react-router-dom'
import Header from './components/Header/headerComponentContainer'
import Spinner from './components/Spinner/spinnerComponentContainer'

import Projects from './components/Projects/projectsComponentContainer'
import Project from './components/Project/projectComponentContainer'
import Cad from './components/Cad/cadComponentContainer'


class App extends Component {
  render () {
    return (
      <div className='uberCad'>
        <Header />
        <div className='content'>
          <Switch>
            <Route path='/' exact component={Projects} />
            <Route path='/project/:id' component={Project} />
            <Route path='/cad/:id' component={Cad} />
            {/*<Route path='/demo' component={Demo} />*/}
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
