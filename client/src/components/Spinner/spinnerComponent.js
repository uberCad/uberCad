import React, { Component } from 'react'
import gif from './spinner.gif'

export default class SpinnerComponent extends Component {
    render () {
        const {active} = this.props
        return (
            <div id="spinner" style={{backgroundImage: `url('${gif}')`, display: active ? 'block' : 'none'}}/>
        )
    }
}