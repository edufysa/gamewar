import React, { useState, useEffect } from 'react';
import { Trophy, Play, RotateCcw, User, Flag, Zap, Loader2 } from 'lucide-react';

// --- KONFIGURASI GAME ---
// ---------------------------------------------------------
// MASUKKAN URL APPS SCRIPT ANDA DI BAWAH INI (DALAM TANDA KUTIP)
// Contoh: "https://script.google.com/macros/s/AKfycby.../exec"
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyesKcQQugl6DSaycJ54ym_GDIeu912xroZgV3PVtBe6uj_OyQOd6Lr1rBPD8X0TfrZ/exec"; 
// ---------------------------------------------------------

const WIN_SCORE = 10; 
const AVATARS = ['🐰', '🐢', '🦊', '🐼', '🐯', '🦁', '🦄', '🐸'];
const COLORS = [
  { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-500', ring: 'ring-blue-300' },
  { name: 'red', bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-500', ring: 'ring-red-300' },
  { name: 'green', bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-500', ring: 'ring-green-300' },
  { name: 'yellow', bg: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-400', ring: 'ring-yellow-300' },
];

// --- UTILITIES ---

// Generator Matematika (Cadangan jika tidak ada Spreadsheet)
const generateMathQuestion = () => {
  const types = ['+', '-', '*'];
  const type = types[Math.floor(Math.random() * types.length)];
  let a, b, ans;

  if (type === '+') {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    ans = a + b;
  } else if (type === '-') {
    a = Math.floor(Math.random() * 15) + 5;
    b = Math.floor(Math.random() * a); 
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 5) + 1;
    b = Math.floor(Math.random() * 5) + 1;
    ans = a * b;
  }

  let options = new Set();
  options.add(ans);
  while (options.size < 3) {
    let wrong = ans + Math.floor(Math.random() * 10) - 5;
    if (wrong >= 0 && wrong !== ans) options.add(wrong);
  }

  return {
    text: `${a} ${type === '*' ? '×' : type} ${b} = ?`,
    answer: ans,
    options: Array.from(options).sort(() => Math.random() - 0.5)
  };
};

// --- KOMPONEN UTAMA ---
export default function MathRaceGame() {
  const [phase, setPhase] = useState('setup'); 
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  
  // State untuk Soal Custom
  const [questionBank, setQuestionBank] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(false);

  // Fetch Data Spreadsheet saat awal load
  useEffect(() => {
    if (GOOGLE_SHEET_URL) {
      setIsLoadingData(true);
      fetch(GOOGLE_SHEET_URL)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setQuestionBank(data);
          }
          setIsLoadingData(false);
        })
        .catch(err => {
          console.error("Gagal mengambil soal:", err);
          setDataError(true);
          setIsLoadingData(false);
        });
    }
  }, []);

  // Fungsi Mendapatkan Soal (Prioritas: Spreadsheet > Matematika)
  const getQuestion = () => {
    if (questionBank.length > 0) {
      // Ambil acak dari bank soal
      const rawQ = questionBank[Math.floor(Math.random() * questionBank.length)];
      // Shuffle opsi jawaban agar tidak selalu di posisi sama
      // rawQ.rawOptions berisi [JawabanBenar, Salah1, Salah2] dari spreadsheet
      const shuffledOptions = [...rawQ.rawOptions].sort(() => Math.random() - 0.5);
      
      return {
        text: rawQ.text,
        answer: rawQ.answer,
        options: shuffledOptions
      };
    }
    // Fallback ke matematika
    return generateMathQuestion();
  };

  // --- LOGIC SETUP ---
  const handleStartGame = (playerNames) => {
    const newPlayers = playerNames.map((name, idx) => ({
      id: idx,
      name: name || `Pemain ${idx + 1}`,
      avatar: AVATARS[idx % AVATARS.length],
      color: COLORS[idx % COLORS.length],
      score: 0,
      question: getQuestion(), // Gunakan fungsi getQuestion baru
      isWrong: false 
    }));
    setPlayers(newPlayers);
    setPhase('playing');
    setWinner(null);
  };

  // --- LOGIC GAMEPLAY ---
  const handleAnswer = (playerId, selectedValue) => {
    const pIdx = players.findIndex(p => p.id === playerId);
    if (pIdx === -1) return;

    const player = players[pIdx];
    // Perbandingan: Ubah ke string untuk keamanan perbandingan data spreadsheet vs angka
    const isCorrect = String(selectedValue) === String(player.question.answer);

    const updatedPlayers = [...players];
    
    if (isCorrect) {
      updatedPlayers[pIdx].score += 1;
      updatedPlayers[pIdx].isWrong = false;
      
      if (updatedPlayers[pIdx].score >= WIN_SCORE) {
        setPlayers(updatedPlayers);
        setWinner(updatedPlayers[pIdx]);
        setPhase('victory');
        return;
      }
      
      // Ganti Soal
      updatedPlayers[pIdx].question = getQuestion();
    } else {
      updatedPlayers[pIdx].isWrong = true;
      setTimeout(() => {
        setPlayers(prev => {
          const curr = [...prev];
          if(curr[pIdx]) curr[pIdx].isWrong = false;
          return curr;
        });
      }, 500);
    }

    setPlayers(updatedPlayers);
  };

  const resetGame = () => {
    setPhase('setup');
    setPlayers([]);
    setWinner(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 select-none flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm p-3 sticky top-0 z-20">
        <div className="max-w-[95%] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flag className="text-blue-500 w-6 h-6" />
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lomba Lari Pintar
            </h1>
          </div>
          {phase === 'playing' && (
            <div className="flex items-center gap-1 text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Target: {WIN_SCORE}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[95%] mx-auto p-2 md:p-4 flex-1 flex flex-col w-full">
        
        {/* Status Data Source (Optional, buat debug user) */}
        {phase === 'setup' && GOOGLE_SHEET_URL && (
           <div className="mb-4 text-center">
              {isLoadingData && <span className="text-xs text-blue-500 flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat Soal dari Spreadsheet...</span>}
              {dataError && <span className="text-xs text-red-500">Gagal memuat soal spreadsheet. Menggunakan soal matematika default.</span>}
              {!isLoadingData && !dataError && questionBank.length > 0 && <span className="text-xs text-green-600 font-bold">✓ Menggunakan {questionBank.length} Soal dari Spreadsheet</span>}
           </div>
        )}

        {phase === 'setup' && (
          <div className="flex-1 flex items-center justify-center">
            <SetupScreen numPlayers={numPlayers} setNumPlayers={setNumPlayers} onStart={handleStartGame} isLoading={isLoadingData} />
          </div>
        )}

        {phase === 'playing' && (
          <div className="flex flex-col gap-4 h-full">
            {/* TRACK ARENA */}
            <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 relative">
               <div className="absolute right-[5%] top-0 bottom-0 border-r-2 border-dashed border-slate-300 z-0"></div>
               <div className="space-y-4">
                  {players.map((p) => (
                    <div key={p.id} className="relative h-10 flex items-center">
                      <div className="absolute w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${p.color.bg}`} 
                          style={{ width: `${(p.score / WIN_SCORE) * 100}%` }}
                        />
                      </div>
                      <div 
                        className="absolute transition-all duration-500 ease-out transform -translate-x-1/2 flex flex-col items-center z-10"
                        style={{ left: `${Math.min((p.score / WIN_SCORE) * 100, 100)}%` }}
                      >
                        <span className="text-3xl filter drop-shadow-md">{p.avatar}</span>
                        <span className={`text-[10px] font-bold px-1.5 rounded text-white ${p.color.bg} leading-tight`}>
                          {p.name}
                        </span>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* CONTROLS GRID */}
            <div className={`grid gap-2 flex-1 w-full ${
              players.length === 3 ? 'grid-cols-3' : 
              players.length === 4 ? 'grid-cols-4' : 
              'grid-cols-2'
            }`}>
              {players.map((player) => (
                <PlayerControlPanel 
                  key={player.id} 
                  player={player} 
                  onAnswer={handleAnswer}
                  isCompact={players.length > 2} 
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'victory' && (
          <div className="flex-1 flex items-center justify-center">
            <VictoryScreen winner={winner} players={players} onRestart={resetGame} />
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="p-4 text-center text-slate-400 text-sm font-medium mt-auto">
        Created by Mas Alfy
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function PlayerControlPanel({ player, onAnswer, isCompact }) {
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border-b-4 shadow-sm transition-all duration-200 flex flex-col
      ${player.color.light} ${player.color.border}
      ${player.isWrong ? 'animate-shake ring-4 ring-red-400' : ''}
    `}>
      <div className={`px-2 py-2 flex flex-col xl:flex-row justify-between items-center bg-white/50 border-b border-white/50 text-center`}>
        <div className="flex items-center gap-1 justify-center w-full xl:w-auto xl:justify-start">
          <span className={`${isCompact ? 'text-lg' : 'text-2xl'}`}>{player.avatar}</span>
          <span className={`font-bold ${isCompact ? 'text-xs truncate w-full' : 'text-base'} ${player.color.text}`}>
            {player.name}
          </span>
        </div>
        <div className={`font-bold bg-white px-2 py-0.5 rounded text-slate-500 mt-1 xl:mt-0 ${isCompact ? 'text-[10px]' : 'text-xs'}`}>
          Skor: {player.score}
        </div>
      </div>

      <div className="p-1 md:p-2 flex flex-col items-center justify-center gap-2 h-full">
        <div className={`${isCompact ? 'text-lg md:text-xl' : 'text-2xl md:text-3xl'} font-black text-slate-800 tracking-tight text-center whitespace-normal my-1 leading-tight`}>
          {player.question.text}
        </div>
        
        <div className={`grid ${isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-3'} gap-1 md:gap-2 w-full mt-auto`}>
          {player.question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onAnswer(player.id, opt)}
              className={`
                py-2 rounded-lg font-bold shadow-sm border-b-2 active:border-b-0 active:translate-y-1 transition-all
                bg-white border-slate-200 text-slate-700 hover:bg-white
                ${player.color.text} active:bg-slate-50
                ${isCompact ? 'text-sm' : 'text-lg'}
                whitespace-normal break-words h-full min-h-[3rem] flex items-center justify-center px-1
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {player.isWrong && (
        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-75">
          <span className={`${isCompact ? 'text-lg' : 'text-3xl'} font-black text-red-600 bg-white px-3 py-1 rounded-xl shadow-lg rotate-12`}>
            SALAH!
          </span>
        </div>
      )}
    </div>
  );
}

function SetupScreen({ numPlayers, setNumPlayers, onStart, isLoading }) {
  const [names, setNames] = useState(Array(4).fill(''));

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(names.slice(0, numPlayers));
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 border-blue-500 p-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 mx-auto mb-2 text-blue-500" />
        <h2 className="text-2xl font-bold text-slate-800">Persiapan Lomba</h2>
        <p className="text-slate-400 text-sm">Siapkan Peserta!</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Jumlah Pemain</label>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {[2, 3, 4].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setNumPlayers(num)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  numPlayers === num 
                    ? 'bg-white text-blue-600 shadow-md' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {Array.from({ length: numPlayers }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${COLORS[idx % COLORS.length].bg} text-white`}>
                {AVATARS[idx]}
              </div>
              <input
                required
                type="text"
                placeholder={`Pemain ${idx + 1}`}
                value={names[idx]}
                onChange={(e) => {
                    const newNames = [...names];
                    newNames[idx] = e.target.value;
                    setNames(newNames);
                }}
                className="flex-1 p-3 rounded-xl border-2 border-slate-200 focus:border-blue-400 focus:outline-none bg-slate-50"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoading ? <Loader2 className="animate-spin"/> : <Play className="w-5 h-5 fill-current" />}
          {isLoading ? 'Sedang Memuat...' : 'Mulai Balapan!'}
        </button>
      </form>
    </div>
  );
}

function VictoryScreen({ winner, players, onRestart }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-lg text-center animate-in zoom-in duration-500">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-b-8 border-yellow-400 mb-6">
        <div className="bg-yellow-400 p-8 text-yellow-900">
          <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-700 fill-yellow-500" />
          <h2 className="text-4xl font-black">JUARA 1</h2>
          <p className="text-xl font-bold">{winner.name}</p>
        </div>
        <div className="p-8">
          <div className="text-8xl mb-2 animate-bounce">{winner.avatar}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 text-left">
        {sortedPlayers.map((player, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 border-b last:border-0 border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-400">#{idx + 1}</span>
              <span className="text-xl">{player.avatar}</span>
              <span className="font-semibold text-slate-700">{player.name}</span>
            </div>
            <span className="font-bold text-slate-500">{player.score} Poin</span>
          </div>
        ))}
      </div>

      <button
        onClick={onRestart}
        className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 px-8 rounded-full shadow-xl flex items-center gap-2 mx-auto"
      >
        <RotateCcw className="w-5 h-5" />
        Main Lagi
      </button>
    </div>
  );
}
