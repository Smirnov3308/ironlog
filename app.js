const {
  useState,
  useEffect,
  useRef,
  useCallback
} = React;

// ── PROGRAM CONFIG ───────────────────────────────────────────────────────────
// Exercises with `alts` can be swapped. Each alt has its own id/weight/step.
// `defaultAlt` = index used by default (0 = first alt).
const PROGRAM = {
  A: {
    label: "Day A",
    muscles: "Chest · Back · Legs",
    exercises: [{
      slot: "bench_a",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "bench_a",
        name: "Bench Press",
        reps: 10,
        weight: 60,
        step: 2.5
      }]
    }, {
      slot: "pull_a",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "row_a",
        name: "Compound Row",
        reps: 10,
        weight: 60,
        step: 10,
        progressReps: 12
      }, {
        id: "vlat_a",
        name: "Vertical",
        reps: 10,
        weight: 60,
        step: 10
      }, {
        id: "pullup_a",
        name: "Pull-ups",
        reps: "max",
        weight: null,
        step: null
      }]
    }, {
      slot: "fly_a",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "fly_a",
        name: "Pec Fly",
        reps: 12,
        weight: 60,
        step: 3.75,
        progressReps: 14
      }]
    }, {
      slot: "legpress_a",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "legpress_a",
        name: "Leg Press",
        reps: 15,
        weight: 52.5,
        step: 3.75
      }]
    }]
  },
  B: {
    label: "Day B",
    muscles: "Chest · Back · Shoulders · Biceps · Triceps",
    exercises: [{
      slot: "bench_b",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "bench_b",
        name: "Bench Press",
        reps: 10,
        weight: 60,
        step: 2.5
      }]
    }, {
      slot: "pull_b",
      sets: 4,
      defaultAlt: 1,
      alts: [{
        id: "pullup_b",
        name: "Pull-ups",
        reps: "max",
        weight: null,
        step: null
      }, {
        id: "vlat_b",
        name: "Vertical",
        reps: 10,
        weight: 60,
        step: 10
      }, {
        id: "hrow_b",
        name: "Compound Row",
        reps: 10,
        weight: 60,
        step: 10,
        progressReps: 12
      }]
    }, {
      slot: "lateral_b",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "lateral_b",
        name: "Lateral Raise",
        reps: 15,
        weight: 32,
        step: 5,
        progressReps: 18
      }]
    }, {
      slot: "bicep_b",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "bicep_b",
        name: "Bicep Curl",
        reps: 8,
        weight: 12,
        step: 1
      }]
    }, {
      slot: "triceps_b",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "triceps_b",
        name: "Triceps Pushdown",
        reps: 10,
        weight: 30,
        step: 3.75
      }]
    }]
  },
  C: {
    label: "Day C",
    muscles: "Chest · Shoulders · Core · Back",
    exercises: [{
      slot: "bench_c",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "bench_c",
        name: "Bench Press",
        reps: 10,
        weight: 60,
        step: 2.5
      }]
    }, {
      slot: "shpress_c",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "shpress_c",
        name: "Shoulder Press",
        reps: 12,
        weight: 33.75,
        step: 3.75
      }]
    }, {
      slot: "crunch_c",
      sets: 4,
      defaultAlt: 0,
      alts: [{
        id: "crunch_c",
        name: "Cable Crunches",
        reps: 15,
        weight: 32.5,
        step: 3.75
      }]
    }, {
      slot: "pull_c",
      sets: 4,
      defaultAlt: 2,
      alts: [{
        id: "pullup_c",
        name: "Pull-ups",
        reps: "max",
        weight: null,
        step: null
      }, {
        id: "vlat_c",
        name: "Vertical",
        reps: 10,
        weight: 60,
        step: 10
      }, {
        id: "hrow_c",
        name: "Compound Row",
        reps: 10,
        weight: 60,
        step: 10,
        progressReps: 12
      }]
    }]
  }
};
Object.freeze(PROGRAM);

// Resolve a slot definition → flat exercise object using current subs state
function resolveEx(exDef, subs, customAlts = {}) {
  const allAlts = [...exDef.alts, ...(customAlts[exDef.slot] || [])];
  const selected = subs[exDef.slot];
  let alt;
  if (typeof selected === 'number') alt = exDef.alts[selected] || allAlts[0];else if (typeof selected === 'string') alt = allAlts.find(a => a.id === selected) || allAlts[0];else alt = allAlts[exDef.defaultAlt] || allAlts[0];
  return {
    ...alt,
    sets: exDef.sets,
    slot: exDef.slot,
    allAlts,
    defaultAlt: exDef.defaultAlt
  };
}

// Collect all concrete weighted exercises (for steps defaults)
function getAllWeighted() {
  const all = [];
  Object.values(PROGRAM).forEach(d => d.exercises.forEach(exDef => {
    exDef.alts.forEach(alt => {
      if (alt.weight !== null && alt.step !== null && !all.find(x => x.id === alt.id)) all.push({
        ...alt,
        sets: exDef.sets
      });
    });
  }));
  return all;
}
const ALL_WEIGHTED = getAllWeighted();
const DEFAULT_STEPS = Object.fromEntries(ALL_WEIGHTED.map(e => [e.id, {
  step: e.step,
  progressReps: e.progressReps ?? e.reps
}]));
const ALL_EXERCISES = [];
Object.values(PROGRAM).forEach(d => d.exercises.forEach(exDef => {
  exDef.alts.forEach(alt => {
    if (!ALL_EXERCISES.find(e => e.name === alt.name)) ALL_EXERCISES.push(alt);
  });
}));
const DEFAULT_SUBS = {};
Object.values(PROGRAM).forEach(d => d.exercises.forEach(exDef => {
  if (exDef.alts) DEFAULT_SUBS[exDef.slot] = exDef.defaultAlt;
}));
const DEFAULT_WEIGHTS = {};
Object.values(PROGRAM).forEach(d => d.exercises.forEach(exDef => {
  exDef.alts.forEach(alt => {
    if (alt.weight !== null) DEFAULT_WEIGHTS[alt.id] = alt.weight;
  });
}));
const DEFAULT_STATE = {
  weights: DEFAULT_WEIGHTS,
  steps: DEFAULT_STEPS,
  subs: DEFAULT_SUBS,
  customAlts: {},
  history: [],
  restSeconds: 120
};
const ACCENT = {
  A: "#22c55e",
  B: "#3b82f6",
  C: "#f97316"
};

