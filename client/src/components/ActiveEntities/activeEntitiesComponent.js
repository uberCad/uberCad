import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './ActiveEntities.css'

export default class ActiveEntitiesComponent extends Component {
  render () {
    const {activeEntities} = this.props

    console.log('activeEntities', activeEntities)

    return (
      <div id='activeEntities'>
        {activeEntities.map((entity, idx) => (
          <div className='active-entity' key={idx}>sdf</div>
        ))}
      </div>

    )
  }

  static propTypes = {
    activeEntities: PropTypes.array.isRequired
  }
}
