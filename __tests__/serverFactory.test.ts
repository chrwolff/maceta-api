import {
  ServerParameters,
  createServer,
  Server,
  ServerErrors,
  setServerMock,
  setFilesystemMock
} from "../ts/serverFactory";
import { ServerConfiguration, ServerProperties } from "../ts/serverMain";
import * as randomstring from "randomstring";
import * as path from "path";

const specBaseUrl = randomstring.generate();
const specShellUrl = randomstring.generate();

const startServer = jest.fn(
  (configuration: ServerConfiguration): Promise<ServerProperties> =>
    new Promise((resolve, reject) => {
      const spec: ServerProperties = {
        url: configuration.shellId ? specShellUrl : specBaseUrl,
        stopFunction: stopServer
      };
      resolve(spec);
    })
);
const stopServer = jest.fn(() => null);
setServerMock(startServer);

const componentId = randomstring.generate();

const specServerParams_1: ServerParameters = {
  componentPath: "./" + randomstring.generate(),
  localLibraryPath: "./" + randomstring.generate(),
  hostname: randomstring.generate(),
  port: 3000,
  shellConfiguration: false
};

const specServerConfig_1: ServerConfiguration = {
  componentPath: path.join(process.cwd(), specServerParams_1.componentPath),
  localLibraryPath: path.join(
    process.cwd(),
    specServerParams_1.localLibraryPath
  ),
  hostname: specServerParams_1.hostname,
  port: specServerParams_1.port,
  resourceMap: {
    [componentId]: path.join(process.cwd(), specServerParams_1.componentPath)
  },
  shellId: null,
  oDataPath: null
};

const specServerParams_2: ServerParameters = {
  componentPath: "./" + randomstring.generate(),
  localLibraryPath: "",
  shellConfiguration: false
};

const specServerParams_3: ServerParameters = {
  componentPath: "./" + randomstring.generate(),
  localLibraryPath: "",
  shellConfiguration: false
};

const specServerParams_4: ServerParameters = {
  componentPath: specServerParams_1.componentPath,
  localLibraryPath: "",
  shellConfiguration: true
};

const fsMock = {
  readJson(file) {
    return new Promise((resolve, reject) => {
      if (
        file ===
        path.join(
          process.cwd(),
          specServerParams_1.componentPath,
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
          specServerParams_2.componentPath,
          "manifest.json"
        )
      ) {
        reject("File not found");
      } else if (
        file ===
        path.join(
          process.cwd(),
          specServerParams_3.componentPath,
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

const specSimpleShellConfig = {
  default: {
    app: {
      languages: [],
      ui5ComponentName: componentId
    },
    resourcePath: {}
  }
};

const specAdvanceShellConfig = {
  default: {
    app: {
      languages: ["en", "de"],
      ui5ComponentName: componentId
    },
    resourcePath: {}
  }
};

test("createServer returns a Promise, that contains a Server that starts with correct urls and can be stopped", async () => {
  expect.assertions(3);
  const serverPromise: Promise<Server> = createServer(specServerParams_1);
  const server: Server = await serverPromise;
  startServer.mockClear();
  const url = await server.start();
  expect(startServer.mock.calls.length).toBe(1);
  expect(url).toBe(specBaseUrl);
  stopServer.mockClear();
  await server.stop();
  expect(stopServer.mock.calls.length).toBe(1);
});

test("the correct server configuration can be read", async () => {
  expect.assertions(2);
  const server: Server = await createServer(specServerParams_1);
  const errorFlag = await server.errorPromise;
  expect(errorFlag).toBeFalsy();
  expect(server.serverConfiguration).toMatchObject(specServerConfig_1);
});

test("the wrong server configuration sets the error flag and returns no server", async () => {
  expect.assertions(1);
  try {
    await createServer(specServerParams_2);
  } catch (e) {
    expect(e).toBe(ServerErrors.manifestNotFound);
  }
});

test("manifest contains no entry for id", async () => {
  expect.assertions(1);
  try {
    await createServer(specServerParams_3);
  } catch (e) {
    expect(e).toBe(ServerErrors.manifestContainsNoId);
  }
});

test("shellConfig is created automatically", async () => {
  expect.assertions(3);
  const server: Server = await createServer(specServerParams_4);
  const shellConfig = server.shellConfiguration;
  expect(shellConfig).toMatchObject(specSimpleShellConfig);
  startServer.mockClear();
  const url = await server.start();
  expect(startServer.mock.calls.length).toBe(1);
  expect(url).toBe(specShellUrl);
});

test("attributes of shellConfig can be set correctly", async () => {
  expect.assertions(1);
  const server: Server = await createServer(specServerParams_4);
  server.setShellLanguages(["en", "de"]);
  const shellConfig = server.shellConfiguration;
  expect(shellConfig).toMatchObject(specAdvanceShellConfig);
});