// ── STORAGE ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "ironlog_v1";
async function loadFromStorage() {
  // Claude artifact storage
  try {
    const r = await window.storage.get(STORAGE_KEY);
    if (r) return JSON.parse(r.value);
  } catch {}
  // localStorage fallback (GitHub Pages, standalone)
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) return JSON.parse(r);
  } catch {}
  // Migration from older keys
  for (const oldKey of ["wt_v6", "wt_v5", "wt_v4"]) {
    try {
      const r = await window.storage.get(oldKey);
      if (r) return JSON.parse(r.value);
    } catch {}
    try {
      const r = localStorage.getItem(oldKey);
      if (r) return JSON.parse(r);
    } catch {}
  }
  return null;
}
async function persistState(s) {
  const json = JSON.stringify(s);
  try {
    await window.storage.set(STORAGE_KEY, json);
  } catch {}
  try {
    localStorage.setItem(STORAGE_KEY, json);
  } catch {}
}

// ── EXPORT ───────────────────────────────────────────────────────────────────
function formatWorkout(rec) {
  let txt = rec.label + "\n";
  rec.exercises.forEach(ex => {
    txt += ex.name + "\n";
    ex.sets.forEach(s => {
      if (!s.done) return;
      const w = ex.weight != null ? ex.weight : "BW";
      const r = s.reps === "" ? "?" : s.reps;
      txt += `${w} - ${r}\n`;
    });
  });
  return txt.trimEnd();
}
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

