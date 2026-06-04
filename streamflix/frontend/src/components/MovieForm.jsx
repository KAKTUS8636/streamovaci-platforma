import { useState } from 'react';

function MovieForm({ onSubmit, initial, onCancel }) {
  const [form, setForm] = useState(
    initial || {
      title: '',
      genre: '',
      year: '',
      rating: '',
      poster: '',
      backdrop: '',
      trailer: '',
      description: '',
      director: '',
      cast: '',
      runtime: '',
      type: 'movie', // 'movie' nebo 'series'
      seasons: []    // [{ number: 1, episodes: [{ number: 1, title: '' }] }]
    }
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSeason = () => {
    const newSeason = { 
      number: form.seasons.length + 1, 
      episodes: [] 
    };
    setForm({ ...form, seasons: [...form.seasons, newSeason] });
  };

  const addEpisode = (sIdx) => {
    const newSeasons = [...form.seasons];
    const epNum = newSeasons[sIdx].episodes.length + 1;
    newSeasons[sIdx].episodes.push({ number: epNum, title: `Episode ${epNum}` });
    setForm({ ...form, seasons: newSeasons });
  };

  const handleEpisodeTitle = (sIdx, eIdx, val) => {
    const newSeasons = [...form.seasons];
    newSeasons[sIdx].episodes[eIdx].title = val;
    setForm({ ...form, seasons: newSeasons });
  };

  const removeSeason = (sIdx) => {
    const newSeasons = form.seasons.filter((_, i) => i !== sIdx);
    setForm({ ...form, seasons: newSeasons });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass = "w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors";
  const labelClass = "block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Title *</label>
          <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Breaking Bad" className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>Content Type</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            <option value="movie">Movie</option>
            <option value="series">Series</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label className={labelClass}>Genre</label>
          <input name="genre" value={form.genre} onChange={handleChange} placeholder="Action, Drama" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Year</label>
          <input name="year" type="number" value={form.year} onChange={handleChange} placeholder="2024" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Rating (0-10)</label>
          <input name="rating" type="number" step="0.1" value={form.rating} onChange={handleChange} placeholder="8.5" className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Director</label>
          <input name="director" value={form.director} onChange={handleChange} placeholder="Director Name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Length (minutes)</label>
          <input name="runtime" type="number" value={form.runtime} onChange={handleChange} placeholder="120" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Cast (Comma separated)</label>
        <input name="cast" value={form.cast} onChange={handleChange} placeholder="Actor 1, Actor 2, Actor 3" className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Poster URL</label>
          <input name="poster" value={form.poster} onChange={handleChange} placeholder="https://..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Backdrop URL</label>
          <input name="backdrop" value={form.backdrop} onChange={handleChange} placeholder="https://..." className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Trailer (YouTube URL)</label>
        <input name="trailer" value={form.trailer} onChange={handleChange} placeholder="https://youtube.com/..." className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Movie plot..." rows="4" className={`${inputClass} resize-vertical`} />
      </div>

      {/* DYNAMICKÁ SEKCE PRO SERIÁLY */}
      {form.type === 'series' && (
        <div className="p-8 bg-gray-900/50 rounded-2xl border border-gray-700 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-tighter">Seasons & Episodes</h3>
            <button type="button" onClick={addSeason} className="bg-red-600/20 text-red-500 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-all">
              + Add Season
            </button>
          </div>

          {form.seasons.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">No seasons added yet.</p>}

          <div className="space-y-8">
            {form.seasons.map((s, sIdx) => (
              <div key={sIdx} className="bg-gray-800/40 p-6 rounded-xl border border-gray-700 relative">
                <button type="button" onClick={() => removeSeason(sIdx)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500">✕</button>
                
                <h4 className="font-black text-white text-xl mb-4 italic">Season {s.number}</h4>
                
                <div className="space-y-3 mb-6">
                  {s.episodes.map((ep, eIdx) => (
                    <div key={eIdx} className="flex gap-3">
                      <span className="flex items-center justify-center bg-gray-700 w-10 rounded-lg text-xs font-bold text-red-400">{eIdx + 1}</span>
                      <input 
                        value={ep.title} 
                        onChange={(e) => handleEpisodeTitle(sIdx, eIdx, e.target.value)} 
                        className="flex-1 bg-gray-900 border border-gray-700 p-2 rounded-lg text-sm outline-none focus:border-red-500"
                        placeholder="Episode Title"
                      />
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => addEpisode(sIdx)} className="w-full py-2 bg-gray-700/50 rounded-lg text-xs font-bold text-gray-400 hover:bg-gray-700 hover:text-white transition-all">
                  + Add Episode to Season {s.number}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-5 pt-6 border-t border-gray-800">
        <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all shadow-lg shadow-red-900/20">
          {initial ? 'Update Content' : 'Save To Streamflix'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default MovieForm;