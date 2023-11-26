import http from 'node:http';
import https from 'node:https';
import { normalize } from 'node:path';
import { URL } from 'node:url';

import tryParse from './try-parse.js';

const verbs = [
  'get', 'head', 'post', 'put', 'delete',
  'connect', 'options', 'trace', 'path',
];

export function createContext(contextOptions = null) {
  const haveContext = !!contextOptions;

  function getUrl(requestOptions) {
    if (requestOptions.url) {
      return new URL(requestOptions.url);
    }

    if (!haveContext) {
      throw new Error('The request URL is mandatory.');
    }

    if (!contextOptions.origin) {
      throw new Error('The context\'s origin is mandatory.');
    }

    return new URL(normalize(`${contextOptions.origin}/${requestOptions.path}`));
  }

  function request(requestOptions) {
    const url = getUrl(requestOptions);
    const isSecure = url.protocol === 'https:';

    const options = {
      host: url.host,
      method: requestOptions.method || 'get',
      path: url.pathname,
      port: requestOptions?.port || contextOptions?.port || url.port || (isSecure ? 443 : 80),
    };

    const requestPromise = new Promise((resolve, reject) => {
      let responseBody = '';

      const clientRequest = (isSecure ? https : http).request(options, (stream) => {
        if (requestOptions.isStream) {
          resolve(stream);
          return;
        }

        stream
          .setEncoding('utf8')
          .on('data', (chunk) => {
            responseBody += chunk;
          })
          .on('end', () => {
            if (stream.statusCode > 400) {
              const error = new Error(`Request failed with status code ${stream.statusCode}.`);
              error.statusCode = stream.statusCode;
              error.body = tryParse(responseBody);
              reject(error);
            }
            resolve({ statusCode: stream.statusCode, body: tryParse(responseBody) });
          });
      });

      clientRequest.on('error', (error) => {
        reject(error);
      });

      if (requestOptions.body) {
        clientRequest.write(
          typeof requestOptions.body === 'object'
            ? JSON.stringify(requestOptions.body)
            : requestOptions.body,
        );
      }

      clientRequest.end();
    });

    return requestPromise;
  }

  request.stream = (options) => request({ ...options, isStream: true });
  Object.defineProperty(request.stream, 'name', { value: 'request.stream', writable: false });

  verbs.forEach((verb) => {
    request[verb] = (options) => request({ ...options, method: verb });
    Object.defineProperty(request[verb], 'name', { value: `request ${verb.toUpperCase()}`, writable: false });

    request.stream[verb] = (options) => request({ ...options, method: verb, isStream: true });
    Object.defineProperty(request.stream[verb], 'name', { value: `request.stream ${verb.toUpperCase()}`, writable: false });
  });

  return request;
}

const genericRequest = createContext();

export default genericRequest;