// ── REST TIMER ───────────────────────────────────────────────────────────────
function RestTimer({
  accent,
  restartRef,
  target = 120
}) {
  const [startedAt, setStartedAt] = useState(null); // timestamp or null
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);
  const vibratedRef = useRef(false);
  const TARGET = target;
  const running = startedAt !== null;
  useEffect(() => {
    if (!running) return;
    const tick = () => setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 500);
    return () => clearInterval(intervalRef.current);
  }, [startedAt]);

  // Vibrate once when timer reaches target
  useEffect(() => {
    if (running && seconds >= TARGET && !vibratedRef.current) {
      vibratedRef.current = true;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [seconds, running, TARGET]);

  // Also sync on visibility change (returning from background)
  useEffect(() => {
    const onVisible = () => {
      if (startedAt) setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [startedAt]);
  const restart = useCallback(() => {
    vibratedRef.current = false;
    setStartedAt(Date.now());
    setSeconds(0);
  }, []);
  const stop = () => {
    setStartedAt(null);
  };
  useEffect(() => {
    if (restartRef) restartRef.current = restart;
  }, [restart, restartRef]);
  const pct = Math.min(seconds / TARGET, 1);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const ready = seconds >= TARGET;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      background: "#111113",
      border: `1px solid ${running ? accent + "33" : "#1e1e22"}`,
      borderRadius: 10,
      padding: "10px 14px",
      transition: "border-color 0.3s"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: restart,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flex: 1,
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 36,
      height: 36,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 36 36",
    style: {
      transform: "rotate(-90deg)"
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "15",
    fill: "none",
    stroke: "#1e1e22",
    strokeWidth: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "18",
    r: "15",
    fill: "none",
    stroke: ready ? accent : "#555",
    strokeWidth: "3",
    strokeLinecap: "round",
    strokeDasharray: `${pct * 94.25} 94.25`,
    style: {
      transition: "stroke-dasharray 0.3s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 8,
      fontWeight: 700,
      color: ready ? accent : "#666",
      fontFamily: "monospace"
    }
  }, ready ? "GO" : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 22,
      fontWeight: 700,
      color: ready ? accent : running ? "#ccc" : "#555",
      letterSpacing: 2,
      minWidth: 70,
      transition: "color 0.3s"
    }
  }, mm, ":", ss)), running && /*#__PURE__*/React.createElement("button", {
    onClick: stop,
    style: {
      background: "#1e1e22",
      border: "1px solid #2a2a2e",
      color: "#666",
      borderRadius: 8,
      padding: "6px 12px",
      cursor: "pointer",
      fontSize: 10,
      fontWeight: 700,
      fontFamily: "inherit",
      letterSpacing: 1,
      WebkitTapHighlightColor: "transparent"
    }
  }, "STOP"), !running && /*#__PURE__*/React.createElement("div", {
    onClick: restart,
    style: {
      cursor: "pointer",
      fontSize: 11,
      color: "#444",
      fontWeight: 600,
      letterSpacing: 1,
      WebkitTapHighlightColor: "transparent"
    }
  }, seconds > 0 ? "↺" : "START"));
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [state, setStateRaw] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [session, setSession] = useState(null);
  const [view, setView] = useState("home");
  const [toast, setToast] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, onConfirm, danger }
  const [chartFor, setChartFor] = useState(null); // exercise name for progress chart

  useEffect(() => {
    loadFromStorage().then(stored => {
      if (stored) {
        setStateRaw({
          ...DEFAULT_STATE,
          ...stored,
          steps: {
            ...DEFAULT_STEPS,
            ...(stored.steps || {})
          },
          subs: {
            ...DEFAULT_SUBS,
            ...(stored.subs || {})
          },
          customAlts: stored.customAlts || {},
          weights: {
            ...DEFAULT_WEIGHTS,
            ...(stored.weights || {})
          },
          restSeconds: stored.restSeconds || 120
        });
      }
      setLoaded(true);
    });
  }, []);
  const setState = useCallback(updater => {
    setStateRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistState(next);
      return next;
    });
  }, []);
  function showToast(msg, color = "#22c55e") {
    setToast({
      msg,
      color
    });
    setTimeout(() => setToast(null), 3500);
  }
  function getDayExercises(dayKey, subs, customAlts = {}) {
    return PROGRAM[dayKey].exercises.map(exDef => resolveEx(exDef, subs, customAlts));
  }
  function startDay(dayKey) {
    const exercises = getDayExercises(dayKey, state.subs, state.customAlts);
    setActiveDay(dayKey);
    setSession(exercises.map(ex => ({
      exId: ex.id,
      slot: ex.slot || null,
      weight: state.weights[ex.id] ?? ex.weight,
      sets: Array.from({
        length: ex.sets
      }, () => ({
        done: false,
        reps: ex.reps === "max" ? "" : ex.reps
      }))
    })));
    setView("workout");
  }
  function swapExercise(exIdx, newAltId) {
    const exDef = PROGRAM[activeDay].exercises[exIdx];
    const allAlts = [...exDef.alts, ...(state.customAlts[exDef.slot] || [])];
    const newAlt = allAlts.find(a => a.id === newAltId) || allAlts[0];
    setState(prev => ({
      ...prev,
      subs: {
        ...prev.subs,
        [exDef.slot]: newAltId
      }
    }));
    const resolved = {
      ...newAlt,
      sets: exDef.sets
    };
    setSession(s => s.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        exId: resolved.id,
        slot: exDef.slot,
        weight: state.weights[resolved.id] ?? resolved.weight,
        sets: Array.from({
          length: resolved.sets
        }, () => ({
          done: false,
          reps: resolved.reps === "max" ? "" : resolved.reps
        }))
      };
    }));
  }
  function addCustomAlt(exIdx, name) {
    const exDef = PROGRAM[activeDay].exercises[exIdx];
    const currentEx = resolveEx(exDef, state.subs, state.customAlts);
    const sessionEx = session[exIdx];
    const newId = "custom_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const newAlt = {
      id: newId,
      name,
      reps: currentEx.reps === "max" ? "max" : currentEx.reps,
      weight: sessionEx.weight,
      step: state.steps[currentEx.id]?.step || currentEx.step,
      progressReps: currentEx.progressReps
    };
    setState(prev => ({
      ...prev,
      customAlts: {
        ...prev.customAlts,
        [exDef.slot]: [...(prev.customAlts[exDef.slot] || []), newAlt]
      },
      subs: {
        ...prev.subs,
        [exDef.slot]: newId
      }
    }));
    setSession(s => s.map((ex, i) => {
      if (i !== exIdx) return ex;
      return {
        exId: newId,
        slot: exDef.slot,
        weight: sessionEx.weight,
        sets: Array.from({
          length: exDef.sets
        }, () => ({
          done: false,
          reps: newAlt.reps === "max" ? "" : newAlt.reps
        }))
      };
    }));
  }
  function removeCustomAlt(slot, altId) {
    setState(prev => {
      const newCustomAlts = {
        ...prev.customAlts
      };
      newCustomAlts[slot] = (newCustomAlts[slot] || []).filter(a => a.id !== altId);
      if (newCustomAlts[slot].length === 0) delete newCustomAlts[slot];
      const newSubs = {
        ...prev.subs
      };
      if (newSubs[slot] === altId) delete newSubs[slot];
      return {
        ...prev,
        customAlts: newCustomAlts,
        subs: newSubs
      };
    });
  }
  function adoptExercise(exIdx, ex) {
    const exDef = PROGRAM[activeDay].exercises[exIdx];
    const altEntry = {
      id: ex.id,
      name: ex.name,
      reps: ex.reps,
      weight: ex.weight,
      step: ex.step,
      progressReps: ex.progressReps
    };
    setState(prev => ({
      ...prev,
      customAlts: {
        ...prev.customAlts,
        [exDef.slot]: [...(prev.customAlts[exDef.slot] || []).filter(a => a.id !== ex.id), altEntry]
      },
      subs: {
        ...prev.subs,
        [exDef.slot]: ex.id
      }
    }));
    setSession(s => s.map((sessionEx, i) => {
      if (i !== exIdx) return sessionEx;
      return {
        exId: ex.id,
        slot: exDef.slot,
        weight: state.weights[ex.id] ?? ex.weight,
        sets: Array.from({
          length: exDef.sets
        }, () => ({
          done: false,
          reps: ex.reps === "max" ? "" : ex.reps
        }))
      };
    }));
  }
  function toggleSet(exIdx, setIdx) {
    setSession(s => s.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((set, j) => j !== setIdx ? set : {
        ...set,
        done: !set.done
      })
    }));
  }
  function updateReps(exIdx, setIdx, val) {
    setSession(s => s.map((ex, i) => i !== exIdx ? ex : {
      ...ex,
      sets: ex.sets.map((set, j) => j !== setIdx ? set : {
        ...set,
        reps: val
      })
    }));
  }
  function updateSessionWeight(exIdx, dir) {
    setSession(s => s.map((ex, i) => {
      if (i !== exIdx) return ex;
      const step = state.steps[ex.exId]?.step ?? 2.5;
      const next = Math.round((ex.weight + dir * step) * 100) / 100;
      return {
        ...ex,
        weight: Math.max(0, next)
      };
    }));
  }
  function finishWorkout() {
    const exercises = getDayExercises(activeDay, state.subs, state.customAlts);
    const newWeights = {
      ...state.weights
    };
    const changes = [];
    session.forEach((exSession, i) => {
      const ex = exercises.find(e => e.id === exSession.exId) || exercises[i];
      if (!ex || ex.weight === null || ex.step === null) return;
      const cfg = state.steps[ex.id] || {
        step: ex.step,
        progressReps: ex.progressReps ?? ex.reps
      };
      const threshold = Number(cfg.progressReps ?? ex.reps);
      const allDone = exSession.sets.every(s => s.done && Number(s.reps) >= threshold);
      if (allDone) {
        newWeights[ex.id] = Math.round((exSession.weight + cfg.step) * 100) / 100;
        changes.push({
          name: ex.name,
          from: exSession.weight,
          to: newWeights[ex.id]
        });
      }
    });
    const record = {
      date: new Date().toISOString(),
      dateStr: new Date().toLocaleDateString(navigator.language || "en-GB"),
      day: activeDay,
      label: PROGRAM[activeDay].label,
      exercises: session.filter(exSes => exSes.sets.some(s => s.done)).map((exSes, i) => {
        const exDef = exercises.find(e => e.id === exSes.exId) || exercises[i];
        return {
          name: exDef?.name || exSes.exId,
          weight: exSes.weight,
          sets: exSes.sets
        };
      })
    };
    setState(prev => ({
      ...prev,
      weights: newWeights,
      history: [record, ...prev.history].slice(0, 200)
    }));
    if (changes.length) {
      showToast(`↑ ${changes.map(c => `${c.name} ${c.from}→${c.to}kg`).join(" · ")}`, ACCENT[activeDay]);
    } else {
      showToast("Workout saved", "#666");
    }
    setView("home");
    setSession(null);
    setActiveDay(null);
  }
  function updateStepCfg(exId, field, val) {
    setState(prev => ({
      ...prev,
      steps: {
        ...prev.steps,
        [exId]: {
          ...prev.steps[exId],
          [field]: parseFloat(val) || prev.steps[exId]?.[field]
        }
      }
    }));
  }
  function updateWeight(exId, val) {
    const w = parseFloat(val);
    if (isNaN(w) || w < 0) return;
    setState(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [exId]: w
      }
    }));
  }
  function handleExport(rec) {
    copyText(formatWorkout(rec)).then(ok => {
      showToast(ok ? "Copied" : "Copy failed", ok ? "#22c55e" : "#ef4444");
    });
  }
  function handleReset() {
    setState(DEFAULT_STATE);
    showToast("Data reset", "#ef4444");
    setConfirmReset(false);
  }
  function updateRestSeconds(val) {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 5 || n > 600) return;
    setState(prev => ({
      ...prev,
      restSeconds: n
    }));
  }
  function exportBackup() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ironlog-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Backup exported", "#22c55e");
    } catch (e) {
      showToast("Export failed", "#ef4444");
    }
  }
  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.history)) {
          showToast("Invalid backup file", "#ef4444");
          return;
        }
        setConfirmAction({
          title: "Import backup?",
          message: `This will replace current data with backup (${parsed.history.length} workouts).`,
          danger: true,
          onConfirm: () => {
            setState({
              ...DEFAULT_STATE,
              ...parsed,
              steps: {
                ...DEFAULT_STEPS,
                ...(parsed.steps || {})
              },
              subs: {
                ...DEFAULT_SUBS,
                ...(parsed.subs || {})
              },
              weights: {
                ...DEFAULT_WEIGHTS,
                ...(parsed.weights || {})
              },
              customAlts: parsed.customAlts || {},
              history: parsed.history,
              restSeconds: parsed.restSeconds || 120
            });
            showToast("Backup imported", "#22c55e");
            setConfirmAction(null);
          }
        });
      } catch (err) {
        showToast("Invalid JSON", "#ef4444");
      }
    };
    reader.readAsText(file);
  }
  if (!loaded) return /*#__PURE__*/React.createElement("div", {
    style: S.loadingScreen
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 32,
      fontWeight: 800,
      letterSpacing: 6,
      color: "#222"
    }
  }, "IRONLOG"));
  return /*#__PURE__*/React.createElement("div", {
    style: S.root
  }, /*#__PURE__*/React.createElement("style", null, GLOBAL_CSS), toast && /*#__PURE__*/React.createElement("div", {
    key: toast.msg,
    className: "safe-toast",
    style: {
      ...S.toast,
      borderColor: toast.color,
      color: toast.color
    }
  }, toast.msg), confirmReset && /*#__PURE__*/React.createElement("div", {
    style: S.overlay,
    onClick: () => setConfirmReset(false)
  }, /*#__PURE__*/React.createElement("div", {
    style: S.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#fff",
      marginBottom: 8
    }
  }, "Reset all data?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#666",
      marginBottom: 24,
      lineHeight: 1.5
    }
  }, "Weights, history and settings will be deleted."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmReset(false),
    style: S.modalBtnCancel
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: handleReset,
    style: S.modalBtnDanger
  }, "Reset")))), confirmAction && /*#__PURE__*/React.createElement("div", {
    style: S.overlay,
    onClick: () => setConfirmAction(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: S.modal,
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      color: "#fff",
      marginBottom: 8
    }
  }, confirmAction.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#666",
      marginBottom: 24,
      lineHeight: 1.5
    }
  }, confirmAction.message), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setConfirmAction(null),
    style: S.modalBtnCancel
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    onClick: confirmAction.onConfirm,
    style: confirmAction.danger ? S.modalBtnDanger : S.modalBtnPrimary
  }, "OK")))), chartFor && /*#__PURE__*/React.createElement("div", {
    style: S.overlay,
    onClick: () => setChartFor(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.modal,
      maxWidth: 420
    },
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement(ProgressChart, {
    name: chartFor,
    history: state.history
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setChartFor(null),
    style: {
      ...S.modalBtnCancel,
      width: "100%",
      marginTop: 16
    }
  }, "Close"))), view === "home" && /*#__PURE__*/React.createElement(HomeView, {
    state: state,
    onStart: startDay,
    onHistory: () => setView("history"),
    onSettings: () => setView("settings"),
    onReset: () => setConfirmReset(true)
  }), view === "workout" && session && /*#__PURE__*/React.createElement(WorkoutView, {
    dayKey: activeDay,
    day: PROGRAM[activeDay],
    session: session,
    state: state,
    onToggle: toggleSet,
    onReps: updateReps,
    onWeight: updateSessionWeight,
    onSwap: swapExercise,
    onAddAlt: addCustomAlt,
    onRemoveAlt: removeCustomAlt,
    onAdopt: adoptExercise,
    onFinish: finishWorkout,
    onBack: () => {
      setView("home");
      setSession(null);
      setActiveDay(null);
    }
  }), view === "history" && /*#__PURE__*/React.createElement(HistoryView, {
    history: state.history,
    onExport: handleExport,
    onBack: () => setView("home")
  }), view === "settings" && /*#__PURE__*/React.createElement(SettingsView, {
    state: state,
    onUpdate: updateStepCfg,
    onUpdateWeight: updateWeight,
    onUpdateRest: updateRestSeconds,
    onChart: setChartFor,
    onExport: exportBackup,
    onImport: importBackup,
    onBack: () => setView("home")
  }));
}

