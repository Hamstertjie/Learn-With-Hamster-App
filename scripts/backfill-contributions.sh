#!/usr/bin/env bash
# =============================================================================
# backfill-contributions.sh
# Backfills GitHub contribution graph with weekday commits since 2023.
# Commits are backdated so they appear on the correct days in the graph.
#
# Usage:
#   cd /path/to/Learn-With-Hamster-App
#   bash scripts/backfill-contributions.sh
#   git push origin main
# =============================================================================

set -e

# --- Config ------------------------------------------------------------------
START_DATE="2023-01-02"                        # First weekday of 2023
END_DATE=$(date -d "yesterday" +%Y-%m-%d)      # Up to yesterday
TRACKING_FILE=".contributions"
TIMEZONE="+02:00"                              # Your local timezone offset
AUTHOR_NAME="hamstertjie"
AUTHOR_EMAIL="akoojeeman@gmail.com"

# Rotating commit messages to look natural
MESSAGES=(
  "Update project structure"
  "Refactor component logic"
  "Fix minor bugs"
  "Improve code quality"
  "Code cleanup and formatting"
  "Update configuration"
  "Add improvements"
  "Fix edge cases"
  "Update documentation"
  "Enhance functionality"
  "Performance improvements"
  "Resolve issues"
  "Update dependencies"
  "Clean up unused code"
  "Add missing validations"
  "Improve error handling"
  "Refine UI components"
  "Fix styling issues"
  "Update service logic"
  "Optimize queries"
)

# --- Setup -------------------------------------------------------------------
cd "$(git rev-parse --show-toplevel)"

echo "Backfilling contributions from $START_DATE to $END_DATE..."
echo "This may take a few minutes..."
echo ""

# Create tracking file if it doesn't exist
touch "$TRACKING_FILE"
git add "$TRACKING_FILE" 2>/dev/null || true

# Convert date to integer YYYYMMDD for numeric comparison
to_int() { echo "$1" | tr -d '-'; }

# --- Main Loop ---------------------------------------------------------------
current="$START_DATE"
end_int=$(to_int "$END_DATE")
day_count=0
commit_count=0

while [[ $(to_int "$current") -le $end_int ]]; do

  # Day of week: 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat 7=Sun
  dow=$(date -d "$current" +%u)

  # Only commit on weekdays
  if [[ "$dow" -le 5 ]]; then

    # Random 1-4 commits per day (weighted toward 2-3 to look natural)
    weight=$((RANDOM % 10))
    if   [[ $weight -lt 2 ]]; then num=1
    elif [[ $weight -lt 6 ]]; then num=2
    elif [[ $weight -lt 9 ]]; then num=3
    else                           num=4
    fi

    for ((i = 1; i <= num; i++)); do
      # Random time between 08:00 and 18:00
      hour=$(( (RANDOM % 11) + 8 ))
      min=$(( RANDOM % 60 ))
      sec=$(( RANDOM % 60 ))
      timestamp="${current}T$(printf '%02d:%02d:%02d' "$hour" "$min" "$sec")${TIMEZONE}"

      # Pick a random message
      msg="${MESSAGES[$((RANDOM % ${#MESSAGES[@]}))]}"

      # Append to tracking file so there's an actual change to commit
      echo "$timestamp" >> "$TRACKING_FILE"
      git add "$TRACKING_FILE"

      GIT_AUTHOR_NAME="$AUTHOR_NAME"       \
      GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL"     \
      GIT_AUTHOR_DATE="$timestamp"         \
      GIT_COMMITTER_NAME="$AUTHOR_NAME"    \
      GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL"  \
      GIT_COMMITTER_DATE="$timestamp"      \
        git commit -q -m "$msg"

      commit_count=$((commit_count + 1))
    done

    day_count=$((day_count + 1))
  fi

  # Advance to next day
  current=$(date -d "$current + 1 day" +%Y-%m-%d)

done

echo ""
echo "Done!"
echo "  Days filled : $day_count"
echo "  Total commits: $commit_count"
echo ""
echo "Now push to GitHub:"
echo "  git push origin main"
