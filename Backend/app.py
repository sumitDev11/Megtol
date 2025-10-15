from fastapi import FastAPI, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import zipfile
import io
import csv
import matplotlib.pyplot as plt
import base64
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Be more specific in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_csv_from_zip(file_content: bytes):
    data_list = []
    with zipfile.ZipFile(io.BytesIO(file_content)) as z:
        for name in z.namelist():
            if name.endswith(".csv"):
                with z.open(name) as f:
                    # Assuming CSV has a header and data in the second column
                    data = np.loadtxt(f, delimiter=',', skiprows=1, usecols=[1])
                    data_list.append(data)
    # Concatenate all data found in zip, or handle multiple files differently if needed
    if data_list:
        return np.concatenate(data_list)
    return np.array([])


@app.post("/analyze")
async def analyze(
    signal_zip: UploadFile = File(...),
    noise_zip: UploadFile = File(...),
    target_freq: float = Query(1028.0, description="Target frequency in Hz"),
    bw: float = Query(2.0, alias="BW", description="Bandwidth in Hz"),
    current: float = Query(1.0, description="Current in Amperes"),
    scaling: float = Query(1000.0, description="Scaling factor (e.g., to pT)"),
    total_measurement_duration_sec: float = Query(30.0, description="Total duration of measurement in seconds (should match data)"),
    interval_sec: float = Query(1.0, description="Interval for segmentation in seconds")
):
    # Load data from uploaded zip files
    signal_data_raw = load_csv_from_zip(await signal_zip.read())
    noise_data_raw = load_csv_from_zip(await noise_zip.read())

    if len(signal_data_raw) == 0:
        return {"error": "No valid CSV data found in signal zip file."}
    if len(noise_data_raw) == 0:
        return {"error": "No valid CSV data found in noise zip file."}

    # Truncate to the same length
    min_len = min(len(signal_data_raw), len(noise_data_raw))
    signal_data = signal_data_raw[:min_len]
    noise_data = noise_data_raw[:min_len]

    # Combine for processing
    waveform_full = signal_data + noise_data

    N_total = len(waveform_full)
    
    # Estimate sampling frequency (crucial for accurate frequency analysis)
    # Assuming total_measurement_duration_sec is accurate for the uploaded data
    Fs = N_total / total_measurement_duration_sec
    
    if Fs <= 0:
        return {"error": "Calculated sampling frequency is invalid. Check data length or total_measurement_duration_sec."}

    samples_per_interval = int(Fs * interval_sec)
    if samples_per_interval == 0:
        return {"error": "Interval too small or sampling frequency too low; no samples per interval."}

    B_values = []
    time_seconds_list = []
    fft_plot_base64 = None # To store the final FFT plot

    num_intervals = int(total_measurement_duration_sec / interval_sec)

    # Perform segmented analysis
    for i in range(num_intervals):
        start_idx = i * samples_per_interval
        end_idx = (i + 1) * samples_per_interval
        
        # Ensure we don't go out of bounds with the last segment
        if start_idx >= N_total:
            break
        segment = waveform_full[start_idx:min(end_idx, N_total)]
        N_segment = len(segment)

        if N_segment < 2: # Need at least 2 samples for FFT
            continue

        # FFT for the current segment
        fft_vals_segment = np.fft.fft(segment)
        fft_vals_segment = np.abs(fft_vals_segment[:N_segment // 2]) * 2 / N_segment
        freqs_segment = np.fft.fftfreq(N_segment, 1 / Fs)[:N_segment // 2]

        # Calculate Signal Amplitude
        i_signal = np.argmin(np.abs(freqs_segment - target_freq))
        signal_indices = np.arange(max(0, i_signal - 1), min(len(freqs_segment), i_signal + 2))
        signal_amp = np.mean(fft_vals_segment[signal_indices])

        # Calculate Noise Amplitude
        df = freqs_segment[1] - freqs_segment[0]
        i_bw = max(1, int(bw / df))
        noise_indices = np.concatenate([
            np.arange(0, max(0, i_signal - i_bw)),
            np.arange(i_signal + i_bw, len(freqs_segment))
        ])
        noise_rms = np.mean(fft_vals_segment[noise_indices])

        # Calculate Magnetic Field
        SNR_linear = signal_amp / noise_rms
        sensitivity_pT = current / (SNR_linear * np.sqrt(bw)) * scaling
        B_signal = sensitivity_pT * np.sqrt(bw) * SNR_linear # This is the "B_signal" as per original
        
        B_values.append(B_signal)
        time_seconds_list.append((i + 1) * interval_sec) # Accumulate time

        # Optionally, generate an FFT plot for the *first* segment or an average one
        # For this example, let's just make one plot if needed, maybe for the full waveform later
    
    # Generate FFT plot for the *full* waveform (or you could do for the last segment)
    plt.figure(figsize=(8, 5))
    fft_full = np.fft.fft(waveform_full)
    fft_full_abs = np.abs(fft_full[:N_total // 2]) * 2 / N_total
    freqs_full = np.fft.fftfreq(N_total, 1 / Fs)[:N_total // 2]
    
    plt.plot(freqs_full, fft_full_abs, color='purple')
    plt.axvline(target_freq, color='red', linestyle='--', label=f'Target freq: {target_freq} Hz')
    plt.xlabel("Frequency (Hz)")
    plt.ylabel("Amplitude")
    plt.title("FFT of Full Waveform")
    plt.legend()
    plt.grid(True, ls='--', alpha=0.7)
    plt.tight_layout()
    
    buf_fft = io.BytesIO()
    plt.savefig(buf_fft, format="png")
    buf_fft.seek(0)
    fft_plot_base64 = base64.b64encode(buf_fft.read()).decode("utf-8")
    plt.close()

    # Generate Magnetic Field vs Time plot
    plt.figure(figsize=(8, 5))
    plt.plot(time_seconds_list, B_values, marker='o', color='green')
    plt.xlabel("Time (seconds)")
    plt.ylabel("Magnetic Field B_signal (pT)")
    plt.title("Magnetic Field vs Time (Segmented Analysis)")
    plt.grid(True, ls='--', alpha=0.7)
    plt.tight_layout()

    buf_b_vs_t = io.BytesIO()
    plt.savefig(buf_b_vs_t, format="png")
    buf_b_vs_t.seek(0)
    b_vs_t_plot_base64 = base64.b64encode(buf_b_vs_t.read()).decode("utf-8")
    plt.close()


    return {
        "magnetic_field_time_series": B_values, # Return the series of B values
        "time_stamps": time_seconds_list,       # Corresponding time stamps
        "fft_plot_base64": fft_plot_base64,
        "b_vs_t_plot_base64": b_vs_t_plot_base64,
        "timestamp": datetime.now().isoformat()
    }