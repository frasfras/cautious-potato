// import logo from './logo.svg';
import './App.css';
// import fog from './fog.css';
// import GpsTrackViewer from "./GpsTrackViewer";
import RacingLineVisualizer from "./RacingLineVisualizer";
import EtherealFog from './EtherealFog';


function App() {
  // const backgroundStyle = {
  //   backgroundImage: `url('/ghostmobile.jpeg')`,
  //   backgroundSize: 'cover',
  //   backgroundPosition: 'center',
  //   minHeight: '100vh'
  };

  return (
    <div  className="App">
    
     
     <EtherealFog />
      <RacingLineVisualizer />
    </div>
  );
}

export default App;
