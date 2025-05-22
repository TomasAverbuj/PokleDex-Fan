import { useParams, Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-8 px-2 md:px-8">
      <Link to="/" className="mb-6 text-blue-600 hover:underline">← Volver a la Pokédex</Link>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-2 sm:p-8 flex flex-col md:flex-row items-center w-full max-w-4xl gap-8">
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {pokemon.stats.map(stat => (
                <div key={stat.stat.name} className="flex flex-col items-center bg-gray-100 rounded p-2">
                  <span className="text-xs text-gray-500 capitalize">{stat.stat.name}</span>
                  <span className="text-lg font-bold text-gray-800">{stat.base_stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Línea evolutiva mejorada */}
      {evolution.length > 1 && (
        <div className="mt-10 w-full max-w-2xl mx-auto flex flex-col items-center py-8 rounded-xl" style={{background: 'repeating-linear-gradient(135deg, #e5e7eb 0 20px, #f3f4f6 20px 40px)'}}>
          <h3 className="text-2xl font-bold mb-8 text-gray-800 w-full text-center md:text-left">Evoluciones</h3>
          <div className="flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 w-full">
            {evolution.map((evo, idx) => (
              <div key={evo.id} className="flex flex-col items-center w-56">
                <div className="rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center w-40 h-40 mb-4">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                    alt={evo.name}
                    className="w-28 h-28 object-contain image-render-pixelated"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <span className="capitalize text-xl font-bold text-gray-800">{evo.name}</span>
                  <span className="text-gray-400 text-md font-mono">N.º {String(evo.id).padStart(4, '0')}</span>
                  <div className="flex gap-2 mt-2">
                    {evo.types.map((type) => (
                      <span
                        key={type.type.name}
                        style={{ backgroundColor: typeColors[type.type.name]?.bg }}
                        className={`px-3 py-1 rounded text-xs font-semibold capitalize ${typeColors[type.type.name]?.text || 'text-black'}`}
                      >
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                  {idx > 0 && evolution[idx].details && (
                    <span className="mt-2 text-xs text-gray-600 italic">{getLevelOrCondition(evolution[idx].details)}</span>
                  )}
                </div>
              </div>
            )).reduce((acc, curr, idx, arr) => {
              if (idx === 0) return [curr];
              acc.push(
                <span key={idx + '-arrow'} className="mx-2 text-5xl text-gray-400 flex items-center">→</span>
              );
              acc.push(curr);
              return acc;
            }, [])}
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
                  <th className="px-4 py-2 text-left text-gray-700 font-bold">Sprite</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-bold">Juego</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-bold">Localización</th>
                  <th className="px-4 py-2 text-left text-gray-700 font-bold">Cómo conseguirlo</th>
                </tr>
              </thead>
              <tbody>
                {encounters.map((enc, idx) => (
                  enc.location_area_encounters && enc.location_area_encounters.length === 0 ? null :
                  enc.version_details.map((ver, i) => (
                    <tr key={idx + '-' + i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${gameMascots[ver.version.name] || 0}.png`} alt="sprite" className="w-10 h-10 image-render-pixelated" />
                      </td>
                      <td className="px-4 py-2 capitalize text-gray-800 font-semibold">{ver.version.name}</td>
                      <td className="px-4 py-2 capitalize text-gray-600">{enc.location_area.name.replace(/-/g, ' ')}</td>
                      <td className="px-4 py-2 text-gray-500 text-sm">{getCatchText(enc.location_area.name)}</td>
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
                <th className="px-4 py-2 text-left text-gray-700 font-bold">Nivel</th>
                <th className="px-4 py-2 text-left text-gray-700 font-bold">Método</th>
              </tr>
            </thead>
            <tbody>
              {/* Primero los ataques aprendidos por nivel */}
              {allMoves
                .filter(move => move.method === 'level-up' && move.level > 0)
                .sort((a, b) => a.level - b.level)
                .map((move, idx) => (
                  <tr key={move.name + '-' + idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 capitalize text-gray-800 font-semibold">{move.name.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-2">
                      <span style={{ backgroundColor: move.color }} className={`px-3 py-1 rounded text-xs font-semibold capitalize ${move.text}`}>{move.type}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-center">{move.level > 0 ? move.level : '-'}</td>
                    <td className="px-4 py-2 capitalize text-gray-600">{move.method.replace(/-/g, ' ')}</td>
                  </tr>
                ))}
              {/* Luego el resto de ataques */}
              {allMoves
                .filter(move => !(move.method === 'level-up' && move.level > 0))
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((move, idx) => (
                  <tr key={move.name + '-rest-' + idx} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 capitalize text-gray-800 font-semibold">{move.name.replace(/-/g, ' ')}</td>
                    <td className="px-4 py-2">
                      <span style={{ backgroundColor: move.color }} className={`px-3 py-1 rounded text-xs font-semibold capitalize ${move.text}`}>{move.type}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-center">-</td>
                    <td className="px-4 py-2 capitalize text-gray-600">{move.method.replace(/-/g, ' ')}</td>
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