// ── HOME ─────────────────────────────────────────────────────────────────────
function HomeView({
  state,
  onStart,
  onHistory,
  onSettings,
  onReset
}) {
  const last = state.history[0];
  const streakDays = getStreak(state.history);
  return /*#__PURE__*/React.createElement("div", {
    className: "safe-page",
    style: S.page
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: S.logo
  }, "IRON", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#22c55e"
    }
  }, "LOG")), /*#__PURE__*/React.createElement("div", {
    style: S.subtitle
  }, "hypertrophy \xB7 linear progression")), /*#__PURE__*/React.createElement("button", {
    onClick: onSettings,
    style: S.iconBtn
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "10",
    cy: "10",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 1v2m0 14v2M1 10h2m14 0h2m-2.93-6.07-1.41 1.41M5.34 14.66l-1.41 1.41m0-12.14 1.41 1.41m9.32 9.32 1.41 1.41"
  })))), last && /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      padding: "12px 16px",
      marginBottom: 20,
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: ACCENT[last.day],
      fontSize: 18,
      opacity: 0.7
    }
  }, "\u21BA"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#555",
      letterSpacing: 2,
      fontWeight: 600
    }
  }, "LAST WORKOUT"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "#999",
      marginTop: 2
    }
  }, last.label, " \xB7 ", last.dateStr || last.date)), streakDays > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#22c55e",
      fontWeight: 700
    }
  }, "\uD83D\uDD25", streakDays)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      marginBottom: 28
    }
  }, Object.entries(PROGRAM).map(([key, day]) => /*#__PURE__*/React.createElement(DayCard, {
    key: key,
    dayKey: key,
    day: day,
    state: state,
    onStart: onStart
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(StatBox, {
    label: "WORKOUTS",
    value: state.history.length
  }), /*#__PURE__*/React.createElement(StatBox, {
    label: "LEG PRESS",
    value: `${state.weights.legpress_a ?? "—"}kg`
  }), /*#__PURE__*/React.createElement(StatBox, {
    label: "BENCH",
    value: `${state.weights.bench_a}kg`,
    accent: ACCENT.A
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onHistory,
    style: S.secondaryBtn
  }, "HISTORY"), /*#__PURE__*/React.createElement("button", {
    onClick: onReset,
    style: {
      ...S.secondaryBtn,
      flex: "none",
      padding: "12px 16px",
      color: "#333"
    }
  }, "\u21BA")));
}
function DayCard({
  dayKey,
  day,
  state,
  onStart
}) {
  const accent = ACCENT[dayKey];
  const exercises = day.exercises.map(exDef => resolveEx(exDef, state.subs, state.customAlts));
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onStart(dayKey),
    style: {
      ...S.card,
      padding: 0,
      cursor: "pointer",
      overflow: "hidden",
      borderLeft: `3px solid ${accent}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: 3,
      color: "#fff"
    }
  }, day.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: accent,
      fontSize: 14,
      opacity: 0.6
    }
  }, "\u2192")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#444",
      marginBottom: 14,
      letterSpacing: 1
    }
  }, day.muscles), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, exercises.map(ex => {
    const w = state.weights[ex.id];
    return /*#__PURE__*/React.createElement("div", {
      key: ex.id,
      style: {
        background: "#18181b",
        borderRadius: 6,
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#666"
      }
    }, ex.name), w != null && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: accent,
        fontWeight: 700
      }
    }, w), ex.allAlts && ex.allAlts.length > 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: "#444"
      }
    }, "\u21C4"));
  }))));
}
function StatBox({
  label,
  value,
  accent: color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: S.card
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#444",
      letterSpacing: 2,
      marginBottom: 6,
      fontWeight: 600
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color: color || "#e0e0e0",
      letterSpacing: 1
    }
  }, value));
}

// ── WORKOUT ──────────────────────────────────────────────────────────────────
function WorkoutView({
  dayKey,
  day,
  session,
  state,
  onToggle,
  onReps,
  onWeight,
  onSwap,
  onAddAlt,
  onRemoveAlt,
  onAdopt,
  onFinish,
  onBack
}) {
  const accent = ACCENT[dayKey];
  const total = session.reduce((s, ex) => s + ex.sets.length, 0);
  const done = session.reduce((s, ex) => s + ex.sets.filter(st => st.done).length, 0);
  const pct = total > 0 ? done / total : 0;
  const exercises = day.exercises.map(exDef => resolveEx(exDef, state.subs, state.customAlts));
  const [swapOpen, setSwapOpen] = useState(null);
  const [addingAlt, setAddingAlt] = useState(null);
  const [newAltName, setNewAltName] = useState("");
  const timerRef = useRef(null);
  function handleToggle(exIdx, setIdx) {
    const set = session[exIdx].sets[setIdx];
    onToggle(exIdx, setIdx);
    // Restart timer when marking a set as done
    if (!set.done && timerRef.current) timerRef.current();
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.page,
      paddingBottom: 110,
      paddingTop: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sticky-header"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: S.iconBtn
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: 3,
      color: "#fff"
    }
  }, day.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "monospace",
      fontSize: 14,
      color: accent,
      fontWeight: 700
    }
  }, done, "/", total)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: "#1a1a1e",
      borderRadius: 2,
      marginBottom: 10,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct * 100}%`,
      background: accent,
      borderRadius: 2,
      transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
    }
  })), /*#__PURE__*/React.createElement(RestTimer, {
    accent: accent,
    restartRef: timerRef,
    target: state.restSeconds || 120
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      marginTop: 14
    }
  }, session.map((exSession, exIdx) => {
    const ex = exercises[exIdx];
    const exDef = day.exercises[exIdx];
    const cfg = state.steps?.[ex.id] || {
      step: ex.step,
      progressReps: ex.progressReps ?? ex.reps
    };
    const isMax = ex.reps === "max";
    const allDone = exSession.sets.every(s => s.done);
    const hasWeight = exSession.weight != null;
    const allAlts = [...exDef.alts, ...(state.customAlts?.[exDef.slot] || [])];
    return /*#__PURE__*/React.createElement("div", {
      key: exIdx,
      style: {
        ...S.card,
        borderColor: allDone ? accent + "55" : "#1e1e22",
        transition: "border-color 0.3s, box-shadow 0.3s",
        boxShadow: allDone ? `0 0 20px ${accent}10` : "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 800,
        letterSpacing: 1,
        color: allDone ? accent : "#fff",
        transition: "color 0.3s",
        flex: 1
      }
    }, ex.name), /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setSwapOpen(swapOpen === exIdx ? null : exIdx);
        setAddingAlt(null);
      },
      style: {
        background: swapOpen === exIdx ? accent + "20" : "#18181b",
        border: `1px solid ${swapOpen === exIdx ? accent + "44" : "#2a2a2e"}`,
        color: swapOpen === exIdx ? accent : "#555",
        borderRadius: 6,
        padding: "3px 8px",
        cursor: "pointer",
        fontSize: 11,
        fontFamily: "inherit",
        fontWeight: 600
      }
    }, "\u21C4"), hasWeight && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: S.weightBtn,
      onClick: () => onWeight(exIdx, -1)
    }, "\u2212"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "monospace",
        fontSize: 14,
        fontWeight: 700,
        color: accent,
        minWidth: 46,
        textAlign: "center"
      }
    }, exSession.weight), /*#__PURE__*/React.createElement("button", {
      style: S.weightBtn,
      onClick: () => onWeight(exIdx, +1)
    }, "+"))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 10,
        color: "#444",
        fontFamily: "monospace"
      }
    }, ex.sets, "\xD7", isMax ? "MAX" : ex.reps, hasWeight && cfg.step && ` · step ${cfg.step}kg`, hasWeight && cfg.progressReps && cfg.progressReps !== ex.reps && ` · ≥${cfg.progressReps}r`)), swapOpen === exIdx && (() => {
      const customIds = state.customAlts?.[exDef.slot] || [];
      const isInCustom = id => customIds.some(a => a.id === id);
      const otherExercises = ALL_EXERCISES.filter(e => !allAlts.find(a => a.name === e.name));
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 14,
          padding: "10px 12px",
          background: "#0c0c0e",
          borderRadius: 8,
          border: "1px solid #1e1e22"
        }
      }, allAlts.map(alt => {
        const active = ex.id === alt.id;
        const removable = isInCustom(alt.id) && !active;
        return /*#__PURE__*/React.createElement("div", {
          key: alt.id,
          style: {
            display: "flex",
            alignItems: "center"
          }
        }, /*#__PURE__*/React.createElement("button", {
          onClick: () => {
            onSwap(exIdx, alt.id);
            setSwapOpen(null);
            setAddingAlt(null);
          },
          style: {
            padding: "8px 14px",
            borderRadius: removable ? "8px 0 0 8px" : 8,
            cursor: "pointer",
            background: active ? accent + "20" : "#18181b",
            border: `1px solid ${active ? accent : "#2a2a2e"}`,
            color: active ? accent : "#888",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "inherit"
          }
        }, alt.name), removable && /*#__PURE__*/React.createElement("button", {
          onClick: () => onRemoveAlt(exDef.slot, alt.id),
          style: {
            background: "#18181b",
            border: "1px solid #2a2a2e",
            borderLeft: "none",
            color: "#444",
            borderRadius: "0 8px 8px 0",
            padding: "8px 8px",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "inherit"
          }
        }, "\xD7"));
      }), otherExercises.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          width: "100%",
          borderTop: "1px solid #1e1e22",
          marginTop: 2,
          paddingTop: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 9,
          color: "#555",
          letterSpacing: 2,
          fontWeight: 600
        }
      }, "ALL EXERCISES")), otherExercises.map(other => /*#__PURE__*/React.createElement("button", {
        key: other.id,
        onClick: () => {
          onAdopt(exIdx, other);
          setSwapOpen(null);
          setAddingAlt(null);
        },
        style: {
          padding: "6px 10px",
          borderRadius: 6,
          cursor: "pointer",
          background: "#18181b",
          border: "1px solid #1e1e22",
          color: "#555",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "inherit"
        }
      }, other.name))), addingAlt === exIdx ? /*#__PURE__*/React.createElement("form", {
        onSubmit: e => {
          e.preventDefault();
          if (newAltName.trim()) {
            onAddAlt(exIdx, newAltName.trim());
            setAddingAlt(null);
            setNewAltName("");
            setSwapOpen(null);
          }
        },
        style: {
          display: "flex",
          gap: 6,
          width: "100%",
          marginTop: 4
        }
      }, /*#__PURE__*/React.createElement("input", {
        value: newAltName,
        onChange: e => setNewAltName(e.target.value),
        placeholder: "Exercise name",
        autoFocus: true,
        style: {
          flex: 1,
          background: "#18181b",
          border: "1px solid #2a2a2e",
          color: "#ccc",
          padding: "8px 12px",
          borderRadius: 8,
          fontSize: 16,
          fontFamily: "inherit",
          outline: "none"
        }
      }), /*#__PURE__*/React.createElement("button", {
        type: "submit",
        style: {
          background: accent + "20",
          border: `1px solid ${accent}`,
          color: accent,
          borderRadius: 8,
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "inherit"
        }
      }, "OK")) : /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          setAddingAlt(exIdx);
          setNewAltName("");
        },
        style: {
          padding: "8px 14px",
          borderRadius: 8,
          cursor: "pointer",
          background: "#18181b",
          border: "1px dashed #2a2a2e",
          color: "#555",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit"
        }
      }, "+"));
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6
      }
    }, exSession.sets.map((set, setIdx) => {
      const target = isMax ? null : Number(ex.reps);
      const actual = Number(set.reps) || 0;
      const belowTarget = target && set.done && actual < target;
      return /*#__PURE__*/React.createElement("div", {
        key: setIdx,
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 0"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 20,
          fontSize: 11,
          fontFamily: "monospace",
          fontWeight: 600,
          color: set.done ? belowTarget ? "#ef4444" : accent : "#333",
          textAlign: "center",
          flexShrink: 0
        }
      }, setIdx + 1), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          flex: 1,
          background: "#18181b",
          borderRadius: 8,
          overflow: "hidden",
          border: `1px solid ${belowTarget ? "#ef444466" : "#2a2a2e"}`,
          height: 36
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => onReps(exIdx, setIdx, Math.max(0, actual - 1)),
        style: S.repStepBtn
      }, "\u2212"), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          textAlign: "center",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "monospace",
          color: belowTarget ? "#ef4444" : set.reps === "" ? "#333" : "#ccc"
        }
      }, set.reps === "" ? "—" : actual), /*#__PURE__*/React.createElement("button", {
        onClick: () => onReps(exIdx, setIdx, actual + 1),
        style: S.repStepBtn
      }, "+")), /*#__PURE__*/React.createElement("button", {
        onClick: () => handleToggle(exIdx, setIdx),
        style: {
          width: 40,
          height: 36,
          borderRadius: 8,
          cursor: "pointer",
          flexShrink: 0,
          background: set.done ? belowTarget ? "#ef444430" : accent : "#18181b",
          border: `2px solid ${set.done ? belowTarget ? "#ef4444" : accent : "#2a2a2e"}`,
          color: set.done ? belowTarget ? "#ef4444" : "#000" : "#555",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "inherit",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, set.done ? "✓" : ""));
    })));
  })), /*#__PURE__*/React.createElement("div", {
    style: S.bottomBar
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 480,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onFinish,
    style: {
      width: "100%",
      padding: "16px",
      background: pct === 1 ? accent : "transparent",
      border: `2px solid ${accent}`,
      color: pct === 1 ? "#000" : accent,
      fontSize: 15,
      fontWeight: 800,
      letterSpacing: 4,
      borderRadius: 12,
      cursor: "pointer",
      transition: "all 0.3s",
      fontFamily: "inherit"
    }
  }, pct === 1 ? "✓ FINISH" : "SAVE"))));
}

