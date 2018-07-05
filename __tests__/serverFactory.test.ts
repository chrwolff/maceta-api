import {
  ServerConfiguration,
  createServer,
  Server,
  ServerErrors,
  RuntimeDetails,
  setServerMock,
  setFilesystemMock
} from "../ts/serverFactory";
import * as randomstring from "randomstring";
import * as path from "path";

const specRuntimeDetails: RuntimeDetails = {
  baseUrl: randomstring.generate(),
  indexUrl: randomstring.generate(),
  shellUrl: randomstring.generate()
};

const startServer = jest.fn(
  () =>
    new Promise((resolve, reject) => {
      let spec: any = { ...specRuntimeDetails };
      spec.serverStopFunction = stopServer;
      resolve(spec);
    })
);
const stopServer = jest.fn(() => null);
setServerMock(startServer);

const specServerConfig_1: ServerConfiguration = {
  componentPath: "./" + randomstring.generate(),
  hostname: randomstring.generate(),
  port: 3000
};

const specServerConfig_2: ServerConfiguration = {
  componentPath: "./" + randomstring.generate()
};

const specServerConfig_3: ServerConfiguration = {
  componentPath: "./" + randomstring.generate()
};

const componentId = randomstring.generate();
const fsMock = {
  readJson(file) {
    return new Promise((resolve, reject) => {
      if (
        file ===
        path.join(
          process.cwd(),
          specServerConfig_1.componentPath,
          "manifest.json"
        )
      ) {
        resolve({
          "sap.app": {
            id: componentId
          }
        });
      } else if (
        file ===
        path.join(
          process.cwd(),
          specServerConfig_2.componentPath,
          "manifest.json"
        )
      ) {
        reject("File not found");
      } else if (
        file ===
        path.join(
          process.cwd(),
          specServerConfig_3.componentPath,
          "manifest.json"
        )
      ) {
        resolve({
          "sap.app": {}
        });
      }
    });
  }
};
setFilesystemMock(fsMock);

const specShellConfig = {
  default: {
    app: {
      languages: ["en", "de"],
      ui5ComponentName: componentId
    },
    resourcePath: {}
  }
};

test("createServer returns a Server that starts with correct urls and can be stopped", async () => {
  expect.assertions(3);
  const server: Server = createServer(specServerConfig_1);
  startServer.mockClear();
  const runtimeDetails = await server.start();
  expect(startServer.mock.calls.length).toBe(1);
  expect(runtimeDetails).toMatchObject(specRuntimeDetails);
  stopServer.mockClear();
  await server.stop();
  expect(stopServer.mock.calls.length).toBe(1);
});

test("the correct server configuration can be read", async () => {
  expect.assertions(2);
  const server: Server = createServer(specServerConfig_1);
  const errorFlag = await server.errorPromise;
  expect(errorFlag).toBeFalsy();
  expect(server.configuration).toMatchObject(specServerConfig_1);
});

test("the wrong server configuration sets the error flag and the server can not be started", async () => {
  expect.assertions(2);
  const server: Server = createServer(specServerConfig_2);
  try {
    await server.errorPromise;
  } catch (e) {
    expect(e).toBe(ServerErrors.manifestNotFound);
  }
  try {
    await server.start();
  } catch (e) {
    expect(e).toBe(ServerErrors.manifestNotFound);
  }
});

test("manifest contains no entry for id", async () => {
  expect.assertions(1);
  const server: Server = createServer(specServerConfig_3);
  try {
    await server.errorPromise;
  } catch (e) {
    expect(e).toBe(ServerErrors.manifestContainsNoId);
  }
});
