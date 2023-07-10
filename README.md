# Note Quick Add

## Configuration

During the first run you'll have to provide the configuration.

The app will ask you to do that and allow guide you though creating a file.

In case it doesn't, just copy the [.note-quick-add-config.json.tpl](.note-quick-add-config.json.tpl) file to `~/.note-quick-add-config.json` and fill in the placeholder values.

## Dev

Clone the repo and go for:

```sh
git clone git@github.com:mlewand/capture-it.git
cd capture-it
yarn
yarn start
```

## Distribution

Run the following steps to build distribution version of the app:

```sh
yarn dist
```
