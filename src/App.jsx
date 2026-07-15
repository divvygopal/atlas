import { useState } from 'react';
import Stage from './components/Stage.jsx';
import Home from './screens/Home.jsx';
import ModeSelect from './screens/ModeSelect.jsx';
import CountSelect from './screens/CountSelect.jsx';
import TimeSelect from './screens/TimeSelect.jsx';
import PlayQuiz from './screens/PlayQuiz.jsx';
import PlayCountries from './screens/PlayCountries.jsx';
import Results from './screens/Results.jsx';
import ResultsCountries from './screens/ResultsCountries.jsx';
import Browse from './screens/Browse.jsx';
import countriesData from './data/countries.json';
import letterPairsData from './data/letterPairs.json';

export default function App() {
  const [route, setRoute] = useState('home');
  const [mode, setMode] = useState(null); // capitals | flags | letter
  const [count, setCount] = useState(25);
  const [continent, setContinent] = useState(null); // capitals/flags "by continent"
  const [minutes, setMinutes] = useState(15);
  const [result, setResult] = useState(null);
  const [runId, setRunId] = useState(0); // forces a fresh run on "play again"

  const newRun = () => setRunId((r) => r + 1);

  let screen = null;

  if (route === 'home') {
    screen = <Home onStart={() => setRoute('mode')} onBrowse={() => setRoute('browse')} />;
  } else if (route === 'browse') {
    screen = <Browse onBack={() => setRoute('home')} />;
  } else if (route === 'mode') {
    screen = (
      <ModeSelect
        onSelect={(id) => {
          if (id === 'countries') setRoute('time');
          else { setMode(id); setRoute('count'); }
        }}
        onBack={() => setRoute('home')}
      />
    );
  } else if (route === 'count') {
    screen = (
      <CountSelect
        mode={mode}
        poolAll={mode === 'letter' ? letterPairsData.length : countriesData.length}
        onSelect={(cfg) => {
          if (cfg.continent) { setContinent(cfg.continent); setCount('all'); }
          else { setContinent(null); setCount(cfg.count); }
          newRun();
          setRoute('quiz');
        }}
        onBack={() => setRoute('mode')}
      />
    );
  } else if (route === 'time') {
    screen = (
      <TimeSelect
        onSelect={(m) => { setMinutes(m); newRun(); setRoute('countries'); }}
        onBack={() => setRoute('mode')}
      />
    );
  } else if (route === 'quiz') {
    screen = (
      <PlayQuiz
        key={`quiz-${mode}-${count}-${continent}-${runId}`}
        mode={mode}
        count={count}
        continent={continent}
        onDone={(r) => { setResult(r); setRoute('results'); }}
        onQuit={() => setRoute('mode')}
      />
    );
  } else if (route === 'countries') {
    screen = (
      <PlayCountries
        key={`countries-${minutes}-${runId}`}
        minutes={minutes}
        onDone={(r) => { setResult(r); setRoute('results-countries'); }}
        onQuit={() => setRoute('mode')}
      />
    );
  } else if (route === 'results') {
    screen = (
      <Results
        result={result}
        onPlayAgain={() => { newRun(); setRoute('quiz'); }}
        onMenu={() => setRoute('mode')}
      />
    );
  } else if (route === 'results-countries') {
    screen = (
      <ResultsCountries
        result={result}
        onPlayAgain={() => { newRun(); setRoute('countries'); }}
        onMenu={() => setRoute('mode')}
      />
    );
  }

  return <Stage>{screen}</Stage>;
}
