import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PokedexGeneral from './PokedexGeneral';
import PokemonDetail from './PokemonDetail';
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PokedexGeneral />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
