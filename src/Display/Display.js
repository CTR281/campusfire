import React, { Component } from 'react';
import io from 'socket.io-client';
import logo from '../Assets/cfwhite.png';
import '../App.css';
import PostIt from './PostIt';
import Pointer from './Pointer';
import {toast, ToastContainer} from "react-toastify";
import { css } from 'glamor';

toast.configure();
const notify_in = () => toast("Someone just joined!");
const notify_out = () => toast("Someone logged out!");

class Display extends Component {

  constructor(props) {
    super(props);

    this.state = {
      texts: [],
      cursor: {},
      keyChecked: false,
      qr_path : '/qr',
      color: {'red':false, 'yellow':false, 'purple':false, 'pink':false},
      socket: null
    };
  }

  async componentDidMount() {
    const { match: { params: { key } } } = this.props;
    await this.checkKey(key);
    console.log(this.state.keyChecked);
    if (this.state.keyChecked) {
      //load from back
      let {texts} = this.state;
      const postits = await this.getText();
      postits.text.forEach(({id, content}) => {texts.push(content)});
      this.setState({texts});

      //socket
      const socket = io();
      this.socket = socket;

      socket.emit('display');

      socket.on('client_list', (clients) => {      //refresh cursors on page reloads
        let {cursor} = this.state;
        clients.forEach((client) => {
          if (client.clientId) {
            cursor[client.clientKey] = {x: 0, y: 0, color: this.pickColor()};
          }
        });
        this.setState({
          cursor,
        });
      });

      socket.on('data', (data) => {   //  to move cursor
        if (data.length === 3) {
          this.moveCursor(data);
        }
      });

      socket.on('displayCursor', (key) => {   //  to display cursor on user connection
        let {cursor} = this.state;
        if (key != null) {
          cursor[key] = {x: 0, y: 0, color: this.pickColor()};
          this.setState({
            cursor,
          });
          notify_in();
        }
        console.log(cursor);
      });

      socket.on('disconnect_user', (key) => {   //  removes cursor when user disconnects
        const {cursor} = this.state;
        if (cursor[key]) {
          this.state.color[cursor[key].color] = false;
          delete cursor[key];
          this.setState({cursor});
          notify_out();
        }
      });

      socket.on('reload_qr', () => {    //  reload qr on user connection
        let {qr_path} = this.state;
        qr_path += '?' + Date.now();
        this.setState({
              qr_path,
            }
        );
      });

      socket.on('posting', async (content) => {
        const {texts} = this.state;
        texts.push(content);   //   front
        await this.postText(content); //  back
        this.setState({
          texts,
        });
      });

      socket.on('remote_click', (data) => {
        const {x, y} = this.state.cursor[data.clientKey];
        const {
          left, right, top, bottom,
        } = document.getElementById('post').getBoundingClientRect();
        if (x > left && x < right && y > top && y < bottom) {
          socket.emit('start_posting', data.clientId);
        }
      });
    }
  }

  moveCursor(data) {
    const displacement = data[1] * 0.2;
    const key = data[2];
    console.log(key);
    const dx = displacement * Math.cos(data[0]);
    const dy = -displacement * Math.sin(data[0]);
    let {cursor} = this.state;
    let {x,y} = cursor[key];

    if (key !== null) {
      x += dx;
      y += dy;
    }
    const {
      left, right, top, bottom,
    } = document.getElementById('root').getBoundingClientRect();
    if (x<left || x>right){
      x -= dx;
    }
    if (y<top || y>bottom){
      y -= dy;
    }
    cursor[key].x = x;
    cursor[key].y = y;
    this.setState({
          cursor,
        }
    );
  }

  pickColor(){  // définir une couleur pour l'utilisateur qui dure jusqu'à ce qu'il se déconnecte
    const color = Object.entries(this.state.color); // [['red',false],...,['purple',false]]
    for (let i=0, len = color.length; i<len; ++i){
      if (color[i][1] === false){
        this.state.color[color[i][0]] = true;
        return color[i][0];
      }
    }
    return 'red'; // par défaut
  }

  getText(){
    return fetch('/postit.json', {
        method: 'GET',
        headers:{
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }).then((data) =>data.json())
          .then((object) => {
            return object;
          })
          .catch((err) =>  Promise.reject(err));
  }

  postText(content) {
    return fetch('/postit.json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({id:this.state.texts.length, content: content})
      }).then(res => {
        return res;
      })
        .then(res => console.log(res));
  };

checkKey(key) {
     return fetch(`/display/${key}`)
          .then((resp) => {
            return resp.text()
                .then((txt) => {
                  if (txt === 'ok') {
                    this.setState({keyChecked: true});
                  } else {
                    this.setState({keyChecked: false});
                  }
                })
                .catch((error) => {
                  this.setState({keyChecked: false});
                  return Promise.reject(Error(error.message))
                });
          });
      }

  render() {
    const { texts, cursor, keyChecked, qr_path } = this.state;
    //console.log(Object.entries(cursor));
    const postits = texts.map((text, index) => <PostIt id={`postit n ${index}`} text={text} />);
    const cursors = Object.entries(cursor).map(([key, object],index,cursor) => <Pointer key = {key} id={key} color={object.color} x={object.x} y={object.y} />);
    //console.log(cursors);
    return (
      keyChecked
        ? (
          <div className="Display">
            <header>
              <img src={logo} className="Display-logo" alt="logo" />
              <div id="post" className="post">Poster</div>
            </header>
            {postits}
            {cursors}
            <ToastContainer className='toast-container'
                            toastClassName="dark-toast"
                            progressClassName={css({
                              height: "2px"
                            })}/>
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
