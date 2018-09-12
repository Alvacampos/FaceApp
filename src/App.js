import React, { Component } from 'react';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Signin from './components/SignIn/Signin';
import Register from './components/Register/Register';
import Particles from 'react-particles-js';
import Clarifai from 'clarifai';
import './App.css';

const app = new Clarifai.App ({
 apiKey: '2e7bae7495e84319bacbb395f125b6a1'
});

const particlesOptions = {
  particles: {
    number: {
      value: 150,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        password: '',
        entries: 0,
        joined: ''
      }
    }
  }

  componentDidMount() {
    fetch('http://localhost:3001')
      .then(response => response.json())
      .then(console.log)
  }

  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col*width,
      topRow: clarifaiFace.top_row*height,
      rightCol: width - (clarifaiFace.right_col*width),
      bottomRow: height - (clarifaiFace.bottom_row*height)
    }
  }

  loadUser = ( data ) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.pass,
      entries: data.entries,
      joined: data.joined
    }});
  }

  displayFaceBox = ( box ) => {
    console.log( box );
    this.setState({ box: box });
  }

  onInputChange = ( event ) => {
    this.setState({ input: event.target.value });
  }

  onButtonSubmit = () => {
    this.setState({ imageUrl: this.state.input } )
    app.models.predict(Clarifai.FACE_DETECT_MODEL, this.state.input)
      .then(response => {
        if(response){
          fetch('http://localhost:3001/image', {
            method: 'put',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
          .then(response => response.json())
          .then(count => {
            this.setState(Object.assign(this.state.user, { entries: count }))
          })
        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
    .catch(err => console.log(err));
  }

  onRouteChange = (status) => {
    if( status === 'signout' ){
      this.setState({ isSignedIn: false });
    }else if( status === 'home' ){
      this.setState({ isSignedIn: true });
    }
    this.setState({route: status});   
  }

  render() {
    // Render Logic //
    const { isSignedIn, imageUrl, route, box } = this.state;
    let page = null;
    switch (route){
      case 'signin':
        page = (<Signin onRouteChange = { this.onRouteChange } loadUser = { this.loadUser }/>);
        break;
      case 'home':
        page = (
          <div>
            <Logo />
            <Rank 
              name = { this.state.user.name }
              entries = { this.state.user.entries } />
            <ImageLinkForm 
              onInputChange = { this.onInputChange } 
              onButtonSubmit = { this.onButtonSubmit }
            />
            <FaceRecognition box = { box } imageUrl = { imageUrl } />  
          </div>
        );
        break;
      case 'register':
        page = (
          <Register 
            loadUser = { this.loadUser } 
            onRouteChange = { this.onRouteChange }
          />
        );
        break;
      default:
        page = (
          <Signin 
            onRouteChange = { this.onRouteChange } 
            loadUser = { this.loadUser }
          />
        );
        break;
    }
    // ------ //
    return (
      <div className = "App">
        <Particles
        className = 'particles'
          params = { particlesOptions }                 
        />
        <Navigation isSignedIn = { isSignedIn } onRouteChange = { this.onRouteChange } />
        {page}
      </div>
    );
  }
}

export default App;
