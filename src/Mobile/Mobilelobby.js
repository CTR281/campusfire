import '../App.css'

import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import Mobile from './Mobile'
import QrReader from 'react-qr-reader'

class Mobilelobby extends Component {
    state = {
        result: 'No result',
        redirect: false
    }

    setRedirect = () => {
        this.setState({
            redirect: true
        })
    }

    renderRedirect = () => {
        if (this.state.redirect) {
            return <Redirect to = {this.state.result}/>
        }
    }
    handleScan = data => {
        if (data) {
            this.setState({
                result: data
            })
            this.setRedirect();
        }

    }
    handleError = err => {
        console.error(err)
    }
    render() {
        return (
            <div>
                {this.renderRedirect()}
                <header>
                    Veuillez scanner le QR code de la borne
                </header>
                <QrReader
                    delay={300}
                    onError={this.handleError}
                    onScan={this.handleScan}
                    style={{ width: '100%' }}
                />
                <p>{this.state.result}</p>
            </div>
        )
    }
}

export default Mobilelobby;