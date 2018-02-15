/**
 * @license
 * Code City Client
 *
 * Copyright 2017 Google Inc.
 * https://codecity.world/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Functions common across frames of Code City's client.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

var CCC = {};
CCC.Common = {};


/**
 * Namespace for SVG elements.
 * @constant
 */
CCC.Common.NS = 'http://www.w3.org/2000/svg';

/**
 * Is the client currently connected to the server?
 */
CCC.Common.isConnected = false;

/**
 * Initialization code called on startup.
 */
CCC.Common.init = function() {
  CCC.Common.parser = new DOMParser();
  CCC.Common.serializer = new XMLSerializer();
  document.body.addEventListener('click', CCC.Common.closeMenu, true);
  document.body.addEventListener('keydown', CCC.Common.keyDown, true);
  document.body.addEventListener('keypress', CCC.Common.keyPress, true);

  // Report back to the parent frame that we're fully loaded and ready to go.
  parent.postMessage('init', location.origin);
};

/**
 * Verify that a received message is from our parent frame.
 * @param {!Event} e Incoming message event.
 */
CCC.Common.verifyMessage = function(e) {
  var origin = e.origin || e.originalEvent.origin;
  if (origin !== location.origin) {
    console.error('Message received by frame from unknown origin: ' + origin);
    return null;
  }
  return e.data;
};

/**
 * Create a command menu icon.  Attach the menu commands to the icon.
 * @param {!Array<string>|!Element} cmds Array of menu commands,
 *     or root DOM element describing the menu commands.
 * @return {SVGSVGElement} Root element of icon.
 */
CCC.Common.newMenuIcon = function(cmds) {
  if (cmds.querySelectorAll) {
    // HTML frames provide commands as XML.
    // Convert the command DOM into an array.
    // <cmds><cmd>look Bob</cmd></cmds> -> ['look Bob']
    var nodes = cmds.querySelectorAll('cmd');
    cmds = [];
    for (var i = 0; i < nodes.length; i++) {
      cmds[i] = CCC.Common.innerText(nodes[i]);
    }
  }
  if (!cmds.length) {
    return null;
  }
  var svg = CCC.Common.createSvgElement('svg',
      {'class': 'menuIcon', 'data-cmds': JSON.stringify(cmds)});
  CCC.Common.createSvgElement('path', {'d': 'm 0.5,2.5 5,5 5,-5 z'}, svg);
  return svg;
};

/**
 * Concatenate all the text element in a DOM tree.
 * <foo>123<bar>456</bar>789</foo> -> '123456789'
 * @param {!Element} node Root DOM element.
 * @return {string} Plain text.
 */
CCC.Common.innerText = function(node) {
  var text = '';
  if (node.nodeType === 3) {
    text = node.data;
  } else if (node.nodeType === 1) {
    for (var i = 0; i < node.childNodes.length; i++) {
      text += CCC.Common.innerText(node.childNodes[i]);
    }
  }
  return text;
};

/**
 * Open the command menu for the clicked menu icon.
 * @param {!Event} e Click event.
 * @this {!SVGSVGElement} Root element of icon.
 */
CCC.Common.openMenu = function(e) {
  CCC.Common.closeMenu();  // Should be already closed, but let's make sure.
  var cmds = JSON.parse(this.getAttribute('data-cmds'));
  var menu = document.createElement('div');
  menu.id = 'menu';
  for (var i = 0; i < cmds.length; i++) {
    var menuItem = document.createElement('div');
    menuItem.className = 'menuitem';
    menuItem.appendChild(document.createTextNode(cmds[i]));
    menuItem.addEventListener('click', CCC.Common.commandFunction, false);
    menu.appendChild(menuItem);
  }
  var scrollDiv = document.getElementById('scrollDiv');
  var pageHeight = scrollDiv.scrollHeight;
  var pageWidth = scrollDiv.scrollWidth;
  scrollDiv.appendChild(menu);
  var iconRect = this.getBoundingClientRect();
  // Calculate preferred location of below and right of icon.
  var top = iconRect.top + scrollDiv.scrollTop + iconRect.height -
      scrollDiv.offsetTop;
  var left = iconRect.left + scrollDiv.scrollLeft;
  // Flip up if below page.
  if (top + menu.offsetHeight > pageHeight) {
    top -= menu.offsetHeight + iconRect.height;
    // Don't go off the top of the page.
    top = Math.max(top, 0);
  }
  // Don't go off the right of the page.
  if (left + menu.offsetWidth > pageWidth) {
    left = pageWidth - menu.offsetWidth;
    // Don't go off the right of the page.
    left = Math.max(left, 0);
  }
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
};

