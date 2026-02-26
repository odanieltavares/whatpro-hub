#!/bin/bash

# commit_swarm_handoff.sh
# Commits the current Swarm State to git so the other agent can see it globally (if using git sync)
# Or simply updates the timestamp to signal freshness.

MEMORY_FILE=".agent/swarm/state/SWARM_MEMORY.md"
ROLES_FILE=".agent/swarm/state/SWARM_ROLES.md"

if [ -z "$1" ]; then
  echo "Usage: ./commit_swarm_handoff.sh \"Message for next agent\""
  exit 1
fi

MESSAGE="$1"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Append handoff log to memory
echo "" >> $MEMORY_FILE
echo "### 🔄 Handoff - $TIMESTAMP" >> $MEMORY_FILE
echo "**Message**: $MESSAGE" >> $MEMORY_FILE

echo "✅ Swarm Handoff recorded."
echo "You can now ask the other agent to 'Check Swarm Memory'."
