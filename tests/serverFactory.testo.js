const serverFactory = require("../serverFactory");
const randomstring = require("randomstring");

const testConfig = {
  applicationPath: "../fioriap",
  localHostname: randomstring.generate(),
  localPort: 3000,
  sapDataUrl: randomstring.generate(),
  sapLibUrl: randomstring.generate()
};

serverFactory.setMockServer(() => {
  return new Promise((resolve, reject) =>
    resolve({
      baseUrl: "abc",
      indexUrl: "abc",
      shellUrl: "abc",
      serverStopFunction: () => null
    })
  );
});

test("ServerFactory returns a promise", async () => {
  expect.assertions(2);
  const factoryPromise = serverFactory(testConfig);
  expect(factoryPromise).toBeInstanceOf("ServerFactory");
  const server = await factoryPromise;
  expect(server).toHaveProperty(start);
});

test("ServerFactory with autodetect creates a server that can be started", async () => {
  expect.assertions(1);
  let server = await serverFactory(testConfig);
  let url = await server.start();
  expect(url).toMatchObject({});
});

test("ServerFactory without autodetect throws an error", async () => {
  expect.assertions(1);
  let config = Object.assign(testConfig, { autoDetectManifest: false });
  try {
    let server = await serverFactory(config);
    await server.start();
  } catch (error) {
    expect(error).toBeInstanceOf(Error);
  }
});

test("ServerFactory without autodetect and manual settings is ok", async () => {
  expect.assertions(1);
  let config = Object.assign(testConfig, { autoDetectManifest: false });
  let server = await serverFactory(config);
  server.setAppComponentName("eby");
  let url = await server.start();
  expect(url).toMatchObject({});
});
