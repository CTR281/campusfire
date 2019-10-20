import React, { Component } from 'react';
import ReactNipple from 'react-nipple';
import io from 'socket.io-client';
import logo from '../Assets/logo.svg';
import hax from '../Assets/hax.jpg';
import kek from '../Assets/kek.mp3';
import '../App.css';

function checkKey(key, component) {
  fetch(`/mobile/${key}`)
      .then((resp) => {
        resp.text()
            .then((txt) => {
              console.log(txt);
              component.state.init = txt === 'ok';
              console.log(component.state.init);
            })
      });
}

class Mobile extends Component {
  constructor() {
    super();
    this.state = {
      socket: null,
      init: false
    };

    this.handleMove = this.handleMove.bind(this);
  }

  componentDidMount() {
    const { match } = this.props;
    const { params: { key } } = match;
    fetch(`/mobile/${key}`)
        .then((resp) => {
          resp.text()
              .then((txt) => {
                this.state.init = txt === 'ok';
                if (match && this.state.init) {
                  const socket = io();
                  this.setState({
                    socket,
                  });
                }
              })
        });
  }

  handleMove(event, data) {
    const { socket } = this.state;
    if (socket) {
      socket.emit('move', [data.angle.radian, data.distance]);
    }
  }

  render() {
    if (this.state.init) {
      return (
          <div className="Display">
            <header>
              <img src={logo} className="Display-logo" alt="logo"/>
            </header>
            <ReactNipple
                option={{mode: 'dynamic'}}
                style={{
                  flex: '1 1 auto',
                  position: 'relative',
                }}
                onMove={this.handleMove}
            />
          </div>
      );
    }
    else {
      return (
          <div className="Mobile">
            <img src={hax} className = "hax"/>
              <audio autoPlay>
              <source src={kek} type="audio/mp3"/>

                  </audio>
          </div>
      )
    }
  }
}


export default Mobile;
