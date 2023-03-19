import logo from './logo.svg';
import './App.css';

function App() {
  async function generateProof() {
    alert("Generating proof!")
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button
					type="submit"
					onClick={() => generateProof()}
					className="searchButton"
				>Click me!</button>
      </header>
    </div>
  );
}

export default App;