/**
 * If there is a menu open, close it.
 */
CCC.Common.closeMenu = function() {
  var menu = document.getElementById('menu');
  if (menu) {
    menu.parentNode.removeChild(menu);
    CCC.Common.parentFocus();
  }
};

/**
 * When clicked, execute the printed command.
 * @this {!Element} Clicked element.
 */
CCC.Common.commandFunction = function() {
  if (CCC.Common.isConnected) {
    parent.postMessage({'commands': [this.innerText]}, location.origin);
  }
  CCC.Common.parentFocus();
};

/**
 * The user pressed a key with the focus in the world/log frame.
 * Move focus back to the parent frame and inject the keystroke into the
 * command area.
 * @param {!KeyboardEvent} e Keyboard down event.
 */
CCC.Common.keyDown = function(e) {
  if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
    // Don't steal focus if the user is pressing a modifier key in preparation
    // for a cut/copy operation.
    return;
  }
  if (e.ctrlKey || e.altKey || e.metaKey) {
    // Allow Chrome time to complete a copy before moving focus.
    setTimeout(CCC.Common.parentFocus, 0);
  } else {
    CCC.Common.parentFocus(e);
  }
};

/**
 * The user pressed a key with the focus in the world/log frame.
 * Move focus back to the parent frame and inject the keystroke into the
 * command area.
 * @param {!KeyboardEvent} e Keyboard press event.
 */
CCC.Common.keyPress = function(e) {
  // Allow Firefox time to complete a copy before moving focus.
  setTimeout(CCC.Common.parentFocus, 0);
};

/**
 * Move focus back to the parent frame.  If specified, inject the keystroke
 * into the command area.
 * @param {KeyboardEvent} e Optional keyboard event.
 */
CCC.Common.parentFocus = function(e) {
  try {
    var ct = parent.document.getElementById('commandTextarea');
    ct.focus();
    // Chrome won't type the character in the textarea after a focus change.
    // For the easy case where the field is empty, just add the character.
    // TODO: Handle cases where the field is not empty.
    if (e && e.key.length === 1 && !ct.value.length) {
      ct.value = e.key;
      // Firefox will type the character a second time, prevent this.
      e.preventDefault();
    }
  } catch (e) {
    // Cross-frame is risky in some browsers.  Fallback method.
    parent.focus();
  }
};

/**
 * Return a local date/time in 'yyyy-mm-dd hh:mm:ss' format.
 * @return {string} Current date/time.
 */
CCC.Common.currentDateString = function() {
  var now = new Date();
  var dy = now.getFullYear();
  var dm = ('0' + (now.getMonth() + 1)).slice(-2);
  var dd = ('0' + now.getDate()).slice(-2);
  var th = ('0' + now.getHours()).slice(-2);
  var tm = ('0' + now.getMinutes()).slice(-2);
  var ts = ('0' + now.getSeconds()).slice(-2);
  return dy + '-' + dm + '-' + dd + ' ' + th + ':' + tm + ':' + ts;
};

/**
 * Helper method for creating SVG elements.
 * @param {string} name Element's tag name.
 * @param {!Object} attrs Dictionary of attribute names and values.
 * @param {Element} opt_parent Optional parent on which to append the element.
 * @return {!SVGElement} Newly created SVG element.
 */
CCC.Common.createSvgElement = function(name, attrs, opt_parent) {
  var el = document.createElementNS(CCC.Common.NS, name);
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  if (opt_parent) {
    opt_parent.appendChild(el);
  }
  return el;
};