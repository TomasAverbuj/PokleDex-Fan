import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const URL = 'https://pokeapi.co/api/v2/pokemon/';
const URL_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=10000';
const URL_TYPES = 'https://pokeapi.co/api/v2/type';

// Colores oficiales de Pokémon por tipo
const typeColors = {
  normal: { bg: '#A8A77A', text: 'text-white' },
  fire: { bg: '#EE8130', text: 'text-white' },
  water: { bg: '#6390F0', text: 'text-white' },
  grass: { bg: '#7AC74C', text: 'text-white' },
  electric: { bg: '#F7D02C', text: 'text-black' },
  ice: { bg: '#96D9D6', text: 'text-black' },
  fighting: { bg: '#C22E28', text: 'text-white' },
  poison: { bg: '#A33EA1', text: 'text-white' },
  ground: { bg: '#E2BF65', text: 'text-black' },
  flying: { bg: '#A98FF3', text: 'text-black' },
  psychic: { bg: '#F95587', text: 'text-white' },
  bug: { bg: '#A6B91A', text: 'text-black' },
  rock: { bg: '#B6A136', text: 'text-white' },
  ghost: { bg: '#735797', text: 'text-white' },
  dragon: { bg: '#6F35FC', text: 'text-white' },
  dark: { bg: '#705746', text: 'text-white' },
  steel: { bg: '#B7B7CE', text: 'text-black' },
  fairy: { bg: '#D685AD', text: 'text-black' },
};

function PokedexGeneral() {
  const [pokemones, setPokemones] = useState([]);
  const [allPokemones, setAllPokemones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipos, setTipos] = useState([]);
  const [filtro, setFiltro] = useState('ver-todos');
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    // Traer todos los tipos
    fetch(URL_TYPES)
      .then(res => res.json())
      .then(data => {
        setTipos(data.results.filter(t => t.name !== 'unknown' && t.name !== 'shadow'));
      });
  }, []);

  useEffect(() => {
    // Traer todos los pokemones (solo nombres y urls)
    fetch(URL_LIST)
      .then(res => res.json())
      .then(async data => {
        // Traer detalles de cada pokemon
        const detalles = await Promise.all(
          data.results.map(async (poke) => {
            const res = await fetch(poke.url);
            return await res.json();
          })
        );
        setAllPokemones(detalles);
        setPokemones(detalles);
        setLoading(false);
      });
  }, []);

  // Filtrar por tipo
  const filtrarPorTipo = (tipo) => {
    setFiltro(tipo);
    if (tipo === 'ver-todos') {
      setPokemones(allPokemones);
    } else {
      setPokemones(
        allPokemones.filter(poke => poke.types.some(t => t.type.name === tipo))
      );
    }
  };

  // Filtrar por nombre y número
  const pokemonesFiltrados = pokemones.filter(poke => {
    const nombreMatch = poke.name.toLowerCase().includes(searchName.toLowerCase());
    const idMatch = searchId === '' || String(poke.id) === searchId;
    return nombreMatch && idMatch;
  });

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-start py-8 px-2 md:px-8 transition-all">
      {/* Buscadores */}
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 mb-6 justify-center items-center">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchName}
          onChange={e => setSearchName(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-1/2"
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Buscar por número..."
          value={searchId}
          onChange={e => {
            // Solo permitir números
            const val = e.target.value.replace(/[^0-9]/g, '');
            setSearchId(val);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-1/4"
        />
      </div>
      {/* Filtros */}
      <div className="w-full max-w-6xl flex flex-wrap justify-center gap-2 mb-8 sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 py-4">
        <button
          className={`px-4 py-1 rounded-full font-semibold border border-black shadow-sm transition-all duration-200 ${filtro === 'ver-todos' ? 'bg-black text-white scale-105' : 'bg-white text-black hover:bg-gray-200'}`}
          onClick={() => filtrarPorTipo('ver-todos')}
        >
          Ver todos
        </button>
        {tipos.map(tipo => (
          <button
            key={tipo.name}
            style={{ backgroundColor: typeColors[tipo.name]?.bg }}
            className={`px-4 py-1 rounded-full font-semibold border border-black shadow-sm capitalize transition-all duration-200 ${filtro === tipo.name ? 'scale-105 ring-2 ring-black ' : ''} ${typeColors[tipo.name]?.text || 'text-black'}`}
            onClick={() => filtrarPorTipo(tipo.name)}
          >
            {tipo.name}
          </button>
        ))}
      </div>
      {/* Pokemones */}
      {loading ? (
        <div className="flex justify-center items-center h-64 w-full">
          <span className="text-black text-2xl animate-pulse">Cargando Pokémons...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl">
          {pokemonesFiltrados.map((poke) => (
            <Link to={`/pokemon/${poke.id}`} key={poke.id} className="no-underline">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 flex flex-col items-center hover:shadow-xl transition-all cursor-pointer">
                <div className="w-24 h-24 flex items-center justify-center mb-2 bg-gradient-to-tr from-red-100 via-white to-black/10 rounded-full border-2 border-red-200">
                  <img src={poke.sprites.other["official-artwork"].front_default} alt={poke.name} className="w-20 h-20 object-contain" />
                </div>
                <h2 className="text-lg font-bold capitalize mb-1 text-gray-900 tracking-wide">{poke.name}</h2>
                <p className="text-xs text-gray-400 mb-2">#{poke.id}</p>
                <div className="flex gap-2 mb-2">
                  {poke.types.map((type) => (
                    <span key={type.type.name} style={{ backgroundColor: typeColors[type.type.name]?.bg }} className={`px-2 py-1 rounded text-xs font-semibold capitalize ${typeColors[type.type.name]?.text || 'text-black'}`}>{type.type.name}</span>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Altura: {poke.height / 10} m</span>
                  <span>Peso: {poke.weight / 10} kg</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default PokedexGeneral; 