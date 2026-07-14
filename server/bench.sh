#!/bin/bash
# Reproducible LLM benchmarks: generation + prompt-processing tok/s per model.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:$PATH"
MODELS="${*:-$(ollama list | tail -n +2 | awk '{print $1}')}"
for m in $MODELS; do
  echo "=== $m ==="
  curl -s http://localhost:11434/api/generate -d "{\"model\":\"$m\",\"prompt\":\"Write a 200-word story about a home lab server. /no_think\",\"stream\":false,\"options\":{\"num_predict\":300}}" > /tmp/g.json
  jq -r '"load_s: \(.load_duration/1e9*10|round/10)   gen: \(.eval_count/(.eval_duration/1e9)*10|round/10) tok/s  (\(.eval_count) tokens)"' /tmp/g.json
  P=$(printf 'The quick brown fox jumps over the lazy dog and runs through the quiet forest at dawn. %.0s' {1..150})
  jq -n --arg m "$m" --arg p "Summarize this in one sentence: $P /no_think" '{model:$m, prompt:$p, stream:false, options:{num_predict:40}}' > /tmp/req.json
  curl -s http://localhost:11434/api/generate -d @/tmp/req.json > /tmp/p.json
  jq -r '"prompt processing: \(.prompt_eval_count/(.prompt_eval_duration/1e9)|round) tok/s  (\(.prompt_eval_count) tokens)"' /tmp/p.json
  curl -s http://localhost:11434/api/generate -d "{\"model\":\"$m\",\"keep_alive\":0}" > /dev/null
done
command -v mlx_lm.benchmark >/dev/null && { echo "=== MLX (if a model is given as \$MLX_MODEL) ==="; [ -n "${MLX_MODEL:-}" ] && mlx_lm.benchmark --model "$MLX_MODEL" | tail -3; }
echo BENCH_COMPLETE
