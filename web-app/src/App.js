import React, { Component } from 'react';

import './normalizer.css';
import './App.css';

const STORAGE_KEY = 'yuk.feed.v1';

const TRASH = {
  cup: {
    key: 'cup',
    emoji: '🥤',
    item: 'takeaway paper cup',
    material: 'paper + plastic lining',
    materialKey: 'paper',
    bin: 'usually general waste',
    fate: 'The glued plastic lining makes ordinary paper recycling awkward. Some cities have dedicated cup recycling, most do not.',
    verdict: 'paper pretending to be simple. suspicious.',
    tip: 'A reusable cup deletes this whole tiny material drama.',
  },
  bottle: {
    key: 'bottle',
    emoji: '🧴',
    item: 'PET bottle',
    material: 'PET plastic',
    materialKey: 'plastic',
    bin: 'packaging recycling or deposit return',
    fate: 'Clear PET is one of the more recyclable plastics when it reaches a clean collection stream.',
    verdict: 'plastic, but at least the useful kind.',
    tip: 'Empty it, keep it clean, and use deposit return where available.',
  },
  banana: {
    key: 'banana',
    emoji: '🍌',
    item: 'banana peel',
    material: 'organic',
    materialKey: 'organic',
    bin: 'bio-waste or compost',
    fate: 'Collected organics can become compost or biogas instead of being burned or landfilled.',
    verdict: 'finally, food. exquisite.',
    tip: 'Use your local bio-waste stream if it accepts food scraps.',
  },
  can: {
    key: 'can',
    emoji: '🥫',
    item: 'aluminium can',
    material: 'aluminium',
    materialKey: 'metal',
    bin: 'deposit return or metal packaging recycling',
    fate: 'Aluminium can be recycled repeatedly and remelting it uses much less energy than making new aluminium.',
    verdict: 'ooo shiny. elite trash.',
    tip: 'Deposit systems are ideal because they keep the material stream unusually clean.',
  },
  battery: {
    key: 'battery',
    emoji: '🔋',
    item: 'battery',
    material: 'battery / e-waste',
    materialKey: 'ewaste',
    bin: 'battery collection point',
    fate: 'Batteries need a dedicated collection stream because they contain recoverable materials and can create fire risks in mixed waste.',
    verdict: 'spicy little danger brick. not normal trash.',
    tip: 'Never put loose batteries in ordinary recycling. Use a battery or e-waste collection point.',
  },
  glass: {
    key: 'glass',
    emoji: '🫙',
    item: 'glass jar',
    material: 'container glass',
    materialKey: 'glass',
    bin: 'glass packaging recycling',
    fate: 'Container glass can be crushed into cullet and remelted into new glass when kept separate from ceramics and heat-resistant glass.',
    verdict: 'crunchy. circular. approved.',
    tip: 'Empty it first. Local rules differ on lids and rinsing.',
  },
  mystery: {
    key: 'mystery',
    emoji: '👀',
    item: 'mystery trash',
    material: 'unknown',
    materialKey: 'unknown',
    bin: 'do not guess yet',
    fate: 'I saved the observation, but my real vision brain is not connected in this environment yet.',
    verdict: 'i can eat the photo. i refuse to hallucinate the bin.',
    tip: 'Connect REACT_APP_YUK_ANALYZE_URL to a vision + local waste-rules service for real photo analysis.',
  },
};

const DEMOS = ['cup', 'bottle', 'banana', 'can', 'battery'];

function normalizeAnalysis(data) {
  const materialKey = data.materialKey || data.material_key || 'unknown';
  return {
    key: data.key || 'remote',
    emoji: data.emoji || '🗑️',
    item: data.item || data.name || 'trash',
    material: data.material || 'unknown material',
    materialKey,
    bin: data.bin || data.disposal || 'check local rules',
    fate: data.fate || data.explanation || 'No material journey supplied.',
    verdict: data.verdict || 'hmm. edible data.',
    tip: data.tip || 'Waste rules vary by location.',
  };
}

function readHistory() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    // The monster still works if storage is unavailable.
  }
}

