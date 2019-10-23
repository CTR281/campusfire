import React from 'react';
import io from 'socket.io-client';
import logo from '../Assets/cfwhite.png';
import '../App.css';
import PostIt from './PostIt';
import Pointer from './Pointer';

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

class Display extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: null,
      clients: [],
      qr_path:'/qr',
      texts: [],
      cursor:[{ x: 0, y: 0 }, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}],
      keyChecked: false,
    };
  }

  componentDidMount() {
    const { match: { params: { key } } } = this.props;
    this.checkKey(key);
    const socket = io();
    socket.emit('display');

    socket.on('reload_qr', () => {
      this.setState({qr_path: this.state.qr_path + "?" + Date.now()});
    });

    socket.on('clientKey', (data) => {
      let clientsInfo = {clientKey : data.clientKey, clientId: data.clientId};
      this.state.clients.push(clientsInfo);
    });

    socket.on('data', (data) => {
      if (data.length === 3) {
        this.moveCursor(data);
      }
    });
    socket.on('posting', (content) => {
      const { texts } = this.state;
      texts.push(content);
      this.setState({
        texts,
      });
    });
    socket.on('remote_click', () => {
      const { cursor: { x, y } } = this.state;
      const {
        left, right, top, bottom,
      } = document.getElementById('post').getBoundingClientRect();
      if (x > left && x < right && y > top && y < bottom) {
        socket.emit('start_posting');
      }
    });
  }

  moveCursor(data) {
    console.log(data);
    const displacement = data[1] * 0.2;
    const dx = displacement * Math.cos(data[0]);
    const dy = -displacement * Math.sin(data[0]);
    let i = this.findKey(data[2]);
    const {cursor} = this.state;
    cursor[i].x += dx;
    cursor[i].y += dy;
    this.setState({
      cursor,
    });
    const {
      left, right, top, bottom,
    } = document.getElementById('root').getBoundingClientRect();
    const { cursor: { x, y } } = this.state;
    if (x<left){
      this.setState({cursor:{x: right, y}});
    }
    if (x>right){
      this.setState({cursor:{x: left, y}});
    }
    if (y<top){
      this.setState({cursor:{x, y: bottom}});
    }
    if (y>bottom){
      this.setState({cursor:{x, y: top}});
    }
  }

  checkKey(key) {
    fetch(`/display/${key}`)
      .then((resp) => {
        resp.text()
          .then((txt) => {
            if (txt === 'ok') {
              this.setState({ keyChecked: true });
            } else {
              this.setState({ keyChecked: false });
            }
          })
          .catch(() => {
            this.setState({ keyChecked: false });
          });
      });
  }

  findKey(id){
    const {clients} = this.state;
    for (let i=0; i<clients.length; i++){
      if (clients[i].clientId === id){
        return i;
      }
    }
    return null;
  }

  render() {
    const { texts, cursor: { x, y }, keyChecked, qr_path} = this.state;
    const postits = texts.map((text) => <PostIt key = {text} id={text} text={text} />);
    return (
      keyChecked
        ? (
          <div className="Display">
            <header>
              <img src={logo} className="Display-logo" alt="logo" />
              <div id="post" className="post" >Poster</div>
            </header>
            {postits}
            <Pointer id="pointer" color="red" x={x} y={y} />

            <footer>
                <img src={qr_path} alt="" className="qr" />
            </footer>
          </div>
        ) : (
          <div className="Display" />
        )
    );
  }
}

export default Display;
