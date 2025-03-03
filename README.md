# Marketing Automation

*Node.js app for automating marketing.*

---

## Setup

1. Copy [`.sample.env`](./.sample.env) to `.env` and set values.
2. `npm install`

## Running

    $ npm start -- --in=remote --out=remote

## CLI Options

    --in   local | remote
        Whether to use disk-cached values, or download live data

    --out  local | remote
        Whether to cache output to disk and log, or upload live data

    --cached-fns  scorer.json
        (Optional) Reuse cached results of given function

    --loglevel    error | warn | info | verbose | detailed
        (Optional) What the engine should log to console.log()

## Developer NPM commands

```sh
# Run engine once
$ npm start -- [options]

# Example of dry-run, using local data and cached scorer data, with medium verbosity
$ npm start -- --in=local --out=local --cached-fns=scorer.json --loglevel=info

# Download live data and cache to disk
$ npm run download

# Run unit tests
$ npm run build # either build once
$ npm run watch # or watch and build
$ npm test

# Run engine multiple times,
#   starting with cached data,
#   and pumping output of each run
#     into input of next run
$ npm run multiple

# Explain what the engine does given certain SENs or transactions
# (Requires the engine to have been run on latest data locally)
$ npm run explain -- [--verbose] <SEN12345ABCDE>... | <transactions.json>
```

## Running during Development

Running the engine live (steps above) will cache data locally in git-ignored `data` directory. After it's cached, you can use `--in=local` for faster development and to avoid API calls.

Instead of uploading to Hubspot, you can use `--out=local` and `--loglevel=verbose` (the default) to print data to console that would have been uploaded, or `--loglevel=info` to just show array counts.

After running the engine, to test logic *after* the Scoring Engine runs, pass `--cached-fns=scorer.json` to reuse the most recently results of the Scoring Engine.

## Engine Logic

### High-level Overview

1. Download HubSpot and Marketplace data
2. Generate contacts from all Licenses/Transactions
3. Identify and flag Contact Type for each Contact/Company
4. Match License/Transaction groups via similarity-scoring
5. Update Contacts based on match results
6. Generate Deals based on match results
7. Upsert HubSpot data entities

## Changelog

- Coming soon