// ── SETTINGS ─────────────────────────────────────────────────────────────────
function SettingsView({
  state,
  onUpdate,
  onUpdateWeight,
  onUpdateRest,
  onChart,
  onExport,
  onImport,
  onBack
}) {
  const byDay = {};
  Object.entries(PROGRAM).forEach(([key, day]) => {
    day.exercises.forEach(exDef => {
      const list = exDef.alts.filter(a => a.weight !== null && a.step !== null);
      // Include custom alts for this slot
      const custom = (state.customAlts?.[exDef.slot] || []).filter(a => a.weight !== null && a.step !== null);
      [...list, ...custom].forEach(ex => {
        if (!byDay[key]) byDay[key] = {
          label: day.label,
          exercises: []
        };
        if (!byDay[key].exercises.find(e => e.id === ex.id)) byDay[key].exercises.push(ex);
      });
    });
  });
  const fileInputRef = useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "safe-page",
    style: S.page
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: S.iconBtn
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: 3,
      color: "#fff"
    }
  }, "SETTINGS")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#444",
      letterSpacing: 3,
      fontWeight: 600,
      marginBottom: 12
    }
  }, "TIMER"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-end"
    }
  }, /*#__PURE__*/React.createElement(NumField, {
    label: "REST",
    value: state.restSeconds || 120,
    hint: "seconds",
    onChange: onUpdateRest,
    accent: "#22c55e"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 2,
      fontSize: 11,
      color: "#444",
      paddingBottom: 14,
      lineHeight: 1.5
    }
  }, "Rest timer target. Vibrates on completion."))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#444",
      letterSpacing: 3,
      fontWeight: 600,
      marginBottom: 20
    }
  }, "CURRENT WEIGHTS & PROGRESSION"), Object.entries(byDay).map(([key, {
    label,
    exercises
  }]) => /*#__PURE__*/React.createElement("div", {
    key: key,
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: ACCENT[key],
      letterSpacing: 3,
      fontWeight: 700,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: "1px solid #1a1a1e"
    }
  }, label.toUpperCase()), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, exercises.map(ex => {
    const cfg = state.steps[ex.id] || {
      step: ex.step,
      progressReps: ex.progressReps ?? ex.reps
    };
    const currentWeight = state.weights[ex.id] ?? ex.weight;
    const hasChart = state.history.some(rec => rec.exercises.some(e => e.name === ex.name && e.weight != null));
    return /*#__PURE__*/React.createElement("div", {
      key: ex.id,
      style: S.card
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        fontSize: 16,
        fontWeight: 800,
        letterSpacing: 2,
        color: "#bbb"
      }
    }, ex.name), hasChart && /*#__PURE__*/React.createElement("button", {
      onClick: () => onChart(ex.name),
      style: {
        background: "#18181b",
        border: "1px solid #2a2a2e",
        color: ACCENT[key],
        borderRadius: 6,
        padding: "4px 10px",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "inherit",
        fontWeight: 600
      }
    }, "\uD83D\uDCC8")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(NumField, {
      label: "WEIGHT",
      value: currentWeight,
      hint: "kg",
      onChange: v => onUpdateWeight(ex.id, v),
      accent: ACCENT[key]
    }), /*#__PURE__*/React.createElement(NumField, {
      label: "STEP",
      value: cfg.step,
      hint: "increment",
      onChange: v => onUpdate(ex.id, "step", v),
      accent: ACCENT[key]
    }), /*#__PURE__*/React.createElement(NumField, {
      label: "MIN R",
      value: cfg.progressReps ?? ex.reps,
      hint: "threshold",
      onChange: v => onUpdate(ex.id, "progressReps", v),
      accent: ACCENT[key]
    })));
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: "#444",
      letterSpacing: 3,
      fontWeight: 600,
      marginBottom: 12,
      marginTop: 12
    }
  }, "DATA"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#666",
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Export your data as JSON to keep a backup. Import to restore from a previous backup."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onExport,
    style: {
      flex: 1,
      padding: "10px",
      background: "#18181b",
      border: "1px solid #2a2a2e",
      color: "#bbb",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 2,
      fontFamily: "inherit"
    }
  }, "EXPORT"), /*#__PURE__*/React.createElement("button", {
    onClick: () => fileInputRef.current?.click(),
    style: {
      flex: 1,
      padding: "10px",
      background: "#18181b",
      border: "1px solid #2a2a2e",
      color: "#bbb",
      borderRadius: 8,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 2,
      fontFamily: "inherit"
    }
  }, "IMPORT"), /*#__PURE__*/React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: "application/json,.json",
    style: {
      display: "none"
    },
    onChange: e => {
      const f = e.target.files?.[0];
      if (f) onImport(f);
      e.target.value = "";
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...S.card,
      fontSize: 11,
      color: "#444",
      lineHeight: 2
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#666"
    }
  }, "Step"), " \u2014 increment on clean completion"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#666"
    }
  }, "Min reps"), " \u2014 each set must be \u2265 this number"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      fontSize: 10,
      color: "#333"
    }
  }, "Life Fitness stack: 3.75kg \xB7 Vertical/Compound Row: 10kg \xB7 Cable Crunches: 3.75kg \xB7 Bicep: 1kg")));
}
function NumField({
  label,
  value,
  hint,
  onChange,
  accent = "#22c55e"
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#444",
      letterSpacing: 2,
      marginBottom: 6,
      fontWeight: 600
    }
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    value: local,
    step: "any",
    onChange: e => setLocal(e.target.value),
    onBlur: () => onChange(local),
    style: {
      width: "100%",
      background: "#18181b",
      border: "1px solid #2a2a2e",
      color: accent,
      padding: "10px 12px",
      borderRadius: 8,
      fontFamily: "monospace",
      fontSize: 16,
      fontWeight: 700
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 9,
      color: "#333",
      marginTop: 4
    }
  }, hint));
}

