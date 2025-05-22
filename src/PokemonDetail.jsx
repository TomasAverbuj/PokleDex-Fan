import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

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

const statColors = {
  hp: 'bg-green-400',
  attack: 'bg-red-500',
  defense: 'bg-blue-500',
  'special-attack': 'bg-pink-500',
  'special-defense': 'bg-purple-500',
  speed: 'bg-yellow-400',
};

function getIdFromSpeciesUrl(url) {
  return url.split('/').filter(Boolean).pop();
}

function getLevelOrCondition(evoDetails) {
  if (!evoDetails) return '';
  if (evoDetails.min_level) return `Nivel ${evoDetails.min_level}`;
  if (evoDetails.trigger && evoDetails.trigger.name === 'trade') return 'Intercambio';
  if (evoDetails.item) return `Usa ${evoDetails.item.name}`;
  if (evoDetails.min_happiness) return 'Felicidad';
  if (evoDetails.min_beauty) return 'Belleza';
  if (evoDetails.known_move) return `Con movimiento ${evoDetails.known_move.name}`;
  if (evoDetails.location) return `En ${evoDetails.location.name}`;
  return 'Condición especial';
}

function parseEvolutionChain(chain) {
  const evoChain = [];
  let evo = chain;
  let evoDetails = null;
  do {
    evoChain.push({
      name: evo.species.name,
      id: getIdFromSpeciesUrl(evo.species.url),
      details: evoDetails,
      types: [], // Se llenará luego
    });
    evoDetails =
      evo.evolves_to && evo.evolves_to[0] && evo.evolves_to[0].evolution_details[0]
        ? evo.evolves_to[0].evolution_details[0]
        : null;
    evo = evo.evolves_to[0];
  } while (evo && evo.hasOwnProperty('evolves_to'));
  return evoChain;
}

function getLocationIdFromUrl(url) {
  // La url es algo como https://pokeapi.co/api/v2/location-area/296/
  return url.split('/').filter(Boolean).pop();
}

function getCatchText(locationName) {
  if (locationName.includes('route')) return 'Capturable en ruta';
  if (locationName.includes('cave')) return 'Capturable en cueva';
  if (locationName.includes('forest')) return 'Capturable en bosque';
  if (locationName.includes('tower')) return 'Capturable en torre';
  if (locationName.includes('city')) return 'Capturable en ciudad';
  if (locationName.includes('lake')) return 'Capturable en lago';
  if (locationName.includes('mountain')) return 'Capturable en montaña';
  if (locationName.includes('safari')) return 'Capturable en safari';
  if (locationName.includes('power-plant')) return 'Capturable en central eléctrica';
  if (locationName.includes('sea')) return 'Capturable en mar';
  if (locationName.includes('island')) return 'Capturable en isla';
  if (locationName.includes('desert')) return 'Capturable en desierto';
  if (locationName.includes('lab')) return 'Obtenible en laboratorio';
  return 'Capturable en esa localización';
}

const gameMascots = {
  'red': 6,        // Charizard
  'blue': 9,       // Blastoise
  'yellow': 25,    // Pikachu
  'gold': 250,     // Ho-oh
  'silver': 249,   // Lugia
  'crystal': 245,  // Suicune
  'ruby': 383,     // Groudon
  'sapphire': 382, // Kyogre
  'emerald': 384,  // Rayquaza
  'firered': 6,    // Charizard
  'leafgreen': 3,  // Venusaur
  'diamond': 483,  // Dialga
  'pearl': 484,    // Palkia
  'platinum': 487, // Giratina
  'heartgold': 250,// Ho-oh
  'soulsilver': 249,// Lugia
  'black': 643,    // Reshiram
  'white': 644,    // Zekrom
  'black-2': 646,  // Kyurem
  'white-2': 646,  // Kyurem
  'x': 716,        // Xerneas
  'y': 717,        // Yveltal
  'omega-ruby': 383, // Groudon
  'alpha-sapphire': 382, // Kyogre
  'sun': 791,      // Solgaleo
  'moon': 792,     // Lunala
  'ultra-sun': 800,// Necrozma
  'ultra-moon': 800,// Necrozma
  'sword': 888,    // Zacian
  'shield': 889,   // Zamazenta
  'legends-arceus': 493 // Arceus
};

