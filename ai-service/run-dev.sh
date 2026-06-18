#!/bin/bash
export CLAUDE_MODEL="${CLAUDE_MODEL:-claude-sonnet-4-6}"

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ANTHROPIC_API_KEY is required"
  exit 1
fi

node src/server.js