// ── HISTORY ──────────────────────────────────────────────────────────────────
function HistoryView({
  history,
  onExport,
  onDelete,
  onBack
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "safe-page",
    style: S.page
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: S.iconBtn
  }, "\u2190"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      fontSize: 28,
      fontWeight: 800,
      letterSpacing: 3,
      color: "#fff"
    }
  }, "HISTORY"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "monospace",
      fontSize: 11,
      color: "#333"
    }
  }, history.length)), history.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#222",
      fontSize: 14,
      textAlign: "center",
      marginTop: 80,
      fontFamily: "monospace"
    }
  }, "no records"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, history.map((rec, i) => {
    const accent = ACCENT[rec.day] || "#555";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        ...S.card,
        borderLeft: `3px solid ${accent}`,
        padding: "14px 18px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: 2,
        color: "#fff"
      }
    }, rec.label), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#444",
        fontFamily: "monospace"
      }
    }, rec.dateStr || rec.date), /*#__PURE__*/React.createElement("button", {
      onClick: () => onExport(rec),
      style: S.exportBtn
    }, "\uD83D\uDCCB"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 4
      }
    }, rec.exercises.map((ex, j) => {
      const d = ex.sets.filter(s => s.done).length;
      const all = d === ex.sets.length;
      return /*#__PURE__*/React.createElement("div", {
        key: j,
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "#555"
        }
      }, ex.name), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 12,
          alignItems: "center"
        }
      }, ex.weight != null && /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 12,
          color: "#666",
          fontFamily: "monospace"
        }
      }, ex.weight, "kg"), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "monospace",
          color: all ? accent : "#333"
        }
      }, d, "/", ex.sets.length)));
    })));
  })));
}

