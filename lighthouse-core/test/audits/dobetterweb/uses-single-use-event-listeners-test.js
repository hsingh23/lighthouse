/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const SingleUseEventsAudit = require(
    '../../../audits/dobetterweb/uses-single-use-event-listeners.js');
const assert = require('assert');
const fixtureData = require('../../fixtures/page-level-event-listeners.json');

const URL = 'https://example.com';

/* eslint-env mocha */

describe('Page uses single-use event listeners where applicable', () => {
  it('it returns error value when no input present', () => {
    const auditResult = SingleUseEventsAudit.audit({});
    assert.equal(auditResult.rawValue, -1);
    assert.ok(auditResult.debugString);
  });

  it('debugString is present if gatherer fails', () => {
    const debugString = 'EventListeners gatherer did not run';
    const auditResult = SingleUseEventsAudit.audit({
      EventListeners: {
        rawValue: -1,
        debugString: debugString
      },
      URL: {finalUrl: URL}
    });
    assert.equal(auditResult.rawValue, -1);
    assert.equal(auditResult.debugString, debugString);
  });

  it('fails gracefully when Chrome < 56 is used', () => {
    const auditResult = SingleUseEventsAudit.audit({
      EventListeners: [
        {url: URL} // does not have once property
      ],
      URL: {finalUrl: URL}
    });
    assert.equal(auditResult.rawValue, -1);
    assert.equal(auditResult.debugString, 'This audit requires Chrome 56+');
  });

  it('passes when violations are from another host', () => {
    const auditResult = SingleUseEventsAudit.audit({
      /* eslint-disable */
      EventListeners: [{
        'type': 'click',
        'useCapture': false,
        'passive': false,
        'once': false,
        'lineNumber': 218,
        'columnNumber': 65,
        'handler': {
          'type': 'function',
          'className': 'Function',
          'description': 'function handler(e) {this.removeEventListener(\'click\', handler);}'
        },
        'url': 'http://anotherdomain.com/',
        'startLine': 87,
        'startColumn': 8,
        'endLine': 302,
        'endColumn': 0,
        'objectName': 'body',
        'line': 219,
        'col': 66
      }],
      /* eslint-enable */
      URL: {finalUrl: URL}
    });

    assert.equal(auditResult.rawValue, true);
    assert.equal(auditResult.extendedInfo.value.length, 0);
  });

  it('passes when listeners should be single-use', () => {
    const auditResult = SingleUseEventsAudit.audit({
      EventListeners: fixtureData,
      URL: {finalUrl: URL}
    });

    assert.equal(auditResult.rawValue, false);
    assert.equal(auditResult.extendedInfo.value.length, 2);

    for (let i = 0; i < auditResult.extendedInfo.value.length; ++i) {
      const val = auditResult.extendedInfo.value[i];
      assert.ok(!val.once, 'results should all be non-single-use listeners');
      assert.ok(val.code.match(/removeEventListener/));
    }
  });
});
