"use client";
import { useState, useEffect, useRef } from "react";
// import LiquidEther from './LiquidEther'; // Your LiquidEther component

export default function Home() {
  const [signal, setSignal] = useState(null);
  const [noise, setNoise] = useState(null);

  // State for user-configurable parameters
  const [targetFreq, setTargetFreq] = useState(1028); // Default from backend
  const [bw, setBw] = useState(2);                   // Default from backend
  const [current, setCurrent] = useState(1);         // Default from backend
  const [scaling, setScaling] = useState(1000);      // Default from backend
  const [totalDuration, setTotalDuration] = useState(30); // Default from backend
  
  const [intervalSec, setIntervalSec] = useState(1); // Default from backend

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results

    if (!signal || !noise) {
      setError("Please upload both Signal and Noise ZIP files.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("signal_zip", signal);
    formData.append("noise_zip", noise);

    const queryParams = new URLSearchParams({
      target_freq: targetFreq,
      bw: bw,
      current: current,
      scaling: scaling,
      total_measurement_duration_sec: totalDuration,
      interval_sec: intervalSec,
    }).toString();

    try {
      const res = await fetch(`http://127.0.0.1:8000/analyze?${queryParams}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Response:", data);
      setResult(data);
    } catch (err) {
      console.error("Error:", err.message);
      setError(`Failed to analyze: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-start min-h-screen text-gray-800">
      {/* LiquidEther Background Component - Stays as Z-0 */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']} // Your chosen colors
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          resolution={0.8}
          className="w-full h-full"
        /> */}
      </div>

      {/* Hero Section - Elevated and Visually Distinct */}
      <section className="relative z-10 w-full py-16 md:py-24 text-center text-white bg-gradient-to-r from-blue-700 to-purple-600 shadow-lg mb-8">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg leading-tight">
          Magnetic Field Analyzer
        </h1>
        <p className="text-xl md:text-2xl font-light max-w-3xl mx-auto px-4 opacity-90">
          Precisely analyze magnetic field data by uploading signal and noise measurements.
        </p>
      </section>

      {/* Content Layer for Form and Results */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-4xl px-4 pb-16">

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-gradient-to-br from-blue-50 to-purple-50 bg-opacity-90 p-8 md:p-10 rounded-xl shadow-3xl w-full max-w-lg transition-all duration-300 hover:shadow-4xl border border-blue-100">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-6">Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="signalZip" className="block text-gray-800 text-sm font-semibold mb-2">
                Upload Signal ZIP:
              </label>
              <input
                id="signalZip"
                type="file"
                accept=".zip"
                onChange={(e) => setSignal(e.target.files[0])}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out
                           file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold
                           file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300 cursor-pointer"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="noiseZip" className="block text-gray-800 text-sm font-semibold mb-2">
                Upload Noise ZIP:
              </label>
              <input
                id="noiseZip"
                type="file"
                accept=".zip"
                onChange={(e) => setNoise(e.target.files[0])}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out
                           file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold
                           file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300 cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="targetFreq" className="block text-gray-800 text-sm font-semibold mb-2">Target Freq (Hz):</label>
              <input
                id="targetFreq"
                type="number"
                value={targetFreq}
                onChange={(e) => setTargetFreq(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-blue-50"
                step="0.1"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="bw" className="block text-gray-800 text-sm font-semibold mb-2">Bandwidth (Hz):</label>
              <input
                id="bw"
                type="number"
                value={bw}
                onChange={(e) => setBw(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-purple-50"
                step="0.1"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="current" className="block text-gray-800 text-sm font-semibold mb-2">Current (A):</label>
              <input
                id="current"
                type="number"
                value={current}
                onChange={(e) => setCurrent(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-blue-50"
                step="0.1"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="scaling" className="block text-gray-800 text-sm font-semibold mb-2">Scaling Factor:</label>
              <input
                id="scaling"
                type="number"
                value={scaling}
                onChange={(e) => setScaling(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-purple-50"
                step="1"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="totalDuration" className="block text-gray-800 text-sm font-semibold mb-2">Total Duration (s):</label>
              <input
                id="totalDuration"
                type="number"
                value={totalDuration}
                onChange={(e) => setTotalDuration(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-blue-50"
                step="1"
                required
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="intervalSec" className="block text-gray-800 text-sm font-semibold mb-2">Interval (s):</label>
              <input
                id="intervalSec"
                type="number"
                value={intervalSec}
                onChange={(e) => setIntervalSec(parseFloat(e.target.value))}
                className="w-full border border-blue-300 p-2 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-purple-50"
                step="0.1"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-3 px-6 rounded-lg
                       hover:from-blue-700 hover:to-purple-800 transition duration-300 ease-in-out shadow-md hover:shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing...
              </>
            ) : "Analyze Magnetic Field"}
          </button>
        </form>

        {error && (
          <div className="mt-8 bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-xl relative w-full max-w-lg shadow-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        {result && (
          <section className="mt-12 bg-gradient-to-br from-green-50 to-blue-50 bg-opacity-90 p-8 md:p-10 rounded-xl shadow-3xl w-full max-w-4xl text-center border border-green-100">
            <h2 className="text-3xl font-bold mb-6 text-green-800">Analysis Results</h2>
            <p className="text-lg text-gray-800 mb-6">
              Analysis Timestamp: <b className="text-blue-700">{new Date(result.timestamp).toLocaleString()}</b>
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mt-6">
               {result.fft_plot_base64 && (
                <div className="bg-blue-50 p-6 rounded-lg shadow-inner border border-blue-100">
                  <h3 className="text-xl font-semibold mb-4 text-blue-700">FFT Graph</h3>
                  <img
                    src={`data:image/png;base64,${result.fft_plot_base64}`}
                    alt="FFT Plot"
                    className="max-w-full h-auto rounded-lg border border-blue-200 shadow-md mx-auto"
                  />
                </div>
              )}

              {result.b_vs_t_plot_base64 && (
                <div className="bg-purple-50 p-6 rounded-lg shadow-inner border border-purple-100">
                  <h3 className="text-xl font-semibold mb-4 text-purple-700">Magnetic Field vs Time</h3>
                  <img
                    src={`data:image/png;base64,${result.b_vs_t_plot_base64}`}
                    alt="Magnetic Field vs Time Plot"
                    className="max-w-full h-auto rounded-lg border border-purple-200 shadow-md mx-auto"
                  />
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}