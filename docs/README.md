# Docs

This folder stores architecture and reference materials for Aurora Atelier.

## Current project truth

The live application now runs with:

- Docker-first runtime
- SQLite in Docker volume
- JSON-driven constructor configuration
- React UI served from `public/react-app`

Some older architecture notes in this folder still describe the earlier MVP phase. Treat them as historical reference unless they match the current runtime and product flow.

## Recommended doc priorities

When updating docs, prioritize:

1. deployment and Docker runtime
2. auth and email flows
3. constructor JSON source of truth
4. admin content workflow
5. order and reservation lifecycle
