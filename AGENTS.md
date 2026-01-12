# AGENTS

This document sets expectations for agents contributing.

## Project Overview

Dive Decompression Simulator helps visualise decompression algorithm from a drawn dive profile.

This project is a frontend web-app only. No server. Any contribution must comply to this fact.

## Mandatory Checks Before Any Answer

Run those checks after making any changes in the codebase.
Deprecation and other warnings must be fixed at the source (do not ignore).

1. Review your own code for compliance with the Guidelines section of this document (AGENTS.md); refactor if not.

## Coding Guidelines

- Clarity: Write for readers, not machines. Keep it simple (KISS, YAGNI).
- Naming: Be explicit and consistent.
  - Functions and methods: verbs (do_x, fetch_y, generate_z).
  - Classes: nouns (Book, BookScene, ImageStore).
  - Variables: intention‑revealing words; avoid abbreviations and acronyms.
  - Single‑letter names are forbidden everywhere (including tests). Use clear names like book, extract, scene, index_counter instead of b, e, s, i.
- Functions: Small, single-purpose, few parameters, return early.
- Comments & Docs: Prefer self-explanatory code. No un-necessary comments.
  - Do not add inline comments that explain removed code or point to alternatives.
  - When removing functions/fields, do not leave placeholder notes in code.
  - Only add inline comments when explicitly requested by the user.
  - If explanation is truly needed, update README or tests instead of code comments.
- Text encoding: Use literal characters for accents and symbols. Do not use HTML entities like `&egrave;`.
- Objects & State: Favor small cohesive classes, dataclasses for data. Composition over inheritance. Avoid hidden mutable state.
- Pythonic Practices: Use comprehensions, unpacking, with, f-strings, pathlib. Add type hints (typing).
- Testing: Fast, deterministic, behavior-focused. One logical assert per test.
- Dependencies & Config: Isolate side effects. Keep config external.
- Documentation: Minimal but clear Readme.

## Misc Notes

- Keep changes minimal and focused; prefer fixing root causes over band-aids.
- Follow the existing project style and structure; avoid unnecessary churn (renames, large refactors) unless requested.
- Prefer existing project conventions over introducing new ones. Match file naming, script patterns, and tool usage already present in the repo.
- Tone & Openers: Start with substance. Do not begin responses with filler
  phrases like “Good call”, “Nice catch”, “Great”, “Sure”, or “Alright”.
  Keep a direct, neutral opening.
