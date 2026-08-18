#!/usr/bin/env python3
"""Minimal API performance test; intentionally measures inference, not retrieval."""
import argparse
import statistics
import time
import urllib.request
import json

PAPER = """This study evaluates a transformer model for classifying satellite imagery. We train on 12,000 labelled images and test on 3,000 held-out images. The model reached 91.2% accuracy, but performance declined for rare classes. Limitations include a single geographic region and no temporal validation. Future work will add multi-region data and seasonal imagery."""

def call(endpoint: str) -> tuple[float, str]:
    body = json.dumps({"content": PAPER, "task": "summary"}).encode()
    request = urllib.request.Request(endpoint + "/api/analyze", data=body, headers={"Content-Type": "application/json"})
    start = time.perf_counter()
    with urllib.request.urlopen(request, timeout=300) as response:
        output = json.load(response)["result"]
    return time.perf_counter() - start, output

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://localhost")
parser.add_argument("--runs", type=int, default=5)
args = parser.parse_args()
times = []
for index in range(args.runs):
    elapsed, output = call(args.url.rstrip("/"))
    times.append(elapsed)
    print(f"run={index + 1} latency_s={elapsed:.2f} output_chars={len(output)}")
print(f"mean_s={statistics.mean(times):.2f} p50_s={statistics.median(times):.2f} max_s={max(times):.2f}")

