# Rainbow Rumble Audience Display

This is the backend server and ui for the custom audience display app for rainbow rumble.

### Setup

To run locally, it _requires_ [bun](https://bun.sh/) as it abuses quite a few of the built in features that it provides.

```bash
bun install
```

By default, the server will expect FMS to be running at `10.0.100.5`. If your instance of FMS is not running at that address, you can set the `FMS_URL` environment variable to the correct address, either in the terminal or in a `.env` file in the server package.

### Running

Both the UI and server should be run in separate terminals.

```bash
bun run server:dev
```

```bash
bun run ui:dev
```

The UI will run at `localhost:5173` and proxy requests to the socket server running at `localhost:3000`.

Eventually I'll set up a docker container for this, but for now, this is how it is.
