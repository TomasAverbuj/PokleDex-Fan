import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Fragment } from 'react';

const URL = 'https://pokeapi.co/api/v2/pokemon/';
const URL_LIST = 'https://pokeapi.co/api/v2/pokemon?limit=10000';
const URL_TYPES = 'https://pokeapi.co/api/v2/type';
const URL_GENERATIONS = 'https://pokeapi.co/api/v2/generation';
const PAGE_SIZE = 100;

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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [generaciones, setGeneraciones] = useState([]);
  const [filtroGeneracion, setFiltroGeneracion] = useState('todas');
  const loader = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Traer tipos y generaciones solo una vez
  useEffect(() => {
    fetch(URL_TYPES)
      .then(res => res.json())
      .then(data => {
        setTipos(data.results.filter(t => t.name !== 'unknown' && t.name !== 'shadow'));
      });
    fetch(URL_GENERATIONS)
      .then(res => res.json())
      .then(data => setGeneraciones(data.results));
  }, []);

  // Traer pokemones por página
  const fetchPokemones = useCallback(async (offsetValue = 0, append = false, genUrl = null) => {
    setLoading(true);
    let detalles = [];
    if (genUrl && genUrl !== 'todas') {
      // Si hay filtro de generación, traer solo los de esa generación
      const res = await fetch(genUrl);
      const data = await res.json();
      // data.pokemon_species tiene los pokemones de esa generación (pero solo nombre y url de species)
      // Necesitamos mapear a la url de /pokemon/{id}
      detalles = await Promise.all(
        data.pokemon_species
          .sort((a, b) => {
            // Ordenar por id ascendente
            const getId = url => parseInt(url.url.split('/').filter(Boolean).pop());
            return getId(a) - getId(b);
          })
          .map(async (poke) => {
            // Obtener el id de species y usarlo para pedir el /pokemon/{id}
            const id = poke.url.split('/').filter(Boolean).pop();
            const resPoke = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            return await resPoke.json();
          })
      );
      setAllPokemones(detalles);
      setPokemones(detalles);
      setHasMore(false); // No hay paginación en filtro de generación
      setLoading(false);
      return;
    }
    // Si no hay filtro de generación, paginación normal
    const res = await fetch(`${URL_LIST}&offset=${offsetValue}&limit=${PAGE_SIZE}`);
    const data = await res.json();
    detalles = await Promise.all(
      data.results.map(async (poke) => {
        const resPoke = await fetch(poke.url);
        return await resPoke.json();
      })
    );
    if (append) {
      setAllPokemones(prev => [...prev, ...detalles]);
      setPokemones(prev => [...prev, ...detalles]);
    } else {
      setAllPokemones(detalles);
      setPokemones(detalles);
    }
    setHasMore(data.next !== null);
    setLoading(false);
  }, []);

  // Inicial
  useEffect(() => {
    fetchPokemones(0, false);
    setOffset(PAGE_SIZE);
  }, [fetchPokemones]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || filtroGeneracion !== 'todas') return;
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200 && !loading
      ) {
        fetchPokemones(offset, true);
        setOffset(prev => prev + PAGE_SIZE);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset, loading, hasMore, fetchPokemones, filtroGeneracion]);

  // Filtro por generación
  useEffect(() => {
    if (filtroGeneracion === 'todas') {
      fetchPokemones(0, false);
      setOffset(PAGE_SIZE);
      setHasMore(true);
    } else {
      fetchPokemones(0, false, filtroGeneracion);
    }
  }, [filtroGeneracion, fetchPokemones]);

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

  // Mostrar botón cuando se scrollea hacia abajo
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{background: 'none'}}>
      {/* Pokéball pattern background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none" aria-hidden="true" style={{
        background: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'36\' fill=\'#fff\' stroke=\'#d1d5db\' stroke-width=\'4\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'14\' fill=\'#9ca3af\' stroke=\'#d1d5db\' stroke-width=\'2\'/%3E%3Crect x=\'4\' y=\'36\' width=\'72\' height=\'8\' fill=\'#d1d5db\'/%3E%3Ccircle cx=\'40\' cy=\'40\' r=\'7\' fill=\'#fff\' stroke=\'#d1d5db\' stroke-width=\'1\'/%3E%3C/svg%3E") repeat',
        backgroundSize: '80px 80px',
        opacity: 0.5
      }}></div>
      {/* NAV BAR: Buscadores, Filtros y Generaciones */}
      <nav className="w-full max-w-screen overflow-x-auto bg-white/95 shadow-lg rounded-b-2xl px-4 md:px-12 py-6 mb-10 flex flex-col gap-6 items-center sticky top-0 z-20">
        {/* Buscadores */}
        <div className="w-full flex flex-col md:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="w-full md:w-1/2 px-8 py-4 border-2 border-gray-200 rounded-full shadow focus:outline-none focus:ring-4 focus:ring-blue-200 text-lg font-semibold bg-white transition-all duration-200 placeholder-gray-400"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Buscar por número..."
            value={searchId}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setSearchId(val);
            }}
            className="w-full md:w-1/4 px-8 py-4 border-2 border-gray-200 rounded-full shadow focus:outline-none focus:ring-4 focus:ring-red-200 text-lg font-semibold bg-white transition-all duration-200 placeholder-gray-400"
          />
        </div>
        {/* Filtros solo en desktop/tablet */}
        <div className="hidden md:flex w-full flex-col gap-2">
          {/* Filtro por generación - Botones interactivos */}
          <div className="w-full flex flex-col items-center gap-2 mb-2">
            <span className="font-bold text-lg mb-1">Generación:</span>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setFiltroGeneracion('todas')}
                className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg shadow-md transition-all duration-200
                  ${filtroGeneracion === 'todas' ? 'bg-black text-white scale-110 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'}
                `}
              >
                Todas
              </button>
              {generaciones.map((gen, idx) => (
                <button
                  key={gen.name}
                  onClick={() => setFiltroGeneracion(gen.url)}
                  className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg shadow-md transition-all duration-200
                    ${filtroGeneracion === gen.url ? 'bg-black text-white scale-110 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'}
                  `}
                >
                  {['I','II','III','IV','V','VI','VII','VIII','IX'][idx]}
                </button>
              ))}
            </div>
          </div>
          {/* Filtros de tipo */}
          <div className="w-full flex flex-wrap gap-3 justify-center">
            <button
              className={`px-8 py-3 rounded-full font-bold border-2 shadow-md transition-all duration-200 text-lg ${filtro === 'ver-todos' ? 'bg-black text-white scale-105 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'} hover:scale-105`}
              onClick={() => filtrarPorTipo('ver-todos')}
            >
              Ver todos
            </button>
            {tipos.map(tipo => (
              <button
                key={tipo.name}
                style={{ backgroundColor: typeColors[tipo.name]?.bg }}
                className={`px-8 py-3 rounded-full font-bold border-2 shadow-md capitalize transition-all duration-200 text-lg ${filtro === tipo.name ? 'scale-105 border-black shadow-lg ring-2 ring-black' : 'border-gray-300'} ${typeColors[tipo.name]?.text || 'text-black'} hover:scale-105`}
                onClick={() => filtrarPorTipo(tipo.name)}
              >
                {tipo.name}
              </button>
            ))}
          </div>
        </div>
        {/* Botón flotante de filtros en mobile */}
        <button
          className="fixed bottom-6 left-6 z-50 bg-red-500 text-white md:hidden rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-red-700 transition-all border-4 border-white/90"
          aria-label="Mostrar filtros"
          onClick={() => setShowMobileFilters(true)}
        >
          {/* Pokeball SVG colorida */}
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10">
            <circle cx="24" cy="24" r="20" fill="#fff" stroke="#222" strokeWidth="3" />
            <path d="M4 24h40" stroke="#e53e3e" strokeWidth="4" />
            <circle cx="24" cy="24" r="8" fill="#fff" stroke="#222" strokeWidth="3" />
            <circle cx="24" cy="24" r="4" fill="#e53e3e" stroke="#222" strokeWidth="2" />
            <path d="M44 24a20 20 0 0 0-40 0" stroke="#e53e3e" strokeWidth="4" />
          </svg>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full shadow-lg">Filtros</span>
        </button>
        {/* Modal/drawer de filtros en mobile */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 flex items-end md:hidden bg-black/40" onClick={() => setShowMobileFilters(false)}>
            <div className="w-full bg-white rounded-t-3xl p-6 pt-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">Filtros</span>
                <button onClick={() => setShowMobileFilters(false)} className="text-2xl font-bold text-gray-500 hover:text-black">×</button>
              </div>
              {/* Filtro por generación - Botones interactivos */}
              <div className="w-full flex flex-col items-center gap-2 mb-4">
                <span className="font-bold text-lg mb-1">Generación:</span>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => { setFiltroGeneracion('todas'); setShowMobileFilters(false); }}
                    className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg shadow-md transition-all duration-200
                      ${filtroGeneracion === 'todas' ? 'bg-black text-white scale-110 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'}
                    `}
                  >
                    Todas
                  </button>
                  {generaciones.map((gen, idx) => (
                    <button
                      key={gen.name}
                      onClick={() => { setFiltroGeneracion(gen.url); setShowMobileFilters(false); }}
                      className={`w-12 h-12 flex items-center justify-center rounded-full border-2 font-bold text-lg shadow-md transition-all duration-200
                        ${filtroGeneracion === gen.url ? 'bg-black text-white scale-110 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'}
                      `}
                    >
                      {['I','II','III','IV','V','VI','VII','VIII','IX'][idx]}
                    </button>
                  ))}
                </div>
              </div>
              {/* Filtros de tipo */}
              <div className="w-full flex flex-wrap gap-3 justify-center mb-2">
                <button
                  className={`px-8 py-3 rounded-full font-bold border-2 shadow-md transition-all duration-200 text-lg ${filtro === 'ver-todos' ? 'bg-black text-white scale-105 border-red-500 shadow-lg' : 'bg-white text-black hover:bg-gray-100 border-gray-300'} hover:scale-105`}
                  onClick={() => { filtrarPorTipo('ver-todos'); setShowMobileFilters(false); }}
                >
                  Ver todos
                </button>
                {tipos.map(tipo => (
                  <button
                    key={tipo.name}
                    style={{ backgroundColor: typeColors[tipo.name]?.bg }}
                    className={`px-8 py-3 rounded-full font-bold border-2 shadow-md capitalize transition-all duration-200 text-lg ${filtro === tipo.name ? 'scale-105 border-black shadow-lg ring-2 ring-black' : 'border-gray-300'} ${typeColors[tipo.name]?.text || 'text-black'} hover:scale-105`}
                    onClick={() => { filtrarPorTipo(tipo.name); setShowMobileFilters(false); }}
                  >
                    {tipo.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Contenido principal */}
      <div className="relative z-10 w-full min-h-screen">
        {/* Pokemones */}
        {loading ? (
          <div className="flex justify-center items-center min-h-screen w-screen">
            <span className="text-black text-2xl animate-pulse">Cargando Pokémons...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 w-full px-2 md:px-8">
            {pokemonesFiltrados.map((poke) => (
              <Link to={`/pokemon/${poke.id}`} key={poke.id} className="no-underline">
                <div className="relative bg-white/70 border-2 border-gray-200 rounded-3xl shadow-xl p-6 flex flex-col items-center hover:shadow-2xl transition-all cursor-pointer overflow-hidden">
                  {/* Card Pokémon (sin cambios) */}
                  <div className="w-24 h-24 flex items-center justify-center mb-2 bg-gradient-to-tr from-red-100 via-white to-black/10 rounded-full border-2 border-red-200 z-10">
                    <img src={poke.sprites.other["official-artwork"].front_default} alt={poke.name} className="w-20 h-20 object-contain" />
                  </div>
                  <h2 className="text-2xl font-extrabold capitalize mb-1 text-gray-900 tracking-wide text-center z-10">{poke.name}</h2>
                  <p className="text-xs text-gray-400 mb-2 font-bold z-10">#{poke.id}</p>
                  <div className="flex gap-2 mb-2 z-10">
                    {poke.types.map((type) => (
                      <span key={type.type.name} style={{ backgroundColor: typeColors[type.type.name]?.bg }} className={`px-3 py-1 rounded-full text-sm font-bold capitalize border-2 ${typeColors[type.type.name]?.text || 'text-black'} border-white/60 shadow`}>{type.type.name}</span>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm text-gray-700 font-semibold z-10">
                    <span>Altura: {poke.height / 10} m</span>
                    <span>Peso: {poke.weight / 10} kg</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {/* Loader para infinite scroll */}
        {loading && pokemones.length > 0 && (
          <div className="flex justify-center items-center py-8">
            <span className="text-black text-xl animate-pulse">Cargando más...</span>
          </div>
        )}
      </div>
      {/* Botón scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-white text-black rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl hover:bg-red-600 transition-all border-4 border-white/80"
          aria-label="Volver arriba"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default PokedexGeneral; 