import React from 'react';
import ReactDOM from 'react-dom/client';
import { RunsVisualizerView } from './components/RunsVisualizerView';

const rootElement = document.getElementById('visualizer-root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(167,243,208,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] font-sans text-slate-800 p-6">
      <RunsVisualizerView />
    </div>
  </React.StrictMode>
);
