# YUK architecture thesis

## Purpose

YUK is an open observational layer for mismanaged waste in the physical world.

The historical World Cleanup system primarily modeled reports called trashpoints. YUK separates the **thing in the world** from the **evidence about that thing**.

## Core model

### Site

A persistent real-world waste entity or location.

A site can exist across many observations and interventions. It has a current projected state, but that projection is derived from evidence rather than treated as timeless truth.

Example states may include:

- suspected
- verified
- cleanup planned
- cleaned
- verified clean
- reappeared

These are lifecycle projections, not replacements for the underlying evidence history.

### Observation

A timestamped assertion or piece of evidence about waste.

Sources can include:

- a person taking a phone photo
- an organization survey
- a cleanup verification
- a municipal/open-data import
- a legacy World Cleanup record
- a dashcam or street-level image
- a drone/aerial survey
- a machine-learning detector

An observation may initially have no `site_id`. Matching it to an existing site or creating a new site is a separate, confidence-bearing operation.

### Media

Evidence attached to an observation.

Store private originals separately from public derivatives. Public media should support redaction of faces, license plates, documents and other sensitive content.

### Classification

Structured interpretation of evidence, including:

- material
- object/type
- amount
- hazard
- brand/product
- model or taxonomy version
- confidence

A classification must retain provenance. Re-running a better model should create a new interpretation rather than silently rewriting historical evidence.

### Intervention / Cleanup

An action intended to change a site's physical state.

A cleanup links participants/organizations, time, geometry, observations and affected sites. It does not erase the site or its prior evidence.

### Verification

An assertion that evaluates another state or observation: present, absent, cleaned, hazardous, duplicate, inaccessible, etc.

Verification may come from people, authorities or models, with source and confidence preserved.

## Derived current state

A site's current state is a projection over evidence:

`observations + verifications + interventions + recency + confidence → current belief`

This allows uncertainty. The system can say that a site was last verified clean six months ago without pretending that means it is clean today.

## Capture UX

The default contribution flow should be:

**camera → location/time captured automatically → AI interprets → user confirms → observation saved**

The user should not have to understand the data model or complete a long form.

When offline, capture must still succeed locally.

## Offline-first contract

Offline support is not a UI mode. It is a data-integrity requirement.

Modern YUK should use:

- client-generated stable IDs
- durable local operation log
- idempotency keys for writes
- resumable media uploads
- explicit sync state
- deterministic duplicate handling
- no assumption that connectivity exists during capture

The 2018 project demonstrated that a nominal offline feature is insufficient if retries create duplicates, records disappear, photos fail to sync, or the UI treats ordinary disconnection as an exceptional error.

## Identity and privacy

Reporter identity is separate from observation identity.

Principles:

- anonymous or pseudonymous contribution where abuse/safety policy permits
- no social-provider ID as public/domain identity
- minimum necessary public reporter information
- variable public geospatial precision when safety/privacy requires it
- provenance retained internally without unnecessarily exposing personal data

## Open data

YUK should expose privacy-safe structured data and APIs.

Every imported or machine-generated record should retain:

- source
- source record ID where lawful/appropriate
- observed time
- imported/processed time
- transformation/model version
- confidence or uncertainty where relevant

Historical World Cleanup records should enter as observations with `source = wcd-legacy`, not as claims that the corresponding waste still exists in 2026.

## AI's role

AI is a sensor interpreter, not the authority.

It can:

- classify visible waste
- estimate amount/material/hazard
- propose site matching and deduplication
- redact sensitive content
- prioritize likely hotspots
- find contradictions or stale evidence

Its outputs remain versioned assertions with confidence and provenance.

## Initial logical entities

A likely first schema is:

- `sites`
- `observations`
- `media`
- `classifications`
- `interventions`
- `verifications`
- `sources`
- `organizations`
- `sync_ops`

This document describes the domain boundary, not a commitment to a specific database or framework.

## Thesis

> Create an open, continuously updated observational layer of mismanaged waste, where people provide evidence and AI makes that evidence cheap to structure, verify, connect and act on.
