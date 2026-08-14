import assert from 'node:assert/strict';
import test from 'node:test';

import { CookieHandlerDevtools } from '../interface/devtools/cookieHandlerDevtools.js';
import { createSinonBrowserMock } from './mocks/sinonBrowserMock.js';

test('CookieHandlerDevtools - saveCookie succeeds with Promise and returns cookie', async () => {
  const { detector, stubs } = createSinonBrowserMock();
  const fakeSavedCookie = { name: 'auth_token', value: 'secret' };
  stubs.runtime.sendMessage.resolves({
    success: true,
    cookie: fakeSavedCookie,
  });

  const handler = new CookieHandlerDevtools(detector);
  handler.currentTab = { url: 'https://example.com' };

  const saved = await handler.saveCookie(
    { name: 'auth_token', value: 'secret' },
    'https://example.com'
  );

  assert.deepEqual(saved, fakeSavedCookie);
});

test('CookieHandlerDevtools - saveCookie throws Error on background error response', async () => {
  const { detector, stubs } = createSinonBrowserMock();
  stubs.runtime.sendMessage.resolves({
    success: false,
    error: 'Cookie name is required',
  });

  const handler = new CookieHandlerDevtools(detector);
  handler.currentTab = { url: 'https://example.com' };

  await assert.rejects(
    async () => {
      await handler.saveCookie({ name: '' }, 'https://example.com');
    },
    {
      name: 'Error',
      message: 'Cookie name is required',
    }
  );
});

test('CookieHandlerDevtools - getAllCookies sends storeId to background script', async () => {
  const { detector, stubs } = createSinonBrowserMock();
  const expectedCookies = [{ name: 'c1', value: 'v1' }];
  stubs.runtime.sendMessage.resolves(expectedCookies);

  const handler = new CookieHandlerDevtools(detector);
  handler.currentTab = {
    url: 'https://example.com',
    cookieStoreId: 'firefox-container-2',
  };

  const cookies = await handler.getAllCookies();

  assert.deepEqual(cookies, expectedCookies);
  assert.equal(
    stubs.runtime.sendMessage.calledWithMatch({
      type: 'getAllCookies',
      params: {
        url: 'https://example.com',
        storeId: 'firefox-container-2',
      },
    }),
    true
  );
});
