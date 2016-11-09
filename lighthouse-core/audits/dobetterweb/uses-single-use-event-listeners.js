/**
 * @license
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

/**
 * @fileoverview Audit a page to see if it is using single-use event listeners
 * where appropriate.
 */

'use strict';

const url = require('url');
const Audit = require('../audit');
const Formatter = require('../../formatters/formatter');

class SingleUseEventsAudit extends Audit {

  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'JavaScript',
      name: 'single-use-event-listeners',
      description: 'Site is using single-use events listeners (at the page level) ' +
                   'when it can',
      helpText: '<a href="https://www.chromestatus.com/feature/5630331130478592" target="_blank">Single-use event listeners</a> remove the need to call <code>removeEventListener</code> in an event listener\'s callback. Their callback is only invoked once: <code>addEventListener(\'click\', ..., {once: true})</code>.',
      requiredArtifacts: ['URL', 'PageLevelEventListeners']
    };
  }

  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    if (typeof artifacts.PageLevelEventListeners === 'undefined' ||
        artifacts.PageLevelEventListeners === -1) {
      return SingleUseEventsAudit.generateAuditResult({
        rawValue: -1,
        debugString: 'PageLevelEventListeners gatherer did not run'
      });
    } else if (artifacts.PageLevelEventListeners.rawValue === -1) {
      return SingleUseEventsAudit.generateAuditResult(artifacts.PageLevelEventListeners);
    }

    const listeners = artifacts.PageLevelEventListeners;
    const pageHost = url.parse(artifacts.URL.finalUrl).host;

    // Filter out event listeners that should be single-use.
    const results = listeners.filter(loc => {
      const removesOwnListener = loc.handler.description.match(
            /\.removeEventListener\(\s*\)/g);
      const sameHost = loc.url ? url.parse(loc.url).host === pageHost : true;
      return sameHost && removesOwnListener;
    }).map(loc => {
      const handler = loc.handler ? loc.handler.description : '...';
      return Object.assign({
        label: `line: ${loc.line}, col: ${loc.col}`,
        code: `${loc.objectId}.addEventListener('${loc.type}', ${handler})`
      }, loc);
    });

    return SingleUseEventsAudit.generateAuditResult({
      rawValue: results.length === 0,
      extendedInfo: {
        formatter: Formatter.SUPPORTED_FORMATS.URLLIST,
        value: results
      }
    });
  }
}

module.exports = SingleUseEventsAudit;