function materialCounts(history) {
  return history.reduce((counts, entry) => {
    const key = entry.materialKey || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function dominantMaterial(counts) {
  const keys = Object.keys(counts).filter(key => key !== 'unknown');
  if (!keys.length) return null;
  return keys.sort((a, b) => counts[b] - counts[a])[0];
}

class Monster extends Component {
  render() {
    const { counts, feeding, line } = this.props;
    const classNames = ['yuk-monster'];
    if (feeding) classNames.push('is-feeding');
    if (counts.plastic) classNames.push('has-plastic');
    if (counts.metal) classNames.push('has-metal');
    if (counts.organic) classNames.push('has-organic');
    if (counts.paper) classNames.push('has-paper');
    if (counts.ewaste) classNames.push('has-ewaste');
    if (counts.glass) classNames.push('has-glass');

    return (
      <div className="monster-stage" aria-label="YUK, your evolving trash monster">
        <div className="monster-speech" aria-live="polite">{line}</div>
        <svg className={classNames.join(' ')} viewBox="0 0 420 390" role="img" aria-hidden="true">
          <g className="monster-antenna">
            <path d="M207 86 C205 54 228 43 224 18" />
            <circle cx="225" cy="16" r="13" />
          </g>
          <g className="monster-sprout">
            <path d="M205 75 C206 49 201 32 188 19" />
            <path d="M190 23 C166 20 159 5 160 0 C179 -2 192 7 190 23 Z" />
            <path d="M190 24 C211 18 220 2 218 -5 C199 -4 187 7 190 24 Z" />
          </g>
          <path className="monster-paper-ear" d="M92 132 L46 99 L62 165 Z" />
          <path className="monster-body" d="M210 72 C291 71 346 123 349 207 C351 263 330 318 286 344 C247 368 170 366 128 346 C79 322 58 268 65 209 C73 137 126 74 210 72 Z" />
          <g className="monster-bubbles">
            <circle cx="96" cy="237" r="20" />
            <circle cx="322" cy="170" r="15" />
            <circle cx="290" cy="306" r="10" />
          </g>
          <g className="monster-glass-sparkles">
            <path d="M89 173 L95 188 L110 194 L95 200 L89 215 L83 200 L68 194 L83 188 Z" />
            <path d="M303 245 L307 254 L316 258 L307 262 L303 271 L299 262 L290 258 L299 254 Z" />
          </g>
          <g className="monster-face">
            <ellipse className="monster-eye" cx="162" cy="183" rx="22" ry="28" />
            <ellipse className="monster-eye" cx="259" cy="183" rx="22" ry="28" />
            <circle className="monster-pupil" cx="167" cy="190" r="8" />
            <circle className="monster-pupil" cx="264" cy="190" r="8" />
            <path className="monster-mouth" d="M148 246 C174 285 246 285 273 246 C248 258 175 258 148 246 Z" />
            <path className="monster-tongue" d="M183 268 C197 285 224 286 239 267 C225 264 199 264 183 268 Z" />
            <path className="monster-tooth" d="M185 253 L197 272 L209 253 Z" />
          </g>
          <g className="monster-battery-mark">
            <rect x="184" y="304" width="53" height="25" rx="8" />
            <rect x="237" y="311" width="7" height="11" rx="2" />
            <path d="M210 308 L201 319 L211 319 L205 327 L222 314 L212 314 L219 308 Z" />
          </g>
        </svg>
      </div>
    );
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    const history = readHistory();
    this.state = {
      history,
      status: 'idle',
      result: history.length ? history[0] : null,
      preview: null,
      monsterLine: history.length ? 'you came back. i kept the receipts. 🤤' : 'feed me something gross.',
      analyzerNote: null,
    };
    this.fileInput = null;
    this.handleFile = this.handleFile.bind(this);
    this.feedDemo = this.feedDemo.bind(this);
    this.clearHistory = this.clearHistory.bind(this);
  }

  fallbackForFile(file) {
    const name = (file.name || '').toLowerCase();
    if (/cup|coffee/.test(name)) return TRASH.cup;
    if (/bottle|pet/.test(name)) return TRASH.bottle;
    if (/banana|peel|food/.test(name)) return TRASH.banana;
    if (/can|aluminium|aluminum/.test(name)) return TRASH.can;
    if (/battery/.test(name)) return TRASH.battery;
    if (/glass|jar/.test(name)) return TRASH.glass;
    return TRASH.mystery;
  }

  analyzePhoto(file) {
    const endpoint = process.env.REACT_APP_YUK_ANALYZE_URL;
    if (!endpoint) {
      this.setState({ analyzerNote: 'prototype brain: photo capture works, real vision endpoint not configured' });
      return Promise.resolve(this.fallbackForFile(file));
    }

    const body = new FormData();
    body.append('image', file);
    body.append('locale', window.navigator.language || 'en');

    return fetch(endpoint, { method: 'POST', body })
      .then(response => {
        if (!response.ok) throw new Error('Analyzer returned ' + response.status);
        return response.json();
      })
      .then(data => {
        this.setState({ analyzerNote: 'vision brain connected' });
        return normalizeAnalysis(data);
      })
      .catch(() => {
        this.setState({ analyzerNote: 'vision brain unreachable, using safe prototype fallback' });
        return this.fallbackForFile(file);
      });
  }

  commitResult(result, source) {
    const entry = Object.assign({}, result, {
      id: String(Date.now()) + '-' + Math.random().toString(16).slice(2),
      source,
      createdAt: new Date().toISOString(),
    });
    const history = [entry].concat(this.state.history).slice(0, 40);
    saveHistory(history);
    this.setState({
      history,
      result: entry,
      status: 'done',
      monsterLine: result.verdict,
    });
  }

  handleFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = loadEvent => this.setState({ preview: loadEvent.target.result });
    reader.readAsDataURL(file);

    this.setState({
      status: 'feeding',
      monsterLine: 'sniff sniff... what is this??',
      analyzerNote: null,
    });

    this.analyzePhoto(file).then(result => {
      window.setTimeout(() => this.commitResult(result, 'photo'), 420);
    });

    event.target.value = '';
  }

  feedDemo(key) {
    this.setState({
      status: 'feeding',
      preview: null,
      analyzerNote: 'sample object: tap these to feel the complete YUK loop',
      monsterLine: 'NOM NOM NOM',
    });
    window.setTimeout(() => this.commitResult(TRASH[key], 'sample'), 360);
  }

  clearHistory() {
    saveHistory([]);
    this.setState({
      history: [],
      result: null,
      preview: null,
      status: 'idle',
      monsterLine: 'empty belly. tragic.',
      analyzerNote: null,
    });
  }

  renderResult() {
    const { result } = this.state;
    if (!result) return null;

    return (
      <section className="result-card" aria-live="polite">
        <div className="result-topline">
          <div className="result-emoji">{result.emoji}</div>
          <div>
            <div className="eyebrow">YUK thinks this is</div>
            <h2>{result.item}</h2>
            <div className={'material-pill material-' + result.materialKey}>{result.material}</div>
          </div>
        </div>
        <div className="result-grid">
          <div>
            <div className="result-label">where it goes</div>
            <p className="result-big">{result.bin}</p>
          </div>
          <div>
            <div className="result-label">what probably happens next</div>
            <p>{result.fate}</p>
          </div>
        </div>
        <div className="yuk-tip">💡 {result.tip}</div>
        <p className="local-warning">Generic prototype guidance only. Real disposal rules depend on your location and local waste system.</p>
      </section>
    );
  }

  renderHistory() {
    const recent = this.state.history.slice(0, 8);
    if (!recent.length) return null;

    return (
      <section className="history-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">your material autobiography</div>
            <h2>stuff YUK remembers</h2>
          </div>
          <button className="text-button" type="button" onClick={this.clearHistory}>wipe memory</button>
        </div>
        <div className="history-list">
          {recent.map(entry => (
            <div className="history-item" key={entry.id}>
              <span className="history-emoji">{entry.emoji}</span>
              <span className="history-name">{entry.item}</span>
              <span className="history-material">{entry.material}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  render() {
    const counts = materialCounts(this.state.history);
    const dominant = dominantMaterial(counts);
    const total = this.state.history.length;
    const feeding = this.state.status === 'feeding';

    return (
      <div className="App">
        <header className="site-header">
          <a className="wordmark" href="/" aria-label="YUK home">yuk<span>.wtf</span></a>
          <div className="belly-count"><strong>{total}</strong> things in belly</div>
        </header>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="kicker">AI trash creature / personal waste diary</div>
              <h1>feed me<br />your trash.</h1>
              <p className="hero-lede">Take a photo. YUK eats it, figures out what it is, tells you where it should go, and slowly becomes the trash you create.</p>

              <label className="camera-button">
                <span className="camera-icon">◉</span>
                <span>{feeding ? 'chewing...' : 'take photo / choose trash'}</span>
                <input
                  ref={input => { this.fileInput = input; }}
                  className="file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={this.handleFile}
                  disabled={feeding}
                />
              </label>

              <div className="demo-block">
                <span>or feed a sample</span>
                <div className="demo-buttons">
                  {DEMOS.map(key => (
                    <button key={key} type="button" disabled={feeding} onClick={() => this.feedDemo(key)}>
                      {TRASH[key].emoji} {TRASH[key].item}
                    </button>
                  ))}
                </div>
              </div>

              {this.state.analyzerNote && <div className="analyzer-note">{this.state.analyzerNote}</div>}
            </div>

            <div className="monster-column">
              {this.state.preview && feeding && (
                <div className="food-preview"><img src={this.state.preview} alt="Trash being fed to YUK" /></div>
              )}
              <Monster counts={counts} feeding={feeding} line={this.state.monsterLine} />
              <div className="evolution-note">
                {dominant ? 'currently evolving toward ' + dominant + ' creature' : 'feed YUK to mutate its body'}
              </div>
            </div>
          </section>

          {this.renderResult()}

          <section className="how-it-works">
            <div className="eyebrow">the loop</div>
            <div className="loop-grid">
              <div><span>01</span><strong>show trash</strong><p>Camera first. No taxonomy homework.</p></div>
              <div><span>02</span><strong>YUK eats</strong><p>Object + material analysis, then local disposal rules.</p></div>
              <div><span>03</span><strong>learn the fate</strong><p>Not just a bin. See where the material probably goes.</p></div>
              <div><span>04</span><strong>become your trash</strong><p>Your monster and history mutate with what you discard.</p></div>
            </div>
          </section>

          {this.renderHistory()}
        </main>

        <footer>
          <span>yuk.wtf</span>
          <span>your trash is data now 🤢</span>
        </footer>
      </div>
    );
  }
}

export default App;
