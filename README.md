# Capture It

A simple app to instantly add notes to your todo list.

![Capture It screenshot](assets/screenshot.png)

## Installation

Just grab a suitable distribution from [the releases page](https://github.com/mlewand/capture-it/releases).

## Configuration

During the first run you'll have to provide the configuration.

The app will ask you to do that and allow guide you though creating a file.

In case it doesn't, just copy the [.capture-it-config.tpl.json](.capture-it-config.tpl.json) file to `~/.capture-it-config.json` and fill in the placeholder values.

## Dev

Clone the repo and go for:

```sh
git clone git@github.com:mlewand/capture-it.git
cd capture-it
yarn
yarn start:dev
```

## Distribution

Run the following steps to build distribution version of the app:

```sh
yarn dist
```
