#!/bin/bash
set -eo pipefail

# Install pnpm
npm install -g pnpm@9.12.0

# Install dependencies with pnpm
pnpm install --frozen-lockfile
