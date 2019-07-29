(function (child_process, fs, events, util, path, os) {
    'use strict';

    var fs__default = 'default' in fs ? fs['default'] : fs;
    util = util && util.hasOwnProperty('default') ? util['default'] : util;
    path = path && path.hasOwnProperty('default') ? path['default'] : path;
    os = os && os.hasOwnProperty('default') ? os['default'] : os;

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    var toString = Function.prototype.toString;

    function constant(x) {
      return function() {
        return x;
      };
    }

    function canvas(width, height) {
      var canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }

    function context2d(width, height, dpi) {
      if (dpi == null) dpi = devicePixelRatio;
      var canvas = document.createElement("canvas");
      canvas.width = width * dpi;
      canvas.height = height * dpi;
      canvas.style.width = width + "px";
      var context = canvas.getContext("2d");
      context.scale(dpi, dpi);
      return context;
    }

    function download(value, name = "untitled", label = "Save") {
      const a = document.createElement("a");
      const b = a.appendChild(document.createElement("button"));
      b.textContent = label;
      a.download = name;

      async function reset() {
        await new Promise(requestAnimationFrame);
        URL.revokeObjectURL(a.href);
        a.removeAttribute("href");
        b.textContent = label;
        b.disabled = false;
      }

      a.onclick = async event => {
        b.disabled = true;
        if (a.href) return reset(); // Already saved.
        b.textContent = "Saving…";
        try {
          const object = await (typeof value === "function" ? value() : value);
          b.textContent = "Download";
          a.href = URL.createObjectURL(object);
        } catch (ignore) {
          b.textContent = label;
        }
        if (event.eventPhase) return reset(); // Already downloaded.
        b.disabled = false;
      };

      return a;
    }

    var namespaces = {
      math: "http://www.w3.org/1998/Math/MathML",
      svg: "http://www.w3.org/2000/svg",
      xhtml: "http://www.w3.org/1999/xhtml",
      xlink: "http://www.w3.org/1999/xlink",
      xml: "http://www.w3.org/XML/1998/namespace",
      xmlns: "http://www.w3.org/2000/xmlns/"
    };

    function element(name, attributes) {
      var prefix = name += "", i = prefix.indexOf(":"), value;
      if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
      var element = namespaces.hasOwnProperty(prefix)
          ? document.createElementNS(namespaces[prefix], name)
          : document.createElement(name);
      if (attributes) for (var key in attributes) {
        prefix = key, i = prefix.indexOf(":"), value = attributes[key];
        if (i >= 0 && (prefix = key.slice(0, i)) !== "xmlns") key = key.slice(i + 1);
        if (namespaces.hasOwnProperty(prefix)) element.setAttributeNS(namespaces[prefix], key, value);
        else element.setAttribute(key, value);
      }
      return element;
    }

    function input(type) {
      var input = document.createElement("input");
      if (type != null) input.type = type;
      return input;
    }

    function range(min, max, step) {
      if (arguments.length === 1) max = min, min = null;
      var input = document.createElement("input");
      input.min = min = min == null ? 0 : +min;
      input.max = max = max == null ? 1 : +max;
      input.step = step == null ? "any" : step = +step;
      input.type = "range";
      return input;
    }

    function select(values) {
      var select = document.createElement("select");
      Array.prototype.forEach.call(values, function(value) {
        var option = document.createElement("option");
        option.value = option.textContent = value;
        select.appendChild(option);
      });
      return select;
    }

    function svg(width, height) {
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", [0, 0, width, height]);
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      return svg;
    }

    function text(value) {
      return document.createTextNode(value);
    }

    var count = 0;

    function uid(name) {
      return new Id("O-" + (name == null ? "" : name + "-") + ++count);
    }

    function Id(id) {
      this.id = id;
      this.href = window.location.href + "#" + id;
    }

    Id.prototype.toString = function() {
      return "url(" + this.href + ")";
    };

    var DOM = {
      canvas: canvas,
      context2d: context2d,
      download: download,
      element: element,
      input: input,
      range: range,
      select: select,
      svg: svg,
      text: text,
      uid: uid
    };

    function buffer(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader;
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    function text$1(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader;
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    function url(file) {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader;
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    var Files = {
      buffer: buffer,
      text: text$1,
      url: url
    };

    function that() {
      return this;
    }

    function disposable(value, dispose) {
      let done = false;
      return {
        [Symbol.iterator]: that,
        next: () => done ? {done: true} : (done = true, {done: false, value}),
        return: () => (done = true, dispose(value), {done: true}),
        throw: () => ({done: done = true})
      };
    }

    function* filter(iterator, test) {
      var result, index = -1;
      while (!(result = iterator.next()).done) {
        if (test(result.value, ++index)) {
          yield result.value;
        }
      }
    }

    function observe(initialize) {
      let stale = false;
      let value;
      let resolve;
      const dispose = initialize(change);

      function change(x) {
        if (resolve) resolve(x), resolve = null;
        else stale = true;
        return value = x;
      }

      function next() {
        return {done: false, value: stale
            ? (stale = false, Promise.resolve(value))
            : new Promise(_ => (resolve = _))};
      }

      return {
        [Symbol.iterator]: that,
        throw: () => ({done: true}),
        return: () => (dispose != null && dispose(), {done: true}),
        next
      };
    }

    function input$1(input) {
      return observe(function(change) {
        var event = eventof(input), value = valueof(input);
        function inputted() { change(valueof(input)); }
        input.addEventListener(event, inputted);
        if (value !== undefined) change(value);
        return function() { input.removeEventListener(event, inputted); };
      });
    }

    function valueof(input) {
      switch (input.type) {
        case "range":
        case "number": return input.valueAsNumber;
        case "date": return input.valueAsDate;
        case "checkbox": return input.checked;
        case "file": return input.multiple ? input.files : input.files[0];
        default: return input.value;
      }
    }

    function eventof(input) {
      switch (input.type) {
        case "button":
        case "submit":
        case "checkbox": return "click";
        case "file": return "change";
        default: return "input";
      }
    }

    function* map(iterator, transform) {
      var result, index = -1;
      while (!(result = iterator.next()).done) {
        yield transform(result.value, ++index);
      }
    }

    function queue(initialize) {
      let resolve;
      const queue = [];
      const dispose = initialize(push);

      function push(x) {
        queue.push(x);
        if (resolve) resolve(queue.shift()), resolve = null;
        return x;
      }

      function next() {
        return {done: false, value: queue.length
            ? Promise.resolve(queue.shift())
            : new Promise(_ => (resolve = _))};
      }

      return {
        [Symbol.iterator]: that,
        throw: () => ({done: true}),
        return: () => (dispose != null && dispose(), {done: true}),
        next
      };
    }

    function* range$1(start, stop, step) {
      start = +start;
      stop = +stop;
      step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;
      var i = -1, n = Math.max(0, Math.ceil((stop - start) / step)) | 0;
      while (++i < n) {
        yield start + i * step;
      }
    }

    function valueAt(iterator, i) {
      if (!isFinite(i = +i) || i < 0 || i !== i | 0) return;
      var result, index = -1;
      while (!(result = iterator.next()).done) {
        if (++index === i) {
          return result.value;
        }
      }
    }

    function worker(source) {
      const url = URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
      const worker = new Worker(url);
      return disposable(worker, () => {
        worker.terminate();
        URL.revokeObjectURL(url);
      });
    }

    var Generators = {
      disposable: disposable,
      filter: filter,
      input: input$1,
      map: map,
      observe: observe,
      queue: queue,
      range: range$1,
      valueAt: valueAt,
      worker: worker
    };

    function template(render, wrapper) {
      return function(strings) {
        var string = strings[0],
            parts = [], part,
            root = null,
            node, nodes,
            walker,
            i, n, j, m, k = -1;

        // Concatenate the text using comments as placeholders.
        for (i = 1, n = arguments.length; i < n; ++i) {
          part = arguments[i];
          if (part instanceof Node) {
            parts[++k] = part;
            string += "<!--o:" + k + "-->";
          } else if (Array.isArray(part)) {
            for (j = 0, m = part.length; j < m; ++j) {
              node = part[j];
              if (node instanceof Node) {
                if (root === null) {
                  parts[++k] = root = document.createDocumentFragment();
                  string += "<!--o:" + k + "-->";
                }
                root.appendChild(node);
              } else {
                root = null;
                string += node;
              }
            }
            root = null;
          } else {
            string += part;
          }
          string += strings[i];
        }

        // Render the text.
        root = render(string);

        // Walk the rendered content to replace comment placeholders.
        if (++k > 0) {
          nodes = new Array(k);
          walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null, false);
          while (walker.nextNode()) {
            node = walker.currentNode;
            if (/^o:/.test(node.nodeValue)) {
              nodes[+node.nodeValue.slice(2)] = node;
            }
          }
          for (i = 0; i < k; ++i) {
            if (node = nodes[i]) {
              node.parentNode.replaceChild(parts[i], node);
            }
          }
        }

        // Is the rendered content
        // … a parent of a single child? Detach and return the child.
        // … a document fragment? Replace the fragment with an element.
        // … some other node? Return it.
        return root.childNodes.length === 1 ? root.removeChild(root.firstChild)
            : root.nodeType === 11 ? ((node = wrapper()).appendChild(root), node)
            : root;
      };
    }

    var html = template(function(string) {
      var template = document.createElement("template");
      template.innerHTML = string.trim();
      return document.importNode(template.content, true);
    }, function() {
      return document.createElement("span");
    });

    /**
     * marked - a markdown parser
     * Copyright (c) 2011-2014, Christopher Jeffrey. (MIT Licensed)
     * https://github.com/chjj/marked
     */

    /**
     * Block-Level Grammar
     */

    var block = {
      newline: /^\n+/,
      code: /^( {4}[^\n]+\n*)+/,
      fences: noop,
      hr: /^( *[-*_]){3,} *(?:\n+|$)/,
      heading: /^ *(#{1,6}) *([^\n]+?) *#* *(?:\n+|$)/,
      nptable: noop,
      lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
      blockquote: /^( *>[^\n]+(\n(?!def)[^\n]+)*\n*)+/,
      list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
      html: /^ *(?:comment *(?:\n|\s*$)|closed *(?:\n{2,}|\s*$)|closing *(?:\n{2,}|\s*$))/,
      def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +["(]([^\n]+)[")])? *(?:\n+|$)/,
      table: noop,
      paragraph: /^((?:[^\n]+\n?(?!hr|heading|lheading|blockquote|tag|def))+)\n*/,
      text: /^[^\n]+/
    };

    block.bullet = /(?:[*+-]|\d+\.)/;
    block.item = /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/;
    block.item = replace(block.item, 'gm')
      (/bull/g, block.bullet)
      ();

    block.list = replace(block.list)
      (/bull/g, block.bullet)
      ('hr', '\\n+(?=\\1?(?:[-*_] *){3,}(?:\\n+|$))')
      ('def', '\\n+(?=' + block.def.source + ')')
      ();

    block.blockquote = replace(block.blockquote)
      ('def', block.def)
      ();

    block._tag = '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code'
      + '|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo'
      + '|span|br|wbr|ins|del|img)\\b)\\w+(?!:/|[^\\w\\s@]*@)\\b';

    block.html = replace(block.html)
      ('comment', /<!--[\s\S]*?-->/)
      ('closed', /<(tag)[\s\S]+?<\/\1>/)
      ('closing', /<tag(?:"[^"]*"|'[^']*'|[^'">])*?>/)
      (/tag/g, block._tag)
      ();

    block.paragraph = replace(block.paragraph)
      ('hr', block.hr)
      ('heading', block.heading)
      ('lheading', block.lheading)
      ('blockquote', block.blockquote)
      ('tag', '<' + block._tag)
      ('def', block.def)
      ();

    /**
     * Normal Block Grammar
     */

    block.normal = merge({}, block);

    /**
     * GFM Block Grammar
     */

    block.gfm = merge({}, block.normal, {
      fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/,
      paragraph: /^/,
      heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
    });

    block.gfm.paragraph = replace(block.paragraph)
      ('(?!', '(?!'
        + block.gfm.fences.source.replace('\\1', '\\2') + '|'
        + block.list.source.replace('\\1', '\\3') + '|')
      ();

    /**
     * GFM + Tables Block Grammar
     */

    block.tables = merge({}, block.gfm, {
      nptable: /^ *(\S.*\|.*)\n *([-:]+ *\|[-| :]*)\n((?:.*\|.*(?:\n|$))*)\n*/,
      table: /^ *\|(.+)\n *\|( *[-:]+[-| :]*)\n((?: *\|.*(?:\n|$))*)\n*/
    });

    /**
     * Block Lexer
     */

    function Lexer(options) {
      this.tokens = [];
      this.tokens.links = {};
      this.options = options || marked.defaults;
      this.rules = block.normal;

      if (this.options.gfm) {
        if (this.options.tables) {
          this.rules = block.tables;
        } else {
          this.rules = block.gfm;
        }
      }
    }

    /**
     * Expose Block Rules
     */

    Lexer.rules = block;

    /**
     * Static Lex Method
     */

    Lexer.lex = function(src, options) {
      var lexer = new Lexer(options);
      return lexer.lex(src);
    };

    /**
     * Preprocessing
     */

    Lexer.prototype.lex = function(src) {
      src = src
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\u00a0/g, ' ')
        .replace(/\u2424/g, '\n');

      return this.token(src, true);
    };

    /**
     * Lexing
     */

    Lexer.prototype.token = function(src, top, bq) {
      var src = src.replace(/^ +$/gm, '')
        , next
        , loose
        , cap
        , bull
        , b
        , item
        , space
        , i
        , l;

      while (src) {
        // newline
        if (cap = this.rules.newline.exec(src)) {
          src = src.substring(cap[0].length);
          if (cap[0].length > 1) {
            this.tokens.push({
              type: 'space'
            });
          }
        }

        // code
        if (cap = this.rules.code.exec(src)) {
          src = src.substring(cap[0].length);
          cap = cap[0].replace(/^ {4}/gm, '');
          this.tokens.push({
            type: 'code',
            text: !this.options.pedantic
              ? cap.replace(/\n+$/, '')
              : cap
          });
          continue;
        }

        // fences (gfm)
        if (cap = this.rules.fences.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'code',
            lang: cap[2],
            text: cap[3] || ''
          });
          continue;
        }

        // heading
        if (cap = this.rules.heading.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[1].length,
            text: cap[2]
          });
          continue;
        }

        // table no leading pipe (gfm)
        if (top && (cap = this.rules.nptable.exec(src))) {
          src = src.substring(cap[0].length);

          item = {
            type: 'table',
            header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3].replace(/\n$/, '').split('\n')
          };

          for (i = 0; i < item.align.length; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }

          for (i = 0; i < item.cells.length; i++) {
            item.cells[i] = item.cells[i].split(/ *\| */);
          }

          this.tokens.push(item);

          continue;
        }

        // lheading
        if (cap = this.rules.lheading.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[2] === '=' ? 1 : 2,
            text: cap[1]
          });
          continue;
        }

        // hr
        if (cap = this.rules.hr.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'hr'
          });
          continue;
        }

        // blockquote
        if (cap = this.rules.blockquote.exec(src)) {
          src = src.substring(cap[0].length);

          this.tokens.push({
            type: 'blockquote_start'
          });

          cap = cap[0].replace(/^ *> ?/gm, '');

          // Pass `top` to keep the current
          // "toplevel" state. This is exactly
          // how markdown.pl works.
          this.token(cap, top, true);

          this.tokens.push({
            type: 'blockquote_end'
          });

          continue;
        }

        // list
        if (cap = this.rules.list.exec(src)) {
          src = src.substring(cap[0].length);
          bull = cap[2];

          this.tokens.push({
            type: 'list_start',
            ordered: bull.length > 1
          });

          // Get each top-level item.
          cap = cap[0].match(this.rules.item);

          next = false;
          l = cap.length;
          i = 0;

          for (; i < l; i++) {
            item = cap[i];

            // Remove the list item's bullet
            // so it is seen as the next token.
            space = item.length;
            item = item.replace(/^ *([*+-]|\d+\.) +/, '');

            // Outdent whatever the
            // list item contains. Hacky.
            if (~item.indexOf('\n ')) {
              space -= item.length;
              item = !this.options.pedantic
                ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                : item.replace(/^ {1,4}/gm, '');
            }

            // Determine whether the next list item belongs here.
            // Backpedal if it does not belong in this list.
            if (this.options.smartLists && i !== l - 1) {
              b = block.bullet.exec(cap[i + 1])[0];
              if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                src = cap.slice(i + 1).join('\n') + src;
                i = l - 1;
              }
            }

            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            loose = next || /\n\n(?!\s*$)/.test(item);
            if (i !== l - 1) {
              next = item.charAt(item.length - 1) === '\n';
              if (!loose) loose = next;
            }

            this.tokens.push({
              type: loose
                ? 'loose_item_start'
                : 'list_item_start'
            });

            // Recurse.
            this.token(item, false, bq);

            this.tokens.push({
              type: 'list_item_end'
            });
          }

          this.tokens.push({
            type: 'list_end'
          });

          continue;
        }

        // html
        if (cap = this.rules.html.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: this.options.sanitize
              ? 'paragraph'
              : 'html',
            pre: !this.options.sanitizer
              && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
            text: cap[0]
          });
          continue;
        }

        // def
        if ((!bq && top) && (cap = this.rules.def.exec(src))) {
          src = src.substring(cap[0].length);
          this.tokens.links[cap[1].toLowerCase()] = {
            href: cap[2],
            title: cap[3]
          };
          continue;
        }

        // table (gfm)
        if (top && (cap = this.rules.table.exec(src))) {
          src = src.substring(cap[0].length);

          item = {
            type: 'table',
            header: cap[1].replace(/^ *| *\| *$/g, '').split(/ *\| */),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3].replace(/(?: *\| *)?\n$/, '').split('\n')
          };

          for (i = 0; i < item.align.length; i++) {
            if (/^ *-+: *$/.test(item.align[i])) {
              item.align[i] = 'right';
            } else if (/^ *:-+: *$/.test(item.align[i])) {
              item.align[i] = 'center';
            } else if (/^ *:-+ *$/.test(item.align[i])) {
              item.align[i] = 'left';
            } else {
              item.align[i] = null;
            }
          }

          for (i = 0; i < item.cells.length; i++) {
            item.cells[i] = item.cells[i]
              .replace(/^ *\| *| *\| *$/g, '')
              .split(/ *\| */);
          }

          this.tokens.push(item);

          continue;
        }

        // top-level paragraph
        if (top && (cap = this.rules.paragraph.exec(src))) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'paragraph',
            text: cap[1].charAt(cap[1].length - 1) === '\n'
              ? cap[1].slice(0, -1)
              : cap[1]
          });
          continue;
        }

        // text
        if (cap = this.rules.text.exec(src)) {
          // Top-level should never reach here.
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'text',
            text: cap[0]
          });
          continue;
        }

        if (src) {
          throw new
            Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
      }

      return this.tokens;
    };

    /**
     * Inline-Level Grammar
     */

    var inline = {
      escape: /^\\([\\`*{}\[\]()#+\-.!_>])/,
      autolink: /^<([^ <>]+(@|:\/)[^ <>]+)>/,
      url: noop,
      tag: /^<!--[\s\S]*?-->|^<\/?\w+(?:"[^"]*"|'[^']*'|[^<'">])*?>/,
      link: /^!?\[(inside)\]\(href\)/,
      reflink: /^!?\[(inside)\]\s*\[([^\]]*)\]/,
      nolink: /^!?\[((?:\[[^\]]*\]|[^\[\]])*)\]/,
      strong: /^__([\s\S]+?)__(?!_)|^\*\*([\s\S]+?)\*\*(?!\*)/,
      em: /^\b_((?:[^_]|__)+?)_\b|^\*((?:\*\*|[\s\S])+?)\*(?!\*)/,
      code: /^(`+)([\s\S]*?[^`])\1(?!`)/,
      br: /^ {2,}\n(?!\s*$)/,
      del: noop,
      text: /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|$)/
    };

    inline._inside = /(?:\[[^\]]*\]|\\[\[\]]|[^\[\]]|\](?=[^\[]*\]))*/;
    inline._href = /\s*<?([\s\S]*?)>?(?:\s+['"]([\s\S]*?)['"])?\s*/;

    inline.link = replace(inline.link)
      ('inside', inline._inside)
      ('href', inline._href)
      ();

    inline.reflink = replace(inline.reflink)
      ('inside', inline._inside)
      ();

    /**
     * Normal Inline Grammar
     */

    inline.normal = merge({}, inline);

    /**
     * Pedantic Inline Grammar
     */

    inline.pedantic = merge({}, inline.normal, {
      strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
      em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/
    });

    /**
     * GFM Inline Grammar
     */

    inline.gfm = merge({}, inline.normal, {
      escape: replace(inline.escape)('])', '~|])')(),
      url: /^(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/,
      del: /^~~(?=\S)([\s\S]*?\S)~~/,
      text: replace(inline.text)
        (']|', '~]|')
        ('|', '|https?://|')
        ()
    });

    /**
     * GFM + Line Breaks Inline Grammar
     */

    inline.breaks = merge({}, inline.gfm, {
      br: replace(inline.br)('{2,}', '*')(),
      text: replace(inline.gfm.text)('{2,}', '*')()
    });

    /**
     * Inline Lexer & Compiler
     */

    function InlineLexer(links, options) {
      this.options = options || marked.defaults;
      this.links = links;
      this.rules = inline.normal;
      this.renderer = this.options.renderer || new Renderer;
      this.renderer.options = this.options;

      if (!this.links) {
        throw new
          Error('Tokens array requires a `links` property.');
      }

      if (this.options.gfm) {
        if (this.options.breaks) {
          this.rules = inline.breaks;
        } else {
          this.rules = inline.gfm;
        }
      } else if (this.options.pedantic) {
        this.rules = inline.pedantic;
      }
    }

    /**
     * Expose Inline Rules
     */

    InlineLexer.rules = inline;

    /**
     * Static Lexing/Compiling Method
     */

    InlineLexer.output = function(src, links, options) {
      var inline = new InlineLexer(links, options);
      return inline.output(src);
    };

    /**
     * Lexing/Compiling
     */

    InlineLexer.prototype.output = function(src) {
      var out = ''
        , link
        , text
        , href
        , cap;

      while (src) {
        // escape
        if (cap = this.rules.escape.exec(src)) {
          src = src.substring(cap[0].length);
          out += cap[1];
          continue;
        }

        // autolink
        if (cap = this.rules.autolink.exec(src)) {
          src = src.substring(cap[0].length);
          if (cap[2] === '@') {
            text = escape(
              cap[1].charAt(6) === ':'
              ? this.mangle(cap[1].substring(7))
              : this.mangle(cap[1])
            );
            href = this.mangle('mailto:') + text;
          } else {
            text = escape(cap[1]);
            href = text;
          }
          out += this.renderer.link(href, null, text);
          continue;
        }

        // url (gfm)
        if (!this.inLink && (cap = this.rules.url.exec(src))) {
          src = src.substring(cap[0].length);
          text = escape(cap[1]);
          href = text;
          out += this.renderer.link(href, null, text);
          continue;
        }

        // tag
        if (cap = this.rules.tag.exec(src)) {
          if (!this.inLink && /^<a /i.test(cap[0])) {
            this.inLink = true;
          } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
            this.inLink = false;
          }
          src = src.substring(cap[0].length);
          out += this.options.sanitize
            ? this.options.sanitizer
              ? this.options.sanitizer(cap[0])
              : escape(cap[0])
            : cap[0];
          continue;
        }

        // link
        if (cap = this.rules.link.exec(src)) {
          src = src.substring(cap[0].length);
          this.inLink = true;
          out += this.outputLink(cap, {
            href: cap[2],
            title: cap[3]
          });
          this.inLink = false;
          continue;
        }

        // reflink, nolink
        if ((cap = this.rules.reflink.exec(src))
            || (cap = this.rules.nolink.exec(src))) {
          src = src.substring(cap[0].length);
          link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
          link = this.links[link.toLowerCase()];
          if (!link || !link.href) {
            out += cap[0].charAt(0);
            src = cap[0].substring(1) + src;
            continue;
          }
          this.inLink = true;
          out += this.outputLink(cap, link);
          this.inLink = false;
          continue;
        }

        // strong
        if (cap = this.rules.strong.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.strong(this.output(cap[2] || cap[1]));
          continue;
        }

        // em
        if (cap = this.rules.em.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.em(this.output(cap[2] || cap[1]));
          continue;
        }

        // code
        if (cap = this.rules.code.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.codespan(escape(cap[2].trim(), true));
          continue;
        }

        // br
        if (cap = this.rules.br.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.br();
          continue;
        }

        // del (gfm)
        if (cap = this.rules.del.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.del(this.output(cap[1]));
          continue;
        }

        // text
        if (cap = this.rules.text.exec(src)) {
          src = src.substring(cap[0].length);
          out += this.renderer.text(escape(this.smartypants(cap[0])));
          continue;
        }

        if (src) {
          throw new
            Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
      }

      return out;
    };

    /**
     * Compile Link
     */

    InlineLexer.prototype.outputLink = function(cap, link) {
      var href = escape(link.href)
        , title = link.title ? escape(link.title) : null;

      return cap[0].charAt(0) !== '!'
        ? this.renderer.link(href, title, this.output(cap[1]))
        : this.renderer.image(href, title, escape(cap[1]));
    };

    /**
     * Smartypants Transformations
     */

    InlineLexer.prototype.smartypants = function(text) {
      if (!this.options.smartypants) return text;
      return text
        // em-dashes
        .replace(/---/g, '\u2014')
        // en-dashes
        .replace(/--/g, '\u2013')
        // opening singles
        .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
        // closing singles & apostrophes
        .replace(/'/g, '\u2019')
        // opening doubles
        .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
        // closing doubles
        .replace(/"/g, '\u201d')
        // ellipses
        .replace(/\.{3}/g, '\u2026');
    };

    /**
     * Mangle Links
     */

    InlineLexer.prototype.mangle = function(text) {
      if (!this.options.mangle) return text;
      var out = ''
        , l = text.length
        , i = 0
        , ch;

      for (; i < l; i++) {
        ch = text.charCodeAt(i);
        if (Math.random() > 0.5) {
          ch = 'x' + ch.toString(16);
        }
        out += '&#' + ch + ';';
      }

      return out;
    };

    /**
     * Renderer
     */

    function Renderer(options) {
      this.options = options || {};
    }

    Renderer.prototype.code = function(code, lang, escaped) {
      if (this.options.highlight) {
        var out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }

      if (!lang) {
        return '<pre><code>'
          + (escaped ? code : escape(code, true))
          + '\n</code></pre>';
      }

      return '<pre><code class="'
        + this.options.langPrefix
        + escape(lang, true)
        + '">'
        + (escaped ? code : escape(code, true))
        + '\n</code></pre>\n';
    };

    Renderer.prototype.blockquote = function(quote) {
      return '<blockquote>\n' + quote + '</blockquote>\n';
    };

    Renderer.prototype.html = function(html) {
      return html;
    };

    Renderer.prototype.heading = function(text, level, raw) {
      return '<h'
        + level
        + ' id="'
        + this.options.headerPrefix
        + raw.toLowerCase().replace(/[^\w]+/g, '-')
        + '">'
        + text
        + '</h'
        + level
        + '>\n';
    };

    Renderer.prototype.hr = function() {
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };

    Renderer.prototype.list = function(body, ordered) {
      var type = ordered ? 'ol' : 'ul';
      return '<' + type + '>\n' + body + '</' + type + '>\n';
    };

    Renderer.prototype.listitem = function(text) {
      return '<li>' + text + '</li>\n';
    };

    Renderer.prototype.paragraph = function(text) {
      return '<p>' + text + '</p>\n';
    };

    Renderer.prototype.table = function(header, body) {
      return '<table>\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + '<tbody>\n'
        + body
        + '</tbody>\n'
        + '</table>\n';
    };

    Renderer.prototype.tablerow = function(content) {
      return '<tr>\n' + content + '</tr>\n';
    };

    Renderer.prototype.tablecell = function(content, flags) {
      var type = flags.header ? 'th' : 'td';
      var tag = flags.align
        ? '<' + type + ' style="text-align:' + flags.align + '">'
        : '<' + type + '>';
      return tag + content + '</' + type + '>\n';
    };

    // span level renderer
    Renderer.prototype.strong = function(text) {
      return '<strong>' + text + '</strong>';
    };

    Renderer.prototype.em = function(text) {
      return '<em>' + text + '</em>';
    };

    Renderer.prototype.codespan = function(text) {
      return '<code>' + text + '</code>';
    };

    Renderer.prototype.br = function() {
      return this.options.xhtml ? '<br/>' : '<br>';
    };

    Renderer.prototype.del = function(text) {
      return '<del>' + text + '</del>';
    };

    Renderer.prototype.link = function(href, title, text) {
      if (this.options.sanitize) {
        try {
          var prot = decodeURIComponent(unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
        } catch (e) {
          return text;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
          return text;
        }
      }
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      var out = '<a href="' + href + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;
    };

    Renderer.prototype.image = function(href, title, text) {
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      var out = '<img src="' + href + '" alt="' + text + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';
      return out;
    };

    Renderer.prototype.text = function(text) {
      return text;
    };

    /**
     * Parsing & Compiling
     */

    function Parser(options) {
      this.tokens = [];
      this.token = null;
      this.options = options || marked.defaults;
      this.options.renderer = this.options.renderer || new Renderer;
      this.renderer = this.options.renderer;
      this.renderer.options = this.options;
    }

    /**
     * Static Parse Method
     */

    Parser.parse = function(src, options, renderer) {
      var parser = new Parser(options, renderer);
      return parser.parse(src);
    };

    /**
     * Parse Loop
     */

    Parser.prototype.parse = function(src) {
      this.inline = new InlineLexer(src.links, this.options, this.renderer);
      this.tokens = src.reverse();

      var out = '';
      while (this.next()) {
        out += this.tok();
      }

      return out;
    };

    /**
     * Next Token
     */

    Parser.prototype.next = function() {
      return this.token = this.tokens.pop();
    };

    /**
     * Preview Next Token
     */

    Parser.prototype.peek = function() {
      return this.tokens[this.tokens.length - 1] || 0;
    };

    /**
     * Parse Text Tokens
     */

    Parser.prototype.parseText = function() {
      var body = this.token.text;

      while (this.peek().type === 'text') {
        body += '\n' + this.next().text;
      }

      return this.inline.output(body);
    };

    /**
     * Parse Current Token
     */

    Parser.prototype.tok = function() {
      switch (this.token.type) {
        case 'space': {
          return '';
        }
        case 'hr': {
          return this.renderer.hr();
        }
        case 'heading': {
          return this.renderer.heading(
            this.inline.output(this.token.text),
            this.token.depth,
            this.token.text);
        }
        case 'code': {
          return this.renderer.code(this.token.text,
            this.token.lang,
            this.token.escaped);
        }
        case 'table': {
          var header = ''
            , body = ''
            , i
            , row
            , cell
            , flags
            , j;

          // header
          cell = '';
          for (i = 0; i < this.token.header.length; i++) {
            flags = { header: true, align: this.token.align[i] };
            cell += this.renderer.tablecell(
              this.inline.output(this.token.header[i]),
              { header: true, align: this.token.align[i] }
            );
          }
          header += this.renderer.tablerow(cell);

          for (i = 0; i < this.token.cells.length; i++) {
            row = this.token.cells[i];

            cell = '';
            for (j = 0; j < row.length; j++) {
              cell += this.renderer.tablecell(
                this.inline.output(row[j]),
                { header: false, align: this.token.align[j] }
              );
            }

            body += this.renderer.tablerow(cell);
          }
          return this.renderer.table(header, body);
        }
        case 'blockquote_start': {
          var body = '';

          while (this.next().type !== 'blockquote_end') {
            body += this.tok();
          }

          return this.renderer.blockquote(body);
        }
        case 'list_start': {
          var body = ''
            , ordered = this.token.ordered;

          while (this.next().type !== 'list_end') {
            body += this.tok();
          }

          return this.renderer.list(body, ordered);
        }
        case 'list_item_start': {
          var body = '';

          while (this.next().type !== 'list_item_end') {
            body += this.token.type === 'text'
              ? this.parseText()
              : this.tok();
          }

          return this.renderer.listitem(body);
        }
        case 'loose_item_start': {
          var body = '';

          while (this.next().type !== 'list_item_end') {
            body += this.tok();
          }

          return this.renderer.listitem(body);
        }
        case 'html': {
          var html = !this.token.pre && !this.options.pedantic
            ? this.inline.output(this.token.text)
            : this.token.text;
          return this.renderer.html(html);
        }
        case 'paragraph': {
          return this.renderer.paragraph(this.inline.output(this.token.text));
        }
        case 'text': {
          return this.renderer.paragraph(this.parseText());
        }
      }
    };

    /**
     * Helpers
     */

    function escape(html, encode) {
      return html
        .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function unescape(html) {
    	// explicitly match decimal, hex, and named HTML entities
      return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
        n = n.toLowerCase();
        if (n === 'colon') return ':';
        if (n.charAt(0) === '#') {
          return n.charAt(1) === 'x'
            ? String.fromCharCode(parseInt(n.substring(2), 16))
            : String.fromCharCode(+n.substring(1));
        }
        return '';
      });
    }

    function replace(regex, opt) {
      regex = regex.source;
      opt = opt || '';
      return function self(name, val) {
        if (!name) return new RegExp(regex, opt);
        val = val.source || val;
        val = val.replace(/(^|[^\[])\^/g, '$1');
        regex = regex.replace(name, val);
        return self;
      };
    }

    function resolveUrl(base, href) {
      if (!baseUrls[' ' + base]) {
        // we can ignore everything in base after the last slash of its path component,
        // but we might need to add _that_
        // https://tools.ietf.org/html/rfc3986#section-3
        if (/^[^:]+:\/*[^/]*$/.test(base)) {
          baseUrls[' ' + base] = base + '/';
        } else {
          baseUrls[' ' + base] = base.replace(/[^/]*$/, '');
        }
      }
      base = baseUrls[' ' + base];

      if (href.slice(0, 2) === '//') {
        return base.replace(/:[\s\S]*/, ':') + href;
      } else if (href.charAt(0) === '/') {
        return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
      } else {
        return base + href;
      }
    }
    var baseUrls = {};
    var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

    function noop() {}
    noop.exec = noop;

    function merge(obj) {
      var i = 1
        , target
        , key;

      for (; i < arguments.length; i++) {
        target = arguments[i];
        for (key in target) {
          if (Object.prototype.hasOwnProperty.call(target, key)) {
            obj[key] = target[key];
          }
        }
      }

      return obj;
    }


    /**
     * Marked
     */

    function marked(src, opt, callback) {
      if (callback || typeof opt === 'function') {
        if (!callback) {
          callback = opt;
          opt = null;
        }

        opt = merge({}, marked.defaults, opt || {});

        var highlight = opt.highlight
          , tokens
          , pending
          , i = 0;

        try {
          tokens = Lexer.lex(src, opt);
        } catch (e) {
          return callback(e);
        }

        pending = tokens.length;

        var done = function(err) {
          if (err) {
            opt.highlight = highlight;
            return callback(err);
          }

          var out;

          try {
            out = Parser.parse(tokens, opt);
          } catch (e) {
            err = e;
          }

          opt.highlight = highlight;

          return err
            ? callback(err)
            : callback(null, out);
        };

        if (!highlight || highlight.length < 3) {
          return done();
        }

        delete opt.highlight;

        if (!pending) return done();

        for (; i < tokens.length; i++) {
          (function(token) {
            if (token.type !== 'code') {
              return --pending || done();
            }
            return highlight(token.text, token.lang, function(err, code) {
              if (err) return done(err);
              if (code == null || code === token.text) {
                return --pending || done();
              }
              token.text = code;
              token.escaped = true;
              --pending || done();
            });
          })(tokens[i]);
        }

        return;
      }
      try {
        if (opt) opt = merge({}, marked.defaults, opt);
        return Parser.parse(Lexer.lex(src, opt), opt);
      } catch (e) {
        e.message += '\nPlease report this to https://github.com/chjj/marked.';
        if ((opt || marked.defaults).silent) {
          return '<p>An error occurred:</p><pre>'
            + escape(e.message + '', true)
            + '</pre>';
        }
        throw e;
      }
    }

    /**
     * Options
     */

    marked.options =
    marked.setOptions = function(opt) {
      merge(marked.defaults, opt);
      return marked;
    };

    marked.defaults = {
      gfm: true,
      tables: true,
      breaks: false,
      pedantic: false,
      sanitize: false,
      sanitizer: null,
      mangle: true,
      smartLists: false,
      silent: false,
      highlight: null,
      langPrefix: 'lang-',
      smartypants: false,
      headerPrefix: '',
      renderer: new Renderer,
      xhtml: false,
      baseUrl: null
    };

    /**
     * Expose
     */

    marked.Parser = Parser;
    marked.parser = Parser.parse;

    marked.Renderer = Renderer;

    marked.Lexer = Lexer;
    marked.lexer = Lexer.lex;

    marked.InlineLexer = InlineLexer;
    marked.inlineLexer = InlineLexer.output;

    marked.parse = marked;

    const HL_ROOT =
      "https://cdn.jsdelivr.net/npm/@observablehq/highlight.js@2.0.0/";

    function md(require) {
      return function() {
        return template(
          function(string) {
            var root = document.createElement("div");
            root.innerHTML = marked(string, { langPrefix: "" }).trim();
            var code = root.querySelectorAll("pre code[class]");
            if (code.length > 0) {
              require(HL_ROOT + "highlight.min.js").then(function(hl) {
                code.forEach(function(block) {
                  function done() {
                    hl.highlightBlock(block);
                    block.parentNode.classList.add("observablehq--md-pre");
                  }
                  if (hl.getLanguage(block.className)) {
                    done();
                  } else {
                    require(HL_ROOT + "async-languages/index.js")
                      .then(index => {
                        if (index.has(block.className)) {
                          return require(HL_ROOT +
                            "async-languages/" +
                            index.get(block.className)).then(language => {
                            hl.registerLanguage(block.className, language);
                          });
                        }
                      })
                      .then(done, done);
                  }
                });
              });
            }
            return root;
          },
          function() {
            return document.createElement("div");
          }
        );
      };
    }

    function Mutable(value) {
      let change;
      Object.defineProperties(this, {
        generator: {value: observe(_ => void (change = _))},
        value: {get: () => value, set: x => change(value = x)}
      });
      if (value !== undefined) change(value);
    }

    function* now() {
      while (true) {
        yield Date.now();
      }
    }

    function delay(duration, value) {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve(value);
        }, duration);
      });
    }

    var timeouts = new Map;

    function timeout(now, time) {
      var t = new Promise(function(resolve) {
        timeouts.delete(time);
        var delay = time - now;
        if (!(delay > 0)) throw new Error("invalid time");
        if (delay > 0x7fffffff) throw new Error("too long to wait");
        setTimeout(resolve, delay);
      });
      timeouts.set(time, t);
      return t;
    }

    function when(time, value) {
      var now;
      return (now = timeouts.get(time = +time)) ? now.then(constant(value))
          : (now = Date.now()) >= time ? Promise.resolve(value)
          : timeout(now, time).then(constant(value));
    }

    function tick(duration, value) {
      return when(Math.ceil((Date.now() + 1) / duration) * duration, value);
    }

    var Promises = {
      delay: delay,
      tick: tick,
      when: when
    };

    function resolve(name, base) {
      if (/^(\w+:)|\/\//i.test(name)) return name;
      if (/^[.]{0,2}\//i.test(name)) return new URL(name, base == null ? location : base).href;
      if (!name.length || /^[\s._]/.test(name) || /\s$/.test(name)) throw new Error("illegal name");
      return "https://unpkg.com/" + name;
    }

    const metas = new Map;
    const queue$1 = [];
    const map$1 = queue$1.map;
    const some = queue$1.some;
    const hasOwnProperty = queue$1.hasOwnProperty;
    const origin = "https://cdn.jsdelivr.net/npm/";
    const identifierRe = /^((?:@[^/@]+\/)?[^/@]+)(?:@([^/]+))?(?:\/(.*))?$/;
    const versionRe = /^\d+\.\d+\.\d+(-[\w-.+]+)?$/;
    const extensionRe = /\.[^/]*$/;
    const mains = ["unpkg", "jsdelivr", "browser", "main"];

    class RequireError extends Error {
      constructor(message) {
        super(message);
      }
    }

    RequireError.prototype.name = RequireError.name;

    function main(meta) {
      for (const key of mains) {
        const value = meta[key];
        if (typeof value === "string") {
          return extensionRe.test(value) ? value : `${value}.js`;
        }
      }
    }

    function parseIdentifier(identifier) {
      const match = identifierRe.exec(identifier);
      return match && {
        name: match[1],
        version: match[2],
        path: match[3]
      };
    }

    function resolveMeta(target) {
      const url = `${origin}${target.name}${target.version ? `@${target.version}` : ""}/package.json`;
      let meta = metas.get(url);
      if (!meta) metas.set(url, meta = fetch(url).then(response => {
        if (!response.ok) throw new RequireError("unable to load package.json");
        if (response.redirected && !metas.has(response.url)) metas.set(response.url, meta);
        return response.json();
      }));
      return meta;
    }

    async function resolve$1(name, base) {
      if (name.startsWith(origin)) name = name.substring(origin.length);
      if (/^(\w+:)|\/\//i.test(name)) return name;
      if (/^[.]{0,2}\//i.test(name)) return new URL(name, base == null ? location : base).href;
      if (!name.length || /^[\s._]/.test(name) || /\s$/.test(name)) throw new RequireError("illegal name");
      const target = parseIdentifier(name);
      if (!target) return `${origin}${name}`;
      if (!target.version && base != null && base.startsWith(origin)) {
        const meta = await resolveMeta(parseIdentifier(base.substring(origin.length)));
        target.version = meta.dependencies && meta.dependencies[target.name] || meta.peerDependencies && meta.peerDependencies[target.name];
      }
      if (target.path && !extensionRe.test(target.path)) target.path += ".js";
      if (target.path && target.version && versionRe.test(target.version)) return `${origin}${target.name}@${target.version}/${target.path}`;
      const meta = await resolveMeta(target);
      return `${origin}${meta.name}@${meta.version}/${target.path || main(meta) || "index.js"}`;
    }

    const require = requireFrom(resolve$1);

    function requireFrom(resolver) {
      const cache = new Map;
      const requireBase = requireRelative(null);

      function requireAbsolute(url) {
        if (typeof url !== "string") return url;
        let module = cache.get(url);
        if (!module) cache.set(url, module = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.onload = () => {
            try { resolve(queue$1.pop()(requireRelative(url))); }
            catch (error) { reject(new RequireError("invalid module")); }
            script.remove();
          };
          script.onerror = () => {
            reject(new RequireError("unable to load module"));
            script.remove();
          };
          script.async = true;
          script.src = url;
          window.define = define;
          document.head.appendChild(script);
        }));
        return module;
      }

      function requireRelative(base) {
        return name => Promise.resolve(resolver(name, base)).then(requireAbsolute);
      }

      function requireAlias(aliases) {
        return requireFrom((name, base) => {
          if (name in aliases) {
            name = aliases[name], base = null;
            if (typeof name !== "string") return name;
          }
          return resolver(name, base);
        });
      }

      function require(name) {
        return arguments.length > 1
            ? Promise.all(map$1.call(arguments, requireBase)).then(merge$1)
            : requireBase(name);
      }

      require.alias = requireAlias;
      require.resolve = resolver;

      return require;
    }

    function merge$1(modules) {
      const o = {};
      for (const m of modules) {
        for (const k in m) {
          if (hasOwnProperty.call(m, k)) {
            if (m[k] == null) Object.defineProperty(o, k, {get: getter(m, k)});
            else o[k] = m[k];
          }
        }
      }
      return o;
    }

    function getter(object, name) {
      return () => object[name];
    }

    function isexports(name) {
      return (name + "") === "exports";
    }

    function define(name, dependencies, factory) {
      const n = arguments.length;
      if (n < 2) factory = name, dependencies = [];
      else if (n < 3) factory = dependencies, dependencies = typeof name === "string" ? [] : name;
      queue$1.push(some.call(dependencies, isexports) ? require => {
        const exports = {};
        return Promise.all(map$1.call(dependencies, name => {
          return isexports(name += "") ? exports : require(name);
        })).then(dependencies => {
          factory.apply(null, dependencies);
          return exports;
        });
      } : require => {
        return Promise.all(map$1.call(dependencies, require)).then(dependencies => {
          return typeof factory === "function" ? factory.apply(null, dependencies) : factory;
        });
      });
    }

    define.amd = {};

    function requirer(resolve) {
      return resolve == null ? require : requireFrom(resolve);
    }

    var svg$1 = template(function(string) {
      var root = document.createElementNS("http://www.w3.org/2000/svg", "g");
      root.innerHTML = string.trim();
      return root;
    }, function() {
      return document.createElementNS("http://www.w3.org/2000/svg", "g");
    });

    var raw = String.raw;

    function style(href) {
      return new Promise(function(resolve, reject) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onerror = reject;
        link.onload = resolve;
        document.head.appendChild(link);
      });
    }

    function tex(require) {
      return function() {
        return Promise.all([
          require("@observablehq/katex@0.10.1/dist/katex.min.js"),
          require.resolve("@observablehq/katex@0.10.1/dist/katex.min.css").then(style)
        ]).then(function(values) {
          var katex = values[0], tex = renderer();

          function renderer(options) {
            return function() {
              var root = document.createElement("div");
              katex.render(raw.apply(String, arguments), root, options);
              return root.removeChild(root.firstChild);
            };
          }

          tex.options = renderer;
          tex.block = renderer({displayMode: true});
          return tex;
        });
      };
    }

    function width() {
      return observe(function(change) {
        var width = change(document.body.clientWidth);
        function resized() {
          var w = document.body.clientWidth;
          if (w !== width) change(width = w);
        }
        window.addEventListener("resize", resized);
        return function() {
          window.removeEventListener("resize", resized);
        };
      });
    }

    function Library(resolver) {
      const require = requirer(resolver);
      Object.defineProperties(this, {
        DOM: {value: DOM, writable: true, enumerable: true},
        Files: {value: Files, writable: true, enumerable: true},
        Generators: {value: Generators, writable: true, enumerable: true},
        html: {value: constant(html), writable: true, enumerable: true},
        md: {value: md(require), writable: true, enumerable: true},
        Mutable: {value: constant(Mutable), writable: true, enumerable: true},
        now: {value: now, writable: true, enumerable: true},
        Promises: {value: Promises, writable: true, enumerable: true},
        require: {value: constant(require), writable: true, enumerable: true},
        resolve: {value: constant(resolve), writable: true, enumerable: true},
        svg: {value: constant(svg$1), writable: true, enumerable: true},
        tex: {value: tex(require), writable: true, enumerable: true},
        width: {value: width, writable: true, enumerable: true}
      });
    }

    function RuntimeError(message, input) {
      this.message = message + "";
      this.input = input;
    }

    RuntimeError.prototype = Object.create(Error.prototype);
    RuntimeError.prototype.name = "RuntimeError";
    RuntimeError.prototype.constructor = RuntimeError;

    function generatorish(value) {
      return value
          && typeof value.next === "function"
          && typeof value.return === "function";
    }

    function load(notebook, library, observer) {
      if (typeof library == "function") observer = library, library = null;
      if (typeof observer !== "function") throw new Error("invalid observer");
      if (library == null) library = new Library();

      const {modules, id} = notebook;
      const map = new Map;
      const runtime = new Runtime(library);
      const main = runtime_module(id);

      function runtime_module(id) {
        let module = map.get(id);
        if (!module) map.set(id, module = runtime.module());
        return module;
      }

      for (const m of modules) {
        const module = runtime_module(m.id);
        let i = 0;
        for (const v of m.variables) {
          if (v.from) module.import(v.remote, v.name, runtime_module(v.from));
          else if (module === main) module.variable(observer(v, i, m.variables)).define(v.name, v.inputs, v.value);
          else module.define(v.name, v.inputs, v.value);
          ++i;
        }
      }

      return runtime;
    }

    var prototype = Array.prototype;
    var map$2 = prototype.map;
    var forEach = prototype.forEach;

    function constant$1(x) {
      return function() {
        return x;
      };
    }

    function identity(x) {
      return x;
    }

    function rethrow(e) {
      return function() {
        throw e;
      };
    }

    function noop$1() {}

    var TYPE_NORMAL = 1; // a normal variable
    var TYPE_IMPLICIT = 2; // created on reference
    var TYPE_DUPLICATE = 3; // created on duplicate definition

    var no_observer = {};

    function Variable(type, module, observer) {
      if (observer == null) observer = no_observer;
      Object.defineProperties(this, {
        _observer: {value: observer, writable: true},
        _definition: {value: variable_undefined, writable: true},
        _duplicate: {value: undefined, writable: true},
        _duplicates: {value: undefined, writable: true},
        _indegree: {value: -1, writable: true}, // The number of computing inputs.
        _inputs: {value: [], writable: true},
        _invalidate: {value: noop$1, writable: true},
        _module: {value: module},
        _name: {value: null, writable: true},
        _outputs: {value: new Set, writable: true},
        _promise: {value: Promise.resolve(undefined), writable: true},
        _reachable: {value: observer !== no_observer, writable: true}, // Is this variable transitively visible?
        _rejector: {value: variable_rejector(this)},
        _type: {value: type},
        _value: {value: undefined, writable: true},
        _version: {value: 0, writable: true}
      });
    }

    Object.defineProperties(Variable.prototype, {
      _pending: {value: variable_pending, writable: true, configurable: true},
      _fulfilled: {value: variable_fulfilled, writable: true, configurable: true},
      _rejected: {value: variable_rejected, writable: true, configurable: true},
      define: {value: variable_define, writable: true, configurable: true},
      delete: {value: variable_delete, writable: true, configurable: true},
      import: {value: variable_import, writable: true, configurable: true}
    });

    function variable_attach(variable) {
      variable._module._runtime._dirty.add(variable);
      variable._outputs.add(this);
    }

    function variable_detach(variable) {
      variable._module._runtime._dirty.add(variable);
      variable._outputs.delete(this);
    }

    function variable_undefined() {
      throw variable_undefined;
    }

    function variable_rejector(variable) {
      return function(error) {
        if (error === variable_undefined) throw new RuntimeError(variable._name + " is not defined", variable._name);
        throw new RuntimeError(variable._name + " could not be resolved", variable._name);
      };
    }

    function variable_duplicate(name) {
      return function() {
        throw new RuntimeError(name + " is defined more than once");
      };
    }

    function variable_define(name, inputs, definition) {
      switch (arguments.length) {
        case 1: {
          definition = name, name = inputs = null;
          break;
        }
        case 2: {
          definition = inputs;
          if (typeof name === "string") inputs = null;
          else inputs = name, name = null;
          break;
        }
      }
      return variable_defineImpl.call(this,
        name == null ? null : name + "",
        inputs == null ? [] : map$2.call(inputs, this._module._resolve, this._module),
        typeof definition === "function" ? definition : constant$1(definition)
      );
    }

    function variable_defineImpl(name, inputs, definition) {
      var scope = this._module._scope, runtime = this._module._runtime;

      this._inputs.forEach(variable_detach, this);
      inputs.forEach(variable_attach, this);
      this._inputs = inputs;
      this._definition = definition;
      this._value = undefined;

      // Did the variable’s name change? Time to patch references!
      if (name == this._name && scope.get(name) === this) {
        this._outputs.forEach(runtime._updates.add, runtime._updates);
      } else {
        var error, found;

        if (this._name) { // Did this variable previously have a name?
          if (this._outputs.size) { // And did other variables reference this variable?
            scope.delete(this._name);
            found = this._module._resolve(this._name);
            found._outputs = this._outputs, this._outputs = new Set;
            found._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(this)] = found; }, this);
            found._outputs.forEach(runtime._updates.add, runtime._updates);
            runtime._dirty.add(found).add(this);
            scope.set(this._name, found);
          } else if ((found = scope.get(this._name)) === this) { // Do no other variables reference this variable?
            scope.delete(this._name); // It’s safe to delete!
          } else if (found._type === TYPE_DUPLICATE) { // Do other variables assign this name?
            found._duplicates.delete(this); // This variable no longer assigns this name.
            this._duplicate = undefined;
            if (found._duplicates.size === 1) { // Is there now only one variable assigning this name?
              found = found._duplicates.keys().next().value; // Any references are now fixed!
              error = scope.get(this._name);
              found._outputs = error._outputs, error._outputs = new Set;
              found._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(error)] = found; });
              found._definition = found._duplicate, found._duplicate = undefined;
              runtime._dirty.add(error).add(found);
              runtime._updates.add(found);
              scope.set(this._name, found);
            }
          } else {
            throw new Error;
          }
        }

        if (this._outputs.size) throw new Error;

        if (name) { // Does this variable have a new name?
          if (found = scope.get(name)) { // Do other variables reference or assign this name?
            if (found._type === TYPE_DUPLICATE) { // Do multiple other variables already define this name?
              this._definition = variable_duplicate(name), this._duplicate = definition;
              found._duplicates.add(this);
            } else if (found._type === TYPE_IMPLICIT) { // Are the variable references broken?
              this._outputs = found._outputs, found._outputs = new Set; // Now they’re fixed!
              this._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(found)] = this; }, this);
              runtime._dirty.add(found).add(this);
              scope.set(name, this);
            } else { // Does another variable define this name?
              found._duplicate = found._definition, this._duplicate = definition; // Now they’re duplicates.
              error = new Variable(TYPE_DUPLICATE, this._module);
              error._name = name;
              error._definition = this._definition = found._definition = variable_duplicate(name);
              error._outputs = found._outputs, found._outputs = new Set;
              error._outputs.forEach(function(output) { output._inputs[output._inputs.indexOf(found)] = error; });
              error._duplicates = new Set([this, found]);
              runtime._dirty.add(found).add(error);
              runtime._updates.add(found).add(error);
              scope.set(name, error);
            }
          } else {
            scope.set(name, this);
          }
        }

        this._name = name;
      }

      runtime._updates.add(this);
      runtime._compute();
      return this;
    }

    function variable_import(remote, name, module) {
      if (arguments.length < 3) module = name, name = remote;
      return variable_defineImpl.call(this, name + "", [module._resolve(remote + "")], identity);
    }

    function variable_delete() {
      return variable_defineImpl.call(this, null, [], noop$1);
    }

    function variable_pending() {
      if (this._observer.pending) this._observer.pending();
    }

    function variable_fulfilled(value) {
      if (this._observer.fulfilled) this._observer.fulfilled(value, this._name);
    }

    function variable_rejected(error) {
      if (this._observer.rejected) this._observer.rejected(error, this._name);
    }

    var none = new Map;

    function Module(runtime) {
      Object.defineProperties(this, {
        _runtime: {value: runtime},
        _scope: {value: new Map}
      });
    }

    Object.defineProperties(Module.prototype, {
      _copy: {value: module_copy, writable: true, configurable: true},
      _resolve: {value: module_resolve, writable: true, configurable: true},
      redefine: {value: module_redefine, writable: true, configurable: true},
      define: {value: module_define, writable: true, configurable: true},
      derive: {value: module_derive, writable: true, configurable: true},
      import: {value: module_import, writable: true, configurable: true},
      variable: {value: module_variable, writable: true, configurable: true}
    });

    function module_redefine(name) {
      var v = this._scope.get(name);
      if (!v) throw new RuntimeError(name + " is not defined");
      if (v._type === TYPE_DUPLICATE) throw new RuntimeError(name + " is defined more than once");
      return v.define.apply(v, arguments);
    }

    function module_define() {
      var v = new Variable(TYPE_NORMAL, this);
      return v.define.apply(v, arguments);
    }

    function module_import() {
      var v = new Variable(TYPE_NORMAL, this);
      return v.import.apply(v, arguments);
    }

    function module_variable(observer) {
      return new Variable(TYPE_NORMAL, this, observer);
    }

    function module_derive(injects, injectModule) {
      var injectByAlias = new Map;
      forEach.call(injects, function(inject) {
        if (typeof inject !== "object") inject = {name: inject + ""};
        if (inject.alias == null) inject.alias = inject.name;
        injectByAlias.set(inject.alias, inject);
      });
      return this._copy(injectByAlias, injectModule, new Map);
    }

    function module_copy(injectByAlias, injectModule, map) {
      var copy = new Module(this._runtime);
      map.set(this, copy);
      this._scope.forEach(function(source, name) {
        var target = new Variable(source._type, copy), inject;
        if (inject = injectByAlias.get(name)) {
          target.import(inject.name, inject.alias, injectModule);
        } else if (source._definition === identity) { // import!
          var sourceInput = source._inputs[0],
              sourceModule = sourceInput._module,
              targetModule = map.get(sourceModule) || sourceModule._copy(none, null, map);
          target.import(sourceInput._name, name, targetModule);
        } else {
          target.define(name, source._inputs.map(variable_name), source._definition);
        }
      });
      return copy;
    }

    function module_resolve(name) {
      var variable = this._scope.get(name), value;
      if (!variable)  {
        variable = new Variable(TYPE_IMPLICIT, this);
        if (this._runtime._builtin._scope.has(name)) {
          variable.import(name, this._runtime._builtin);
        } else if (name === "invalidation") {
          variable.define(name, variable_invalidation);
        } else if (name === "visibility") {
          variable.define(name, variable_visibility);
        } else {
          try {
            value = this._runtime._global(name);
          } catch (error) {
            return variable.define(name, rethrow(error));
          }
          if (value === undefined) {
            this._scope.set(variable._name = name, variable);
          } else {
            variable.define(name, constant$1(value));
          }
        }
      }
      return variable;
    }

    function variable_name(variable) {
      return variable._name;
    }

    const frame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setImmediate;

    var variable_invalidation = {};
    var variable_visibility = {};

    function Runtime(builtins = new Library, global = window_global) {
      var builtin = this.module();
      Object.defineProperties(this, {
        _dirty: {value: new Set},
        _updates: {value: new Set},
        _computing: {value: null, writable: true},
        _modules: {value: new Map},
        _builtin: {value: builtin},
        _global: {value: global}
      });
      if (builtins) for (var name in builtins) {
        (new Variable(TYPE_IMPLICIT, builtin)).define(name, [], builtins[name]);
      }
    }

    Object.defineProperties(Runtime, {
      load: {value: load, writable: true, configurable: true}
    });

    Object.defineProperties(Runtime.prototype, {
      _compute: {value: runtime_compute, writable: true, configurable: true},
      _computeSoon: {value: runtime_computeSoon, writable: true, configurable: true},
      _computeNow: {value: runtime_computeNow, writable: true, configurable: true},
      module: {value: runtime_module, writable: true, configurable: true}
    });

    function runtime_module(define, observer = noop$1) {
      if (define === undefined) return new Module(this);
      let module = this._modules.get(define);
      if (module) return module;
      this._modules.set(define, module = define(this, observer));
      return module;
    }

    function runtime_compute() {
      return this._computing || (this._computing = this._computeSoon());
    }

    function runtime_computeSoon() {
      var runtime = this;
      return new Promise(function(resolve) {
        frame(function() {
          resolve();
          runtime._computeNow();
        });
      });
    }

    function runtime_computeNow() {
      var queue = [],
          variables,
          variable;

      // Compute the reachability of the transitive closure of dirty variables.
      // Any newly-reachable variable must also be recomputed.
      // Any no-longer-reachable variable must be terminated.
      variables = new Set(this._dirty);
      variables.forEach(function(variable) {
        variable._inputs.forEach(variables.add, variables);
        const reachable = variable_reachable(variable);
        if (reachable > variable._reachable) {
          this._updates.add(variable);
        } else if (reachable < variable._reachable) {
          variable._invalidate();
        }
        variable._reachable = reachable;
      }, this);

      // Compute the transitive closure of updating, reachable variables.
      variables = new Set(this._updates);
      variables.forEach(function(variable) {
        if (variable._reachable) {
          variable._indegree = 0;
          variable._outputs.forEach(variables.add, variables);
        } else {
          variable._indegree = -1;
          variables.delete(variable);
        }
      });

      this._computing = null;
      this._updates.clear();
      this._dirty.clear();

      // Compute the indegree of updating variables.
      variables.forEach(function(variable) {
        variable._outputs.forEach(variable_increment);
      });

      // Identify the root variables (those with no updating inputs).
      variables.forEach(function(variable) {
        if (variable._indegree === 0) {
          queue.push(variable);
        }
      });

      // Compute the variables in topological order.
      while (variable = queue.pop()) {
        variable_compute(variable);
        variable._outputs.forEach(postqueue);
        variables.delete(variable);
      }

      // Any remaining variables have circular definitions.
      variables.forEach(function(variable) {
        var error = new RuntimeError("circular definition");
        variable._value = undefined;
        (variable._promise = Promise.reject(error)).catch(noop$1);
        variable._rejected(error);
      });

      function postqueue(variable) {
        if (--variable._indegree === 0) {
          queue.push(variable);
        }
      }
    }

    function variable_increment(variable) {
      ++variable._indegree;
    }

    function variable_value(variable) {
      return variable._promise.catch(variable._rejector);
    }

    function variable_invalidator(variable) {
      return new Promise(function(resolve) {
        variable._invalidate = resolve;
      });
    }

    function variable_intersector(invalidation, variable) {
      let node = typeof IntersectionObserver === "function" && variable._observer && variable._observer._node;
      let visible = !node, resolve = noop$1, reject = noop$1, promise, observer;
      if (node) {
        observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting) && (promise = null, resolve()));
        observer.observe(node);
        invalidation.then(() => (observer.disconnect(), observer = null, reject()));
      }
      return function(value) {
        if (visible) return Promise.resolve(value);
        if (!observer) return Promise.reject();
        if (!promise) promise = new Promise((y, n) => (resolve = y, reject = n));
        return promise.then(() => value);
      };
    }

    function variable_compute(variable) {
      variable._invalidate();
      variable._invalidate = noop$1;
      variable._pending();
      var value0 = variable._value,
          version = ++variable._version,
          invalidation = null,
          promise = variable._promise = Promise.all(variable._inputs.map(variable_value)).then(function(inputs) {
        if (variable._version !== version) return;

        // Replace any reference to invalidation with the promise, lazily.
        for (var i = 0, n = inputs.length; i < n; ++i) {
          switch (inputs[i]) {
            case variable_invalidation: {
              inputs[i] = invalidation = variable_invalidator(variable);
              break;
            }
            case variable_visibility: {
              if (!invalidation) invalidation = variable_invalidator(variable);
              inputs[i] = variable_intersector(invalidation, variable);
              break;
            }
          }
        }

        // Compute the initial value of the variable.
        return variable._definition.apply(value0, inputs);
      }).then(function(value) {
        // If the value is a generator, then retrieve its first value,
        // and dispose of the generator if the variable is invalidated.
        if (generatorish(value)) {
          (invalidation || variable_invalidator(variable)).then(variable_return(value));
          return variable_precompute(variable, version, promise, value);
        }
        return value;
      });
      promise.then(function(value) {
        if (variable._version !== version) return;
        variable._value = value;
        variable._fulfilled(value);
      }, function(error) {
        if (variable._version !== version) return;
        variable._value = undefined;
        variable._rejected(error);
      });
    }

    function variable_precompute(variable, version, promise, generator) {
      function recompute() {
        var promise = new Promise(function(resolve) {
          resolve(generator.next());
        }).then(function(next) {
          return next.done ? undefined : Promise.resolve(next.value).then(function(value) {
            if (variable._version !== version) return;
            variable_postrecompute(variable, value, promise).then(recompute);
            variable._fulfilled(value);
            return value;
          });
        });
        promise.catch(function(error) {
          if (variable._version !== version) return;
          variable_postrecompute(variable, undefined, promise);
          variable._rejected(error);
        });
      }
      return new Promise(function(resolve) {
        resolve(generator.next());
      }).then(function(next) {
        if (next.done) return;
        promise.then(recompute);
        return next.value;
      });
    }

    function variable_postrecompute(variable, value, promise) {
      var runtime = variable._module._runtime;
      variable._value = value;
      variable._promise = promise;
      variable._outputs.forEach(runtime._updates.add, runtime._updates); // TODO Cleaner?
      return runtime._compute();
    }

    function variable_return(generator) {
      return function() {
        generator.return();
      };
    }

    function variable_reachable(variable) {
      if (variable._observer !== no_observer) return true; // Directly reachable.
      var outputs = new Set(variable._outputs);
      for (const output of outputs) {
        if (output._observer !== no_observer) return true;
        output._outputs.forEach(outputs.add, outputs);
      }
      return false;
    }

    function window_global(name) {
      return window[name];
    }

    var t0 = new Date,
        t1 = new Date;

    function newInterval(floori, offseti, count, field) {

      function interval(date) {
        return floori(date = new Date(+date)), date;
      }

      interval.floor = interval;

      interval.ceil = function(date) {
        return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
      };

      interval.round = function(date) {
        var d0 = interval(date),
            d1 = interval.ceil(date);
        return date - d0 < d1 - date ? d0 : d1;
      };

      interval.offset = function(date, step) {
        return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
      };

      interval.range = function(start, stop, step) {
        var range = [], previous;
        start = interval.ceil(start);
        step = step == null ? 1 : Math.floor(step);
        if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
        do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
        while (previous < start && start < stop);
        return range;
      };

      interval.filter = function(test) {
        return newInterval(function(date) {
          if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
        }, function(date, step) {
          if (date >= date) {
            if (step < 0) while (++step <= 0) {
              while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
            } else while (--step >= 0) {
              while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
            }
          }
        });
      };

      if (count) {
        interval.count = function(start, end) {
          t0.setTime(+start), t1.setTime(+end);
          floori(t0), floori(t1);
          return Math.floor(count(t0, t1));
        };

        interval.every = function(step) {
          step = Math.floor(step);
          return !isFinite(step) || !(step > 0) ? null
              : !(step > 1) ? interval
              : interval.filter(field
                  ? function(d) { return field(d) % step === 0; }
                  : function(d) { return interval.count(0, d) % step === 0; });
        };
      }

      return interval;
    }

    var millisecond = newInterval(function() {
      // noop
    }, function(date, step) {
      date.setTime(+date + step);
    }, function(start, end) {
      return end - start;
    });

    // An optimized implementation for this simple case.
    millisecond.every = function(k) {
      k = Math.floor(k);
      if (!isFinite(k) || !(k > 0)) return null;
      if (!(k > 1)) return millisecond;
      return newInterval(function(date) {
        date.setTime(Math.floor(date / k) * k);
      }, function(date, step) {
        date.setTime(+date + step * k);
      }, function(start, end) {
        return (end - start) / k;
      });
    };

    var durationSecond = 1e3;
    var durationMinute = 6e4;
    var durationHour = 36e5;
    var durationDay = 864e5;
    var durationWeek = 6048e5;

    var second = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds());
    }, function(date, step) {
      date.setTime(+date + step * durationSecond);
    }, function(start, end) {
      return (end - start) / durationSecond;
    }, function(date) {
      return date.getUTCSeconds();
    });

    var minute = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
    }, function(date, step) {
      date.setTime(+date + step * durationMinute);
    }, function(start, end) {
      return (end - start) / durationMinute;
    }, function(date) {
      return date.getMinutes();
    });

    var hour = newInterval(function(date) {
      date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
    }, function(date, step) {
      date.setTime(+date + step * durationHour);
    }, function(start, end) {
      return (end - start) / durationHour;
    }, function(date) {
      return date.getHours();
    });

    var day = newInterval(function(date) {
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
    }, function(date) {
      return date.getDate() - 1;
    });

    function weekday(i) {
      return newInterval(function(date) {
        date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setDate(date.getDate() + step * 7);
      }, function(start, end) {
        return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
      });
    }

    var sunday = weekday(0);
    var monday = weekday(1);
    var tuesday = weekday(2);
    var wednesday = weekday(3);
    var thursday = weekday(4);
    var friday = weekday(5);
    var saturday = weekday(6);

    var month = newInterval(function(date) {
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setMonth(date.getMonth() + step);
    }, function(start, end) {
      return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
    }, function(date) {
      return date.getMonth();
    });

    var year = newInterval(function(date) {
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step);
    }, function(start, end) {
      return end.getFullYear() - start.getFullYear();
    }, function(date) {
      return date.getFullYear();
    });

    // An optimized implementation for this simple case.
    year.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setFullYear(Math.floor(date.getFullYear() / k) * k);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setFullYear(date.getFullYear() + step * k);
      });
    };

    var utcMinute = newInterval(function(date) {
      date.setUTCSeconds(0, 0);
    }, function(date, step) {
      date.setTime(+date + step * durationMinute);
    }, function(start, end) {
      return (end - start) / durationMinute;
    }, function(date) {
      return date.getUTCMinutes();
    });

    var utcHour = newInterval(function(date) {
      date.setUTCMinutes(0, 0, 0);
    }, function(date, step) {
      date.setTime(+date + step * durationHour);
    }, function(start, end) {
      return (end - start) / durationHour;
    }, function(date) {
      return date.getUTCHours();
    });

    var utcDay = newInterval(function(date) {
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step);
    }, function(start, end) {
      return (end - start) / durationDay;
    }, function(date) {
      return date.getUTCDate() - 1;
    });

    function utcWeekday(i) {
      return newInterval(function(date) {
        date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCDate(date.getUTCDate() + step * 7);
      }, function(start, end) {
        return (end - start) / durationWeek;
      });
    }

    var utcSunday = utcWeekday(0);
    var utcMonday = utcWeekday(1);
    var utcTuesday = utcWeekday(2);
    var utcWednesday = utcWeekday(3);
    var utcThursday = utcWeekday(4);
    var utcFriday = utcWeekday(5);
    var utcSaturday = utcWeekday(6);

    var utcMonth = newInterval(function(date) {
      date.setUTCDate(1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCMonth(date.getUTCMonth() + step);
    }, function(start, end) {
      return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
    }, function(date) {
      return date.getUTCMonth();
    });

    var utcYear = newInterval(function(date) {
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step);
    }, function(start, end) {
      return end.getUTCFullYear() - start.getUTCFullYear();
    }, function(date) {
      return date.getUTCFullYear();
    });

    // An optimized implementation for this simple case.
    utcYear.every = function(k) {
      return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
        date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
        date.setUTCMonth(0, 1);
        date.setUTCHours(0, 0, 0, 0);
      }, function(date, step) {
        date.setUTCFullYear(date.getUTCFullYear() + step * k);
      });
    };

    function localDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
        date.setFullYear(d.y);
        return date;
      }
      return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
    }

    function utcDate(d) {
      if (0 <= d.y && d.y < 100) {
        var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
        date.setUTCFullYear(d.y);
        return date;
      }
      return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
    }

    function newYear(y) {
      return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
    }

    function formatLocale(locale) {
      var locale_dateTime = locale.dateTime,
          locale_date = locale.date,
          locale_time = locale.time,
          locale_periods = locale.periods,
          locale_weekdays = locale.days,
          locale_shortWeekdays = locale.shortDays,
          locale_months = locale.months,
          locale_shortMonths = locale.shortMonths;

      var periodRe = formatRe(locale_periods),
          periodLookup = formatLookup(locale_periods),
          weekdayRe = formatRe(locale_weekdays),
          weekdayLookup = formatLookup(locale_weekdays),
          shortWeekdayRe = formatRe(locale_shortWeekdays),
          shortWeekdayLookup = formatLookup(locale_shortWeekdays),
          monthRe = formatRe(locale_months),
          monthLookup = formatLookup(locale_months),
          shortMonthRe = formatRe(locale_shortMonths),
          shortMonthLookup = formatLookup(locale_shortMonths);

      var formats = {
        "a": formatShortWeekday,
        "A": formatWeekday,
        "b": formatShortMonth,
        "B": formatMonth,
        "c": null,
        "d": formatDayOfMonth,
        "e": formatDayOfMonth,
        "f": formatMicroseconds,
        "H": formatHour24,
        "I": formatHour12,
        "j": formatDayOfYear,
        "L": formatMilliseconds,
        "m": formatMonthNumber,
        "M": formatMinutes,
        "p": formatPeriod,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatSeconds,
        "u": formatWeekdayNumberMonday,
        "U": formatWeekNumberSunday,
        "V": formatWeekNumberISO,
        "w": formatWeekdayNumberSunday,
        "W": formatWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatYear,
        "Y": formatFullYear,
        "Z": formatZone,
        "%": formatLiteralPercent
      };

      var utcFormats = {
        "a": formatUTCShortWeekday,
        "A": formatUTCWeekday,
        "b": formatUTCShortMonth,
        "B": formatUTCMonth,
        "c": null,
        "d": formatUTCDayOfMonth,
        "e": formatUTCDayOfMonth,
        "f": formatUTCMicroseconds,
        "H": formatUTCHour24,
        "I": formatUTCHour12,
        "j": formatUTCDayOfYear,
        "L": formatUTCMilliseconds,
        "m": formatUTCMonthNumber,
        "M": formatUTCMinutes,
        "p": formatUTCPeriod,
        "Q": formatUnixTimestamp,
        "s": formatUnixTimestampSeconds,
        "S": formatUTCSeconds,
        "u": formatUTCWeekdayNumberMonday,
        "U": formatUTCWeekNumberSunday,
        "V": formatUTCWeekNumberISO,
        "w": formatUTCWeekdayNumberSunday,
        "W": formatUTCWeekNumberMonday,
        "x": null,
        "X": null,
        "y": formatUTCYear,
        "Y": formatUTCFullYear,
        "Z": formatUTCZone,
        "%": formatLiteralPercent
      };

      var parses = {
        "a": parseShortWeekday,
        "A": parseWeekday,
        "b": parseShortMonth,
        "B": parseMonth,
        "c": parseLocaleDateTime,
        "d": parseDayOfMonth,
        "e": parseDayOfMonth,
        "f": parseMicroseconds,
        "H": parseHour24,
        "I": parseHour24,
        "j": parseDayOfYear,
        "L": parseMilliseconds,
        "m": parseMonthNumber,
        "M": parseMinutes,
        "p": parsePeriod,
        "Q": parseUnixTimestamp,
        "s": parseUnixTimestampSeconds,
        "S": parseSeconds,
        "u": parseWeekdayNumberMonday,
        "U": parseWeekNumberSunday,
        "V": parseWeekNumberISO,
        "w": parseWeekdayNumberSunday,
        "W": parseWeekNumberMonday,
        "x": parseLocaleDate,
        "X": parseLocaleTime,
        "y": parseYear,
        "Y": parseFullYear,
        "Z": parseZone,
        "%": parseLiteralPercent
      };

      // These recursive directive definitions must be deferred.
      formats.x = newFormat(locale_date, formats);
      formats.X = newFormat(locale_time, formats);
      formats.c = newFormat(locale_dateTime, formats);
      utcFormats.x = newFormat(locale_date, utcFormats);
      utcFormats.X = newFormat(locale_time, utcFormats);
      utcFormats.c = newFormat(locale_dateTime, utcFormats);

      function newFormat(specifier, formats) {
        return function(date) {
          var string = [],
              i = -1,
              j = 0,
              n = specifier.length,
              c,
              pad,
              format;

          if (!(date instanceof Date)) date = new Date(+date);

          while (++i < n) {
            if (specifier.charCodeAt(i) === 37) {
              string.push(specifier.slice(j, i));
              if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
              else pad = c === "e" ? " " : "0";
              if (format = formats[c]) c = format(date, pad);
              string.push(c);
              j = i + 1;
            }
          }

          string.push(specifier.slice(j, i));
          return string.join("");
        };
      }

      function newParse(specifier, newDate) {
        return function(string) {
          var d = newYear(1900),
              i = parseSpecifier(d, specifier, string += "", 0),
              week, day$1;
          if (i != string.length) return null;

          // If a UNIX timestamp is specified, return it.
          if ("Q" in d) return new Date(d.Q);

          // The am-pm flag is 0 for AM, and 1 for PM.
          if ("p" in d) d.H = d.H % 12 + d.p * 12;

          // Convert day-of-week and week-of-year to day-of-year.
          if ("V" in d) {
            if (d.V < 1 || d.V > 53) return null;
            if (!("w" in d)) d.w = 1;
            if ("Z" in d) {
              week = utcDate(newYear(d.y)), day$1 = week.getUTCDay();
              week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
              week = utcDay.offset(week, (d.V - 1) * 7);
              d.y = week.getUTCFullYear();
              d.m = week.getUTCMonth();
              d.d = week.getUTCDate() + (d.w + 6) % 7;
            } else {
              week = newDate(newYear(d.y)), day$1 = week.getDay();
              week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
              week = day.offset(week, (d.V - 1) * 7);
              d.y = week.getFullYear();
              d.m = week.getMonth();
              d.d = week.getDate() + (d.w + 6) % 7;
            }
          } else if ("W" in d || "U" in d) {
            if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
            day$1 = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
            d.m = 0;
            d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
          }

          // If a time zone is specified, all fields are interpreted as UTC and then
          // offset according to the specified time zone.
          if ("Z" in d) {
            d.H += d.Z / 100 | 0;
            d.M += d.Z % 100;
            return utcDate(d);
          }

          // Otherwise, all fields are in local time.
          return newDate(d);
        };
      }

      function parseSpecifier(d, specifier, string, j) {
        var i = 0,
            n = specifier.length,
            m = string.length,
            c,
            parse;

        while (i < n) {
          if (j >= m) return -1;
          c = specifier.charCodeAt(i++);
          if (c === 37) {
            c = specifier.charAt(i++);
            parse = parses[c in pads ? specifier.charAt(i++) : c];
            if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
          } else if (c != string.charCodeAt(j++)) {
            return -1;
          }
        }

        return j;
      }

      function parsePeriod(d, string, i) {
        var n = periodRe.exec(string.slice(i));
        return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortWeekday(d, string, i) {
        var n = shortWeekdayRe.exec(string.slice(i));
        return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseWeekday(d, string, i) {
        var n = weekdayRe.exec(string.slice(i));
        return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseShortMonth(d, string, i) {
        var n = shortMonthRe.exec(string.slice(i));
        return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseMonth(d, string, i) {
        var n = monthRe.exec(string.slice(i));
        return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
      }

      function parseLocaleDateTime(d, string, i) {
        return parseSpecifier(d, locale_dateTime, string, i);
      }

      function parseLocaleDate(d, string, i) {
        return parseSpecifier(d, locale_date, string, i);
      }

      function parseLocaleTime(d, string, i) {
        return parseSpecifier(d, locale_time, string, i);
      }

      function formatShortWeekday(d) {
        return locale_shortWeekdays[d.getDay()];
      }

      function formatWeekday(d) {
        return locale_weekdays[d.getDay()];
      }

      function formatShortMonth(d) {
        return locale_shortMonths[d.getMonth()];
      }

      function formatMonth(d) {
        return locale_months[d.getMonth()];
      }

      function formatPeriod(d) {
        return locale_periods[+(d.getHours() >= 12)];
      }

      function formatUTCShortWeekday(d) {
        return locale_shortWeekdays[d.getUTCDay()];
      }

      function formatUTCWeekday(d) {
        return locale_weekdays[d.getUTCDay()];
      }

      function formatUTCShortMonth(d) {
        return locale_shortMonths[d.getUTCMonth()];
      }

      function formatUTCMonth(d) {
        return locale_months[d.getUTCMonth()];
      }

      function formatUTCPeriod(d) {
        return locale_periods[+(d.getUTCHours() >= 12)];
      }

      return {
        format: function(specifier) {
          var f = newFormat(specifier += "", formats);
          f.toString = function() { return specifier; };
          return f;
        },
        parse: function(specifier) {
          var p = newParse(specifier += "", localDate);
          p.toString = function() { return specifier; };
          return p;
        },
        utcFormat: function(specifier) {
          var f = newFormat(specifier += "", utcFormats);
          f.toString = function() { return specifier; };
          return f;
        },
        utcParse: function(specifier) {
          var p = newParse(specifier, utcDate);
          p.toString = function() { return specifier; };
          return p;
        }
      };
    }

    var pads = {"-": "", "_": " ", "0": "0"},
        numberRe = /^\s*\d+/, // note: ignores next directive
        percentRe = /^%/,
        requoteRe = /[\\^$*+?|[\]().{}]/g;

    function pad(value, fill, width) {
      var sign = value < 0 ? "-" : "",
          string = (sign ? -value : value) + "",
          length = string.length;
      return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
    }

    function requote(s) {
      return s.replace(requoteRe, "\\$&");
    }

    function formatRe(names) {
      return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
    }

    function formatLookup(names) {
      var map = {}, i = -1, n = names.length;
      while (++i < n) map[names[i].toLowerCase()] = i;
      return map;
    }

    function parseWeekdayNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.w = +n[0], i + n[0].length) : -1;
    }

    function parseWeekdayNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 1));
      return n ? (d.u = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberSunday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.U = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberISO(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.V = +n[0], i + n[0].length) : -1;
    }

    function parseWeekNumberMonday(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.W = +n[0], i + n[0].length) : -1;
    }

    function parseFullYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 4));
      return n ? (d.y = +n[0], i + n[0].length) : -1;
    }

    function parseYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
    }

    function parseZone(d, string, i) {
      var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
      return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
    }

    function parseMonthNumber(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
    }

    function parseDayOfMonth(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.d = +n[0], i + n[0].length) : -1;
    }

    function parseDayOfYear(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
    }

    function parseHour24(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.H = +n[0], i + n[0].length) : -1;
    }

    function parseMinutes(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.M = +n[0], i + n[0].length) : -1;
    }

    function parseSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 2));
      return n ? (d.S = +n[0], i + n[0].length) : -1;
    }

    function parseMilliseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 3));
      return n ? (d.L = +n[0], i + n[0].length) : -1;
    }

    function parseMicroseconds(d, string, i) {
      var n = numberRe.exec(string.slice(i, i + 6));
      return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
    }

    function parseLiteralPercent(d, string, i) {
      var n = percentRe.exec(string.slice(i, i + 1));
      return n ? i + n[0].length : -1;
    }

    function parseUnixTimestamp(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = +n[0], i + n[0].length) : -1;
    }

    function parseUnixTimestampSeconds(d, string, i) {
      var n = numberRe.exec(string.slice(i));
      return n ? (d.Q = (+n[0]) * 1000, i + n[0].length) : -1;
    }

    function formatDayOfMonth(d, p) {
      return pad(d.getDate(), p, 2);
    }

    function formatHour24(d, p) {
      return pad(d.getHours(), p, 2);
    }

    function formatHour12(d, p) {
      return pad(d.getHours() % 12 || 12, p, 2);
    }

    function formatDayOfYear(d, p) {
      return pad(1 + day.count(year(d), d), p, 3);
    }

    function formatMilliseconds(d, p) {
      return pad(d.getMilliseconds(), p, 3);
    }

    function formatMicroseconds(d, p) {
      return formatMilliseconds(d, p) + "000";
    }

    function formatMonthNumber(d, p) {
      return pad(d.getMonth() + 1, p, 2);
    }

    function formatMinutes(d, p) {
      return pad(d.getMinutes(), p, 2);
    }

    function formatSeconds(d, p) {
      return pad(d.getSeconds(), p, 2);
    }

    function formatWeekdayNumberMonday(d) {
      var day = d.getDay();
      return day === 0 ? 7 : day;
    }

    function formatWeekNumberSunday(d, p) {
      return pad(sunday.count(year(d), d), p, 2);
    }

    function formatWeekNumberISO(d, p) {
      var day = d.getDay();
      d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
      return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
    }

    function formatWeekdayNumberSunday(d) {
      return d.getDay();
    }

    function formatWeekNumberMonday(d, p) {
      return pad(monday.count(year(d), d), p, 2);
    }

    function formatYear(d, p) {
      return pad(d.getFullYear() % 100, p, 2);
    }

    function formatFullYear(d, p) {
      return pad(d.getFullYear() % 10000, p, 4);
    }

    function formatZone(d) {
      var z = d.getTimezoneOffset();
      return (z > 0 ? "-" : (z *= -1, "+"))
          + pad(z / 60 | 0, "0", 2)
          + pad(z % 60, "0", 2);
    }

    function formatUTCDayOfMonth(d, p) {
      return pad(d.getUTCDate(), p, 2);
    }

    function formatUTCHour24(d, p) {
      return pad(d.getUTCHours(), p, 2);
    }

    function formatUTCHour12(d, p) {
      return pad(d.getUTCHours() % 12 || 12, p, 2);
    }

    function formatUTCDayOfYear(d, p) {
      return pad(1 + utcDay.count(utcYear(d), d), p, 3);
    }

    function formatUTCMilliseconds(d, p) {
      return pad(d.getUTCMilliseconds(), p, 3);
    }

    function formatUTCMicroseconds(d, p) {
      return formatUTCMilliseconds(d, p) + "000";
    }

    function formatUTCMonthNumber(d, p) {
      return pad(d.getUTCMonth() + 1, p, 2);
    }

    function formatUTCMinutes(d, p) {
      return pad(d.getUTCMinutes(), p, 2);
    }

    function formatUTCSeconds(d, p) {
      return pad(d.getUTCSeconds(), p, 2);
    }

    function formatUTCWeekdayNumberMonday(d) {
      var dow = d.getUTCDay();
      return dow === 0 ? 7 : dow;
    }

    function formatUTCWeekNumberSunday(d, p) {
      return pad(utcSunday.count(utcYear(d), d), p, 2);
    }

    function formatUTCWeekNumberISO(d, p) {
      var day = d.getUTCDay();
      d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
      return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
    }

    function formatUTCWeekdayNumberSunday(d) {
      return d.getUTCDay();
    }

    function formatUTCWeekNumberMonday(d, p) {
      return pad(utcMonday.count(utcYear(d), d), p, 2);
    }

    function formatUTCYear(d, p) {
      return pad(d.getUTCFullYear() % 100, p, 2);
    }

    function formatUTCFullYear(d, p) {
      return pad(d.getUTCFullYear() % 10000, p, 4);
    }

    function formatUTCZone() {
      return "+0000";
    }

    function formatLiteralPercent() {
      return "%";
    }

    function formatUnixTimestamp(d) {
      return +d;
    }

    function formatUnixTimestampSeconds(d) {
      return Math.floor(+d / 1000);
    }

    var locale;
    var timeFormat;
    var timeParse;
    var utcFormat;
    var utcParse;

    defaultLocale({
      dateTime: "%x, %X",
      date: "%-m/%-d/%Y",
      time: "%-I:%M:%S %p",
      periods: ["AM", "PM"],
      days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    });

    function defaultLocale(definition) {
      locale = formatLocale(definition);
      timeFormat = locale.format;
      timeParse = locale.parse;
      utcFormat = locale.utcFormat;
      utcParse = locale.utcParse;
      return locale;
    }

    var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

    function formatIsoNative(date) {
      return date.toISOString();
    }

    var formatIso = Date.prototype.toISOString
        ? formatIsoNative
        : utcFormat(isoSpecifier);

    function parseIsoNative(string) {
      var date = new Date(string);
      return isNaN(date) ? null : date;
    }

    var parseIso = +new Date("2000-01-01T00:00:00.000Z")
        ? parseIsoNative
        : utcParse(isoSpecifier);

    // import * as winston from "winston";
    const logDate = timeFormat("%Y-%m-%d %H-%M-%S.%L");
    const createLogger = config => {
        return console;
        /*
        const { label = "UNNAMED" } = config;
        return winston.createLogger({
          level: "debug",
          format: winston.format.combine(
            winston.format.label({ label }),
            winston.format.prettyPrint(),
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(
              ({ level, message, label, timestamp }) =>
                `[${logDate(new Date(timestamp))}] [${label}] ${level} : ${message}`
            )
          ),
          transports: [new winston.transports.Console()]
        });
        */
    };

    const logger = createLogger();
    class OakInspector {
        constructor(socket, initialName) {
            this.socket = socket;
            this.initialName = initialName;
            // logger.debug(`CustomInspector constructor called`);
        }
        pending() {
            // logger.debug(`${this.initialName} pending called`);
            if (this.socket)
                this.socket.emit("pending", { initialName: this.initialName });
        }
        fulfilled(value, name) {
            logger.debug(`fulfilled called, |${name}`);
            if (this.socket)
                this.socket.emit("fulfilled", { value, name });
        }
        rejected(error, name) {
            logger.error(`rejected called, ${error}|${name}`);
            if (this.socket)
                this.socket.emit("rejected", { error, name });
        }
    }

    const loadOakfile = (config) => {
        const { path = "Oakfile", cleanRecipe = true } = config || {};
        return new Promise((res, rej) => {
            fs.readFile(path, "utf8", (err, contents) => {
                if (err)
                    rej(err);
                let oak = null;
                try {
                    oak = JSON.parse(contents);
                }
                catch (err) {
                    console.error(err);
                    rej(err);
                    return;
                }
                if (cleanRecipe) {
                    for (let key in oak.variables) {
                        let { recipe } = oak.variables[key];
                        for (let key2 in oak.variables) {
                            recipe = recipe.replace(`\${${key2}}`, oak.variables[key2].filename);
                        }
                        oak.variables[key].recipe = recipe;
                    }
                }
                res(oak);
            });
        });
    };
    const getStat = (filename) => new Promise(function (res, rej) {
        fs.stat(filename, (err, stat) => {
            if (err)
                rej(err);
            res(stat);
        });
    });

    const oakLogger = createLogger();
    const runRecipe = (recipe) => {
        const e = new events.EventEmitter();
        const process = child_process.spawn(recipe, { shell: true });
        console.log(`running recipe ${recipe}`);
        process.stdout.on("data", chunk => {
            e.emit("stdout", chunk);
        });
        process.stderr.on("data", chunk => {
            e.emit("stderr", chunk);
        });
        process.on("close", (code) => __awaiter(undefined, void 0, void 0, function* () {
            e.emit("close", code);
        }));
        process.on("error", () => {
            e.emit("error");
        });
        return e;
    };
    function performRecipe(oakVariable) {
        return new Promise((res, rej) => {
            runRecipe(oakVariable.recipe)
                .on("stdout", chunk => { })
                .on("stderr", chunk => { })
                .on("close", (code) => __awaiter(this, void 0, void 0, function* () {
                console.info(`Process closing with code ${code}`);
                const stat = yield getStat(oakVariable.filename).catch(e => {
                    oakLogger.error(`Error reading stat for ${oakVariable.filename} (2nd attempt): ${e}`);
                    throw e;
                    return null;
                });
                res({ oakVariable, stat });
            }))
                .on("error", () => {
                process = null;
                console.error(`Process errored`);
                rej("error");
            });
        });
    }
    function createVariableDefinition(oakVariable, key) {
        return function (...variableDependencies) {
            return __awaiter(this, void 0, void 0, function* () {
                let stat = yield getStat(oakVariable.filename).catch(e => {
                    // TODO check error code, only "file not exists" error
                    oakLogger.error(`Error reading stat for ${oakVariable.filename} (intial): ${e}`);
                    return null;
                });
                // ideally, this would only happen at most once, because the target file doesnt
                // exist yet. after running the recipe, the target should exist
                if (stat === null) {
                    oakLogger.info(`[${key}] running recipe - bc inital stat not available - "${oakVariable.recipe}"`);
                    return performRecipe(oakVariable);
                }
                const updatedDeps = variableDependencies.filter(dep => dep.stat.mtime > stat.mtime);
                if (updatedDeps.length > 0) {
                    oakLogger.debug(`${key} is out of date because ${updatedDeps.length} dependenices (${updatedDeps
                    .map(dep => dep.oakVariable.filename)
                    .join(",")}) have updated. Calling recipe '${oakVariable.recipe}'`);
                    return performRecipe(oakVariable);
                }
                return new Promise(function (res, rej) {
                    res({ oakVariable, stat });
                });
            });
        };
    }
    function oak_static(argv) {
        return __awaiter(this, void 0, void 0, function* () {
            const runtime = new Runtime();
            const m = runtime.module();
            console.log("TODO in oak_static, argv:");
            console.log(argv);
            const oak = yield loadOakfile();
            Object.keys(oak.variables).map(key => {
                const variable = oak.variables[key];
                const variableDefinition = createVariableDefinition(variable, key);
                m.variable(new OakInspector(null, key)).define(key, variable.deps, variableDefinition);
            });
        });
    }

    const styles = {
        bgWhite: { open: "\u001b[47m", close: "\u001b[49m" },
        bold: { open: "\u001b[1m", close: "\u001b[22m" },
        black: { open: "\u001b[30m", close: "\u001b[39m" }
    };
    const styleVariable = v => `${styles.bold.open}${styles.black.open}${styles.bgWhite.open}${v}${styles.bgWhite.close}${styles.black.close}${styles.bold.close}`;
    function oak_print(argv) {
        return __awaiter(this, void 0, void 0, function* () {
            const oakfile = yield loadOakfile({ path: argv.oakfile, cleanRecipe: true });
            const { variables } = oakfile;
            console.log(`Oakfile at ${argv.oakfile}:`);
            Object.keys(variables).map(key => {
                const target = variables[key];
                console.log(`${styleVariable(key)} = ${target.filename}`);
                target.deps && console.log(`\t ${target.deps.join(", ")}`);
            });
        });
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var CommandLineParameter_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Identifies the kind of a CommandLineParameter.
     * @public
     */
    var CommandLineParameterKind;
    (function (CommandLineParameterKind) {
        /** Indicates a CommandLineChoiceParameter */
        CommandLineParameterKind[CommandLineParameterKind["Choice"] = 0] = "Choice";
        /** Indicates a CommandLineFlagParameter */
        CommandLineParameterKind[CommandLineParameterKind["Flag"] = 1] = "Flag";
        /** Indicates a CommandLineIntegerParameter */
        CommandLineParameterKind[CommandLineParameterKind["Integer"] = 2] = "Integer";
        /** Indicates a CommandLineStringParameter */
        CommandLineParameterKind[CommandLineParameterKind["String"] = 3] = "String";
        /** Indicates a CommandLineStringListParameter */
        CommandLineParameterKind[CommandLineParameterKind["StringList"] = 4] = "StringList";
    })(CommandLineParameterKind = exports.CommandLineParameterKind || (exports.CommandLineParameterKind = {}));
    /**
     * The base class for the various command-line parameter types.
     * @public
     */
    class CommandLineParameter {
        /** @internal */
        constructor(definition) {
            this.longName = definition.parameterLongName;
            this.shortName = definition.parameterShortName;
            this.description = definition.description;
            this.required = !!definition.required;
            this.environmentVariable = definition.environmentVariable;
            if (!CommandLineParameter._longNameRegExp.test(this.longName)) {
                throw new Error(`Invalid name: "${this.longName}". The parameter long name must be`
                    + ` lower-case and use dash delimiters (e.g. "--do-a-thing")`);
            }
            if (this.shortName) {
                if (!CommandLineParameter._shortNameRegExp.test(this.shortName)) {
                    throw new Error(`Invalid name: "${this.shortName}". The parameter short name must be`
                        + ` a dash followed by a single upper-case or lower-case letter (e.g. "-a")`);
                }
            }
            if (this.environmentVariable) {
                if (this.required) {
                    throw new Error(`An "environmentVariable" cannot be specified for "${this.longName}"`
                        + ` because it is a required parameter`);
                }
                if (!CommandLineParameter._environmentVariableRegExp.test(this.environmentVariable)) {
                    throw new Error(`Invalid environment variable name: "${this.environmentVariable}". The name must`
                        + ` consist only of upper-case letters, numbers, and underscores. It may not start with a number.`);
                }
            }
        }
        /**
         * Returns additional text used by the help formatter.
         * @internal
         */
        _getSupplementaryNotes(supplementaryNotes) {
            if (this.environmentVariable !== undefined) {
                supplementaryNotes.push('This parameter may alternatively specified via the ' + this.environmentVariable
                    + ' environment variable.');
            }
        }
        /**
         * Internal usage only.  Used to report unexpected output from the argparse library.
         */
        reportInvalidData(data) {
            throw new Error(`Unexpected data object for parameter "${this.longName}": `
                + JSON.stringify(data));
        }
        validateDefaultValue(hasDefaultValue) {
            if (this.required && hasDefaultValue) {
                // If a parameter is "required", then the user understands that they always need to
                // specify a value for this parameter (either via the command line or via an environment variable).
                // It would be confusing to allow a default value that sometimes allows the "required" parameter
                // to be omitted.  If you sometimes don't have a suitable default value, then the better approach
                // is to throw a custom error explaining why the parameter is required in that case.
                throw new Error(`A default value cannot be specified for "${this.longName}"`
                    + ` because it is a "required" parameter`);
            }
        }
    }
    // Example: "--do-something"
    CommandLineParameter._longNameRegExp = /^-(-[a-z0-9]+)+$/;
    // Example: "-d"
    CommandLineParameter._shortNameRegExp = /^-[a-zA-Z]$/;
    // "Environment variable names used by the utilities in the Shell and Utilities volume of
    // IEEE Std 1003.1-2001 consist solely of uppercase letters, digits, and the '_' (underscore)
    // from the characters defined in Portable Character Set and do not begin with a digit."
    // Example: "THE_SETTING"
    CommandLineParameter._environmentVariableRegExp = /^[A-Z_][A-Z0-9_]*$/;
    exports.CommandLineParameter = CommandLineParameter;
    /**
     * The common base class for parameters types that receive an argument.
     *
     * @remarks
     * An argument is an accompanying command-line token, such as "123" in the
     * example "--max-count 123".
     * @public
     */
    class CommandLineParameterWithArgument extends CommandLineParameter {
        /** @internal */
        constructor(definition) {
            super(definition);
            if (definition.argumentName === '') {
                throw new Error('The argument name cannot be an empty string. (For the default name, specify undefined.)');
            }
            if (definition.argumentName.toUpperCase() !== definition.argumentName) {
                throw new Error(`Invalid name: "${definition.argumentName}". The argument name must be all upper case.`);
            }
            const match = definition.argumentName.match(CommandLineParameterWithArgument._invalidArgumentNameRegExp);
            if (match) {
                throw new Error(`The argument name "${definition.argumentName}" contains an invalid character "${match[0]}".`
                    + ` Only upper-case letters, numbers, and underscores are allowed.`);
            }
            this.argumentName = definition.argumentName;
        }
    }
    // Matches the first character that *isn't* part of a valid upper-case argument name such as "URL_2"
    CommandLineParameterWithArgument._invalidArgumentNameRegExp = /[^A-Z_0-9]/;
    exports.CommandLineParameterWithArgument = CommandLineParameterWithArgument;
    /**
     * The data type returned by {@link CommandLineParameterProvider.defineChoiceParameter}.
     * @public
     */
    class CommandLineChoiceParameter extends CommandLineParameter {
        /** @internal */
        constructor(definition) {
            super(definition);
            this._value = undefined;
            if (definition.alternatives.length <= 1) {
                throw new Error(`When defining a choice parameter, the alternatives list must contain at least one value.`);
            }
            if (definition.defaultValue && definition.alternatives.indexOf(definition.defaultValue) === -1) {
                throw new Error(`The specified default value "${definition.defaultValue}"`
                    + ` is not one of the available options: ${definition.alternatives.toString()}`);
            }
            this.alternatives = definition.alternatives;
            this.defaultValue = definition.defaultValue;
            this.validateDefaultValue(!!this.defaultValue);
        }
        /** {@inheritDoc CommandLineParameter.kind} */
        get kind() {
            return CommandLineParameterKind.Choice;
        }
        /**
         * {@inheritDoc CommandLineParameter._setValue}
         * @internal
         */
        // tslint:disable-next-line:no-any
        _setValue(data) {
            if (data !== null && data !== undefined) {
                if (typeof data !== 'string') {
                    this.reportInvalidData(data);
                }
                this._value = data;
                return;
            }
            if (this.environmentVariable !== undefined) {
                // Try reading the environment variable
                const environmentValue = process.env[this.environmentVariable];
                if (environmentValue !== undefined && environmentValue !== '') {
                    if (this.alternatives.indexOf(environmentValue) < 0) {
                        const choices = '"' + this.alternatives.join('", "') + '"';
                        throw new Error(`Invalid value "${environmentValue}" for the environment variable`
                            + ` ${this.environmentVariable}.  Valid choices are: ${choices}`);
                    }
                    this._value = environmentValue;
                    return;
                }
            }
            if (this.defaultValue !== undefined) {
                this._value = this.defaultValue;
                return;
            }
            this._value = undefined;
        }
        /**
         * {@inheritDoc CommandLineParameter._getSupplementaryNotes}
         * @internal
         */
        _getSupplementaryNotes(supplementaryNotes) {
            super._getSupplementaryNotes(supplementaryNotes);
            if (this.defaultValue !== undefined) {
                supplementaryNotes.push(`The default value is "${this.defaultValue}".`);
            }
        }
        /**
         * Returns the argument value for a choice parameter that was parsed from the command line.
         *
         * @remarks
         * The return value will be `undefined` if the command-line has not been parsed yet,
         * or if the parameter was omitted and has no default value.
         */
        get value() {
            return this._value;
        }
        /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
        appendToArgList(argList) {
            if (this.value !== undefined) {
                argList.push(this.longName);
                argList.push(this.value);
            }
        }
    }
    exports.CommandLineChoiceParameter = CommandLineChoiceParameter;
    /**
     * The data type returned by {@link CommandLineParameterProvider.defineFlagParameter}.
     * @public
     */
    class CommandLineFlagParameter extends CommandLineParameter {
        /** @internal */
        constructor(definition) {
            super(definition);
            this._value = false;
        }
        /** {@inheritDoc CommandLineParameter.kind} */
        get kind() {
            return CommandLineParameterKind.Flag;
        }
        /**
         * {@inheritDoc CommandLineParameter._setValue}
         * @internal
         */
        // tslint:disable-next-line:no-any
        _setValue(data) {
            if (data !== null && data !== undefined) {
                if (typeof data !== 'boolean') {
                    this.reportInvalidData(data);
                }
                this._value = data;
                return;
            }
            if (this.environmentVariable !== undefined) {
                // Try reading the environment variable
                const environmentValue = process.env[this.environmentVariable];
                if (environmentValue !== undefined && environmentValue !== '') {
                    if (environmentValue !== '0' && environmentValue !== '1') {
                        throw new Error(`Invalid value "${environmentValue}" for the environment variable`
                            + ` ${this.environmentVariable}.  Valid choices are 0 or 1.`);
                    }
                    this._value = environmentValue === '1';
                    return;
                }
            }
            this._value = false;
        }
        /**
         * Returns a boolean indicating whether the parameter was included in the command line.
         *
         * @remarks
         * The return value will be false if the command-line has not been parsed yet,
         * or if the flag was not used.
         */
        get value() {
            return this._value;
        }
        /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
        appendToArgList(argList) {
            if (this.value) {
                argList.push(this.longName);
            }
        }
    }
    exports.CommandLineFlagParameter = CommandLineFlagParameter;
    /**
     * The data type returned by {@link CommandLineParameterProvider.defineIntegerParameter}.
     * @public
     */
    class CommandLineIntegerParameter extends CommandLineParameterWithArgument {
        /** @internal */
        constructor(definition) {
            super(definition);
            this._value = undefined;
            this.defaultValue = definition.defaultValue;
            this.validateDefaultValue(!!this.defaultValue);
        }
        /** {@inheritDoc CommandLineParameter.kind} */
        get kind() {
            return CommandLineParameterKind.Integer;
        }
        /**
         * {@inheritDoc CommandLineParameter._setValue}
         * @internal
         */
        // tslint:disable-next-line:no-any
        _setValue(data) {
            if (data !== null && data !== undefined) {
                if (typeof data !== 'number') {
                    this.reportInvalidData(data);
                }
                this._value = data;
                return;
            }
            if (this.environmentVariable !== undefined) {
                // Try reading the environment variable
                const environmentValue = process.env[this.environmentVariable];
                if (environmentValue !== undefined && environmentValue !== '') {
                    const parsed = parseInt(environmentValue, 10);
                    if (isNaN(parsed) || environmentValue.indexOf('.') >= 0) {
                        throw new Error(`Invalid value "${environmentValue}" for the environment variable`
                            + ` ${this.environmentVariable}.  It must be an integer value.`);
                    }
                    this._value = parsed;
                    return;
                }
            }
            if (this.defaultValue !== undefined) {
                this._value = this.defaultValue;
                return;
            }
            this._value = undefined;
        }
        /**
         * {@inheritDoc CommandLineParameter._getSupplementaryNotes}
         * @internal
         */
        _getSupplementaryNotes(supplementaryNotes) {
            super._getSupplementaryNotes(supplementaryNotes);
            if (this.defaultValue !== undefined) {
                supplementaryNotes.push(`The default value is ${this.defaultValue}.`);
            }
        }
        /**
         * Returns the argument value for an integer parameter that was parsed from the command line.
         *
         * @remarks
         * The return value will be undefined if the command-line has not been parsed yet,
         * or if the parameter was omitted and has no default value.
         */
        get value() {
            return this._value;
        }
        /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
        appendToArgList(argList) {
            if (this.value !== undefined) {
                argList.push(this.longName);
                argList.push(this.value.toString());
            }
        }
    }
    exports.CommandLineIntegerParameter = CommandLineIntegerParameter;
    /**
     * The data type returned by {@link CommandLineParameterProvider.defineStringParameter}.
     * @public
     */
    class CommandLineStringParameter extends CommandLineParameterWithArgument {
        /** @internal */
        constructor(definition) {
            super(definition);
            this._value = undefined;
            this.defaultValue = definition.defaultValue;
            this.validateDefaultValue(!!this.defaultValue);
        }
        /** {@inheritDoc CommandLineParameter.kind} */
        get kind() {
            return CommandLineParameterKind.String;
        }
        /**
         * {@inheritDoc CommandLineParameter._setValue}
         * @internal
         */
        // tslint:disable-next-line:no-any
        _setValue(data) {
            if (data !== null && data !== undefined) {
                if (typeof data !== 'string') {
                    this.reportInvalidData(data);
                }
                this._value = data;
                return;
            }
            if (this.environmentVariable !== undefined) {
                // Try reading the environment variable
                const environmentValue = process.env[this.environmentVariable];
                if (environmentValue !== undefined) {
                    // NOTE: If the environment variable is defined as an empty string,
                    // here we will accept the empty string as our value.  (For number/flag we don't do that.)
                    this._value = environmentValue;
                    return;
                }
            }
            if (this.defaultValue !== undefined) {
                this._value = this.defaultValue;
                return;
            }
            this._value = undefined;
        }
        /**
         * {@inheritDoc CommandLineParameter._getSupplementaryNotes}
         * @internal
         */
        _getSupplementaryNotes(supplementaryNotes) {
            super._getSupplementaryNotes(supplementaryNotes);
            if (this.defaultValue !== undefined) {
                if (this.defaultValue.length < 160) {
                    supplementaryNotes.push(`The default value is ${JSON.stringify(this.defaultValue)}.`);
                }
            }
        }
        /**
         * Returns the argument value for a string parameter that was parsed from the command line.
         *
         * @remarks
         * The return value will be undefined if the command-line has not been parsed yet,
         * or if the parameter was omitted and has no default value.
         */
        get value() {
            return this._value;
        }
        /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
        appendToArgList(argList) {
            if (this.value !== undefined) {
                argList.push(this.longName);
                argList.push(this.value);
            }
        }
    }
    exports.CommandLineStringParameter = CommandLineStringParameter;
    /**
     * The data type returned by {@link CommandLineParameterProvider.defineStringListParameter}.
     * @public
     */
    class CommandLineStringListParameter extends CommandLineParameterWithArgument {
        /** @internal */
        constructor(definition) {
            super(definition);
            this._values = [];
        }
        /** {@inheritDoc CommandLineParameter.kind} */
        get kind() {
            return CommandLineParameterKind.StringList;
        }
        /**
         * {@inheritDoc CommandLineParameter._setValue}
         * @internal
         */
        // tslint:disable-next-line:no-any
        _setValue(data) {
            if (data !== null && data !== undefined) {
                if (!Array.isArray(data)) {
                    this.reportInvalidData(data);
                }
                for (const arrayItem of data) {
                    if (typeof (arrayItem) !== 'string') {
                        this.reportInvalidData(data);
                    }
                }
                this._values = data;
                return;
            }
            if (this.environmentVariable !== undefined) {
                // Try reading the environment variable
                const environmentValue = process.env[this.environmentVariable];
                if (environmentValue !== undefined) {
                    // NOTE: If the environment variable is defined as an empty string,
                    // here we will accept the empty string as our value.  (For number/flag we don't do that.)
                    // In the current implementation, the environment variable for a "string list" can only
                    // store a single item.  If we wanted to allow multiple items (and still have a conventional-seeming
                    // environment), we would ask the caller to provide an appropriate delimiter.  Getting involved
                    // with escaping here seems unwise, since there are so many shell escaping mechanisms that could
                    // potentially confuse the experience.
                    this._values = [environmentValue];
                    return;
                }
            }
            // (No default value for string lists)
            this._values = [];
        }
        /**
         * Returns the string arguments for a string list parameter that was parsed from the command line.
         *
         * @remarks
         * The array will be empty if the command-line has not been parsed yet,
         * or if the parameter was omitted and has no default value.
         */
        get values() {
            return this._values;
        }
        /** {@inheritDoc CommandLineParameter.appendToArgList} @override */
        appendToArgList(argList) {
            if (this.values.length > 0) {
                for (const value of this.values) {
                    argList.push(this.longName);
                    argList.push(value);
                }
            }
        }
    }
    exports.CommandLineStringListParameter = CommandLineStringListParameter;

    });

    unwrapExports(CommandLineParameter_1);
    var CommandLineParameter_2 = CommandLineParameter_1.CommandLineParameterKind;
    var CommandLineParameter_3 = CommandLineParameter_1.CommandLineParameter;
    var CommandLineParameter_4 = CommandLineParameter_1.CommandLineParameterWithArgument;
    var CommandLineParameter_5 = CommandLineParameter_1.CommandLineChoiceParameter;
    var CommandLineParameter_6 = CommandLineParameter_1.CommandLineFlagParameter;
    var CommandLineParameter_7 = CommandLineParameter_1.CommandLineIntegerParameter;
    var CommandLineParameter_8 = CommandLineParameter_1.CommandLineStringParameter;
    var CommandLineParameter_9 = CommandLineParameter_1.CommandLineStringListParameter;

    var CommandLineParameterProvider_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });

    /**
     * This is the common base class for CommandLineAction and CommandLineParser
     * that provides functionality for defining command-line parameters.
     *
     * @public
     */
    class CommandLineParameterProvider {
        /** @internal */
        // Third party code should not inherit subclasses or call this constructor
        constructor() {
            this._parameters = [];
            this._parametersByLongName = new Map();
        }
        /**
         * Returns a collection of the parameters that were defined for this object.
         */
        get parameters() {
            return this._parameters;
        }
        /**
         * Defines a command-line parameter whose value must be a string from a fixed set of
         * allowable choices (similar to an enum).
         *
         * @remarks
         * Example:  example-tool --log-level warn
         */
        defineChoiceParameter(definition) {
            const parameter = new CommandLineParameter_1.CommandLineChoiceParameter(definition);
            this._defineParameter(parameter);
            return parameter;
        }
        /**
         * Returns the CommandLineChoiceParameter with the specified long name.
         * @remarks
         * This method throws an exception if the parameter is not defined.
         */
        getChoiceParameter(parameterLongName) {
            return this._getParameter(parameterLongName, CommandLineParameter_1.CommandLineParameterKind.Choice);
        }
        /**
         * Defines a command-line switch whose boolean value is true if the switch is provided,
         * and false otherwise.
         *
         * @remarks
         * Example:  example-tool --debug
         */
        defineFlagParameter(definition) {
            const parameter = new CommandLineParameter_1.CommandLineFlagParameter(definition);
            this._defineParameter(parameter);
            return parameter;
        }
        /**
         * Returns the CommandLineFlagParameter with the specified long name.
         * @remarks
         * This method throws an exception if the parameter is not defined.
         */
        getFlagParameter(parameterLongName) {
            return this._getParameter(parameterLongName, CommandLineParameter_1.CommandLineParameterKind.Flag);
        }
        /**
         * Defines a command-line parameter whose value is an integer.
         *
         * @remarks
         * Example:  example-tool --max-attempts 5
         */
        defineIntegerParameter(definition) {
            const parameter = new CommandLineParameter_1.CommandLineIntegerParameter(definition);
            this._defineParameter(parameter);
            return parameter;
        }
        /**
         * Returns the CommandLineIntegerParameter with the specified long name.
         * @remarks
         * This method throws an exception if the parameter is not defined.
         */
        getIntegerParameter(parameterLongName) {
            return this._getParameter(parameterLongName, CommandLineParameter_1.CommandLineParameterKind.Integer);
        }
        /**
         * Defines a command-line parameter whose value is a single text string.
         *
         * @remarks
         * Example:  example-tool --message "Hello, world!"
         */
        defineStringParameter(definition) {
            const parameter = new CommandLineParameter_1.CommandLineStringParameter(definition);
            this._defineParameter(parameter);
            return parameter;
        }
        /**
         * Returns the CommandLineStringParameter with the specified long name.
         * @remarks
         * This method throws an exception if the parameter is not defined.
         */
        getStringParameter(parameterLongName) {
            return this._getParameter(parameterLongName, CommandLineParameter_1.CommandLineParameterKind.String);
        }
        /**
         * Defines a command-line parameter whose value is one or more text strings.
         *
         * @remarks
         * Example:  example-tool --add file1.txt --add file2.txt --add file3.txt
         */
        defineStringListParameter(definition) {
            const parameter = new CommandLineParameter_1.CommandLineStringListParameter(definition);
            this._defineParameter(parameter);
            return parameter;
        }
        /**
         * Returns the CommandLineStringListParameter with the specified long name.
         * @remarks
         * This method throws an exception if the parameter is not defined.
         */
        getStringListParameter(parameterLongName) {
            return this._getParameter(parameterLongName, CommandLineParameter_1.CommandLineParameterKind.StringList);
        }
        /**
         * Generates the command-line help text.
         */
        renderHelpText() {
            return this._getArgumentParser().formatHelp();
        }
        /** @internal */
        _processParsedData(data) {
            // Fill in the values for the parameters
            for (const parameter of this._parameters) {
                const value = data[parameter._parserKey]; // tslint:disable-line:no-any
                parameter._setValue(value);
            }
        }
        _generateKey() {
            return 'key_' + (CommandLineParameterProvider._keyCounter++).toString();
        }
        _getParameter(parameterLongName, expectedKind) {
            const parameter = this._parametersByLongName.get(parameterLongName);
            if (!parameter) {
                throw new Error(`The parameter "${parameterLongName}" is not defined`);
            }
            if (parameter.kind !== expectedKind) {
                throw new Error(`The parameter "${parameterLongName}" is of type "${CommandLineParameter_1.CommandLineParameterKind[parameter.kind]}"`
                    + ` whereas the caller was expecting "${CommandLineParameter_1.CommandLineParameterKind[expectedKind]}".`);
            }
            return parameter;
        }
        _defineParameter(parameter) {
            const names = [];
            if (parameter.shortName) {
                names.push(parameter.shortName);
            }
            names.push(parameter.longName);
            parameter._parserKey = this._generateKey();
            let finalDescription = parameter.description;
            const supplementaryNotes = [];
            parameter._getSupplementaryNotes(supplementaryNotes);
            if (supplementaryNotes.length > 0) {
                // If they left the period off the end of their sentence, then add one.
                if (finalDescription.match(/[a-z0-9]\s*$/i)) {
                    finalDescription = finalDescription.trimRight() + '.';
                }
                // Append the supplementary text
                finalDescription += ' ' + supplementaryNotes.join(' ');
            }
            // NOTE: Our "environmentVariable" feature takes precedence over argparse's "defaultValue",
            // so we have to reimplement that feature.
            const argparseOptions = {
                help: finalDescription,
                dest: parameter._parserKey,
                metavar: parameter.argumentName || undefined,
                required: parameter.required
            };
            switch (parameter.kind) {
                case CommandLineParameter_1.CommandLineParameterKind.Choice:
                    const choiceParameter = parameter;
                    argparseOptions.choices = choiceParameter.alternatives;
                    break;
                case CommandLineParameter_1.CommandLineParameterKind.Flag:
                    argparseOptions.action = 'storeTrue';
                    break;
                case CommandLineParameter_1.CommandLineParameterKind.Integer:
                    argparseOptions.type = 'int';
                    break;
                case CommandLineParameter_1.CommandLineParameterKind.String:
                    break;
                case CommandLineParameter_1.CommandLineParameterKind.StringList:
                    argparseOptions.action = 'append';
                    break;
            }
            this._getArgumentParser().addArgument(names, argparseOptions);
            this._parameters.push(parameter);
            this._parametersByLongName.set(parameter.longName, parameter);
        }
    }
    CommandLineParameterProvider._keyCounter = 0;
    exports.CommandLineParameterProvider = CommandLineParameterProvider;

    });

    unwrapExports(CommandLineParameterProvider_1);
    var CommandLineParameterProvider_2 = CommandLineParameterProvider_1.CommandLineParameterProvider;

    var CommandLineAction_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });

    /**
     * Represents a sub-command that is part of the CommandLineParser command line.
     * Applications should create subclasses of CommandLineAction corresponding to
     * each action that they want to expose.
     *
     * The action name should be comprised of lower case words separated by hyphens
     * or colons. The name should include an English verb (e.g. "deploy"). Use a
     * hyphen to separate words (e.g. "upload-docs"). A group of related commands
     * can be prefixed with a colon (e.g. "docs:generate", "docs:deploy",
     * "docs:serve", etc).
     *
     * @public
     */
    class CommandLineAction extends CommandLineParameterProvider_1.CommandLineParameterProvider {
        constructor(options) {
            super();
            if (!CommandLineAction._actionNameRegExp.test(options.actionName)) {
                throw new Error(`Invalid action name "${options.actionName}". `
                    + `The name must be comprised of lower-case words optionally separated by hyphens or colons.`);
            }
            this.actionName = options.actionName;
            this.summary = options.summary;
            this.documentation = options.documentation;
            this._argumentParser = undefined;
        }
        /**
         * This is called internally by CommandLineParser.addAction()
         * @internal
         */
        _buildParser(actionsSubParser) {
            this._argumentParser = actionsSubParser.addParser(this.actionName, {
                help: this.summary,
                description: this.documentation
            });
            this.onDefineParameters();
        }
        /**
         * This is called internally by CommandLineParser.execute()
         * @internal
         */
        _processParsedData(data) {
            super._processParsedData(data);
        }
        /**
         * Invoked by CommandLineParser.onExecute().
         * @internal
         */
        _execute() {
            return this.onExecute();
        }
        /**
         * {@inheritDoc CommandLineParameterProvider._getArgumentParser}
         * @internal
         */
        _getArgumentParser() {
            if (!this._argumentParser) {
                // We will improve this in the future
                throw new Error('The CommandLineAction must be added to a CommandLineParser before it can be used');
            }
            return this._argumentParser;
        }
    }
    // Example: "do-something"
    CommandLineAction._actionNameRegExp = /^[a-z]+([-:][a-z]+)*$/;
    exports.CommandLineAction = CommandLineAction;

    });

    unwrapExports(CommandLineAction_1);
    var CommandLineAction_2 = CommandLineAction_1.CommandLineAction;

    var sprintf = createCommonjsModule(function (module, exports) {
    (function(window) {
        var re = {
            not_string: /[^s]/,
            number: /[diefg]/,
            json: /[j]/,
            not_json: /[^j]/,
            text: /^[^\x25]+/,
            modulo: /^\x25{2}/,
            placeholder: /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/,
            key: /^([a-z_][a-z_\d]*)/i,
            key_access: /^\.([a-z_][a-z_\d]*)/i,
            index_access: /^\[(\d+)\]/,
            sign: /^[\+\-]/
        };

        function sprintf() {
            var key = arguments[0], cache = sprintf.cache;
            if (!(cache[key] && cache.hasOwnProperty(key))) {
                cache[key] = sprintf.parse(key);
            }
            return sprintf.format.call(null, cache[key], arguments)
        }

        sprintf.format = function(parse_tree, argv) {
            var cursor = 1, tree_length = parse_tree.length, node_type = "", arg, output = [], i, k, match, pad, pad_character, pad_length, is_positive = true, sign = "";
            for (i = 0; i < tree_length; i++) {
                node_type = get_type(parse_tree[i]);
                if (node_type === "string") {
                    output[output.length] = parse_tree[i];
                }
                else if (node_type === "array") {
                    match = parse_tree[i]; // convenience purposes only
                    if (match[2]) { // keyword argument
                        arg = argv[cursor];
                        for (k = 0; k < match[2].length; k++) {
                            if (!arg.hasOwnProperty(match[2][k])) {
                                throw new Error(sprintf("[sprintf] property '%s' does not exist", match[2][k]))
                            }
                            arg = arg[match[2][k]];
                        }
                    }
                    else if (match[1]) { // positional argument (explicit)
                        arg = argv[match[1]];
                    }
                    else { // positional argument (implicit)
                        arg = argv[cursor++];
                    }

                    if (get_type(arg) == "function") {
                        arg = arg();
                    }

                    if (re.not_string.test(match[8]) && re.not_json.test(match[8]) && (get_type(arg) != "number" && isNaN(arg))) {
                        throw new TypeError(sprintf("[sprintf] expecting number but found %s", get_type(arg)))
                    }

                    if (re.number.test(match[8])) {
                        is_positive = arg >= 0;
                    }

                    switch (match[8]) {
                        case "b":
                            arg = arg.toString(2);
                        break
                        case "c":
                            arg = String.fromCharCode(arg);
                        break
                        case "d":
                        case "i":
                            arg = parseInt(arg, 10);
                        break
                        case "j":
                            arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6]) : 0);
                        break
                        case "e":
                            arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                        break
                        case "f":
                            arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                        break
                        case "g":
                            arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg);
                        break
                        case "o":
                            arg = arg.toString(8);
                        break
                        case "s":
                            arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
                        break
                        case "u":
                            arg = arg >>> 0;
                        break
                        case "x":
                            arg = arg.toString(16);
                        break
                        case "X":
                            arg = arg.toString(16).toUpperCase();
                        break
                    }
                    if (re.json.test(match[8])) {
                        output[output.length] = arg;
                    }
                    else {
                        if (re.number.test(match[8]) && (!is_positive || match[3])) {
                            sign = is_positive ? "+" : "-";
                            arg = arg.toString().replace(re.sign, "");
                        }
                        else {
                            sign = "";
                        }
                        pad_character = match[4] ? match[4] === "0" ? "0" : match[4].charAt(1) : " ";
                        pad_length = match[6] - (sign + arg).length;
                        pad = match[6] ? (pad_length > 0 ? str_repeat(pad_character, pad_length) : "") : "";
                        output[output.length] = match[5] ? sign + arg + pad : (pad_character === "0" ? sign + pad + arg : pad + sign + arg);
                    }
                }
            }
            return output.join("")
        };

        sprintf.cache = {};

        sprintf.parse = function(fmt) {
            var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
            while (_fmt) {
                if ((match = re.text.exec(_fmt)) !== null) {
                    parse_tree[parse_tree.length] = match[0];
                }
                else if ((match = re.modulo.exec(_fmt)) !== null) {
                    parse_tree[parse_tree.length] = "%";
                }
                else if ((match = re.placeholder.exec(_fmt)) !== null) {
                    if (match[2]) {
                        arg_names |= 1;
                        var field_list = [], replacement_field = match[2], field_match = [];
                        if ((field_match = re.key.exec(replacement_field)) !== null) {
                            field_list[field_list.length] = field_match[1];
                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== "") {
                                if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                    field_list[field_list.length] = field_match[1];
                                }
                                else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                    field_list[field_list.length] = field_match[1];
                                }
                                else {
                                    throw new SyntaxError("[sprintf] failed to parse named argument key")
                                }
                            }
                        }
                        else {
                            throw new SyntaxError("[sprintf] failed to parse named argument key")
                        }
                        match[2] = field_list;
                    }
                    else {
                        arg_names |= 2;
                    }
                    if (arg_names === 3) {
                        throw new Error("[sprintf] mixing positional and named placeholders is not (yet) supported")
                    }
                    parse_tree[parse_tree.length] = match;
                }
                else {
                    throw new SyntaxError("[sprintf] unexpected placeholder")
                }
                _fmt = _fmt.substring(match[0].length);
            }
            return parse_tree
        };

        var vsprintf = function(fmt, argv, _argv) {
            _argv = (argv || []).slice(0);
            _argv.splice(0, 0, fmt);
            return sprintf.apply(null, _argv)
        };

        /**
         * helpers
         */
        function get_type(variable) {
            return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase()
        }

        function str_repeat(input, multiplier) {
            return Array(multiplier + 1).join(input)
        }

        /**
         * export to either browser or node.js
         */
        {
            exports.sprintf = sprintf;
            exports.vsprintf = vsprintf;
        }
    })();
    });
    var sprintf_1 = sprintf.sprintf;
    var sprintf_2 = sprintf.vsprintf;

    //

    var EOL = '\n';

    var SUPPRESS = '==SUPPRESS==';

    var OPTIONAL = '?';

    var ZERO_OR_MORE = '*';

    var ONE_OR_MORE = '+';

    var PARSER = 'A...';

    var REMAINDER = '...';

    var _UNRECOGNIZED_ARGS_ATTR = '_unrecognized_args';

    var _const = {
    	EOL: EOL,
    	SUPPRESS: SUPPRESS,
    	OPTIONAL: OPTIONAL,
    	ZERO_OR_MORE: ZERO_OR_MORE,
    	ONE_OR_MORE: ONE_OR_MORE,
    	PARSER: PARSER,
    	REMAINDER: REMAINDER,
    	_UNRECOGNIZED_ARGS_ATTR: _UNRECOGNIZED_ARGS_ATTR
    };

    var repeat = function (str, num) {
      var result = '';
      for (var i = 0; i < num; i++) { result += str; }
      return result;
    };

    var arrayEqual = function (a, b) {
      if (a.length !== b.length) { return false; }
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) { return false; }
      }
      return true;
    };

    var trimChars = function (str, chars) {
      var start = 0;
      var end = str.length - 1;
      while (chars.indexOf(str.charAt(start)) >= 0) { start++; }
      while (chars.indexOf(str.charAt(end)) >= 0) { end--; }
      return str.slice(start, end + 1);
    };

    var capitalize = function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    var arrayUnion = function () {
      var result = [];
      for (var i = 0, values = {}; i < arguments.length; i++) {
        var arr = arguments[i];
        for (var j = 0; j < arr.length; j++) {
          if (!values[arr[j]]) {
            values[arr[j]] = true;
            result.push(arr[j]);
          }
        }
      }
      return result;
    };

    function has(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }

    var has_1 = has;

    var extend = function (dest, src) {
      for (var i in src) {
        if (has(src, i)) { dest[i] = src[i]; }
      }
    };

    var trimEnd = function (str) {
      return str.replace(/\s+$/g, '');
    };

    var utils = {
    	repeat: repeat,
    	arrayEqual: arrayEqual,
    	trimChars: trimChars,
    	capitalize: capitalize,
    	arrayUnion: arrayUnion,
    	has: has_1,
    	extend: extend,
    	trimEnd: trimEnd
    };

    var action = createCommonjsModule(function (module) {


    // Constants



    /**
     * new Action(options)
     *
     * Base class for all actions. Used only for inherits
     *
     *
     * ##### Options:
     *
     * - `optionStrings`  A list of command-line option strings for the action.
     * - `dest`  Attribute to hold the created object(s)
     * - `nargs`  The number of command-line arguments that should be consumed.
     * By default, one argument will be consumed and a single value will be
     * produced.
     * - `constant`  Default value for an action with no value.
     * - `defaultValue`  The value to be produced if the option is not specified.
     * - `type`  Cast to 'string'|'int'|'float'|'complex'|function (string). If
     * None, 'string'.
     * - `choices`  The choices available.
     * - `required`  True if the action must always be specified at the command
     * line.
     * - `help`  The help describing the argument.
     * - `metavar`  The name to be used for the option's argument with the help
     * string. If None, the 'dest' value will be used as the name.
     *
     * ##### nargs supported values:
     *
     * - `N` (an integer) consumes N arguments (and produces a list)
     * - `?`  consumes zero or one arguments
     * - `*` consumes zero or more arguments (and produces a list)
     * - `+` consumes one or more arguments (and produces a list)
     *
     * Note: that the difference between the default and nargs=1 is that with the
     * default, a single value will be produced, while with nargs=1, a list
     * containing a single value will be produced.
     **/
    var Action = module.exports = function Action(options) {
      options = options || {};
      this.optionStrings = options.optionStrings || [];
      this.dest = options.dest;
      this.nargs = typeof options.nargs !== 'undefined' ? options.nargs : null;
      this.constant = typeof options.constant !== 'undefined' ? options.constant : null;
      this.defaultValue = options.defaultValue;
      this.type = typeof options.type !== 'undefined' ? options.type : null;
      this.choices = typeof options.choices !== 'undefined' ? options.choices : null;
      this.required = typeof options.required !== 'undefined' ? options.required : false;
      this.help = typeof options.help !== 'undefined' ? options.help : null;
      this.metavar = typeof options.metavar !== 'undefined' ? options.metavar : null;

      if (!(this.optionStrings instanceof Array)) {
        throw new Error('optionStrings should be an array');
      }
      if (typeof this.required !== 'undefined' && typeof this.required !== 'boolean') {
        throw new Error('required should be a boolean');
      }
    };

    /**
     * Action#getName -> String
     *
     * Tells action name
     **/
    Action.prototype.getName = function () {
      if (this.optionStrings.length > 0) {
        return this.optionStrings.join('/');
      } else if (this.metavar !== null && this.metavar !== _const.SUPPRESS) {
        return this.metavar;
      } else if (typeof this.dest !== 'undefined' && this.dest !== _const.SUPPRESS) {
        return this.dest;
      }
      return null;
    };

    /**
     * Action#isOptional -> Boolean
     *
     * Return true if optional
     **/
    Action.prototype.isOptional = function () {
      return !this.isPositional();
    };

    /**
     * Action#isPositional -> Boolean
     *
     * Return true if positional
     **/
    Action.prototype.isPositional = function () {
      return (this.optionStrings.length === 0);
    };

    /**
     * Action#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Should be implemented in inherited classes
     *
     * ##### Example
     *
     *      ActionCount.prototype.call = function (parser, namespace, values, optionString) {
     *        namespace.set(this.dest, (namespace[this.dest] || 0) + 1);
     *      };
     *
     **/
    Action.prototype.call = function () {
      throw new Error('.call() not defined');// Not Implemented error
    };
    });

    var help = createCommonjsModule(function (module) {





    // Constants


    /*:nodoc:*
     * new ActionHelp(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionHelp = module.exports = function ActionHelp(options) {
      options = options || {};
      if (options.defaultValue !== null) {
        options.defaultValue = options.defaultValue;
      } else {
        options.defaultValue = _const.SUPPRESS;
      }
      options.dest = (options.dest !== null ? options.dest : _const.SUPPRESS);
      options.nargs = 0;
      action.call(this, options);

    };
    util.inherits(ActionHelp, action);

    /*:nodoc:*
     * ActionHelp#call(parser, namespace, values, optionString)
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Print help and exit
     **/
    ActionHelp.prototype.call = function (parser) {
      parser.printHelp();
      parser.exit();
    };
    });

    var append = createCommonjsModule(function (module) {





    // Constants


    /*:nodoc:*
     * new ActionAppend(options)
     * - options (object): options hash see [[Action.new]]
     *
     * Note: options.nargs should be optional for constants
     * and more then zero for other
     **/
    var ActionAppend = module.exports = function ActionAppend(options) {
      options = options || {};
      if (this.nargs <= 0) {
        throw new Error('nargs for append actions must be > 0; if arg ' +
            'strings are not supplying the value to append, ' +
            'the append const action may be more appropriate');
      }
      if (!!this.constant && this.nargs !== _const.OPTIONAL) {
        throw new Error('nargs must be OPTIONAL to supply const');
      }
      action.call(this, options);
    };
    util.inherits(ActionAppend, action);

    /*:nodoc:*
     * ActionAppend#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Save result in namespace object
     **/
    ActionAppend.prototype.call = function (parser, namespace, values) {
      var items = (namespace[this.dest] || []).slice();
      items.push(values);
      namespace.set(this.dest, items);
    };
    });

    var constant$2 = createCommonjsModule(function (module) {





    /*:nodoc:*
     * new ActionAppendConstant(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionAppendConstant = module.exports = function ActionAppendConstant(options) {
      options = options || {};
      options.nargs = 0;
      if (typeof options.constant === 'undefined') {
        throw new Error('constant option is required for appendAction');
      }
      action.call(this, options);
    };
    util.inherits(ActionAppendConstant, action);

    /*:nodoc:*
     * ActionAppendConstant#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Save result in namespace object
     **/
    ActionAppendConstant.prototype.call = function (parser, namespace) {
      var items = [].concat(namespace[this.dest] || []);
      items.push(this.constant);
      namespace.set(this.dest, items);
    };
    });

    var count$1 = createCommonjsModule(function (module) {





    /*:nodoc:*
     * new ActionCount(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionCount = module.exports = function ActionCount(options) {
      options = options || {};
      options.nargs = 0;

      action.call(this, options);
    };
    util.inherits(ActionCount, action);

    /*:nodoc:*
     * ActionCount#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Save result in namespace object
     **/
    ActionCount.prototype.call = function (parser, namespace) {
      namespace.set(this.dest, (namespace[this.dest] || 0) + 1);
    };
    });

    var store = createCommonjsModule(function (module) {





    // Constants



    /*:nodoc:*
     * new ActionStore(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionStore = module.exports = function ActionStore(options) {
      options = options || {};
      if (this.nargs <= 0) {
        throw new Error('nargs for store actions must be > 0; if you ' +
            'have nothing to store, actions such as store ' +
            'true or store const may be more appropriate');

      }
      if (typeof this.constant !== 'undefined' && this.nargs !== _const.OPTIONAL) {
        throw new Error('nargs must be OPTIONAL to supply const');
      }
      action.call(this, options);
    };
    util.inherits(ActionStore, action);

    /*:nodoc:*
     * ActionStore#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Save result in namespace object
     **/
    ActionStore.prototype.call = function (parser, namespace, values) {
      namespace.set(this.dest, values);
    };
    });

    var constant$3 = createCommonjsModule(function (module) {





    /*:nodoc:*
     * new ActionStoreConstant(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionStoreConstant = module.exports = function ActionStoreConstant(options) {
      options = options || {};
      options.nargs = 0;
      if (typeof options.constant === 'undefined') {
        throw new Error('constant option is required for storeAction');
      }
      action.call(this, options);
    };
    util.inherits(ActionStoreConstant, action);

    /*:nodoc:*
     * ActionStoreConstant#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Save result in namespace object
     **/
    ActionStoreConstant.prototype.call = function (parser, namespace) {
      namespace.set(this.dest, this.constant);
    };
    });

    var _true = createCommonjsModule(function (module) {





    /*:nodoc:*
     * new ActionStoreTrue(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionStoreTrue = module.exports = function ActionStoreTrue(options) {
      options = options || {};
      options.constant = true;
      options.defaultValue = options.defaultValue !== null ? options.defaultValue : false;
      constant$3.call(this, options);
    };
    util.inherits(ActionStoreTrue, constant$3);
    });

    var _false = createCommonjsModule(function (module) {





    /*:nodoc:*
     * new ActionStoreFalse(options)
     * - options (object): hash of options see [[Action.new]]
     *
     **/
    var ActionStoreFalse = module.exports = function ActionStoreFalse(options) {
      options = options || {};
      options.constant = false;
      options.defaultValue = options.defaultValue !== null ? options.defaultValue : true;
      constant$3.call(this, options);
    };
    util.inherits(ActionStoreFalse, constant$3);
    });

    var version = createCommonjsModule(function (module) {





    //
    // Constants
    //


    /*:nodoc:*
     * new ActionVersion(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    var ActionVersion = module.exports = function ActionVersion(options) {
      options = options || {};
      options.defaultValue = (options.defaultValue ? options.defaultValue : _const.SUPPRESS);
      options.dest = (options.dest || _const.SUPPRESS);
      options.nargs = 0;
      this.version = options.version;
      action.call(this, options);
    };
    util.inherits(ActionVersion, action);

    /*:nodoc:*
     * ActionVersion#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Print version and exit
     **/
    ActionVersion.prototype.call = function (parser) {
      var version = this.version || parser.version;
      var formatter = parser._getFormatter();
      formatter.addText(version);
      parser.exit(0, formatter.formatHelp());
    };
    });

    var format  = util.format;


    var ERR_CODE = 'ARGError';

    /*:nodoc:*
     * argumentError(argument, message) -> TypeError
     * - argument (Object): action with broken argument
     * - message (String): error message
     *
     * Error format helper. An error from creating or using an argument
     * (optional or positional). The string value of this exception
     * is the message, augmented with information
     * about the argument that caused it.
     *
     * #####Example
     *
     *      var argumentErrorHelper = require('./argument/error');
     *      if (conflictOptionals.length > 0) {
     *        throw argumentErrorHelper(
     *          action,
     *          format('Conflicting option string(s): %s', conflictOptionals.join(', '))
     *        );
     *      }
     *
     **/
    var error = function (argument, message) {
      var argumentName = null;
      var errMessage;
      var err;

      if (argument.getName) {
        argumentName = argument.getName();
      } else {
        argumentName = '' + argument;
      }

      if (!argumentName) {
        errMessage = message;
      } else {
        errMessage = format('argument "%s": %s', argumentName, message);
      }

      err = new TypeError(errMessage);
      err.code = ERR_CODE;
      return err;
    };

    var format$1  = util.format;




    // Constants


    // Errors



    /*:nodoc:*
     * new ChoicesPseudoAction(name, help)
     *
     * Create pseudo action for correct help text
     *
     **/
    function ChoicesPseudoAction(name, help) {
      var options = {
        optionStrings: [],
        dest: name,
        help: help
      };

      action.call(this, options);
    }

    util.inherits(ChoicesPseudoAction, action);

    /**
     * new ActionSubparsers(options)
     * - options (object): options hash see [[Action.new]]
     *
     **/
    function ActionSubparsers(options) {
      options = options || {};
      options.dest = options.dest || _const.SUPPRESS;
      options.nargs = _const.PARSER;

      this.debug = (options.debug === true);

      this._progPrefix = options.prog;
      this._parserClass = options.parserClass;
      this._nameParserMap = {};
      this._choicesActions = [];

      options.choices = this._nameParserMap;
      action.call(this, options);
    }

    util.inherits(ActionSubparsers, action);

    /*:nodoc:*
     * ActionSubparsers#addParser(name, options) -> ArgumentParser
     * - name (string): sub-command name
     * - options (object): see [[ArgumentParser.new]]
     *
     *  Note:
     *  addParser supports an additional aliases option,
     *  which allows multiple strings to refer to the same subparser.
     *  This example, like svn, aliases co as a shorthand for checkout
     *
     **/
    ActionSubparsers.prototype.addParser = function (name, options) {
      var parser;

      var self = this;

      options = options || {};

      options.debug = (this.debug === true);

      // set program from the existing prefix
      if (!options.prog) {
        options.prog = this._progPrefix + ' ' + name;
      }

      var aliases = options.aliases || [];

      // create a pseudo-action to hold the choice help
      if (!!options.help || typeof options.help === 'string') {
        var help = options.help;
        delete options.help;

        var choiceAction = new ChoicesPseudoAction(name, help);
        this._choicesActions.push(choiceAction);
      }

      // create the parser and add it to the map
      parser = new this._parserClass(options);
      this._nameParserMap[name] = parser;

      // make parser available under aliases also
      aliases.forEach(function (alias) {
        self._nameParserMap[alias] = parser;
      });

      return parser;
    };

    ActionSubparsers.prototype._getSubactions = function () {
      return this._choicesActions;
    };

    /*:nodoc:*
     * ActionSubparsers#call(parser, namespace, values, optionString) -> Void
     * - parser (ArgumentParser): current parser
     * - namespace (Namespace): namespace for output data
     * - values (Array): parsed values
     * - optionString (Array): input option string(not parsed)
     *
     * Call the action. Parse input aguments
     **/
    ActionSubparsers.prototype.call = function (parser, namespace, values) {
      var parserName = values[0];
      var argStrings = values.slice(1);

      // set the parser name if requested
      if (this.dest !== _const.SUPPRESS) {
        namespace[this.dest] = parserName;
      }

      // select the parser
      if (this._nameParserMap[parserName]) {
        parser = this._nameParserMap[parserName];
      } else {
        throw error(format$1(
          'Unknown parser "%s" (choices: [%s]).',
            parserName,
            Object.keys(this._nameParserMap).join(', ')
        ));
      }

      // parse all the remaining options into the namespace
      parser.parseArgs(argStrings, namespace);
    };

    var subparsers = ActionSubparsers;

    var group = createCommonjsModule(function (module) {






    /**
     * new ArgumentGroup(container, options)
     * - container (object): main container
     * - options (object): hash of group options
     *
     * #### options
     * - **prefixChars**  group name prefix
     * - **argumentDefault**  default argument value
     * - **title**  group title
     * - **description** group description
     *
     **/
    var ArgumentGroup = module.exports = function ArgumentGroup(container, options) {

      options = options || {};

      // add any missing keyword arguments by checking the container
      options.conflictHandler = (options.conflictHandler || container.conflictHandler);
      options.prefixChars = (options.prefixChars || container.prefixChars);
      options.argumentDefault = (options.argumentDefault || container.argumentDefault);

      action_container.call(this, options);

      // group attributes
      this.title = options.title;
      this._groupActions = [];

      // share most attributes with the container
      this._container = container;
      this._registries = container._registries;
      this._actions = container._actions;
      this._optionStringActions = container._optionStringActions;
      this._defaults = container._defaults;
      this._hasNegativeNumberOptionals = container._hasNegativeNumberOptionals;
      this._mutuallyExclusiveGroups = container._mutuallyExclusiveGroups;
    };
    util.inherits(ArgumentGroup, action_container);


    ArgumentGroup.prototype._addAction = function (action) {
      // Parent add action
      action = action_container.prototype._addAction.call(this, action);
      this._groupActions.push(action);
      return action;
    };


    ArgumentGroup.prototype._removeAction = function (action) {
      // Parent remove action
      action_container.prototype._removeAction.call(this, action);
      var actionIndex = this._groupActions.indexOf(action);
      if (actionIndex >= 0) {
        this._groupActions.splice(actionIndex, 1);
      }
    };
    });

    var exclusive = createCommonjsModule(function (module) {





    /**
     * new MutuallyExclusiveGroup(container, options)
     * - container (object): main container
     * - options (object): options.required -> true/false
     *
     * `required` could be an argument itself, but making it a property of
     * the options argument is more consistent with the JS adaptation of the Python)
     **/
    var MutuallyExclusiveGroup = module.exports = function MutuallyExclusiveGroup(container, options) {
      var required;
      options = options || {};
      required = options.required || false;
      group.call(this, container);
      this.required = required;

    };
    util.inherits(MutuallyExclusiveGroup, group);


    MutuallyExclusiveGroup.prototype._addAction = function (action) {
      var msg;
      if (action.required) {
        msg = 'mutually exclusive arguments must be optional';
        throw new Error(msg);
      }
      action = this._container._addAction(action);
      this._groupActions.push(action);
      return action;
    };


    MutuallyExclusiveGroup.prototype._removeAction = function (action) {
      this._container._removeAction(action);
      this._groupActions.remove(action);
    };
    });

    var action_container = createCommonjsModule(function (module) {

    var format = util.format;

    // Constants




    //Actions











    // Errors


    /**
     * new ActionContainer(options)
     *
     * Action container. Parent for [[ArgumentParser]] and [[ArgumentGroup]]
     *
     * ##### Options:
     *
     * - `description` -- A description of what the program does
     * - `prefixChars`  -- Characters that prefix optional arguments
     * - `argumentDefault`  -- The default value for all arguments
     * - `conflictHandler` -- The conflict handler to use for duplicate arguments
     **/
    var ActionContainer = module.exports = function ActionContainer(options) {
      options = options || {};

      this.description = options.description;
      this.argumentDefault = options.argumentDefault;
      this.prefixChars = options.prefixChars || '';
      this.conflictHandler = options.conflictHandler;

      // set up registries
      this._registries = {};

      // register actions
      this.register('action', null, store);
      this.register('action', 'store', store);
      this.register('action', 'storeConst', constant$3);
      this.register('action', 'storeTrue', _true);
      this.register('action', 'storeFalse', _false);
      this.register('action', 'append', append);
      this.register('action', 'appendConst', constant$2);
      this.register('action', 'count', count$1);
      this.register('action', 'help', help);
      this.register('action', 'version', version);
      this.register('action', 'parsers', subparsers);

      // raise an exception if the conflict handler is invalid
      this._getHandler();

      // action storage
      this._actions = [];
      this._optionStringActions = {};

      // groups
      this._actionGroups = [];
      this._mutuallyExclusiveGroups = [];

      // defaults storage
      this._defaults = {};

      // determines whether an "option" looks like a negative number
      // -1, -1.5 -5e+4
      this._regexpNegativeNumber = new RegExp('^[-]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$');

      // whether or not there are any optionals that look like negative
      // numbers -- uses a list so it can be shared and edited
      this._hasNegativeNumberOptionals = [];
    };

    // Groups must be required, then ActionContainer already defined



    //
    // Registration methods
    //

    /**
     * ActionContainer#register(registryName, value, object) -> Void
     * - registryName (String) : object type action|type
     * - value (string) : keyword
     * - object (Object|Function) : handler
     *
     *  Register handlers
     **/
    ActionContainer.prototype.register = function (registryName, value, object) {
      this._registries[registryName] = this._registries[registryName] || {};
      this._registries[registryName][value] = object;
    };

    ActionContainer.prototype._registryGet = function (registryName, value, defaultValue) {
      if (arguments.length < 3) {
        defaultValue = null;
      }
      return this._registries[registryName][value] || defaultValue;
    };

    //
    // Namespace default accessor methods
    //

    /**
     * ActionContainer#setDefaults(options) -> Void
     * - options (object):hash of options see [[Action.new]]
     *
     * Set defaults
     **/
    ActionContainer.prototype.setDefaults = function (options) {
      options = options || {};
      for (var property in options) {
        if (utils.has(options, property)) {
          this._defaults[property] = options[property];
        }
      }

      // if these defaults match any existing arguments, replace the previous
      // default on the object with the new one
      this._actions.forEach(function (action) {
        if (utils.has(options, action.dest)) {
          action.defaultValue = options[action.dest];
        }
      });
    };

    /**
     * ActionContainer#getDefault(dest) -> Mixed
     * - dest (string): action destination
     *
     * Return action default value
     **/
    ActionContainer.prototype.getDefault = function (dest) {
      var result = utils.has(this._defaults, dest) ? this._defaults[dest] : null;

      this._actions.forEach(function (action) {
        if (action.dest === dest && utils.has(action, 'defaultValue')) {
          result = action.defaultValue;
        }
      });

      return result;
    };
    //
    // Adding argument actions
    //

    /**
     * ActionContainer#addArgument(args, options) -> Object
     * - args (String|Array): argument key, or array of argument keys
     * - options (Object): action objects see [[Action.new]]
     *
     * #### Examples
     * - addArgument([ '-f', '--foo' ], { action: 'store', defaultValue: 1, ... })
     * - addArgument([ 'bar' ], { action: 'store', nargs: 1, ... })
     * - addArgument('--baz', { action: 'store', nargs: 1, ... })
     **/
    ActionContainer.prototype.addArgument = function (args, options) {
      args = args;
      options = options || {};

      if (typeof args === 'string') {
        args = [ args ];
      }
      if (!Array.isArray(args)) {
        throw new TypeError('addArgument first argument should be a string or an array');
      }
      if (typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('addArgument second argument should be a hash');
      }

      // if no positional args are supplied or only one is supplied and
      // it doesn't look like an option string, parse a positional argument
      if (!args || args.length === 1 && this.prefixChars.indexOf(args[0][0]) < 0) {
        if (args && !!options.dest) {
          throw new Error('dest supplied twice for positional argument');
        }
        options = this._getPositional(args, options);

        // otherwise, we're adding an optional argument
      } else {
        options = this._getOptional(args, options);
      }

      // if no default was supplied, use the parser-level default
      if (typeof options.defaultValue === 'undefined') {
        var dest = options.dest;
        if (utils.has(this._defaults, dest)) {
          options.defaultValue = this._defaults[dest];
        } else if (typeof this.argumentDefault !== 'undefined') {
          options.defaultValue = this.argumentDefault;
        }
      }

      // create the action object, and add it to the parser
      var ActionClass = this._popActionClass(options);
      if (typeof ActionClass !== 'function') {
        throw new Error(format('Unknown action "%s".', ActionClass));
      }
      var action = new ActionClass(options);

      // throw an error if the action type is not callable
      var typeFunction = this._registryGet('type', action.type, action.type);
      if (typeof typeFunction !== 'function') {
        throw new Error(format('"%s" is not callable', typeFunction));
      }

      return this._addAction(action);
    };

    /**
     * ActionContainer#addArgumentGroup(options) -> ArgumentGroup
     * - options (Object): hash of options see [[ArgumentGroup.new]]
     *
     * Create new arguments groups
     **/
    ActionContainer.prototype.addArgumentGroup = function (options) {
      var group$1 = new group(this, options);
      this._actionGroups.push(group$1);
      return group$1;
    };

    /**
     * ActionContainer#addMutuallyExclusiveGroup(options) -> ArgumentGroup
     * - options (Object): {required: false}
     *
     * Create new mutual exclusive groups
     **/
    ActionContainer.prototype.addMutuallyExclusiveGroup = function (options) {
      var group = new exclusive(this, options);
      this._mutuallyExclusiveGroups.push(group);
      return group;
    };

    ActionContainer.prototype._addAction = function (action) {
      var self = this;

      // resolve any conflicts
      this._checkConflict(action);

      // add to actions list
      this._actions.push(action);
      action.container = this;

      // index the action by any option strings it has
      action.optionStrings.forEach(function (optionString) {
        self._optionStringActions[optionString] = action;
      });

      // set the flag if any option strings look like negative numbers
      action.optionStrings.forEach(function (optionString) {
        if (optionString.match(self._regexpNegativeNumber)) {
          if (!self._hasNegativeNumberOptionals.some(Boolean)) {
            self._hasNegativeNumberOptionals.push(true);
          }
        }
      });

      // return the created action
      return action;
    };

    ActionContainer.prototype._removeAction = function (action) {
      var actionIndex = this._actions.indexOf(action);
      if (actionIndex >= 0) {
        this._actions.splice(actionIndex, 1);
      }
    };

    ActionContainer.prototype._addContainerActions = function (container) {
      // collect groups by titles
      var titleGroupMap = {};
      this._actionGroups.forEach(function (group) {
        if (titleGroupMap[group.title]) {
          throw new Error(format('Cannot merge actions - two groups are named "%s".', group.title));
        }
        titleGroupMap[group.title] = group;
      });

      // map each action to its group
      var groupMap = {};
      function actionHash(action) {
        // unique (hopefully?) string suitable as dictionary key
        return action.getName();
      }
      container._actionGroups.forEach(function (group) {
        // if a group with the title exists, use that, otherwise
        // create a new group matching the container's group
        if (!titleGroupMap[group.title]) {
          titleGroupMap[group.title] = this.addArgumentGroup({
            title: group.title,
            description: group.description
          });
        }

        // map the actions to their new group
        group._groupActions.forEach(function (action) {
          groupMap[actionHash(action)] = titleGroupMap[group.title];
        });
      }, this);

      // add container's mutually exclusive groups
      // NOTE: if add_mutually_exclusive_group ever gains title= and
      // description= then this code will need to be expanded as above
      var mutexGroup;
      container._mutuallyExclusiveGroups.forEach(function (group) {
        mutexGroup = this.addMutuallyExclusiveGroup({
          required: group.required
        });
        // map the actions to their new mutex group
        group._groupActions.forEach(function (action) {
          groupMap[actionHash(action)] = mutexGroup;
        });
      }, this);  // forEach takes a 'this' argument

      // add all actions to this container or their group
      container._actions.forEach(function (action) {
        var key = actionHash(action);
        if (groupMap[key]) {
          groupMap[key]._addAction(action);
        } else {
          this._addAction(action);
        }
      });
    };

    ActionContainer.prototype._getPositional = function (dest, options) {
      if (Array.isArray(dest)) {
        dest = dest[0];
      }
      // make sure required is not specified
      if (options.required) {
        throw new Error('"required" is an invalid argument for positionals.');
      }

      // mark positional arguments as required if at least one is
      // always required
      if (options.nargs !== _const.OPTIONAL && options.nargs !== _const.ZERO_OR_MORE) {
        options.required = true;
      }
      if (options.nargs === _const.ZERO_OR_MORE && typeof options.defaultValue === 'undefined') {
        options.required = true;
      }

      // return the keyword arguments with no option strings
      options.dest = dest;
      options.optionStrings = [];
      return options;
    };

    ActionContainer.prototype._getOptional = function (args, options) {
      var prefixChars = this.prefixChars;
      var optionStrings = [];
      var optionStringsLong = [];

      // determine short and long option strings
      args.forEach(function (optionString) {
        // error on strings that don't start with an appropriate prefix
        if (prefixChars.indexOf(optionString[0]) < 0) {
          throw new Error(format('Invalid option string "%s": must start with a "%s".',
            optionString,
            prefixChars
          ));
        }

        // strings starting with two prefix characters are long options
        optionStrings.push(optionString);
        if (optionString.length > 1 && prefixChars.indexOf(optionString[1]) >= 0) {
          optionStringsLong.push(optionString);
        }
      });

      // infer dest, '--foo-bar' -> 'foo_bar' and '-x' -> 'x'
      var dest = options.dest || null;
      delete options.dest;

      if (!dest) {
        var optionStringDest = optionStringsLong.length ? optionStringsLong[0] : optionStrings[0];
        dest = utils.trimChars(optionStringDest, this.prefixChars);

        if (dest.length === 0) {
          throw new Error(
            format('dest= is required for options like "%s"', optionStrings.join(', '))
          );
        }
        dest = dest.replace(/-/g, '_');
      }

      // return the updated keyword arguments
      options.dest = dest;
      options.optionStrings = optionStrings;

      return options;
    };

    ActionContainer.prototype._popActionClass = function (options, defaultValue) {
      defaultValue = defaultValue || null;

      var action = (options.action || defaultValue);
      delete options.action;

      var actionClass = this._registryGet('action', action, action);
      return actionClass;
    };

    ActionContainer.prototype._getHandler = function () {
      var handlerString = this.conflictHandler;
      var handlerFuncName = '_handleConflict' + utils.capitalize(handlerString);
      var func = this[handlerFuncName];
      if (typeof func === 'undefined') {
        var msg = 'invalid conflict resolution value: ' + handlerString;
        throw new Error(msg);
      } else {
        return func;
      }
    };

    ActionContainer.prototype._checkConflict = function (action) {
      var optionStringActions = this._optionStringActions;
      var conflictOptionals = [];

      // find all options that conflict with this option
      // collect pairs, the string, and an existing action that it conflicts with
      action.optionStrings.forEach(function (optionString) {
        var conflOptional = optionStringActions[optionString];
        if (typeof conflOptional !== 'undefined') {
          conflictOptionals.push([ optionString, conflOptional ]);
        }
      });

      if (conflictOptionals.length > 0) {
        var conflictHandler = this._getHandler();
        conflictHandler.call(this, action, conflictOptionals);
      }
    };

    ActionContainer.prototype._handleConflictError = function (action, conflOptionals) {
      var conflicts = conflOptionals.map(function (pair) { return pair[0]; });
      conflicts = conflicts.join(', ');
      throw error(
        action,
        format('Conflicting option string(s): %s', conflicts)
      );
    };

    ActionContainer.prototype._handleConflictResolve = function (action, conflOptionals) {
      // remove all conflicting options
      var self = this;
      conflOptionals.forEach(function (pair) {
        var optionString = pair[0];
        var conflictingAction = pair[1];
        // remove the conflicting option string
        var i = conflictingAction.optionStrings.indexOf(optionString);
        if (i >= 0) {
          conflictingAction.optionStrings.splice(i, 1);
        }
        delete self._optionStringActions[optionString];
        // if the option now has no option string, remove it from the
        // container holding it
        if (conflictingAction.optionStrings.length === 0) {
          conflictingAction.container._removeAction(conflictingAction);
        }
      });
    };
    });

    var formatter = createCommonjsModule(function (module) {

    var sprintf$1 = sprintf.sprintf;

    // Constants





    /*:nodoc:* internal
     * new Support(parent, heding)
     * - parent (object): parent section
     * - heading (string): header string
     *
     **/
    function Section(parent, heading) {
      this._parent = parent;
      this._heading = heading;
      this._items = [];
    }

    /*:nodoc:* internal
     * Section#addItem(callback) -> Void
     * - callback (array): tuple with function and args
     *
     * Add function for single element
     **/
    Section.prototype.addItem = function (callback) {
      this._items.push(callback);
    };

    /*:nodoc:* internal
     * Section#formatHelp(formatter) -> string
     * - formatter (HelpFormatter): current formatter
     *
     * Form help section string
     *
     **/
    Section.prototype.formatHelp = function (formatter) {
      var itemHelp, heading;

      // format the indented section
      if (this._parent) {
        formatter._indent();
      }

      itemHelp = this._items.map(function (item) {
        var obj, func, args;

        obj = formatter;
        func = item[0];
        args = item[1];
        return func.apply(obj, args);
      });
      itemHelp = formatter._joinParts(itemHelp);

      if (this._parent) {
        formatter._dedent();
      }

      // return nothing if the section was empty
      if (!itemHelp) {
        return '';
      }

      // add the heading if the section was non-empty
      heading = '';
      if (this._heading && this._heading !== _const.SUPPRESS) {
        var currentIndent = formatter.currentIndent;
        heading = utils.repeat(' ', currentIndent) + this._heading + ':' + _const.EOL;
      }

      // join the section-initialize newline, the heading and the help
      return formatter._joinParts([ _const.EOL, heading, itemHelp, _const.EOL ]);
    };

    /**
     * new HelpFormatter(options)
     *
     * #### Options:
     * - `prog`: program name
     * - `indentIncriment`: indent step, default value 2
     * - `maxHelpPosition`: max help position, default value = 24
     * - `width`: line width
     *
     **/
    var HelpFormatter = module.exports = function HelpFormatter(options) {
      options = options || {};

      this._prog = options.prog;

      this._maxHelpPosition = options.maxHelpPosition || 24;
      this._width = (options.width || ((process.env.COLUMNS || 80) - 2));

      this._currentIndent = 0;
      this._indentIncriment = options.indentIncriment || 2;
      this._level = 0;
      this._actionMaxLength = 0;

      this._rootSection = new Section(null);
      this._currentSection = this._rootSection;

      this._whitespaceMatcher = new RegExp('\\s+', 'g');
      this._longBreakMatcher = new RegExp(_const.EOL + _const.EOL + _const.EOL + '+', 'g');
    };

    HelpFormatter.prototype._indent = function () {
      this._currentIndent += this._indentIncriment;
      this._level += 1;
    };

    HelpFormatter.prototype._dedent = function () {
      this._currentIndent -= this._indentIncriment;
      this._level -= 1;
      if (this._currentIndent < 0) {
        throw new Error('Indent decreased below 0.');
      }
    };

    HelpFormatter.prototype._addItem = function (func, args) {
      this._currentSection.addItem([ func, args ]);
    };

    //
    // Message building methods
    //

    /**
     * HelpFormatter#startSection(heading) -> Void
     * - heading (string): header string
     *
     * Start new help section
     *
     * See alse [code example][1]
     *
     * ##### Example
     *
     *      formatter.startSection(actionGroup.title);
     *      formatter.addText(actionGroup.description);
     *      formatter.addArguments(actionGroup._groupActions);
     *      formatter.endSection();
     *
     **/
    HelpFormatter.prototype.startSection = function (heading) {
      this._indent();
      var section = new Section(this._currentSection, heading);
      var func = section.formatHelp.bind(section);
      this._addItem(func, [ this ]);
      this._currentSection = section;
    };

    /**
     * HelpFormatter#endSection -> Void
     *
     * End help section
     *
     * ##### Example
     *
     *      formatter.startSection(actionGroup.title);
     *      formatter.addText(actionGroup.description);
     *      formatter.addArguments(actionGroup._groupActions);
     *      formatter.endSection();
     **/
    HelpFormatter.prototype.endSection = function () {
      this._currentSection = this._currentSection._parent;
      this._dedent();
    };

    /**
     * HelpFormatter#addText(text) -> Void
     * - text (string): plain text
     *
     * Add plain text into current section
     *
     * ##### Example
     *
     *      formatter.startSection(actionGroup.title);
     *      formatter.addText(actionGroup.description);
     *      formatter.addArguments(actionGroup._groupActions);
     *      formatter.endSection();
     *
     **/
    HelpFormatter.prototype.addText = function (text) {
      if (text && text !== _const.SUPPRESS) {
        this._addItem(this._formatText, [ text ]);
      }
    };

    /**
     * HelpFormatter#addUsage(usage, actions, groups, prefix) -> Void
     * - usage (string): usage text
     * - actions (array): actions list
     * - groups (array): groups list
     * - prefix (string): usage prefix
     *
     * Add usage data into current section
     *
     * ##### Example
     *
     *      formatter.addUsage(this.usage, this._actions, []);
     *      return formatter.formatHelp();
     *
     **/
    HelpFormatter.prototype.addUsage = function (usage, actions, groups, prefix) {
      if (usage !== _const.SUPPRESS) {
        this._addItem(this._formatUsage, [ usage, actions, groups, prefix ]);
      }
    };

    /**
     * HelpFormatter#addArgument(action) -> Void
     * - action (object): action
     *
     * Add argument into current section
     *
     * Single variant of [[HelpFormatter#addArguments]]
     **/
    HelpFormatter.prototype.addArgument = function (action) {
      if (action.help !== _const.SUPPRESS) {
        var self = this;

        // find all invocations
        var invocations = [ this._formatActionInvocation(action) ];
        var invocationLength = invocations[0].length;

        var actionLength;

        if (action._getSubactions) {
          this._indent();
          action._getSubactions().forEach(function (subaction) {

            var invocationNew = self._formatActionInvocation(subaction);
            invocations.push(invocationNew);
            invocationLength = Math.max(invocationLength, invocationNew.length);

          });
          this._dedent();
        }

        // update the maximum item length
        actionLength = invocationLength + this._currentIndent;
        this._actionMaxLength = Math.max(this._actionMaxLength, actionLength);

        // add the item to the list
        this._addItem(this._formatAction, [ action ]);
      }
    };

    /**
     * HelpFormatter#addArguments(actions) -> Void
     * - actions (array): actions list
     *
     * Mass add arguments into current section
     *
     * ##### Example
     *
     *      formatter.startSection(actionGroup.title);
     *      formatter.addText(actionGroup.description);
     *      formatter.addArguments(actionGroup._groupActions);
     *      formatter.endSection();
     *
     **/
    HelpFormatter.prototype.addArguments = function (actions) {
      var self = this;
      actions.forEach(function (action) {
        self.addArgument(action);
      });
    };

    //
    // Help-formatting methods
    //

    /**
     * HelpFormatter#formatHelp -> string
     *
     * Format help
     *
     * ##### Example
     *
     *      formatter.addText(this.epilog);
     *      return formatter.formatHelp();
     *
     **/
    HelpFormatter.prototype.formatHelp = function () {
      var help = this._rootSection.formatHelp(this);
      if (help) {
        help = help.replace(this._longBreakMatcher, _const.EOL + _const.EOL);
        help = utils.trimChars(help, _const.EOL) + _const.EOL;
      }
      return help;
    };

    HelpFormatter.prototype._joinParts = function (partStrings) {
      return partStrings.filter(function (part) {
        return (part && part !== _const.SUPPRESS);
      }).join('');
    };

    HelpFormatter.prototype._formatUsage = function (usage, actions, groups, prefix) {
      if (!prefix && typeof prefix !== 'string') {
        prefix = 'usage: ';
      }

      actions = actions || [];
      groups = groups || [];


      // if usage is specified, use that
      if (usage) {
        usage = sprintf$1(usage, { prog: this._prog });

        // if no optionals or positionals are available, usage is just prog
      } else if (!usage && actions.length === 0) {
        usage = this._prog;

        // if optionals and positionals are available, calculate usage
      } else if (!usage) {
        var prog = this._prog;
        var optionals = [];
        var positionals = [];
        var actionUsage;
        var textWidth;

        // split optionals from positionals
        actions.forEach(function (action) {
          if (action.isOptional()) {
            optionals.push(action);
          } else {
            positionals.push(action);
          }
        });

        // build full usage string
        actionUsage = this._formatActionsUsage([].concat(optionals, positionals), groups);
        usage = [ prog, actionUsage ].join(' ');

        // wrap the usage parts if it's too long
        textWidth = this._width - this._currentIndent;
        if ((prefix.length + usage.length) > textWidth) {

          // break usage into wrappable parts
          var regexpPart = new RegExp('\\(.*?\\)+|\\[.*?\\]+|\\S+', 'g');
          var optionalUsage = this._formatActionsUsage(optionals, groups);
          var positionalUsage = this._formatActionsUsage(positionals, groups);


          var optionalParts = optionalUsage.match(regexpPart);
          var positionalParts = positionalUsage.match(regexpPart) || [];

          if (optionalParts.join(' ') !== optionalUsage) {
            throw new Error('assert "optionalParts.join(\' \') === optionalUsage"');
          }
          if (positionalParts.join(' ') !== positionalUsage) {
            throw new Error('assert "positionalParts.join(\' \') === positionalUsage"');
          }

          // helper for wrapping lines
          /*eslint-disable func-style*/ // node 0.10 compat
          var _getLines = function (parts, indent, prefix) {
            var lines = [];
            var line = [];

            var lineLength = prefix ? prefix.length - 1 : indent.length - 1;

            parts.forEach(function (part) {
              if (lineLength + 1 + part.length > textWidth) {
                lines.push(indent + line.join(' '));
                line = [];
                lineLength = indent.length - 1;
              }
              line.push(part);
              lineLength += part.length + 1;
            });

            if (line) {
              lines.push(indent + line.join(' '));
            }
            if (prefix) {
              lines[0] = lines[0].substr(indent.length);
            }
            return lines;
          };

          var lines, indent, parts;
          // if prog is short, follow it with optionals or positionals
          if (prefix.length + prog.length <= 0.75 * textWidth) {
            indent = utils.repeat(' ', (prefix.length + prog.length + 1));
            if (optionalParts) {
              lines = [].concat(
                _getLines([ prog ].concat(optionalParts), indent, prefix),
                _getLines(positionalParts, indent)
              );
            } else if (positionalParts) {
              lines = _getLines([ prog ].concat(positionalParts), indent, prefix);
            } else {
              lines = [ prog ];
            }

            // if prog is long, put it on its own line
          } else {
            indent = utils.repeat(' ', prefix.length);
            parts = optionalParts.concat(positionalParts);
            lines = _getLines(parts, indent);
            if (lines.length > 1) {
              lines = [].concat(
                _getLines(optionalParts, indent),
                _getLines(positionalParts, indent)
              );
            }
            lines = [ prog ].concat(lines);
          }
          // join lines into usage
          usage = lines.join(_const.EOL);
        }
      }

      // prefix with 'usage:'
      return prefix + usage + _const.EOL + _const.EOL;
    };

    HelpFormatter.prototype._formatActionsUsage = function (actions, groups) {
      // find group indices and identify actions in groups
      var groupActions = [];
      var inserts = [];
      var self = this;

      groups.forEach(function (group) {
        var end;
        var i;

        var start = actions.indexOf(group._groupActions[0]);
        if (start >= 0) {
          end = start + group._groupActions.length;

          //if (actions.slice(start, end) === group._groupActions) {
          if (utils.arrayEqual(actions.slice(start, end), group._groupActions)) {
            group._groupActions.forEach(function (action) {
              groupActions.push(action);
            });

            if (!group.required) {
              if (inserts[start]) {
                inserts[start] += ' [';
              } else {
                inserts[start] = '[';
              }
              inserts[end] = ']';
            } else {
              if (inserts[start]) {
                inserts[start] += ' (';
              } else {
                inserts[start] = '(';
              }
              inserts[end] = ')';
            }
            for (i = start + 1; i < end; i += 1) {
              inserts[i] = '|';
            }
          }
        }
      });

      // collect all actions format strings
      var parts = [];

      actions.forEach(function (action, actionIndex) {
        var part;
        var optionString;
        var argsDefault;
        var argsString;

        // suppressed arguments are marked with None
        // remove | separators for suppressed arguments
        if (action.help === _const.SUPPRESS) {
          parts.push(null);
          if (inserts[actionIndex] === '|') {
            inserts.splice(actionIndex, actionIndex);
          } else if (inserts[actionIndex + 1] === '|') {
            inserts.splice(actionIndex + 1, actionIndex + 1);
          }

          // produce all arg strings
        } else if (!action.isOptional()) {
          part = self._formatArgs(action, action.dest);

          // if it's in a group, strip the outer []
          if (groupActions.indexOf(action) >= 0) {
            if (part[0] === '[' && part[part.length - 1] === ']') {
              part = part.slice(1, -1);
            }
          }
          // add the action string to the list
          parts.push(part);

        // produce the first way to invoke the option in brackets
        } else {
          optionString = action.optionStrings[0];

          // if the Optional doesn't take a value, format is: -s or --long
          if (action.nargs === 0) {
            part = '' + optionString;

          // if the Optional takes a value, format is: -s ARGS or --long ARGS
          } else {
            argsDefault = action.dest.toUpperCase();
            argsString = self._formatArgs(action, argsDefault);
            part = optionString + ' ' + argsString;
          }
          // make it look optional if it's not required or in a group
          if (!action.required && groupActions.indexOf(action) < 0) {
            part = '[' + part + ']';
          }
          // add the action string to the list
          parts.push(part);
        }
      });

      // insert things at the necessary indices
      for (var i = inserts.length - 1; i >= 0; --i) {
        if (inserts[i] !== null) {
          parts.splice(i, 0, inserts[i]);
        }
      }

      // join all the action items with spaces
      var text = parts.filter(function (part) {
        return !!part;
      }).join(' ');

      // clean up separators for mutually exclusive groups
      text = text.replace(/([\[(]) /g, '$1'); // remove spaces
      text = text.replace(/ ([\])])/g, '$1');
      text = text.replace(/\[ *\]/g, ''); // remove empty groups
      text = text.replace(/\( *\)/g, '');
      text = text.replace(/\(([^|]*)\)/g, '$1'); // remove () from single action groups

      text = text.trim();

      // return the text
      return text;
    };

    HelpFormatter.prototype._formatText = function (text) {
      text = sprintf$1(text, { prog: this._prog });
      var textWidth = this._width - this._currentIndent;
      var indentIncriment = utils.repeat(' ', this._currentIndent);
      return this._fillText(text, textWidth, indentIncriment) + _const.EOL + _const.EOL;
    };

    HelpFormatter.prototype._formatAction = function (action) {
      var self = this;

      var helpText;
      var helpLines;
      var parts;
      var indentFirst;

      // determine the required width and the entry label
      var helpPosition = Math.min(this._actionMaxLength + 2, this._maxHelpPosition);
      var helpWidth = this._width - helpPosition;
      var actionWidth = helpPosition - this._currentIndent - 2;
      var actionHeader = this._formatActionInvocation(action);

      // no help; start on same line and add a final newline
      if (!action.help) {
        actionHeader = utils.repeat(' ', this._currentIndent) + actionHeader + _const.EOL;

      // short action name; start on the same line and pad two spaces
      } else if (actionHeader.length <= actionWidth) {
        actionHeader = utils.repeat(' ', this._currentIndent) +
            actionHeader +
            '  ' +
            utils.repeat(' ', actionWidth - actionHeader.length);
        indentFirst = 0;

      // long action name; start on the next line
      } else {
        actionHeader = utils.repeat(' ', this._currentIndent) + actionHeader + _const.EOL;
        indentFirst = helpPosition;
      }

      // collect the pieces of the action help
      parts = [ actionHeader ];

      // if there was help for the action, add lines of help text
      if (action.help) {
        helpText = this._expandHelp(action);
        helpLines = this._splitLines(helpText, helpWidth);
        parts.push(utils.repeat(' ', indentFirst) + helpLines[0] + _const.EOL);
        helpLines.slice(1).forEach(function (line) {
          parts.push(utils.repeat(' ', helpPosition) + line + _const.EOL);
        });

      // or add a newline if the description doesn't end with one
      } else if (actionHeader.charAt(actionHeader.length - 1) !== _const.EOL) {
        parts.push(_const.EOL);
      }
      // if there are any sub-actions, add their help as well
      if (action._getSubactions) {
        this._indent();
        action._getSubactions().forEach(function (subaction) {
          parts.push(self._formatAction(subaction));
        });
        this._dedent();
      }
      // return a single string
      return this._joinParts(parts);
    };

    HelpFormatter.prototype._formatActionInvocation = function (action) {
      if (!action.isOptional()) {
        var format_func = this._metavarFormatter(action, action.dest);
        var metavars = format_func(1);
        return metavars[0];
      }

      var parts = [];
      var argsDefault;
      var argsString;

      // if the Optional doesn't take a value, format is: -s, --long
      if (action.nargs === 0) {
        parts = parts.concat(action.optionStrings);

      // if the Optional takes a value, format is: -s ARGS, --long ARGS
      } else {
        argsDefault = action.dest.toUpperCase();
        argsString = this._formatArgs(action, argsDefault);
        action.optionStrings.forEach(function (optionString) {
          parts.push(optionString + ' ' + argsString);
        });
      }
      return parts.join(', ');
    };

    HelpFormatter.prototype._metavarFormatter = function (action, metavarDefault) {
      var result;

      if (action.metavar || action.metavar === '') {
        result = action.metavar;
      } else if (action.choices) {
        var choices = action.choices;

        if (typeof choices === 'string') {
          choices = choices.split('').join(', ');
        } else if (Array.isArray(choices)) {
          choices = choices.join(',');
        } else {
          choices = Object.keys(choices).join(',');
        }
        result = '{' + choices + '}';
      } else {
        result = metavarDefault;
      }

      return function (size) {
        if (Array.isArray(result)) {
          return result;
        }

        var metavars = [];
        for (var i = 0; i < size; i += 1) {
          metavars.push(result);
        }
        return metavars;
      };
    };

    HelpFormatter.prototype._formatArgs = function (action, metavarDefault) {
      var result;
      var metavars;

      var buildMetavar = this._metavarFormatter(action, metavarDefault);

      switch (action.nargs) {
        /*eslint-disable no-undefined*/
        case undefined:
        case null:
          metavars = buildMetavar(1);
          result = '' + metavars[0];
          break;
        case _const.OPTIONAL:
          metavars = buildMetavar(1);
          result = '[' + metavars[0] + ']';
          break;
        case _const.ZERO_OR_MORE:
          metavars = buildMetavar(2);
          result = '[' + metavars[0] + ' [' + metavars[1] + ' ...]]';
          break;
        case _const.ONE_OR_MORE:
          metavars = buildMetavar(2);
          result = '' + metavars[0] + ' [' + metavars[1] + ' ...]';
          break;
        case _const.REMAINDER:
          result = '...';
          break;
        case _const.PARSER:
          metavars = buildMetavar(1);
          result = metavars[0] + ' ...';
          break;
        default:
          metavars = buildMetavar(action.nargs);
          result = metavars.join(' ');
      }
      return result;
    };

    HelpFormatter.prototype._expandHelp = function (action) {
      var params = { prog: this._prog };

      Object.keys(action).forEach(function (actionProperty) {
        var actionValue = action[actionProperty];

        if (actionValue !== _const.SUPPRESS) {
          params[actionProperty] = actionValue;
        }
      });

      if (params.choices) {
        if (typeof params.choices === 'string') {
          params.choices = params.choices.split('').join(', ');
        } else if (Array.isArray(params.choices)) {
          params.choices = params.choices.join(', ');
        } else {
          params.choices = Object.keys(params.choices).join(', ');
        }
      }

      return sprintf$1(this._getHelpString(action), params);
    };

    HelpFormatter.prototype._splitLines = function (text, width) {
      var lines = [];
      var delimiters = [ ' ', '.', ',', '!', '?' ];
      var re = new RegExp('[' + delimiters.join('') + '][^' + delimiters.join('') + ']*$');

      text = text.replace(/[\n\|\t]/g, ' ');

      text = text.trim();
      text = text.replace(this._whitespaceMatcher, ' ');

      // Wraps the single paragraph in text (a string) so every line
      // is at most width characters long.
      text.split(_const.EOL).forEach(function (line) {
        if (width >= line.length) {
          lines.push(line);
          return;
        }

        var wrapStart = 0;
        var wrapEnd = width;
        var delimiterIndex = 0;
        while (wrapEnd <= line.length) {
          if (wrapEnd !== line.length && delimiters.indexOf(line[wrapEnd] < -1)) {
            delimiterIndex = (re.exec(line.substring(wrapStart, wrapEnd)) || {}).index;
            wrapEnd = wrapStart + delimiterIndex + 1;
          }
          lines.push(line.substring(wrapStart, wrapEnd));
          wrapStart = wrapEnd;
          wrapEnd += width;
        }
        if (wrapStart < line.length) {
          lines.push(line.substring(wrapStart, wrapEnd));
        }
      });

      return lines;
    };

    HelpFormatter.prototype._fillText = function (text, width, indent) {
      var lines = this._splitLines(text, width);
      lines = lines.map(function (line) {
        return indent + line;
      });
      return lines.join(_const.EOL);
    };

    HelpFormatter.prototype._getHelpString = function (action) {
      return action.help;
    };
    });

    var namespace = createCommonjsModule(function (module) {



    /**
     * new Namespace(options)
     * - options(object): predefined propertis for result object
     *
     **/
    var Namespace = module.exports = function Namespace(options) {
      utils.extend(this, options);
    };

    /**
     * Namespace#isset(key) -> Boolean
     * - key (string|number): property name
     *
     * Tells whenever `namespace` contains given `key` or not.
     **/
    Namespace.prototype.isset = function (key) {
      return utils.has(this, key);
    };

    /**
     * Namespace#set(key, value) -> self
     * -key (string|number|object): propery name
     * -value (mixed): new property value
     *
     * Set the property named key with value.
     * If key object then set all key properties to namespace object
     **/
    Namespace.prototype.set = function (key, value) {
      if (typeof (key) === 'object') {
        utils.extend(this, key);
      } else {
        this[key] = value;
      }
      return this;
    };

    /**
     * Namespace#get(key, defaultValue) -> mixed
     * - key (string|number): property name
     * - defaultValue (mixed): default value
     *
     * Return the property key or defaulValue if not set
     **/
    Namespace.prototype.get = function (key, defaultValue) {
      return !this[key] ? defaultValue : this[key];
    };

    /**
     * Namespace#unset(key, defaultValue) -> mixed
     * - key (string|number): property name
     * - defaultValue (mixed): default value
     *
     * Return data[key](and delete it) or defaultValue
     **/
    Namespace.prototype.unset = function (key, defaultValue) {
      var value = this[key];
      if (value !== null) {
        delete this[key];
        return value;
      }
      return defaultValue;
    };
    });

    var format$2  = util.format;

    var sprintf$1 = sprintf.sprintf;

    // Constants






    // Errors







    /**
     * new ArgumentParser(options)
     *
     * Create a new ArgumentParser object.
     *
     * ##### Options:
     * - `prog`  The name of the program (default: Path.basename(process.argv[1]))
     * - `usage`  A usage message (default: auto-generated from arguments)
     * - `description`  A description of what the program does
     * - `epilog`  Text following the argument descriptions
     * - `parents`  Parsers whose arguments should be copied into this one
     * - `formatterClass`  HelpFormatter class for printing help messages
     * - `prefixChars`  Characters that prefix optional arguments
     * - `fromfilePrefixChars` Characters that prefix files containing additional arguments
     * - `argumentDefault`  The default value for all arguments
     * - `addHelp`  Add a -h/-help option
     * - `conflictHandler`  Specifies how to handle conflicting argument names
     * - `debug`  Enable debug mode. Argument errors throw exception in
     *   debug mode and process.exit in normal. Used for development and
     *   testing (default: false)
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#argumentparser-objects
     **/
    function ArgumentParser(options) {
      if (!(this instanceof ArgumentParser)) {
        return new ArgumentParser(options);
      }
      var self = this;
      options = options || {};

      options.description = (options.description || null);
      options.argumentDefault = (options.argumentDefault || null);
      options.prefixChars = (options.prefixChars || '-');
      options.conflictHandler = (options.conflictHandler || 'error');
      action_container.call(this, options);

      options.addHelp = typeof options.addHelp === 'undefined' || !!options.addHelp;
      options.parents = options.parents || [];
      // default program name
      options.prog = (options.prog || path.basename(process.argv[1]));
      this.prog = options.prog;
      this.usage = options.usage;
      this.epilog = options.epilog;
      this.version = options.version;

      this.debug = (options.debug === true);

      this.formatterClass = (options.formatterClass || formatter);
      this.fromfilePrefixChars = options.fromfilePrefixChars || null;
      this._positionals = this.addArgumentGroup({ title: 'Positional arguments' });
      this._optionals = this.addArgumentGroup({ title: 'Optional arguments' });
      this._subparsers = null;

      // register types
      function FUNCTION_IDENTITY(o) {
        return o;
      }
      this.register('type', 'auto', FUNCTION_IDENTITY);
      this.register('type', null, FUNCTION_IDENTITY);
      this.register('type', 'int', function (x) {
        var result = parseInt(x, 10);
        if (isNaN(result)) {
          throw new Error(x + ' is not a valid integer.');
        }
        return result;
      });
      this.register('type', 'float', function (x) {
        var result = parseFloat(x);
        if (isNaN(result)) {
          throw new Error(x + ' is not a valid float.');
        }
        return result;
      });
      this.register('type', 'string', function (x) {
        return '' + x;
      });

      // add help and version arguments if necessary
      var defaultPrefix = (this.prefixChars.indexOf('-') > -1) ? '-' : this.prefixChars[0];
      if (options.addHelp) {
        this.addArgument(
          [ defaultPrefix + 'h', defaultPrefix + defaultPrefix + 'help' ],
          {
            action: 'help',
            defaultValue: _const.SUPPRESS,
            help: 'Show this help message and exit.'
          }
        );
      }
      if (typeof this.version !== 'undefined') {
        this.addArgument(
          [ defaultPrefix + 'v', defaultPrefix + defaultPrefix + 'version' ],
          {
            action: 'version',
            version: this.version,
            defaultValue: _const.SUPPRESS,
            help: "Show program's version number and exit."
          }
        );
      }

      // add parent arguments and defaults
      options.parents.forEach(function (parent) {
        self._addContainerActions(parent);
        if (typeof parent._defaults !== 'undefined') {
          for (var defaultKey in parent._defaults) {
            if (parent._defaults.hasOwnProperty(defaultKey)) {
              self._defaults[defaultKey] = parent._defaults[defaultKey];
            }
          }
        }
      });
    }

    util.inherits(ArgumentParser, action_container);

    /**
     * ArgumentParser#addSubparsers(options) -> [[ActionSubparsers]]
     * - options (object): hash of options see [[ActionSubparsers.new]]
     *
     * See also [subcommands][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#sub-commands
     **/
    ArgumentParser.prototype.addSubparsers = function (options) {
      if (this._subparsers) {
        this.error('Cannot have multiple subparser arguments.');
      }

      options = options || {};
      options.debug = (this.debug === true);
      options.optionStrings = [];
      options.parserClass = (options.parserClass || ArgumentParser);


      if (!!options.title || !!options.description) {

        this._subparsers = this.addArgumentGroup({
          title: (options.title || 'subcommands'),
          description: options.description
        });
        delete options.title;
        delete options.description;

      } else {
        this._subparsers = this._positionals;
      }

      // prog defaults to the usage message of this parser, skipping
      // optional arguments and with no "usage:" prefix
      if (!options.prog) {
        var formatter = this._getFormatter();
        var positionals = this._getPositionalActions();
        var groups = this._mutuallyExclusiveGroups;
        formatter.addUsage(this.usage, positionals, groups, '');
        options.prog = formatter.formatHelp().trim();
      }

      // create the parsers action and add it to the positionals list
      var ParsersClass = this._popActionClass(options, 'parsers');
      var action = new ParsersClass(options);
      this._subparsers._addAction(action);

      // return the created parsers action
      return action;
    };

    ArgumentParser.prototype._addAction = function (action) {
      if (action.isOptional()) {
        this._optionals._addAction(action);
      } else {
        this._positionals._addAction(action);
      }
      return action;
    };

    ArgumentParser.prototype._getOptionalActions = function () {
      return this._actions.filter(function (action) {
        return action.isOptional();
      });
    };

    ArgumentParser.prototype._getPositionalActions = function () {
      return this._actions.filter(function (action) {
        return action.isPositional();
      });
    };


    /**
     * ArgumentParser#parseArgs(args, namespace) -> Namespace|Object
     * - args (array): input elements
     * - namespace (Namespace|Object): result object
     *
     * Parsed args and throws error if some arguments are not recognized
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#the-parse-args-method
     **/
    ArgumentParser.prototype.parseArgs = function (args, namespace) {
      var argv;
      var result = this.parseKnownArgs(args, namespace);

      args = result[0];
      argv = result[1];
      if (argv && argv.length > 0) {
        this.error(
          format$2('Unrecognized arguments: %s.', argv.join(' '))
        );
      }
      return args;
    };

    /**
     * ArgumentParser#parseKnownArgs(args, namespace) -> array
     * - args (array): input options
     * - namespace (Namespace|Object): result object
     *
     * Parse known arguments and return tuple of result object
     * and unknown args
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#partial-parsing
     **/
    ArgumentParser.prototype.parseKnownArgs = function (args, namespace$1) {
      var self = this;

      // args default to the system args
      args = args || process.argv.slice(2);

      // default Namespace built from parser defaults
      namespace$1 = namespace$1 || new namespace();

      self._actions.forEach(function (action) {
        if (action.dest !== _const.SUPPRESS) {
          if (!utils.has(namespace$1, action.dest)) {
            if (action.defaultValue !== _const.SUPPRESS) {
              var defaultValue = action.defaultValue;
              if (typeof action.defaultValue === 'string') {
                defaultValue = self._getValue(action, defaultValue);
              }
              namespace$1[action.dest] = defaultValue;
            }
          }
        }
      });

      Object.keys(self._defaults).forEach(function (dest) {
        namespace$1[dest] = self._defaults[dest];
      });

      // parse the arguments and exit if there are any errors
      try {
        var res = this._parseKnownArgs(args, namespace$1);

        namespace$1 = res[0];
        args = res[1];
        if (utils.has(namespace$1, _const._UNRECOGNIZED_ARGS_ATTR)) {
          args = utils.arrayUnion(args, namespace$1[_const._UNRECOGNIZED_ARGS_ATTR]);
          delete namespace$1[_const._UNRECOGNIZED_ARGS_ATTR];
        }
        return [ namespace$1, args ];
      } catch (e) {
        this.error(e);
      }
    };

    ArgumentParser.prototype._parseKnownArgs = function (argStrings, namespace) {
      var self = this;

      var extras = [];

      // replace arg strings that are file references
      if (this.fromfilePrefixChars !== null) {
        argStrings = this._readArgsFromFiles(argStrings);
      }
      // map all mutually exclusive arguments to the other arguments
      // they can't occur with
      // Python has 'conflicts = action_conflicts.setdefault(mutex_action, [])'
      // though I can't conceive of a way in which an action could be a member
      // of two different mutually exclusive groups.

      function actionHash(action) {
        // some sort of hashable key for this action
        // action itself cannot be a key in actionConflicts
        // I think getName() (join of optionStrings) is unique enough
        return action.getName();
      }

      var conflicts, key;
      var actionConflicts = {};

      this._mutuallyExclusiveGroups.forEach(function (mutexGroup) {
        mutexGroup._groupActions.forEach(function (mutexAction, i, groupActions) {
          key = actionHash(mutexAction);
          if (!utils.has(actionConflicts, key)) {
            actionConflicts[key] = [];
          }
          conflicts = actionConflicts[key];
          conflicts.push.apply(conflicts, groupActions.slice(0, i));
          conflicts.push.apply(conflicts, groupActions.slice(i + 1));
        });
      });

      // find all option indices, and determine the arg_string_pattern
      // which has an 'O' if there is an option at an index,
      // an 'A' if there is an argument, or a '-' if there is a '--'
      var optionStringIndices = {};

      var argStringPatternParts = [];

      argStrings.forEach(function (argString, argStringIndex) {
        if (argString === '--') {
          argStringPatternParts.push('-');
          while (argStringIndex < argStrings.length) {
            argStringPatternParts.push('A');
            argStringIndex++;
          }
        } else {
          // otherwise, add the arg to the arg strings
          // and note the index if it was an option
          var pattern;
          var optionTuple = self._parseOptional(argString);
          if (!optionTuple) {
            pattern = 'A';
          } else {
            optionStringIndices[argStringIndex] = optionTuple;
            pattern = 'O';
          }
          argStringPatternParts.push(pattern);
        }
      });
      var argStringsPattern = argStringPatternParts.join('');

      var seenActions = [];
      var seenNonDefaultActions = [];


      function takeAction(action, argumentStrings, optionString) {
        seenActions.push(action);
        var argumentValues = self._getValues(action, argumentStrings);

        // error if this argument is not allowed with other previously
        // seen arguments, assuming that actions that use the default
        // value don't really count as "present"
        if (argumentValues !== action.defaultValue) {
          seenNonDefaultActions.push(action);
          if (actionConflicts[actionHash(action)]) {
            actionConflicts[actionHash(action)].forEach(function (actionConflict) {
              if (seenNonDefaultActions.indexOf(actionConflict) >= 0) {
                throw error(
                  action,
                  format$2('Not allowed with argument "%s".', actionConflict.getName())
                );
              }
            });
          }
        }

        if (argumentValues !== _const.SUPPRESS) {
          action.call(self, namespace, argumentValues, optionString);
        }
      }

      function consumeOptional(startIndex) {
        // get the optional identified at this index
        var optionTuple = optionStringIndices[startIndex];
        var action = optionTuple[0];
        var optionString = optionTuple[1];
        var explicitArg = optionTuple[2];

        // identify additional optionals in the same arg string
        // (e.g. -xyz is the same as -x -y -z if no args are required)
        var actionTuples = [];

        var args, argCount, start, stop;

        for (;;) {
          if (!action) {
            extras.push(argStrings[startIndex]);
            return startIndex + 1;
          }
          if (explicitArg) {
            argCount = self._matchArgument(action, 'A');

            // if the action is a single-dash option and takes no
            // arguments, try to parse more single-dash options out
            // of the tail of the option string
            var chars = self.prefixChars;
            if (argCount === 0 && chars.indexOf(optionString[1]) < 0) {
              actionTuples.push([ action, [], optionString ]);
              optionString = optionString[0] + explicitArg[0];
              var newExplicitArg = explicitArg.slice(1) || null;
              var optionalsMap = self._optionStringActions;

              if (Object.keys(optionalsMap).indexOf(optionString) >= 0) {
                action = optionalsMap[optionString];
                explicitArg = newExplicitArg;
              } else {
                throw error(action, sprintf$1('ignored explicit argument %r', explicitArg));
              }
            } else if (argCount === 1) {
              // if the action expect exactly one argument, we've
              // successfully matched the option; exit the loop
              stop = startIndex + 1;
              args = [ explicitArg ];
              actionTuples.push([ action, args, optionString ]);
              break;
            } else {
              // error if a double-dash option did not use the
              // explicit argument
              throw error(action, sprintf$1('ignored explicit argument %r', explicitArg));
            }
          } else {
            // if there is no explicit argument, try to match the
            // optional's string arguments with the following strings
            // if successful, exit the loop

            start = startIndex + 1;
            var selectedPatterns = argStringsPattern.substr(start);

            argCount = self._matchArgument(action, selectedPatterns);
            stop = start + argCount;


            args = argStrings.slice(start, stop);

            actionTuples.push([ action, args, optionString ]);
            break;
          }

        }

        // add the Optional to the list and return the index at which
        // the Optional's string args stopped
        if (actionTuples.length < 1) {
          throw new Error('length should be > 0');
        }
        for (var i = 0; i < actionTuples.length; i++) {
          takeAction.apply(self, actionTuples[i]);
        }
        return stop;
      }

      // the list of Positionals left to be parsed; this is modified
      // by consume_positionals()
      var positionals = self._getPositionalActions();

      function consumePositionals(startIndex) {
        // match as many Positionals as possible
        var selectedPattern = argStringsPattern.substr(startIndex);
        var argCounts = self._matchArgumentsPartial(positionals, selectedPattern);

        // slice off the appropriate arg strings for each Positional
        // and add the Positional and its args to the list
        for (var i = 0; i < positionals.length; i++) {
          var action = positionals[i];
          var argCount = argCounts[i];
          if (typeof argCount === 'undefined') {
            continue;
          }
          var args = argStrings.slice(startIndex, startIndex + argCount);

          startIndex += argCount;
          takeAction(action, args);
        }

        // slice off the Positionals that we just parsed and return the
        // index at which the Positionals' string args stopped
        positionals = positionals.slice(argCounts.length);
        return startIndex;
      }

      // consume Positionals and Optionals alternately, until we have
      // passed the last option string
      var startIndex = 0;
      var position;

      var maxOptionStringIndex = -1;

      Object.keys(optionStringIndices).forEach(function (position) {
        maxOptionStringIndex = Math.max(maxOptionStringIndex, parseInt(position, 10));
      });

      var positionalsEndIndex, nextOptionStringIndex;

      while (startIndex <= maxOptionStringIndex) {
        // consume any Positionals preceding the next option
        nextOptionStringIndex = null;
        for (position in optionStringIndices) {
          if (!optionStringIndices.hasOwnProperty(position)) { continue; }

          position = parseInt(position, 10);
          if (position >= startIndex) {
            if (nextOptionStringIndex !== null) {
              nextOptionStringIndex = Math.min(nextOptionStringIndex, position);
            } else {
              nextOptionStringIndex = position;
            }
          }
        }

        if (startIndex !== nextOptionStringIndex) {
          positionalsEndIndex = consumePositionals(startIndex);
          // only try to parse the next optional if we didn't consume
          // the option string during the positionals parsing
          if (positionalsEndIndex > startIndex) {
            startIndex = positionalsEndIndex;
            continue;
          } else {
            startIndex = positionalsEndIndex;
          }
        }

        // if we consumed all the positionals we could and we're not
        // at the index of an option string, there were extra arguments
        if (!optionStringIndices[startIndex]) {
          var strings = argStrings.slice(startIndex, nextOptionStringIndex);
          extras = extras.concat(strings);
          startIndex = nextOptionStringIndex;
        }
        // consume the next optional and any arguments for it
        startIndex = consumeOptional(startIndex);
      }

      // consume any positionals following the last Optional
      var stopIndex = consumePositionals(startIndex);

      // if we didn't consume all the argument strings, there were extras
      extras = extras.concat(argStrings.slice(stopIndex));

      // if we didn't use all the Positional objects, there were too few
      // arg strings supplied.
      if (positionals.length > 0) {
        self.error('too few arguments');
      }

      // make sure all required actions were present
      self._actions.forEach(function (action) {
        if (action.required) {
          if (seenActions.indexOf(action) < 0) {
            self.error(format$2('Argument "%s" is required', action.getName()));
          }
        }
      });

      // make sure all required groups have one option present
      var actionUsed = false;
      self._mutuallyExclusiveGroups.forEach(function (group) {
        if (group.required) {
          actionUsed = group._groupActions.some(function (action) {
            return seenNonDefaultActions.indexOf(action) !== -1;
          });

          // if no actions were used, report the error
          if (!actionUsed) {
            var names = [];
            group._groupActions.forEach(function (action) {
              if (action.help !== _const.SUPPRESS) {
                names.push(action.getName());
              }
            });
            names = names.join(' ');
            var msg = 'one of the arguments ' + names + ' is required';
            self.error(msg);
          }
        }
      });

      // return the updated namespace and the extra arguments
      return [ namespace, extras ];
    };

    ArgumentParser.prototype._readArgsFromFiles = function (argStrings) {
      // expand arguments referencing files
      var self = this;
      var fs = fs__default;
      var newArgStrings = [];
      argStrings.forEach(function (argString) {
        if (self.fromfilePrefixChars.indexOf(argString[0]) < 0) {
          // for regular arguments, just add them back into the list
          newArgStrings.push(argString);
        } else {
          // replace arguments referencing files with the file content
          try {
            var argstrs = [];
            var filename = argString.slice(1);
            var content = fs.readFileSync(filename, 'utf8');
            content = content.trim().split('\n');
            content.forEach(function (argLine) {
              self.convertArgLineToArgs(argLine).forEach(function (arg) {
                argstrs.push(arg);
              });
              argstrs = self._readArgsFromFiles(argstrs);
            });
            newArgStrings.push.apply(newArgStrings, argstrs);
          } catch (error) {
            return self.error(error.message);
          }
        }
      });
      return newArgStrings;
    };

    ArgumentParser.prototype.convertArgLineToArgs = function (argLine) {
      return [ argLine ];
    };

    ArgumentParser.prototype._matchArgument = function (action, regexpArgStrings) {

      // match the pattern for this action to the arg strings
      var regexpNargs = new RegExp('^' + this._getNargsPattern(action));
      var matches = regexpArgStrings.match(regexpNargs);
      var message;

      // throw an exception if we weren't able to find a match
      if (!matches) {
        switch (action.nargs) {
          /*eslint-disable no-undefined*/
          case undefined:
          case null:
            message = 'Expected one argument.';
            break;
          case _const.OPTIONAL:
            message = 'Expected at most one argument.';
            break;
          case _const.ONE_OR_MORE:
            message = 'Expected at least one argument.';
            break;
          default:
            message = 'Expected %s argument(s)';
        }

        throw error(
          action,
          format$2(message, action.nargs)
        );
      }
      // return the number of arguments matched
      return matches[1].length;
    };

    ArgumentParser.prototype._matchArgumentsPartial = function (actions, regexpArgStrings) {
      // progressively shorten the actions list by slicing off the
      // final actions until we find a match
      var self = this;
      var result = [];
      var actionSlice, pattern, matches;
      var i, j;

      function getLength(string) {
        return string.length;
      }

      for (i = actions.length; i > 0; i--) {
        pattern = '';
        actionSlice = actions.slice(0, i);
        for (j = 0; j < actionSlice.length; j++) {
          pattern += self._getNargsPattern(actionSlice[j]);
        }

        pattern = new RegExp('^' + pattern);
        matches = regexpArgStrings.match(pattern);

        if (matches && matches.length > 0) {
          // need only groups
          matches = matches.splice(1);
          result = result.concat(matches.map(getLength));
          break;
        }
      }

      // return the list of arg string counts
      return result;
    };

    ArgumentParser.prototype._parseOptional = function (argString) {
      var action, optionString, argExplicit, optionTuples;

      // if it's an empty string, it was meant to be a positional
      if (!argString) {
        return null;
      }

      // if it doesn't start with a prefix, it was meant to be positional
      if (this.prefixChars.indexOf(argString[0]) < 0) {
        return null;
      }

      // if the option string is present in the parser, return the action
      if (this._optionStringActions[argString]) {
        return [ this._optionStringActions[argString], argString, null ];
      }

      // if it's just a single character, it was meant to be positional
      if (argString.length === 1) {
        return null;
      }

      // if the option string before the "=" is present, return the action
      if (argString.indexOf('=') >= 0) {
        optionString = argString.split('=', 1)[0];
        argExplicit = argString.slice(optionString.length + 1);

        if (this._optionStringActions[optionString]) {
          action = this._optionStringActions[optionString];
          return [ action, optionString, argExplicit ];
        }
      }

      // search through all possible prefixes of the option string
      // and all actions in the parser for possible interpretations
      optionTuples = this._getOptionTuples(argString);

      // if multiple actions match, the option string was ambiguous
      if (optionTuples.length > 1) {
        var optionStrings = optionTuples.map(function (optionTuple) {
          return optionTuple[1];
        });
        this.error(format$2(
              'Ambiguous option: "%s" could match %s.',
              argString, optionStrings.join(', ')
        ));
      // if exactly one action matched, this segmentation is good,
      // so return the parsed action
      } else if (optionTuples.length === 1) {
        return optionTuples[0];
      }

      // if it was not found as an option, but it looks like a negative
      // number, it was meant to be positional
      // unless there are negative-number-like options
      if (argString.match(this._regexpNegativeNumber)) {
        if (!this._hasNegativeNumberOptionals.some(Boolean)) {
          return null;
        }
      }
      // if it contains a space, it was meant to be a positional
      if (argString.search(' ') >= 0) {
        return null;
      }

      // it was meant to be an optional but there is no such option
      // in this parser (though it might be a valid option in a subparser)
      return [ null, argString, null ];
    };

    ArgumentParser.prototype._getOptionTuples = function (optionString) {
      var result = [];
      var chars = this.prefixChars;
      var optionPrefix;
      var argExplicit;
      var action;
      var actionOptionString;

      // option strings starting with two prefix characters are only split at
      // the '='
      if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) >= 0) {
        if (optionString.indexOf('=') >= 0) {
          var optionStringSplit = optionString.split('=', 1);

          optionPrefix = optionStringSplit[0];
          argExplicit = optionStringSplit[1];
        } else {
          optionPrefix = optionString;
          argExplicit = null;
        }

        for (actionOptionString in this._optionStringActions) {
          if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
            action = this._optionStringActions[actionOptionString];
            result.push([ action, actionOptionString, argExplicit ]);
          }
        }

      // single character options can be concatenated with their arguments
      // but multiple character options always have to have their argument
      // separate
      } else if (chars.indexOf(optionString[0]) >= 0 && chars.indexOf(optionString[1]) < 0) {
        optionPrefix = optionString;
        argExplicit = null;
        var optionPrefixShort = optionString.substr(0, 2);
        var argExplicitShort = optionString.substr(2);

        for (actionOptionString in this._optionStringActions) {
          if (!utils.has(this._optionStringActions, actionOptionString)) continue;

          action = this._optionStringActions[actionOptionString];
          if (actionOptionString === optionPrefixShort) {
            result.push([ action, actionOptionString, argExplicitShort ]);
          } else if (actionOptionString.substr(0, optionPrefix.length) === optionPrefix) {
            result.push([ action, actionOptionString, argExplicit ]);
          }
        }

      // shouldn't ever get here
      } else {
        throw new Error(format$2('Unexpected option string: %s.', optionString));
      }
      // return the collected option tuples
      return result;
    };

    ArgumentParser.prototype._getNargsPattern = function (action) {
      // in all examples below, we have to allow for '--' args
      // which are represented as '-' in the pattern
      var regexpNargs;

      switch (action.nargs) {
        // the default (null) is assumed to be a single argument
        case undefined:
        case null:
          regexpNargs = '(-*A-*)';
          break;
        // allow zero or more arguments
        case _const.OPTIONAL:
          regexpNargs = '(-*A?-*)';
          break;
        // allow zero or more arguments
        case _const.ZERO_OR_MORE:
          regexpNargs = '(-*[A-]*)';
          break;
        // allow one or more arguments
        case _const.ONE_OR_MORE:
          regexpNargs = '(-*A[A-]*)';
          break;
        // allow any number of options or arguments
        case _const.REMAINDER:
          regexpNargs = '([-AO]*)';
          break;
        // allow one argument followed by any number of options or arguments
        case _const.PARSER:
          regexpNargs = '(-*A[-AO]*)';
          break;
        // all others should be integers
        default:
          regexpNargs = '(-*' + utils.repeat('-*A', action.nargs) + '-*)';
      }

      // if this is an optional action, -- is not allowed
      if (action.isOptional()) {
        regexpNargs = regexpNargs.replace(/-\*/g, '');
        regexpNargs = regexpNargs.replace(/-/g, '');
      }

      // return the pattern
      return regexpNargs;
    };

    //
    // Value conversion methods
    //

    ArgumentParser.prototype._getValues = function (action, argStrings) {
      var self = this;

      // for everything but PARSER args, strip out '--'
      if (action.nargs !== _const.PARSER && action.nargs !== _const.REMAINDER) {
        argStrings = argStrings.filter(function (arrayElement) {
          return arrayElement !== '--';
        });
      }

      var value, argString;

      // optional argument produces a default when not present
      if (argStrings.length === 0 && action.nargs === _const.OPTIONAL) {

        value = (action.isOptional()) ? action.constant : action.defaultValue;

        if (typeof (value) === 'string') {
          value = this._getValue(action, value);
          this._checkValue(action, value);
        }

      // when nargs='*' on a positional, if there were no command-line
      // args, use the default if it is anything other than None
      } else if (argStrings.length === 0 && action.nargs === _const.ZERO_OR_MORE &&
        action.optionStrings.length === 0) {

        value = (action.defaultValue || argStrings);
        this._checkValue(action, value);

      // single argument or optional argument produces a single value
      } else if (argStrings.length === 1 &&
            (!action.nargs || action.nargs === _const.OPTIONAL)) {

        argString = argStrings[0];
        value = this._getValue(action, argString);
        this._checkValue(action, value);

      // REMAINDER arguments convert all values, checking none
      } else if (action.nargs === _const.REMAINDER) {
        value = argStrings.map(function (v) {
          return self._getValue(action, v);
        });

      // PARSER arguments convert all values, but check only the first
      } else if (action.nargs === _const.PARSER) {
        value = argStrings.map(function (v) {
          return self._getValue(action, v);
        });
        this._checkValue(action, value[0]);

      // all other types of nargs produce a list
      } else {
        value = argStrings.map(function (v) {
          return self._getValue(action, v);
        });
        value.forEach(function (v) {
          self._checkValue(action, v);
        });
      }

      // return the converted value
      return value;
    };

    ArgumentParser.prototype._getValue = function (action, argString) {
      var result;

      var typeFunction = this._registryGet('type', action.type, action.type);
      if (typeof typeFunction !== 'function') {
        var message = format$2('%s is not callable', typeFunction);
        throw error(action, message);
      }

      // convert the value to the appropriate type
      try {
        result = typeFunction(argString);

        // ArgumentTypeErrors indicate errors
        // If action.type is not a registered string, it is a function
        // Try to deduce its name for inclusion in the error message
        // Failing that, include the error message it raised.
      } catch (e) {
        var name = null;
        if (typeof action.type === 'string') {
          name = action.type;
        } else {
          name = action.type.name || action.type.displayName || '<function>';
        }
        var msg = format$2('Invalid %s value: %s', name, argString);
        if (name === '<function>') { msg += '\n' + e.message; }
        throw error(action, msg);
      }
      // return the converted value
      return result;
    };

    ArgumentParser.prototype._checkValue = function (action, value) {
      // converted value must be one of the choices (if specified)
      var choices = action.choices;
      if (choices) {
        // choise for argument can by array or string
        if ((typeof choices === 'string' || Array.isArray(choices)) &&
            choices.indexOf(value) !== -1) {
          return;
        }
        // choise for subparsers can by only hash
        if (typeof choices === 'object' && !Array.isArray(choices) && choices[value]) {
          return;
        }

        if (typeof choices === 'string') {
          choices = choices.split('').join(', ');
        } else if (Array.isArray(choices)) {
          choices =  choices.join(', ');
        } else {
          choices =  Object.keys(choices).join(', ');
        }
        var message = format$2('Invalid choice: %s (choose from [%s])', value, choices);
        throw error(action, message);
      }
    };

    //
    // Help formatting methods
    //

    /**
     * ArgumentParser#formatUsage -> string
     *
     * Return usage string
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
     **/
    ArgumentParser.prototype.formatUsage = function () {
      var formatter = this._getFormatter();
      formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups);
      return formatter.formatHelp();
    };

    /**
     * ArgumentParser#formatHelp -> string
     *
     * Return help
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
     **/
    ArgumentParser.prototype.formatHelp = function () {
      var formatter = this._getFormatter();

      // usage
      formatter.addUsage(this.usage, this._actions, this._mutuallyExclusiveGroups);

      // description
      formatter.addText(this.description);

      // positionals, optionals and user-defined groups
      this._actionGroups.forEach(function (actionGroup) {
        formatter.startSection(actionGroup.title);
        formatter.addText(actionGroup.description);
        formatter.addArguments(actionGroup._groupActions);
        formatter.endSection();
      });

      // epilog
      formatter.addText(this.epilog);

      // determine help from format above
      return formatter.formatHelp();
    };

    ArgumentParser.prototype._getFormatter = function () {
      var FormatterClass = this.formatterClass;
      var formatter = new FormatterClass({ prog: this.prog });
      return formatter;
    };

    //
    //  Print functions
    //

    /**
     * ArgumentParser#printUsage() -> Void
     *
     * Print usage
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
     **/
    ArgumentParser.prototype.printUsage = function () {
      this._printMessage(this.formatUsage());
    };

    /**
     * ArgumentParser#printHelp() -> Void
     *
     * Print help
     *
     * See also [original guide][1]
     *
     * [1]:http://docs.python.org/dev/library/argparse.html#printing-help
     **/
    ArgumentParser.prototype.printHelp = function () {
      this._printMessage(this.formatHelp());
    };

    ArgumentParser.prototype._printMessage = function (message, stream) {
      if (!stream) {
        stream = process.stdout;
      }
      if (message) {
        stream.write('' + message);
      }
    };

    //
    //  Exit functions
    //

    /**
     * ArgumentParser#exit(status=0, message) -> Void
     * - status (int): exit status
     * - message (string): message
     *
     * Print message in stderr/stdout and exit program
     **/
    ArgumentParser.prototype.exit = function (status, message) {
      if (message) {
        if (status === 0) {
          this._printMessage(message);
        } else {
          this._printMessage(message, process.stderr);
        }
      }

      process.exit(status);
    };

    /**
     * ArgumentParser#error(message) -> Void
     * - err (Error|string): message
     *
     * Error method Prints a usage message incorporating the message to stderr and
     * exits. If you override this in a subclass,
     * it should not return -- it should
     * either exit or throw an exception.
     *
     **/
    ArgumentParser.prototype.error = function (err) {
      var message;
      if (err instanceof Error) {
        if (this.debug === true) {
          throw err;
        }
        message = err.message;
      } else {
        message = err;
      }
      var msg = format$2('%s: error: %s', this.prog, message) + _const.EOL;

      if (this.debug === true) {
        throw new Error(msg);
      }

      this.printUsage(process.stderr);

      return this.exit(2, msg);
    };

    var argument_parser = ArgumentParser;

    // Constants





    /**
     * new RawDescriptionHelpFormatter(options)
     * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
     *
     * Help message formatter which adds default values to argument help.
     *
     * Only the name of this class is considered a public API. All the methods
     * provided by the class are considered an implementation detail.
     **/

    function ArgumentDefaultsHelpFormatter(options) {
      formatter.call(this, options);
    }

    util.inherits(ArgumentDefaultsHelpFormatter, formatter);

    ArgumentDefaultsHelpFormatter.prototype._getHelpString = function (action) {
      var help = action.help;
      if (action.help.indexOf('%(defaultValue)s') === -1) {
        if (action.defaultValue !== _const.SUPPRESS) {
          var defaulting_nargs = [ _const.OPTIONAL, _const.ZERO_OR_MORE ];
          if (action.isOptional() || (defaulting_nargs.indexOf(action.nargs) >= 0)) {
            help += ' (default: %(defaultValue)s)';
          }
        }
      }
      return help;
    };

    var ArgumentDefaultsHelpFormatter_1 = ArgumentDefaultsHelpFormatter;

    /**
     * new RawDescriptionHelpFormatter(options)
     * new ArgumentParser({formatterClass: argparse.RawDescriptionHelpFormatter, ...})
     *
     * Help message formatter which retains any formatting in descriptions.
     *
     * Only the name of this class is considered a public API. All the methods
     * provided by the class are considered an implementation detail.
     **/

    function RawDescriptionHelpFormatter(options) {
      formatter.call(this, options);
    }

    util.inherits(RawDescriptionHelpFormatter, formatter);

    RawDescriptionHelpFormatter.prototype._fillText = function (text, width, indent) {
      var lines = text.split('\n');
      lines = lines.map(function (line) {
        return utils.trimEnd(indent + line);
      });
      return lines.join('\n');
    };
    var RawDescriptionHelpFormatter_1 = RawDescriptionHelpFormatter;

    /**
     * new RawTextHelpFormatter(options)
     * new ArgumentParser({formatterClass: argparse.RawTextHelpFormatter, ...})
     *
     * Help message formatter which retains formatting of all help text.
     *
     * Only the name of this class is considered a public API. All the methods
     * provided by the class are considered an implementation detail.
     **/

    function RawTextHelpFormatter(options) {
      RawDescriptionHelpFormatter.call(this, options);
    }

    util.inherits(RawTextHelpFormatter, RawDescriptionHelpFormatter);

    RawTextHelpFormatter.prototype._splitLines = function (text) {
      return text.split('\n');
    };

    var RawTextHelpFormatter_1 = RawTextHelpFormatter;

    var added_formatters = {
    	ArgumentDefaultsHelpFormatter: ArgumentDefaultsHelpFormatter_1,
    	RawDescriptionHelpFormatter: RawDescriptionHelpFormatter_1,
    	RawTextHelpFormatter: RawTextHelpFormatter_1
    };

    var ArgumentParser$1 = argument_parser;
    var Namespace = namespace;
    var Action = action;
    var HelpFormatter = formatter;
    var Const = _const;

    var ArgumentDefaultsHelpFormatter$1 =
      added_formatters.ArgumentDefaultsHelpFormatter;
    var RawDescriptionHelpFormatter$1 =
      added_formatters.RawDescriptionHelpFormatter;
    var RawTextHelpFormatter$1 =
      added_formatters.RawTextHelpFormatter;

    var argparse = {
    	ArgumentParser: ArgumentParser$1,
    	Namespace: Namespace,
    	Action: Action,
    	HelpFormatter: HelpFormatter,
    	Const: Const,
    	ArgumentDefaultsHelpFormatter: ArgumentDefaultsHelpFormatter$1,
    	RawDescriptionHelpFormatter: RawDescriptionHelpFormatter$1,
    	RawTextHelpFormatter: RawTextHelpFormatter$1
    };

    var argparse$1 = argparse;

    var styles_1 = createCommonjsModule(function (module) {
    /*
    The MIT License (MIT)

    Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

    */

    var styles = {};
    module['exports'] = styles;

    var codes = {
      reset: [0, 0],

      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],

      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      grey: [90, 39],

      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],

      // legacy styles for colors pre v1.0.0
      blackBG: [40, 49],
      redBG: [41, 49],
      greenBG: [42, 49],
      yellowBG: [43, 49],
      blueBG: [44, 49],
      magentaBG: [45, 49],
      cyanBG: [46, 49],
      whiteBG: [47, 49],

    };

    Object.keys(codes).forEach(function(key) {
      var val = codes[key];
      var style = styles[key] = [];
      style.open = '\u001b[' + val[0] + 'm';
      style.close = '\u001b[' + val[1] + 'm';
    });
    });

    /*
    MIT License

    Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

    Permission is hereby granted, free of charge, to any person obtaining a copy of
    this software and associated documentation files (the "Software"), to deal in
    the Software without restriction, including without limitation the rights to
    use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
    of the Software, and to permit persons to whom the Software is furnished to do
    so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */

    var hasFlag = function(flag, argv) {
      argv = argv || process.argv;

      var terminatorPos = argv.indexOf('--');
      var prefix = /^-{1,2}/.test(flag) ? '' : '--';
      var pos = argv.indexOf(prefix + flag);

      return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
    };

    var env = process.env;

    var forceColor = void 0;
    if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false')) {
      forceColor = false;
    } else if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true')
               || hasFlag('color=always')) {
      forceColor = true;
    }
    if ('FORCE_COLOR' in env) {
      forceColor = env.FORCE_COLOR.length === 0
        || parseInt(env.FORCE_COLOR, 10) !== 0;
    }

    function translateLevel(level) {
      if (level === 0) {
        return false;
      }

      return {
        level: level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3,
      };
    }

    function supportsColor(stream) {
      if (forceColor === false) {
        return 0;
      }

      if (hasFlag('color=16m') || hasFlag('color=full')
          || hasFlag('color=truecolor')) {
        return 3;
      }

      if (hasFlag('color=256')) {
        return 2;
      }

      if (stream && !stream.isTTY && forceColor !== true) {
        return 0;
      }

      var min = forceColor ? 1 : 0;

      if (process.platform === 'win32') {
        // Node.js 7.5.0 is the first version of Node.js to include a patch to
        // libuv that enables 256 color output on Windows. Anything earlier and it
        // won't work. However, here we target Node.js 8 at minimum as it is an LTS
        // release, and Node.js 7 is not. Windows 10 build 10586 is the first
        // Windows release that supports 256 colors. Windows 10 build 14931 is the
        // first release that supports 16m/TrueColor.
        var osRelease = os.release().split('.');
        if (Number(process.versions.node.split('.')[0]) >= 8
            && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }

        return 1;
      }

      if ('CI' in env) {
        if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(function(sign) {
          return sign in env;
        }) || env.CI_NAME === 'codeship') {
          return 1;
        }

        return min;
      }

      if ('TEAMCITY_VERSION' in env) {
        return (/^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0
        );
      }

      if ('TERM_PROGRAM' in env) {
        var version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

        switch (env.TERM_PROGRAM) {
          case 'iTerm.app':
            return version >= 3 ? 3 : 2;
          case 'Hyper':
            return 3;
          case 'Apple_Terminal':
            return 2;
          // No default
        }
      }

      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }

      if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }

      if ('COLORTERM' in env) {
        return 1;
      }

      if (env.TERM === 'dumb') {
        return min;
      }

      return min;
    }

    function getSupportLevel(stream) {
      var level = supportsColor(stream);
      return translateLevel(level);
    }

    var supportsColors = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel(process.stdout),
      stderr: getSupportLevel(process.stderr),
    };

    var trap = createCommonjsModule(function (module) {
    module['exports'] = function runTheTrap(text, options) {
      var result = '';
      text = text || 'Run the trap, drop the bass';
      text = text.split('');
      var trap = {
        a: ['\u0040', '\u0104', '\u023a', '\u0245', '\u0394', '\u039b', '\u0414'],
        b: ['\u00df', '\u0181', '\u0243', '\u026e', '\u03b2', '\u0e3f'],
        c: ['\u00a9', '\u023b', '\u03fe'],
        d: ['\u00d0', '\u018a', '\u0500', '\u0501', '\u0502', '\u0503'],
        e: ['\u00cb', '\u0115', '\u018e', '\u0258', '\u03a3', '\u03be', '\u04bc',
             '\u0a6c'],
        f: ['\u04fa'],
        g: ['\u0262'],
        h: ['\u0126', '\u0195', '\u04a2', '\u04ba', '\u04c7', '\u050a'],
        i: ['\u0f0f'],
        j: ['\u0134'],
        k: ['\u0138', '\u04a0', '\u04c3', '\u051e'],
        l: ['\u0139'],
        m: ['\u028d', '\u04cd', '\u04ce', '\u0520', '\u0521', '\u0d69'],
        n: ['\u00d1', '\u014b', '\u019d', '\u0376', '\u03a0', '\u048a'],
        o: ['\u00d8', '\u00f5', '\u00f8', '\u01fe', '\u0298', '\u047a', '\u05dd',
             '\u06dd', '\u0e4f'],
        p: ['\u01f7', '\u048e'],
        q: ['\u09cd'],
        r: ['\u00ae', '\u01a6', '\u0210', '\u024c', '\u0280', '\u042f'],
        s: ['\u00a7', '\u03de', '\u03df', '\u03e8'],
        t: ['\u0141', '\u0166', '\u0373'],
        u: ['\u01b1', '\u054d'],
        v: ['\u05d8'],
        w: ['\u0428', '\u0460', '\u047c', '\u0d70'],
        x: ['\u04b2', '\u04fe', '\u04fc', '\u04fd'],
        y: ['\u00a5', '\u04b0', '\u04cb'],
        z: ['\u01b5', '\u0240'],
      };
      text.forEach(function(c) {
        c = c.toLowerCase();
        var chars = trap[c] || [' '];
        var rand = Math.floor(Math.random() * chars.length);
        if (typeof trap[c] !== 'undefined') {
          result += trap[c][rand];
        } else {
          result += c;
        }
      });
      return result;
    };
    });

    var zalgo = createCommonjsModule(function (module) {
    // please no
    module['exports'] = function zalgo(text, options) {
      text = text || '   he is here   ';
      var soul = {
        'up': [
          '̍', '̎', '̄', '̅',
          '̿', '̑', '̆', '̐',
          '͒', '͗', '͑', '̇',
          '̈', '̊', '͂', '̓',
          '̈', '͊', '͋', '͌',
          '̃', '̂', '̌', '͐',
          '̀', '́', '̋', '̏',
          '̒', '̓', '̔', '̽',
          '̉', 'ͣ', 'ͤ', 'ͥ',
          'ͦ', 'ͧ', 'ͨ', 'ͩ',
          'ͪ', 'ͫ', 'ͬ', 'ͭ',
          'ͮ', 'ͯ', '̾', '͛',
          '͆', '̚',
        ],
        'down': [
          '̖', '̗', '̘', '̙',
          '̜', '̝', '̞', '̟',
          '̠', '̤', '̥', '̦',
          '̩', '̪', '̫', '̬',
          '̭', '̮', '̯', '̰',
          '̱', '̲', '̳', '̹',
          '̺', '̻', '̼', 'ͅ',
          '͇', '͈', '͉', '͍',
          '͎', '͓', '͔', '͕',
          '͖', '͙', '͚', '̣',
        ],
        'mid': [
          '̕', '̛', '̀', '́',
          '͘', '̡', '̢', '̧',
          '̨', '̴', '̵', '̶',
          '͜', '͝', '͞',
          '͟', '͠', '͢', '̸',
          '̷', '͡', ' ҉',
        ],
      };
      var all = [].concat(soul.up, soul.down, soul.mid);

      function randomNumber(range) {
        var r = Math.floor(Math.random() * range);
        return r;
      }

      function isChar(character) {
        var bool = false;
        all.filter(function(i) {
          bool = (i === character);
        });
        return bool;
      }


      function heComes(text, options) {
        var result = '';
        var counts;
        var l;
        options = options || {};
        options['up'] =
          typeof options['up'] !== 'undefined' ? options['up'] : true;
        options['mid'] =
          typeof options['mid'] !== 'undefined' ? options['mid'] : true;
        options['down'] =
          typeof options['down'] !== 'undefined' ? options['down'] : true;
        options['size'] =
          typeof options['size'] !== 'undefined' ? options['size'] : 'maxi';
        text = text.split('');
        for (l in text) {
          if (isChar(l)) {
            continue;
          }
          result = result + text[l];
          counts = {'up': 0, 'down': 0, 'mid': 0};
          switch (options.size) {
          case 'mini':
            counts.up = randomNumber(8);
            counts.mid = randomNumber(2);
            counts.down = randomNumber(8);
            break;
          case 'maxi':
            counts.up = randomNumber(16) + 3;
            counts.mid = randomNumber(4) + 1;
            counts.down = randomNumber(64) + 3;
            break;
          default:
            counts.up = randomNumber(8) + 1;
            counts.mid = randomNumber(6) / 2;
            counts.down = randomNumber(8) + 1;
            break;
          }

          var arr = ['up', 'mid', 'down'];
          for (var d in arr) {
            var index = arr[d];
            for (var i = 0; i <= counts[index]; i++) {
              if (options[index]) {
                result = result + soul[index][randomNumber(soul[index].length)];
              }
            }
          }
        }
        return result;
      }
      // don't summon him
      return heComes(text, options);
    };
    });

    var america = createCommonjsModule(function (module) {
    module['exports'] = (function() {
      return function(letter, i, exploded) {
        if (letter === ' ') return letter;
        switch (i%3) {
          case 0: return colors_1.red(letter);
          case 1: return colors_1.white(letter);
          case 2: return colors_1.blue(letter);
        }
      };
    })();
    });

    var zebra = createCommonjsModule(function (module) {
    module['exports'] = function(letter, i, exploded) {
      return i % 2 === 0 ? letter : colors_1.inverse(letter);
    };
    });

    var rainbow = createCommonjsModule(function (module) {
    module['exports'] = (function() {
      // RoY G BiV
      var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta'];
      return function(letter, i, exploded) {
        if (letter === ' ') {
          return letter;
        } else {
          return colors_1[rainbowColors[i++ % rainbowColors.length]](letter);
        }
      };
    })();
    });

    var random = createCommonjsModule(function (module) {
    module['exports'] = (function() {
      var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green',
        'blue', 'white', 'cyan', 'magenta'];
      return function(letter, i, exploded) {
        return letter === ' ' ? letter :
          colors_1[
            available[Math.round(Math.random() * (available.length - 2))]
          ](letter);
      };
    })();
    });

    var colors_1 = createCommonjsModule(function (module) {
    /*

    The MIT License (MIT)

    Original Library
      - Copyright (c) Marak Squires

    Additional functionality
     - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

    */

    var colors = {};
    module['exports'] = colors;

    colors.themes = {};


    var ansiStyles = colors.styles = styles_1;
    var defineProps = Object.defineProperties;
    var newLineRegex = new RegExp(/[\r\n]+/g);

    colors.supportsColor = supportsColors.supportsColor;

    if (typeof colors.enabled === 'undefined') {
      colors.enabled = colors.supportsColor() !== false;
    }

    colors.enable = function() {
      colors.enabled = true;
    };

    colors.disable = function() {
      colors.enabled = false;
    };

    colors.stripColors = colors.strip = function(str) {
      return ('' + str).replace(/\x1B\[\d+m/g, '');
    };

    // eslint-disable-next-line no-unused-vars
    var stylize = colors.stylize = function stylize(str, style) {
      if (!colors.enabled) {
        return str+'';
      }

      return ansiStyles[style].open + str + ansiStyles[style].close;
    };

    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    var escapeStringRegexp = function(str) {
      if (typeof str !== 'string') {
        throw new TypeError('Expected a string');
      }
      return str.replace(matchOperatorsRe, '\\$&');
    };

    function build(_styles) {
      var builder = function builder() {
        return applyStyle.apply(builder, arguments);
      };
      builder._styles = _styles;
      // __proto__ is used because we must return a function, but there is
      // no way to create a function with a different prototype.
      builder.__proto__ = proto;
      return builder;
    }

    var styles = (function() {
      var ret = {};
      ansiStyles.grey = ansiStyles.gray;
      Object.keys(ansiStyles).forEach(function(key) {
        ansiStyles[key].closeRe =
          new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
        ret[key] = {
          get: function() {
            return build(this._styles.concat(key));
          },
        };
      });
      return ret;
    })();

    var proto = defineProps(function colors() {}, styles);

    function applyStyle() {
      var args = Array.prototype.slice.call(arguments);

      var str = args.map(function(arg) {
        if (arg !== undefined && arg.constructor === String) {
          return arg;
        } else {
          return util.inspect(arg);
        }
      }).join(' ');

      if (!colors.enabled || !str) {
        return str;
      }

      var newLinesPresent = str.indexOf('\n') != -1;

      var nestedStyles = this._styles;

      var i = nestedStyles.length;
      while (i--) {
        var code = ansiStyles[nestedStyles[i]];
        str = code.open + str.replace(code.closeRe, code.open) + code.close;
        if (newLinesPresent) {
          str = str.replace(newLineRegex, code.close + '\n' + code.open);
        }
      }

      return str;
    }

    colors.setTheme = function(theme) {
      if (typeof theme === 'string') {
        console.log('colors.setTheme now only accepts an object, not a string.  ' +
          'If you are trying to set a theme from a file, it is now your (the ' +
          'caller\'s) responsibility to require the file.  The old syntax ' +
          'looked like colors.setTheme(__dirname + ' +
          '\'/../themes/generic-logging.js\'); The new syntax looks like '+
          'colors.setTheme(require(__dirname + ' +
          '\'/../themes/generic-logging.js\'));');
        return;
      }
      for (var style in theme) {
        (function(style) {
          colors[style] = function(str) {
            if (typeof theme[style] === 'object') {
              var out = str;
              for (var i in theme[style]) {
                out = colors[theme[style][i]](out);
              }
              return out;
            }
            return colors[theme[style]](str);
          };
        })(style);
      }
    };

    function init() {
      var ret = {};
      Object.keys(styles).forEach(function(name) {
        ret[name] = {
          get: function() {
            return build([name]);
          },
        };
      });
      return ret;
    }

    var sequencer = function sequencer(map, str) {
      var exploded = str.split('');
      exploded = exploded.map(map);
      return exploded.join('');
    };

    // custom formatter methods
    colors.trap = trap;
    colors.zalgo = zalgo;

    // maps
    colors.maps = {};
    colors.maps.america = america;
    colors.maps.zebra = zebra;
    colors.maps.rainbow = rainbow;
    colors.maps.random = random;

    for (var map in colors.maps) {
      (function(map) {
        colors[map] = function(str) {
          return sequencer(colors.maps[map], str);
        };
      })(map);
    }

    defineProps(colors, init());
    });

    var extendStringPrototype = createCommonjsModule(function (module) {
    module['exports'] = function() {
      //
      // Extends prototype of native string object to allow for "foo".red syntax
      //
      var addProperty = function(color, func) {
        String.prototype.__defineGetter__(color, func);
      };

      addProperty('strip', function() {
        return colors_1.strip(this);
      });

      addProperty('stripColors', function() {
        return colors_1.strip(this);
      });

      addProperty('trap', function() {
        return colors_1.trap(this);
      });

      addProperty('zalgo', function() {
        return colors_1.zalgo(this);
      });

      addProperty('zebra', function() {
        return colors_1.zebra(this);
      });

      addProperty('rainbow', function() {
        return colors_1.rainbow(this);
      });

      addProperty('random', function() {
        return colors_1.random(this);
      });

      addProperty('america', function() {
        return colors_1.america(this);
      });

      //
      // Iterate through all default styles and colors
      //
      var x = Object.keys(colors_1.styles);
      x.forEach(function(style) {
        addProperty(style, function() {
          return colors_1.stylize(this, style);
        });
      });

      function applyTheme(theme) {
        //
        // Remark: This is a list of methods that exist
        // on String that you should not overwrite.
        //
        var stringPrototypeBlacklist = [
          '__defineGetter__', '__defineSetter__', '__lookupGetter__',
          '__lookupSetter__', 'charAt', 'constructor', 'hasOwnProperty',
          'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString',
          'valueOf', 'charCodeAt', 'indexOf', 'lastIndexOf', 'length',
          'localeCompare', 'match', 'repeat', 'replace', 'search', 'slice',
          'split', 'substring', 'toLocaleLowerCase', 'toLocaleUpperCase',
          'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight',
        ];

        Object.keys(theme).forEach(function(prop) {
          if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
            console.log('warn: '.red + ('String.prototype' + prop).magenta +
              ' is probably something you don\'t want to override.  ' +
              'Ignoring style name');
          } else {
            if (typeof(theme[prop]) === 'string') {
              colors_1[prop] = colors_1[theme[prop]];
              addProperty(prop, function() {
                return colors_1[theme[prop]](this);
              });
            } else {
              addProperty(prop, function() {
                var ret = this;
                for (var t = 0; t < theme[prop].length; t++) {
                  ret = colors_1[theme[prop][t]](ret);
                }
                return ret;
              });
            }
          }
        });
      }

      colors_1.setTheme = function(theme) {
        if (typeof theme === 'string') {
          try {
            colors_1.themes[theme] = commonjsRequire(theme);
            applyTheme(colors_1.themes[theme]);
            return colors_1.themes[theme];
          } catch (err) {
            console.log(err);
            return err;
          }
        } else {
          applyTheme(theme);
        }
      };
    };
    });

    var lib = createCommonjsModule(function (module) {
    module['exports'] = colors_1;

    // Remark: By default, colors will add style properties to String.prototype.
    //
    // If you don't wish to extend String.prototype, you can do this instead and
    // native String will not be touched:
    //
    //   var colors = require('colors/safe);
    //   colors.red("foo")
    //
    //
    extendStringPrototype();
    });

    var CommandLineParser_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });



    class CommandLineParserExitError extends Error {
        constructor(exitCode, message) {
            super(message);
            // Manually set the prototype, as we can no longer extend built-in classes like Error, Array, Map, etc
            // tslint:disable-next-line:max-line-length
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            //
            // Note: the prototype must also be set on any classes which extend this one
            this.__proto__ = CommandLineParserExitError.prototype; // tslint:disable-line:no-any
            this.exitCode = exitCode;
        }
    }
    exports.CommandLineParserExitError = CommandLineParserExitError;
    class CustomArgumentParser extends argparse$1.ArgumentParser {
        exit(status, message) {
            throw new CommandLineParserExitError(status, message);
        }
        error(err) {
            // Ensure the ParserExitError bubbles up to the top without any special processing
            if (err instanceof CommandLineParserExitError) {
                throw err;
            }
            super.error(err);
        }
    }
    /**
     * The "argparse" library is a relatively advanced command-line parser with features such
     * as word-wrapping and intelligible error messages (that are lacking in other similar
     * libraries such as commander, yargs, and nomnom).  Unfortunately, its ruby-inspired API
     * is awkward to use.  The abstract base classes CommandLineParser and CommandLineAction
     * provide a wrapper for "argparse" that makes defining and consuming arguments quick
     * and simple, and enforces that appropriate documentation is provided for each parameter.
     *
     * @public
     */
    class CommandLineParser extends CommandLineParameterProvider_1.CommandLineParameterProvider {
        constructor(options) {
            super();
            this._executed = false;
            this._options = options;
            this._actions = [];
            this._actionsByName = new Map();
            this._argumentParser = new CustomArgumentParser({
                addHelp: true,
                prog: this._options.toolFilename,
                description: this._options.toolDescription,
                epilog: lib.bold('For detailed help about a specific command, use:'
                    + ` ${this._options.toolFilename} <command> -h`)
            });
            this._actionsSubParser = this._argumentParser.addSubparsers({
                metavar: '<command>',
                dest: 'action'
            });
            this.onDefineParameters();
        }
        /**
         * Returns the list of actions that were defined for this CommandLineParser object.
         */
        get actions() {
            return this._actions;
        }
        /**
         * Defines a new action that can be used with the CommandLineParser instance.
         */
        addAction(action) {
            action._buildParser(this._actionsSubParser);
            this._actions.push(action);
            this._actionsByName.set(action.actionName, action);
        }
        /**
         * Retrieves the action with the specified name.  If no matching action is found,
         * an exception is thrown.
         */
        getAction(actionName) {
            const action = this.tryGetAction(actionName);
            if (!action) {
                throw new Error(`The action "${actionName}" was not defined`);
            }
            return action;
        }
        /**
         * Retrieves the action with the specified name.  If no matching action is found,
         * undefined is returned.
         */
        tryGetAction(actionName) {
            return this._actionsByName.get(actionName);
        }
        /**
         * The program entry point will call this method to begin parsing command-line arguments
         * and executing the corresponding action.
         *
         * @remarks
         * The returned promise will never reject:  If an error occurs, it will be printed
         * to stderr, process.exitCode will be set to 1, and the promise will resolve to false.
         * This simplifies the most common usage scenario where the program entry point doesn't
         * want to be involved with the command-line logic, and will discard the promise without
         * a then() or catch() block.
         *
         * If your caller wants to trap and handle errors, use {@link CommandLineParser.executeWithoutErrorHandling}
         * instead.
         *
         * @param args - the command-line arguments to be parsed; if omitted, then
         *               the process.argv will be used
         */
        execute(args) {
            return this.executeWithoutErrorHandling(args).then(() => {
                return true;
            }).catch((err) => {
                if (err instanceof CommandLineParserExitError) {
                    // executeWithoutErrorHandling() handles the successful cases,
                    // so here we can assume err has a nonzero exit code
                    if (err.message) {
                        console.error(err.message);
                    }
                    if (!process.exitCode) {
                        process.exitCode = err.exitCode;
                    }
                }
                else {
                    const message = (err.message || 'An unknown error occurred').trim();
                    console.error(lib.red('Error: ' + message));
                    if (!process.exitCode) {
                        process.exitCode = 1;
                    }
                }
                return false;
            });
        }
        /**
         * This is similar to {@link CommandLineParser.execute}, except that execution errors
         * simply cause the promise to reject.  It is the caller's responsibility to trap
         */
        executeWithoutErrorHandling(args) {
            try {
                if (this._executed) {
                    // In the future we could allow the same parser to be invoked multiple times
                    // with different arguments.  We'll do that work as soon as someone encounters
                    // a real world need for it.
                    throw new Error('execute() was already called for this parser instance');
                }
                this._executed = true;
                if (!args) {
                    // 0=node.exe, 1=script name
                    args = process.argv.slice(2);
                }
                if (args.length === 0) {
                    this._argumentParser.printHelp();
                    return Promise.resolve();
                }
                const data = this._argumentParser.parseArgs(args);
                this._processParsedData(data);
                for (const action of this._actions) {
                    if (action.actionName === data.action) {
                        this.selectedAction = action;
                        action._processParsedData(data);
                        break;
                    }
                }
                if (!this.selectedAction) {
                    throw new Error('Unrecognized action');
                }
                return this.onExecute();
            }
            catch (err) {
                if (err instanceof CommandLineParserExitError) {
                    if (!err.exitCode) {
                        // non-error exit modeled using exception handling
                        if (err.message) {
                            console.log(err.message);
                        }
                        return Promise.resolve();
                    }
                }
                return Promise.reject(err);
            }
        }
        /**
         * {@inheritDoc CommandLineParameterProvider._getArgumentParser}
         * @internal
         */
        _getArgumentParser() {
            return this._argumentParser;
        }
        /**
         * This hook allows the subclass to perform additional operations before or after
         * the chosen action is executed.
         */
        onExecute() {
            return this.selectedAction._execute();
        }
    }
    exports.CommandLineParser = CommandLineParser;

    });

    unwrapExports(CommandLineParser_1);
    var CommandLineParser_2 = CommandLineParser_1.CommandLineParserExitError;
    var CommandLineParser_3 = CommandLineParser_1.CommandLineParser;

    var DynamicCommandLineAction_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });

    /**
     * @public
     */
    class DynamicCommandLineAction extends CommandLineAction_1.CommandLineAction {
        onDefineParameters() {
            // (handled by the external code)
        }
        onExecute() {
            // (handled by the external code)
            return Promise.resolve();
        }
    }
    exports.DynamicCommandLineAction = DynamicCommandLineAction;

    });

    unwrapExports(DynamicCommandLineAction_1);
    var DynamicCommandLineAction_2 = DynamicCommandLineAction_1.DynamicCommandLineAction;

    var DynamicCommandLineParser_1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });

    /**
     * @public
     */
    class DynamicCommandLineParser extends CommandLineParser_1.CommandLineParser {
        onDefineParameters() {
        }
    }
    exports.DynamicCommandLineParser = DynamicCommandLineParser;

    });

    unwrapExports(DynamicCommandLineParser_1);
    var DynamicCommandLineParser_2 = DynamicCommandLineParser_1.DynamicCommandLineParser;

    var lib$1 = createCommonjsModule(function (module, exports) {
    // Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
    // See LICENSE in the project root for license information.
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * An object-oriented command-line parser for TypeScript projects.
     *
     * @packageDocumentation
     */

    exports.CommandLineAction = CommandLineAction_1.CommandLineAction;

    exports.CommandLineParameterKind = CommandLineParameter_1.CommandLineParameterKind;
    exports.CommandLineParameter = CommandLineParameter_1.CommandLineParameter;
    exports.CommandLineParameterWithArgument = CommandLineParameter_1.CommandLineParameterWithArgument;
    exports.CommandLineStringParameter = CommandLineParameter_1.CommandLineStringParameter;
    exports.CommandLineStringListParameter = CommandLineParameter_1.CommandLineStringListParameter;
    exports.CommandLineFlagParameter = CommandLineParameter_1.CommandLineFlagParameter;
    exports.CommandLineIntegerParameter = CommandLineParameter_1.CommandLineIntegerParameter;
    exports.CommandLineChoiceParameter = CommandLineParameter_1.CommandLineChoiceParameter;

    exports.CommandLineParameterProvider = CommandLineParameterProvider_1.CommandLineParameterProvider;

    exports.CommandLineParser = CommandLineParser_1.CommandLineParser;

    exports.DynamicCommandLineAction = DynamicCommandLineAction_1.DynamicCommandLineAction;

    exports.DynamicCommandLineParser = DynamicCommandLineParser_1.DynamicCommandLineParser;

    });

    unwrapExports(lib$1);
    var lib_1 = lib$1.CommandLineAction;
    var lib_2 = lib$1.CommandLineParameterKind;
    var lib_3 = lib$1.CommandLineParameter;
    var lib_4 = lib$1.CommandLineParameterWithArgument;
    var lib_5 = lib$1.CommandLineStringParameter;
    var lib_6 = lib$1.CommandLineStringListParameter;
    var lib_7 = lib$1.CommandLineFlagParameter;
    var lib_8 = lib$1.CommandLineIntegerParameter;
    var lib_9 = lib$1.CommandLineChoiceParameter;
    var lib_10 = lib$1.CommandLineParameterProvider;
    var lib_11 = lib$1.CommandLineParser;
    var lib_12 = lib$1.DynamicCommandLineAction;
    var lib_13 = lib$1.DynamicCommandLineParser;

    class PrintAction extends lib_1 {
        constructor() {
            super({
                actionName: "print",
                summary: "Print information about an Oakfile.",
                documentation: "TODO"
            });
        }
        onExecute() {
            oak_print({ filename: this._filename.value });
            return Promise.resolve();
        }
        onDefineParameters() {
            this._filename = this.defineStringParameter({
                argumentName: "FILENAME",
                parameterLongName: "--file",
                parameterShortName: "-f",
                description: "Path to Oakfile."
            });
        }
    }
    class StaticAction extends lib_1 {
        constructor() {
            super({
                actionName: "static",
                summary: "Statically run an Oakfile.",
                documentation: "TODO"
            });
        }
        onExecute() {
            oak_static({
                filename: this._filename.value,
                targets: this._targets.values
            });
            return Promise.resolve();
        }
        onDefineParameters() {
            this._filename = this.defineStringParameter({
                argumentName: "FILENAME",
                parameterLongName: "--file",
                parameterShortName: "-f",
                description: "Path to Oakfile."
            });
            this._targets = this.defineStringListParameter({
                argumentName: "TARGETS",
                parameterLongName: "--targets",
                parameterShortName: "-t",
                description: "List of target names to resolve."
            });
        }
    }
    class OakCommandLine extends lib_11 {
        constructor() {
            super({
                toolFilename: "oak",
                toolDescription: "CLI for oak."
            });
            this.addAction(new PrintAction());
            this.addAction(new StaticAction());
        }
        onDefineParameters() { }
        onExecute() {
            console.log("OakCommandLine executing...");
            return super.onExecute();
        }
    }
    const cli = new OakCommandLine();
    cli.execute();

}(child_process, fs, events, util, path, os));
