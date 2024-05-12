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

## Fake FMS

I'm currently working on adding a fake FMS server that will allow you to test the audience display without needing to run FMS. It handles the SignalR server,
FMS API calls, and will have a UI to help you simulate different scenarios.

It still needs quite a lot of work, but it's a good starting point for testing when you don't have access to FMS.

To run the fake FMS server, run the following command:

> Note that this command requires docker to be installed. If you don't have docker or want to run it manually, [check out this section](#running-fake-fms-manually)

```bash
bun run fakefms:start
```

This will kick off a docker container build + run process that will start the fake FMS server. The raw server is available at `localhost:8080` and the UI is available at `localhost:5174`. All of the FMS API calls will be proxied to the fake FMS server, meaning it can be run entirely off `localhost:5174`.

If you want to actually use the fake FMS server, you will need to set the `FAKE_FMS` environment variable to `true` when running the server, or set the `FMS_URL` environment variable to `http://localhost:8080` in the server package.

### Running Fake FMS Manually

If you don't have docker or want to run the fake FMS server manually, you will need to install Dotnet 8.0. You can find the download link [here](https://dotnet.microsoft.com/download/dotnet/8.0).

> Note: Probably don't actually need 8.0, but that's what I used when I made it so ¯\\\_(ツ)\_/¯

Once you have the .NET SDK installed, you can run the following commands to start the fake FMS server:

```bash
cd packages/fake-fms
dotnet run
```

In a separate terminal, run the following command:

```bash
bun run fakefms-ui:dev
```