// ── PROGRESS CHART ───────────────────────────────────────────────────────────
function ProgressChart({
  name,
  history
}) {
  const points = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const rec = history[i];
    const ex = rec.exercises.find(e => e.name === name && e.weight != null);
    if (ex) points.push({
      date: new Date(rec.date),
      weight: ex.weight
    });
  }
  if (points.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#666",
        fontSize: 13,
        textAlign: "center",
        padding: "30px 0"
      }
    }, "No data for ", name);
  }
  const W = 360,
    H = 180,
    P = 24;
  const weights = points.map(p => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const scaleX = i => P + i / Math.max(1, points.length - 1) * (W - P * 2);
  const scaleY = w => H - P - (w - minW) / range * (H - P * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p.weight)}`).join(" ");
  const first = points[0],
    last = points[points.length - 1];
  const fmt = d => `${d.getDate()}/${d.getMonth() + 1}`;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      letterSpacing: 2,
      color: "#fff",
      marginBottom: 4
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: "#666",
      marginBottom: 14
    }
  }, points.length, " workouts \xB7 ", minW, "kg \u2192 ", maxW, "kg"), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    style: {
      width: "100%",
      height: "auto",
      background: "#0c0c0e",
      borderRadius: 8,
      border: "1px solid #1e1e22"
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: P,
    y1: H - P,
    x2: W - P,
    y2: H - P,
    stroke: "#1e1e22",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("line", {
    x1: P,
    y1: P,
    x2: P,
    y2: H - P,
    stroke: "#1e1e22",
    strokeWidth: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: path,
    fill: "none",
    stroke: "#22c55e",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }), points.map((p, i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: scaleX(i),
    cy: scaleY(p.weight),
    r: "3",
    fill: "#22c55e"
  })), /*#__PURE__*/React.createElement("text", {
    x: P,
    y: H - 6,
    fill: "#555",
    fontSize: "9",
    fontFamily: "monospace"
  }, fmt(first.date)), /*#__PURE__*/React.createElement("text", {
    x: W - P,
    y: H - 6,
    fill: "#555",
    fontSize: "9",
    fontFamily: "monospace",
    textAnchor: "end"
  }, fmt(last.date)), /*#__PURE__*/React.createElement("text", {
    x: P + 4,
    y: P + 4,
    fill: "#555",
    fontSize: "9",
    fontFamily: "monospace"
  }, maxW, "kg"), /*#__PURE__*/React.createElement("text", {
    x: P + 4,
    y: H - P - 2,
    fill: "#555",
    fontSize: "9",
    fontFamily: "monospace"
  }, minW, "kg")));
}

// ── HELPERS ──────────────────────────────────────────────────────────────────
function getStreak(history) {
  if (!history.length) return 0;
  const dayKey = d => {
    const x = new Date(d);
    return isNaN(x) ? null : `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  };
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(new Date(today.getTime() - 86400000));
  const uniqueDays = [];
  const seen = new Set();
  for (const rec of history) {
    const k = dayKey(rec.date);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniqueDays.push(new Date(rec.date));
  }
  if (!uniqueDays.length) return 0;
  // Streak only counts if last workout was today or yesterday
  if (dayKey(uniqueDays[0]) !== todayKey && dayKey(uniqueDays[0]) !== yesterdayKey) return 0;
  let count = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const gap = Math.round((uniqueDays[i - 1] - uniqueDays[i]) / 86400000);
    if (gap === 1) count++;else break;
  }
  return count;
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #09090b; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  input { outline: none; }
  button { -webkit-tap-highlight-color: transparent; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toastIn { from { opacity: 0; transform: translate(-50%, -12px); } to { opacity: 1; transform: translate(-50%, 0); } }
  .safe-page { padding-top: calc(24px + env(safe-area-inset-top, 0px)) !important; }
  .sticky-header {
    position: sticky; top: 0; z-index: 10;
    background: #09090b;
    padding-top: calc(16px + env(safe-area-inset-top, 0px));
    padding-bottom: 12px;
    margin-left: -16px; margin-right: -16px;
    padding-left: 16px; padding-right: 16px;
  }
  .safe-toast { top: calc(20px + env(safe-area-inset-top, 0px)) !important; }
`;
const S = {
  root: {
    background: "#09090b",
    minHeight: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#e8e8e8",
    WebkitFontSmoothing: "antialiased"
  },
  loadingScreen: {
    background: "#09090b",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 16px 40px",
    animation: "fadeIn 0.3s ease-out"
  },
  logo: {
    fontSize: 44,
    fontWeight: 900,
    letterSpacing: 6,
    color: "#fff",
    lineHeight: 1
  },
  subtitle: {
    color: "#333",
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 6,
    fontWeight: 500,
    textTransform: "uppercase"
  },
  card: {
    background: "#111113",
    border: "1px solid #1e1e22",
    borderRadius: 12,
    padding: "14px 16px"
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#555",
    fontSize: 20,
    padding: "6px 8px",
    fontFamily: "inherit",
    borderRadius: 8
  },
  secondaryBtn: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "1px solid #1e1e22",
    color: "#555",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 3,
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "inherit"
  },
  weightBtn: {
    background: "#18181b",
    border: "1px solid #2a2a2e",
    color: "#777",
    width: 28,
    height: 28,
    borderRadius: 6,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontFamily: "inherit"
  },
  repStepBtn: {
    width: 36,
    height: 36,
    background: "transparent",
    border: "none",
    color: "#666",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "inherit",
    WebkitTapHighlightColor: "transparent"
  },
  exportBtn: {
    background: "#18181b",
    border: "1px solid #2a2a2e",
    color: "#555",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 11,
    fontFamily: "inherit",
    fontWeight: 600
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px 16px",
    background: "linear-gradient(transparent, #09090b 40%)"
  },
  toast: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#111113",
    border: "1px solid",
    padding: "10px 22px",
    borderRadius: 10,
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 600,
    zIndex: 1000,
    whiteSpace: "nowrap",
    maxWidth: "92vw",
    overflow: "hidden",
    textOverflow: "ellipsis",
    animation: "toastIn 0.25s ease-out",
    backdropFilter: "blur(12px)"
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)"
  },
  modal: {
    background: "#111113",
    border: "1px solid #1e1e22",
    borderRadius: 16,
    padding: "24px",
    maxWidth: 340,
    width: "90%"
  },
  modalBtnCancel: {
    flex: 1,
    padding: "12px",
    background: "#18181b",
    border: "1px solid #2a2a2e",
    color: "#999",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit"
  },
  modalBtnDanger: {
    flex: 1,
    padding: "12px",
    background: "#ef4444",
    border: "none",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit"
  },
  modalBtnPrimary: {
    flex: 1,
    padding: "12px",
    background: "#22c55e",
    border: "none",
    color: "#000",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    fontFamily: "inherit"
  }
};
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
