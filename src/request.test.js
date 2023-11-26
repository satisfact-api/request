import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import nock from 'nock';

import request, { createContext } from './request.js';

afterEach(nock.cleanAll);

describe('User experience', () => {
  test('The functions are not anonymous', () => {
    assert.equal(request.name, 'request');
    assert.equal(request.get.name, 'request GET');
    assert.equal(request.stream.name, 'request.stream');
    assert.equal(request.stream.get.name, 'request.stream GET');
  });
});

describe('Basic behavior', () => {
  test('It can do a simple GET request', async () => {
    nock('http://star.trek')
      .get('/captains/jean-luc')
      .reply(200, { ship: 'NCC-1701-D' });
    const { body, statusCode } = await request({ method: 'get', url: 'http://star.trek/captains/jean-luc' });
    assert.equal(200, statusCode);
    assert.deepEqual({ ship: 'NCC-1701-D' }, body);
  });
  test('It can do a POST request', async () => {
    nock('http://star.trek')
      .post('/captains', { name: 'Jean Luc' })
      .reply(201);
    const { statusCode } = await request({
      method: 'post',
      url: 'http://star.trek/captains',
      body: { name: 'Jean Luc' },
    });
    assert.equal(201, statusCode);
  });
  test('Non object bodies are not JSON stringified', async () => {
    nock('http://star.trek')
      .post('/captains', 'Jean Luc')
      .reply(201);
    const { statusCode } = await request({
      method: 'post',
      url: 'http://star.trek/captains',
      body: 'Jean Luc',
    });
    assert.equal(201, statusCode);
  });
  test('An error is thrown if the status code >= 400', async () => {
    nock('http://star.trek')
      .get('/captains')
      .reply(404, { name: 'Not Found' });
    await assert.rejects(
      () => request({
        method: 'get',
        url: 'http://star.trek/captains',
      }),
      {
        message: 'Request failed with status code 404.',
        statusCode: 404,
        body: { name: 'Not Found' },
      },
    );
  });
  test('It works with secure requests', async () => {
    nock('https://star.trek')
      .get('/captains')
      .reply(200);
    const { statusCode } = await request({ method: 'get', url: 'https://star.trek/captains' });
    assert.equal(statusCode, 200);
  });
  test('A specific port can be called', async () => {
    nock('http://star.trek:3000')
      .get('/captains')
      .reply(200);
    const { statusCode } = await request({ method: 'get', url: 'http://star.trek:3000/captains' });
    assert.equal(statusCode, 200);
  });
  test('A specific port can be called from the options', async () => {
    nock('http://star.trek:3000')
      .get('/captains')
      .reply(200);
    const { statusCode } = await request({ method: 'get', url: 'http://star.trek/captains', port: 3000 });
    assert.equal(statusCode, 200);
  });
  describe('One function exists per verb', () => {
    test('request.get (call)', async () => {
      nock('http://star.trek')
        .get('/captains')
        .reply(200, ['Jean Luc', 'James T. Kirk']);
      const { body, statusCode } = await request.get({ url: 'http://star.trek/captains' });
      assert.equal(statusCode, 200);
      assert.deepEqual(body, ['Jean Luc', 'James T. Kirk']);
    });
    test('request.get (typeof)', async () => {
      assert.equal(typeof request.get, 'function');
    });
    test('request.head (typeof)', async () => {
      assert.equal(typeof request.head, 'function');
    });
    test('request.post (typeof)', async () => {
      assert.equal(typeof request.post, 'function');
    });
    test('request.put (typeof)', async () => {
      assert.equal(typeof request.put, 'function');
    });
    test('request.delete (typeof)', async () => {
      assert.equal(typeof request.delete, 'function');
    });
    test('request.connect (typeof)', async () => {
      assert.equal(typeof request.connect, 'function');
    });
    test('request.options (typeof)', async () => {
      assert.equal(typeof request.options, 'function');
    });
    test('request.trace (typeof)', async () => {
      assert.equal(typeof request.trace, 'function');
    });
    test('request.path (typeof)', async () => {
      assert.equal(typeof request.path, 'function');
    });
  });
});

describe('Stream', () => {
  test('It can resolve with the raw stream', async () => {
    nock('http://star.trek')
      .get('/captains/jean-luc')
      .reply(200);
    const stream = await request.stream({ method: 'get', url: 'http://star.trek/captains/jean-luc' });
    assert.equal('object', typeof stream);
    assert.equal(true, stream.readable);
    assert.equal(200, stream.statusCode);
  });
  describe('One function exists per verb', () => {
    test('request.get (call)', async () => {
      nock('http://star.trek')
        .get('/captains/jean-luc')
        .reply(200);
      const stream = await request.stream.get({ url: 'http://star.trek/captains/jean-luc' });
      assert.equal('object', typeof stream);
      assert.equal(true, stream.readable);
      assert.equal(200, stream.statusCode);
    });
    test('request.get (typeof)', async () => {
      assert.equal(typeof request.stream.get, 'function');
    });
    test('request.head (typeof)', async () => {
      assert.equal(typeof request.stream.head, 'function');
    });
    test('request.post (typeof)', async () => {
      assert.equal(typeof request.stream.post, 'function');
    });
    test('request.put (typeof)', async () => {
      assert.equal(typeof request.stream.put, 'function');
    });
    test('request.delete (typeof)', async () => {
      assert.equal(typeof request.stream.delete, 'function');
    });
    test('request.connect (typeof)', async () => {
      assert.equal(typeof request.stream.connect, 'function');
    });
    test('request.options (typeof)', async () => {
      assert.equal(typeof request.stream.options, 'function');
    });
    test('request.trace (typeof)', async () => {
      assert.equal(typeof request.stream.trace, 'function');
    });
    test('request.path (typeof)', async () => {
      assert.equal(typeof request.stream.path, 'function');
    });
  });
});

describe('Default values', () => {
  test('The default verb is GET', async () => {
    nock('http://star.trek')
      .get('/captains/jean-luc')
      .reply(200);
    const { statusCode } = await request({ url: 'http://star.trek/captains/jean-luc' });
    assert.equal(200, statusCode);
  });
});

describe('Context', () => {
  test('A context can be defined to do requests', async () => {
    nock('http://star.trek:3000')
      .get('/captains')
      .reply(200);
    const contextRequest = createContext({ origin: 'http://star.trek', port: 3000 });
    const { statusCode } = await contextRequest({ path: '/captains' });
    assert.equal(200, statusCode);
  });
  test('A context origin is mandatory', async () => {
    const contextRequest = createContext({ port: 3000 });
    assert.throws(
      () => contextRequest({ path: '/captains' }),
      { message: 'The context\'s origin is mandatory.' },
    );
  });
});

describe('Errors', () => {
  test('The full url is mandatory without context', async () => {
    assert.throws(
      () => request({ path: '/captain' }),
      { message: 'The request URL is mandatory.' },
    );
  });
  test('It throws if the URL cannot be resolved', async () => {
    assert.rejects(
      () => request({ method: 'get', url: 'http://star.trek' }),
      { message: 'getaddrinfo ENOTFOUND star.trek' },
    );
  });
});