function PokemonDetail() {
  const { id } = useParams();
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [description, setDescription] = useState('');
  const [evolution, setEvolution] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [howToObtain, setHowToObtain] = useState('');
  const [allMoves, setAllMoves] = useState([]);
  const [generation, setGeneration] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(res => res.json())
      .then(async data => {
        setPokemon(data);
        setLoading(false);
        // Obtener detalles de cada movimiento
        const movesWithDetails = await Promise.all(
          data.moves.map(async (move) => {
            const moveData = await fetch(move.move.url).then(r => r.json());
            return {
              name: move.move.name,
              type: moveData.type.name,
              color: typeColors[moveData.type.name]?.bg || '#e5e7eb',
              text: typeColors[moveData.type.name]?.text || 'text-black',
              level: move.version_group_details[0]?.level_learned_at || 0,
              method: move.version_group_details[0]?.move_learn_method.name || '',
            };
          })
        );
        setAllMoves(movesWithDetails);
      });
    // Traer descripción en español y la cadena evolutiva
    fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
      .then(res => res.json())
      .then(data => {
        const flavorEs = data.flavor_text_entries.find(f => f.language.name === 'es');
        const flavorEn = data.flavor_text_entries.find(f => f.language.name === 'en');
        setDescription(flavorEs ? flavorEs.flavor_text.replace(/\f|\n/g, ' ') : (flavorEn ? flavorEn.flavor_text.replace(/\f|\n/g, ' ') : ''));
        setHowToObtain(flavorEs ? flavorEs.flavor_text.replace(/\f|\n/g, ' ') : (flavorEn ? flavorEn.flavor_text.replace(/\f|\n/g, ' ') : 'No hay información específica en la API.'));
        // Traer la cadena evolutiva
        if (data.evolution_chain && data.evolution_chain.url) {
          fetch(data.evolution_chain.url)
            .then(res => res.json())
            .then(async evoData => {
              let evoChain = parseEvolutionChain(evoData.chain);
              // Traer tipos para cada etapa
              evoChain = await Promise.all(
                evoChain.map(async evo => {
                  const pokeData = await fetch(`https://pokeapi.co/api/v2/pokemon/${evo.id}`).then(r => r.json());
                  return { ...evo, types: pokeData.types };
                })
              );
              setEvolution(evoChain);
            });
        }
        // Traer generación
        fetch(data.generation.url)
          .then(res => res.json())
          .then(genData => {
            setGeneration(genData.name.replace('generation-', 'Generación ').toUpperCase());
          });
      });
    // Traer encuentros
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`)
      .then(res => res.json())
      .then(data => setEncounters(data));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-2xl text-gray-700 animate-pulse">Cargando Pokémon...</span>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="text-2xl text-red-500">Pokémon no encontrado</span>
      </div>
    );
  }

  // Seleccionamos los primeros 4 ataques especiales (moves)
  const specialMoves = pokemon.moves.slice(0, 4);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-8 px-2 md:px-8 relative">
      {/* Botón volver arriba a la Pokédex */}
      <button
        onClick={() => window.location.href = '/'}
        className="fixed top-6 left-6 z-50 bg-white border-2 border-gray-300 rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl hover:bg-gray-200 transition-all"
        aria-label="Volver a la Pokédex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      {/* Generación */}
      {generation && (
        <div className="absolute top-6 left-28 bg-gradient-to-r from-gray-800 via-gray-600 to-gray-400 text-white px-6 py-2 rounded-full shadow-lg font-bold text-lg border-2 border-gray-300 z-40">
          {generation}
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-2 sm:p-8 flex flex-col md:flex-row items-center w-full max-w-4xl gap-8 mt-16">
        <div className="flex flex-col items-center w-full md:w-1/3 mb-6 md:mb-0">
          <div className="w-full max-w-xs aspect-square flex items-center justify-center mb-4 bg-gradient-to-tr from-red-100 via-white to-black/10 rounded-full border-2 border-red-200 mx-auto">
            <img src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemon.name} className="w-full h-auto max-w-[180px] object-contain mx-auto" />
          </div>
          <h2 className="text-3xl font-extrabold capitalize mb-2 text-gray-900 tracking-wide">{pokemon.name}</h2>
          <p className="text-md text-gray-400 mb-4">#{pokemon.id}</p>
          <div className="flex gap-2 mb-4">
            {pokemon.types.map((type) => (
              <span
                key={type.type.name}
                style={{ backgroundColor: typeColors[type.type.name]?.bg }}
                className={`px-3 py-1 rounded text-sm font-semibold capitalize ${typeColors[type.type.name]?.text || 'text-black'}`}
              >
                {type.type.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-1 w-full flex flex-col gap-6">
          {description && (
            <div className="mb-2">
              <h3 className="text-lg font-bold mb-1 text-gray-800">Descripción</h3>
              <p className="text-gray-700 text-base bg-gray-50 rounded p-3 shadow-sm">{description}</p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold mb-1 text-gray-800">Estadísticas</h3>
            <div className="flex flex-col gap-3">
              {pokemon.stats.map(stat => (
                <div key={stat.stat.name} className="flex items-center gap-2 w-full">
                  <span className="w-32 text-sm font-semibold capitalize text-gray-700">{stat.stat.name.replace('-', ' ')}</span>
                  <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full ${statColors[stat.stat.name] || 'bg-gray-400'}`}
                      style={{ width: `${Math.min(stat.base_stat, 100)}%`, minWidth: '10%' }}
                    ></div>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-800">{stat.base_stat}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Línea evolutiva mejorada */}
      {evolution.length > 1 && (
        <div className="mt-10 w-full max-w-4xl mx-auto flex flex-col items-center py-8 px-4 md:px-8 rounded-xl" style={{background: 'repeating-linear-gradient(135deg, #e5e7eb 0 20px, #f3f4f6 20px 40px)'}}>
          <h3 className="text-2xl font-bold mb-8 text-gray-800 w-full text-center md:text-left">Evoluciones</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 w-full pb-4 flex-wrap">
            {evolution.map((evo, idx) => [
              idx > 0 && (
                <div key={evo.id + '-arrow'} className="flex flex-col items-center justify-center">
                  <span className="text-3xl text-gray-500 flex items-center justify-center">{window.innerWidth < 768 ? '↓' : '→'}</span>
                  {evolution[idx].details && (
                    <span className="text-xs text-gray-600 italic mt-1">{getLevelOrCondition(evolution[idx].details)}</span>
                  )}
                </div>
              ),
              <Link to={`/pokemon/${evo.id}`} key={evo.id} className="flex flex-col items-center group transition-transform hover:scale-105 min-w-[180px]">
                <div className="rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center w-32 h-32 md:w-40 md:h-40 mb-2 group-hover:border-red-400 transition-all">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${evo.id}.png`}
                    alt={evo.name}
                    className="w-24 h-24 md:w-32 md:h-32 object-contain image-render-pixelated"
                  />
                </div>
                <span className="text-gray-400 text-md font-mono">#{String(evo.id).padStart(4, '0')}</span>
                <span className="capitalize text-lg md:text-xl font-bold text-gray-800 group-hover:text-red-600 transition-all">{evo.name}</span>
                <div className="flex gap-2 mt-2">
                  {evo.types.map((type) => (
                    <span
                      key={type.type.name}
                      style={{ backgroundColor: typeColors[type.type.name]?.bg }}
                      className={`px-3 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ${typeColors[type.type.name]?.text || 'text-black'}`}
                    >
                      {type.type.name}
                    </span>
                  ))}
                </div>
              </Link>
            ])}
          </div>
        </div>
      )}
      {/* Dónde encontrarlo */}
      {encounters.length > 0 && (
        <div className="mt-10 w-full max-w-4xl flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-4 text-gray-800 w-full text-left">Dónde encontrarlo</h3>
          <div className="overflow-x-auto w-full">
            <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-center text-gray-700 font-bold">Sprite</th>
                  <th className="px-4 py-2 text-center text-gray-700 font-bold md:order-2 order-3">Juego</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-bold md:order-4 order-1">Cómo conseguirlo</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-bold md:order-3 order-2">Localización</th>
                </tr>
              </thead>
              <tbody>
                {encounters.map((enc, idx) => (
                  enc.location_area_encounters && enc.location_area_encounters.length === 0 ? null :
                  enc.version_details.map((ver, i) => (
                    <tr key={idx + '-' + i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2 text-center align-middle"> <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${gameMascots[ver.version.name] || 0}.png`} alt="sprite" className="w-10 h-10 image-render-pixelated mx-auto" /> </td>
                      <td className="px-4 py-2 capitalize text-gray-800 font-semibold text-center align-middle md:order-2 order-3">{ver.version.name}</td>
                      <td className="px-4 py-2 text-gray-500 text-sm text-left align-middle md:order-4 order-1">{getCatchText(enc.location_area.name)}</td>
                      <td className="px-4 py-2 capitalize text-gray-600 text-left align-middle md:order-3 order-2">{enc.location_area.name.replace(/-/g, ' ')}</td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Todos los ataques */}
      <div className="mt-10 w-full max-w-4xl flex flex-col items-center">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 w-full text-left">Todos los ataques</h3>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full bg-white border border-gray-200 rounded-xl shadow">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-gray-700 font-bold">Nombre</th>
                <th className="px-4 py-2 text-left text-gray-700 font-bold">Tipo</th>
                <th className="px-4 py-2 text-center text-gray-700 font-bold">Nivel</th>
                <th className="px-4 py-2 text-center text-gray-700 font-bold">Método</th>
              </tr>
            </thead>
            <tbody>
              {/* Primero los ataques aprendidos por nivel */}
              {allMoves
                .filter(move => move.method === 'level-up' && move.level > 0)
                .sort((a, b) => a.level - b.level)
                .map((move, idx) => (
                  <tr key={move.name + '-' + idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 capitalize text-gray-800 font-semibold text-left align-middle">{move.name.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-2 text-left align-middle">
                      <span style={{ backgroundColor: move.color }} className={`px-3 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ${move.text}`}>{move.type}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-gray-700 align-middle">{move.level > 0 ? move.level : '-'}</td>
                    <td className="px-4 py-2 capitalize text-gray-600 text-center align-middle">{move.method.replace(/-/g, ' ')}</td>
                  </tr>
                ))}
              {/* Luego el resto de ataques */}
              {allMoves
                .filter(move => !(move.method === 'level-up' && move.level > 0))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((move, idx) => (
                  <tr key={move.name + '-rest-' + idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 capitalize text-gray-800 font-semibold text-left align-middle">{move.name.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-2 text-left align-middle">
                      <span style={{ backgroundColor: move.color }} className={`px-3 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap ${move.text}`}>{move.type}</span>
                    </td>
                    <td className="px-4 py-2 text-center text-gray-700 align-middle">-</td>
                    <td className="px-4 py-2 capitalize text-gray-600 text-center align-middle">{move.method.replace(/-/g, ' ')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PokemonDetail; 