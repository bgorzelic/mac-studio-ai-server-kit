# Mac Studio LLM Benchmarks — July 14, 2026

Machine: Apple M3 Ultra, 28-core, 256 GB unified memory, macOS 26.5.2, GPU wired limit 240 GB.
Method: Ollama `/api/generate` (300-token generation; ~2.7k-token prompt for prompt-processing), flash attention on, q8 KV cache. MLX via `mlx_lm.benchmark` (512 prompt / 1024 gen tokens, 5 trials).

| Model | Runtime | Generation | Prompt processing | Cold load | Memory |
|---|---|---|---|---|---|
| Qwen3-30B-A3B 4-bit | **MLX** | **106.5 tok/s** | **1,789 tok/s** | ~5 s | 17.8 GB peak |
| qwen3:30b (MoE) | Ollama | 86.5 tok/s | 1,552 tok/s | ~20 s | ~21 GB |
| gpt-oss:120b (MoE) | Ollama | 66.7 tok/s | 1,224 tok/s | ~11 s | ~68 GB |
| qwen3:235b (MoE) | Ollama | 27.1 tok/s | 256 tok/s | ~15 s | ~150 GB |

## Reading the numbers

MLX is ~23% faster than Ollama on the identical model class (106 vs 87 tok/s) and ~15% faster at prompt ingestion — when throughput matters, serve via `mlx_lm.server`; when convenience and the model zoo matter, Ollama. All three Ollama MoE models generate at interactive speed; the 235B's 256 tok/s prompt processing is the one real bottleneck — long-context RAG on the 235B will feel slow to first token (a 20k-token prompt ≈ 80 s), so route long-context work to the 30B/120B and save the 235B for hard reasoning on shorter prompts.

Practical routing rule: **30B (MLX) for volume, 120B for daily quality, 235B for the hard stuff.** All three coexist in memory only partially — 30B+120B fit together comfortably; loading the 235B evicts others under memory pressure.

Reproduce: `~/dev/infra/bench.sh` (results logged to `~/dev/infra/logs/bench.log`).
