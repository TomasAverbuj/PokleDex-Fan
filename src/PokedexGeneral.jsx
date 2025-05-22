import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const URL = 'https://pokeapi.co/api/v2/pokemon/';
const URL_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=10000';
const URL_TYPES = 'https://pokeapi.co/api/v2/type';

// Colores oficiales de Pokémon por tipo
const typeColors = {
  normal: { bg: '#A8A77A', text: 'text-black' },
  fire: { bg: '#EE8130', text: 'text-black' },
  water: { bg: '#6390F0', text: 'text-black' },
  grass: { bg: '#7AC74C', text: 'text-black' },
  electric: { bg: '#F7D02C', text: 'text-black' },
  ice: { bg: '#96D9D6', text: 'text-black' },
  fighting: { bg: '#C22E28', text: 'text-black' },
  poison: { bg: '#A33EA1', text: 'text-black' },
  ground: { bg: '#E2BF65', text: 'text-black' },
  flying: { bg: '#A98FF3', text: 'text-black' },
  psychic: { bg: '#F95587', text: 'text-black' },
  bug: { bg: '#A6B91A', text: 'text-black' },
  rock: { bg: '#B6A136', text: 'text-black' },
  ghost: { bg: '#735797', text: 'text-black' },
  dragon: { bg: '#6F35FC', text: 'text-black' },
  dark: { bg: '#705746', text: 'text-black' },
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
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{background: 'radial-gradient(circle at 50% 0%, #fff 0%, #ffe082 40%, #fca5a5 80%, #93c5fd 100%)'}}>
      {/* Pokéball pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true" style={{
        background: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'36\' fill=\'%23fff\' stroke=\'%23e5e7eb\' stroke-width=\'4\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'14\' fill=\'%23e53e3e\' stroke=\'%23e5e7eb\' stroke-width=\'2\'/%3E%3Crect x=\'4\' y=\'36\' width=\'72\' height=\'8\' fill=\'%23e53e3e\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'7\' fill=\'%23fff\' stroke=\'%23e5e7eb\' stroke-width=\'1\'/%3E%3C/svg%3E") repeat',
        backgroundSize: '80px 80px',
        opacity: 0.13
      }}></div>
      {/* Contenido principal */}
      <div className="relative z-10 w-full min-h-screen">
        {/* Buscadores */}
        <div className="w-full flex flex-col md:flex-row gap-4 mb-6 items-center px-2 md:px-8">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-1/2 font-semibold"
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
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 w-full md:w-1/4 font-semibold"
          />
        </div>
        {/* Filtros */}
        <div className="w-full flex flex-wrap gap-2 mb-8 md:sticky md:top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 py-4 px-2 md:px-8">
          <button
            className={`px-4 py-1 rounded-full font-bold border border-black shadow-sm transition-all duration-200 ${filtro === 'ver-todos' ? 'bg-black text-white scale-105' : 'bg-white text-black hover:bg-gray-200'}`}
            onClick={() => filtrarPorTipo('ver-todos')}
          >
            Ver todos
          </button>
          {tipos.map(tipo => (
            <button
              key={tipo.name}
              style={{ backgroundColor: typeColors[tipo.name]?.bg }}
              className={`px-4 py-1 rounded-full font-bold border border-black shadow-sm capitalize transition-all duration-200 ${filtro === tipo.name ? 'scale-105 ring-2 ring-black ' : ''} ${typeColors[tipo.name]?.text || 'text-black'}`}
              onClick={() => filtrarPorTipo(tipo.name)}
            >
              {tipo.name}
            </button>
          ))}
        </div>
        {/* Pokemones */}
        {loading ? (
          <div className="flex justify-center items-center min-h-screen w-screen">
            <span className="text-black text-2xl animate-pulse">Cargando Pokémons...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full px-2 md:px-8">
            {pokemonesFiltrados.map((poke) => (
              <Link to={`/pokemon/${poke.id}`} key={poke.id} className="no-underline">
                <div className="bg-white/60 border border-gray-200 rounded-2xl shadow-xl p-4 flex flex-col items-center hover:shadow-2xl transition-all cursor-pointer">
                  <div className="w-24 h-24 flex items-center justify-center mb-2 bg-gradient-to-tr from-red-100 via-white to-black/10 rounded-full border-2 border-red-200">
                    <img src={poke.sprites.other["official-artwork"].front_default} alt={poke.name} className="w-20 h-20 object-contain" />
                  </div>
                  <h2 className="text-xl font-extrabold capitalize mb-1 text-gray-900 tracking-wide text-center">{poke.name}</h2>
                  <p className="text-xs text-gray-400 mb-2 font-bold">#{poke.id}</p>
                  <div className="flex gap-2 mb-2">
                    {poke.types.map((type) => (
                      <span key={type.type.name} style={{ backgroundColor: typeColors[type.type.name]?.bg }} className={`px-2 py-1 rounded text-sm font-bold capitalize ${typeColors[type.type.name]?.text || 'text-black'}`}>{type.type.name}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-700 font-semibold">
                    <span>Altura: {poke.height / 10} m</span>
                    <span>Peso: {poke.weight / 10} kg</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PokedexGeneral; 