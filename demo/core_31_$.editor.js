/**
 * @license
 * Code City: Minimal code editor.
 *
 * Copyright 2017 Google Inc.
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
 * @fileoverview Code editor for Code City.
 * @author cpcallen@google.com (Christopher Allen)
 */

$.editor = { objs: [] };

$.editor.edit = function(obj, name, key) {
  /* Return a (valid) URL for a web editing session editing obj[key],
   * where obj might more commonly be known as name.
   */
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    throw TypeError('Can only edit objects');
  }
  var objId = this.objIdFor(obj);
  var url = '/edit?objId=' + objId;
  if (name) {
    url += '&name=' + encodeURIComponent(name);
  }
  if (key) {
    url += '&key=' + encodeURIComponent(key);
  }
  return url;
};

$.editor.objIdFor = function(obj) {
  /* Find index of obj in this.objs, adding it if it's not already there.
   */
  for (var i = 0; i < this.objs.length; i++) {
    if (this.objs[i] === obj) {
      return i;
    }
  }
  var id = this.objs.length;
  this.objs.push(obj);
  return id;
};

$.editor.load = function(obj, key) {
  /* Return string containing initial editor contents for editing
   * obj[key].
   */
  // TODO(cpcallen): This should call toSource, once we have such a
  // function.
  var pd = Object.getOwnPropertyDescriptor(obj, key);
  var v = pd ? pd.value : undefined;
  return (typeof v === 'string' ?
      "'" + v.replace(/[\\']/g, '\$&') + "'" :
      String(v));
};

$.editor.save = function(obj, key, src) {
  /* Eval the string src and (if successful) save the resulting value
   * as obj[key].  If the value produced from src and the existing
   * value of obj[key] are both objects, then an attempt will be made
   * to copy any properties from the old value to the new one.
   */
  // Use Acorn to trim source to first expression.
  var ast = $.utils.acorn.parseExpressionAt(src, 0, { ecmaVersion: 5 });
  src = src.substring(ast.start, ast.end);
  // Evaluate src in global scope (eval by any other name, literally).
  // TODO: don't use eval - prefer Function constructor for
  // functions; generate other values from an Acorn parse tree.
  var evalGlobal = eval;
  var old = obj[key];
  var val = evalGlobal('(' + src + ')');
  if ($.utils.isObject(val) && $.utils.isObject(old)) {
    $.utils.transplantProperties(old, val);
  }
  obj[key] = val;
  return src;
};


$.editor.page = function(request, response) {
  // Overwrite on first execution.
  $.editor.page = $.jssp.compile($.editor.page);
  $.editor.page.call(this, request, response);
};
$.editor.page.jssp = [
  '<%',
  'var params = request.parameters;',
  'var objId = params.objId;',
  'var obj = $.editor.objs[params.objId];',
  'if (!$.utils.isObject(obj)) {',
  '  // Bad edit URL.',
  '  $.pages[\'404\'](request, response);',
  '  return;',
  '}',
  'var key = params.key;',
  'var src = params.src;',
  'var status = \'\';',
  'if (src) {',
  '  try {',
  '    // Use Acorn to trim source to first expression.',
  '    var ast = $.utils.acorn.parseExpressionAt(src, 0, { ecmaVersion: 5 });',
  '    src = src.substring(ast.start, ast.end);',
  '    src = $.editor.save(obj, key, src);',
  '    status = \'(saved)\';',
  '  } catch (e) {',
  '    status = \'(ERROR: \' + String(e) + \')\';',
  '  }',
  '} else {',
  '  src = $.editor.load(obj, key);',
  '}',
  'var name = $.utils.htmlEscape(params.name);',
  'key = $.utils.htmlEscape(key);',
  '%>',
  '<!DOCTYPE html>',
  '<html><head>',
  '  <title>Code Editor for <%= name %>.<%= key %></title>',
  '  <link href="/static/client/jfk.css" rel="stylesheet">',
  '  <link rel="stylesheet" href="/static/CodeMirror/codemirror.css">',
  '  <style>',
  '    body {margin: 0; font-family: sans-serif}',
  '    h1 {margin-bottom: 5; font-size: small}',
  '    #submit {position: fixed; bottom: 1ex; right: 2ex; z-index: 9}',
  '    .CodeMirror {height: auto; border: 1px solid #eee}',
  '  </style>',
  '  <script src="/static/CodeMirror/codemirror.js"></script>',
  '  <script src="/static/CodeMirror/javascript.js"></script>',
  '</head><body>',
  '  <form action="/edit" method="post">',
  '  <button type="submit" class="jfk-button-submit" id="submit"',
  '    onclick="document.getElementById(\'src\').value = editor.getValue()">Save</button>',
  '  <h1>Editing <%= name %>.<%= key %>',
  '    <span id="status"><%= status %></span></h1>',
  '  <input name="objId" type="hidden" value="<%= $.utils.htmlEscape(objId) %>">',
  '  <input name="name" type="hidden" value="<%= name %>">',
  '  <input name="key" type="hidden" value="<%= key %>">',
  '  <textarea name="src" id="src"><%= $.utils.htmlEscape(src) %>\n</textarea>',
  '  </form>',
  '  <script>',
  '    var editor = CodeMirror.fromTextArea(document.getElementById(\'src\'), {',
  '      lineNumbers: true,',
  '      matchBrackets: true,',
  '      viewportMargin: Infinity,',
  '    });',
  '    editor.on(\'change\', function() {document.getElementById("status").innerText = \'(modified)\'});',
  '  </script>',
  '</body></html>',
].join('\n');

$.http.router.edit = {regexp: /^\/edit(\?|$)/, handler: $.editor.page};
