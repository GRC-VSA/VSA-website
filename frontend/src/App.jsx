import "./App.css";
import CreateEventPage from "./pages/create-events.jsx";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import NavBar from "./components/NavBar.jsx";

function App() {
  return (
    <BrowserRouter>
      <NavBar/>
      <Routes>
        <Route path="/home" element={<HomePage/>} />
        <Route path="/create-event" element={<CreateEventPage/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;