#!/usr/bin/env bash
# scripts/finder/grade.sh <dataDir> <list.txt> <prefix> [batch...]
# Grades the URL column (last |-field) of dataDir/list.txt with check-site.mjs in batches
# of 20, one foreground run per batch (low-memory machines); skips batches already saved
# in dataDir/batches/. dataDir must be outside Git: results list every visible email.
here="$(cd "$(dirname "$0")/../.." && pwd)"
L=$1; list=$2; prefix=$3; shift 3
mkdir -p "$L/batches"
mapfile -t urls < <(tr -d '\r' < "$L/$list" | grep -v '^#' | grep . | awk -F'|' '{print $NF}')
total=$(( (${#urls[@]} + 19) / 20 ))
for n in "${@:-$(seq 0 $((total - 1)))}"; do
  out="$L/batches/$prefix-$n.json"
  [ -s "$out" ] && { echo "batch $n already done"; continue; }
  chunk=("${urls[@]:$((n * 20)):20}")
  [ ${#chunk[@]} -eq 0 ] && continue
  (cd "$here" && NODE_PATH="${NODE_PATH:-$(npm root -g)}" node scripts/check-site.mjs "${chunk[@]}" > "$out.tmp" 2> "$out.log") && mv "$out.tmp" "$out"
  echo "batch $n/$((total - 1)): $(cut -c1-4 "$out.log" | sort | uniq -c | tr '\n' ' ')"
  grep '^WEAK' "$out.log"
done
true
