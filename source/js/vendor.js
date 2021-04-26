// svgxuse.js
/*!
 * @copyright Copyright (c) 2017 IcoMoon.io
 * @license   Licensed under MIT license
 *            See https://github.com/Keyamoon/svgxuse
 * @version   1.2.6
 */
/*jslint browser: true */
/*global XDomainRequest, MutationObserver, window */
(function () {
  "use strict";
  if (typeof window !== "undefined" && window.addEventListener) {
    var cache = Object.create(null); // holds xhr objects to prevent multiple requests
    var checkUseElems;
    var tid; // timeout id
    var debouncedCheck = function () {
      clearTimeout(tid);
      tid = setTimeout(checkUseElems, 100);
    };
    var unobserveChanges = function () {
      return;
    };
    var observeChanges = function () {
      var observer;
      window.addEventListener("resize", debouncedCheck, false);
      window.addEventListener("orientationchange", debouncedCheck, false);
      if (window.MutationObserver) {
        observer = new MutationObserver(debouncedCheck);
        observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: true
        });
        unobserveChanges = function () {
          try {
            observer.disconnect();
            window.removeEventListener("resize", debouncedCheck, false);
            window.removeEventListener("orientationchange", debouncedCheck, false);
          } catch (ignore) {}
        };
      } else {
        document.documentElement.addEventListener("DOMSubtreeModified", debouncedCheck, false);
        unobserveChanges = function () {
          document.documentElement.removeEventListener("DOMSubtreeModified", debouncedCheck, false);
          window.removeEventListener("resize", debouncedCheck, false);
          window.removeEventListener("orientationchange", debouncedCheck, false);
        };
      }
    };
    var createRequest = function (url) {
      // In IE 9, cross origin requests can only be sent using XDomainRequest.
      // XDomainRequest would fail if CORS headers are not set.
      // Therefore, XDomainRequest should only be used with cross origin requests.
      function getOrigin(loc) {
        var a;
        if (loc.protocol !== undefined) {
          a = loc;
        } else {
          a = document.createElement("a");
          a.href = loc;
        }
        return a.protocol.replace(/:/g, "") + a.host;
      }
      var Request;
      var origin;
      var origin2;
      if (window.XMLHttpRequest) {
        Request = new XMLHttpRequest();
        origin = getOrigin(location);
        origin2 = getOrigin(url);
        if (Request.withCredentials === undefined && origin2 !== "" && origin2 !== origin) {
          Request = XDomainRequest || undefined;
        } else {
          Request = XMLHttpRequest;
        }
      }
      return Request;
    };
    var xlinkNS = "http://www.w3.org/1999/xlink";
    checkUseElems = function () {
      var base;
      var bcr;
      var fallback = ""; // optional fallback URL in case no base path to SVG file was given and no symbol definition was found.
      var hash;
      var href;
      var i;
      var inProgressCount = 0;
      var isHidden;
      var Request;
      var url;
      var uses;
      var xhr;

      function observeIfDone() {
        // If done with making changes, start watching for chagnes in DOM again
        inProgressCount -= 1;
        if (inProgressCount === 0) { // if all xhrs were resolved
          unobserveChanges(); // make sure to remove old handlers
          observeChanges(); // watch for changes to DOM
        }
      }

      function attrUpdateFunc(spec) {
        return function () {
          if (cache[spec.base] !== true) {
            spec.useEl.setAttributeNS(xlinkNS, "xlink:href", "#" + spec.hash);
            if (spec.useEl.hasAttribute("href")) {
              spec.useEl.setAttribute("href", "#" + spec.hash);
            }
          }
        };
      }

      function onloadFunc(xhr) {
        return function () {
          var body = document.body;
          var x = document.createElement("x");
          var svg;
          xhr.onload = null;
          x.innerHTML = xhr.responseText;
          svg = x.getElementsByTagName("svg")[0];
          if (svg) {
            svg.setAttribute("aria-hidden", "true");
            svg.style.position = "absolute";
            svg.style.width = 0;
            svg.style.height = 0;
            svg.style.overflow = "hidden";
            body.insertBefore(svg, body.firstChild);
          }
          observeIfDone();
        };
      }

      function onErrorTimeout(xhr) {
        return function () {
          xhr.onerror = null;
          xhr.ontimeout = null;
          observeIfDone();
        };
      }
      unobserveChanges(); // stop watching for changes to DOM
      // find all use elements
      uses = document.getElementsByTagName("use");
      for (i = 0; i < uses.length; i += 1) {
        try {
          bcr = uses[i].getBoundingClientRect();
        } catch (ignore) {
          // failed to get bounding rectangle of the use element
          bcr = false;
        }
        href = uses[i].getAttribute("href") ||
          uses[i].getAttributeNS(xlinkNS, "href") ||
          uses[i].getAttribute("xlink:href");
        if (href && href.split) {
          url = href.split("#");
        } else {
          url = ["", ""];
        }
        base = url[0];
        hash = url[1];
        isHidden = bcr && bcr.left === 0 && bcr.right === 0 && bcr.top === 0 && bcr.bottom === 0;
        if (bcr && bcr.width === 0 && bcr.height === 0 && !isHidden) {
          // the use element is empty
          // if there is a reference to an external SVG, try to fetch it
          // use the optional fallback URL if there is no reference to an external SVG
          if (fallback && !base.length && hash && !document.getElementById(hash)) {
            base = fallback;
          }
          if (uses[i].hasAttribute("href")) {
            uses[i].setAttributeNS(xlinkNS, "xlink:href", href);
          }
          if (base.length) {
            // schedule updating xlink:href
            xhr = cache[base];
            if (xhr !== true) {
              // true signifies that prepending the SVG was not required
              setTimeout(attrUpdateFunc({
                useEl: uses[i],
                base: base,
                hash: hash
              }), 0);
            }
            if (xhr === undefined) {
              Request = createRequest(base);
              if (Request !== undefined) {
                xhr = new Request();
                cache[base] = xhr;
                xhr.onload = onloadFunc(xhr);
                xhr.onerror = onErrorTimeout(xhr);
                xhr.ontimeout = onErrorTimeout(xhr);
                xhr.open("GET", base);
                xhr.send();
                inProgressCount += 1;
              }
            }
          }
        } else {
          if (!isHidden) {
            if (cache[base] === undefined) {
              // remember this URL if the use element was not empty and no request was sent
              cache[base] = true;
            } else if (cache[base].onload) {
              // if it turns out that prepending the SVG is not necessary,
              // abort the in-progress xhr.
              cache[base].abort();
              delete cache[base].onload;
              cache[base] = true;
            }
          } else if (base.length && cache[base]) {
            setTimeout(attrUpdateFunc({
              useEl: uses[i],
              base: base,
              hash: hash
            }), 0);
          }
        }
      }
      uses = "";
      inProgressCount += 1;
      observeIfDone();
    };
    var winLoad;
    winLoad = function () {
      window.removeEventListener("load", winLoad, false); // to prevent memory leaks
      tid = setTimeout(checkUseElems, 0);
    };
    if (document.readyState !== "complete") {
      // The load event fires when all resources have finished loading, which allows detecting whether SVG use elements are empty.
      window.addEventListener("load", winLoad, false);
    } else {
      // No need to add a listener if the document is already loaded, initialize immediately.
      winLoad();
    }
  }
})();

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//lazysizes.js
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
(function () {
  /*! lazysizes - v5.2.2 */
  ! function (e) {
    var t = function (u, D, f) {
      "use strict";
      var k, H;
      if (function () {
          var e;
          var t = {
            lazyClass: "lazyload",
            loadedClass: "lazyloaded",
            loadingClass: "lazyloading",
            preloadClass: "lazypreload",
            errorClass: "lazyerror",
            autosizesClass: "lazyautosizes",
            srcAttr: "data-src",
            srcsetAttr: "data-srcset",
            sizesAttr: "data-sizes",
            minSize: 40,
            customMedia: {},
            init: true,
            expFactor: 1.5,
            hFac: .8,
            loadMode: 2,
            loadHidden: true,
            ricTimeout: 0,
            throttleDelay: 125
          };
          H = u.lazySizesConfig || u.lazysizesConfig || {};
          for (e in t) {
            if (!(e in H)) {
              H[e] = t[e]
            }
          }
        }(), !D || !D.getElementsByClassName) {
        return {
          init: function () {},
          cfg: H,
          noSupport: true
        }
      }
      var O = D.documentElement,
        a = u.HTMLPictureElement,
        P = "addEventListener",
        $ = "getAttribute",
        q = u[P].bind(u),
        I = u.setTimeout,
        U = u.requestAnimationFrame || I,
        l = u.requestIdleCallback,
        j = /^picture$/i,
        r = ["load", "error", "lazyincluded", "_lazyloaded"],
        i = {},
        G = Array.prototype.forEach,
        J = function (e, t) {
          if (!i[t]) {
            i[t] = new RegExp("(\\s|^)" + t + "(\\s|$)")
          }
          return i[t].test(e[$]("class") || "") && i[t]
        },
        K = function (e, t) {
          if (!J(e, t)) {
            e.setAttribute("class", (e[$]("class") || "").trim() + " " + t)
          }
        },
        Q = function (e, t) {
          var i;
          if (i = J(e, t)) {
            e.setAttribute("class", (e[$]("class") || "").replace(i, " "))
          }
        },
        V = function (t, i, e) {
          var a = e ? P : "removeEventListener";
          if (e) {
            V(t, i)
          }
          r.forEach(function (e) {
            t[a](e, i)
          })
        },
        X = function (e, t, i, a, r) {
          var n = D.createEvent("Event");
          if (!i) {
            i = {}
          }
          i.instance = k;
          n.initEvent(t, !a, !r);
          n.detail = i;
          e.dispatchEvent(n);
          return n
        },
        Y = function (e, t) {
          var i;
          if (!a && (i = u.picturefill || H.pf)) {
            if (t && t.src && !e[$]("srcset")) {
              e.setAttribute("srcset", t.src)
            }
            i({
              reevaluate: true,
              elements: [e]
            })
          } else if (t && t.src) {
            e.src = t.src
          }
        },
        Z = function (e, t) {
          return (getComputedStyle(e, null) || {})[t]
        },
        s = function (e, t, i) {
          i = i || e.offsetWidth;
          while (i < H.minSize && t && !e._lazysizesWidth) {
            i = t.offsetWidth;
            t = t.parentNode
          }
          return i
        },
        ee = function () {
          var i, a;
          var t = [];
          var r = [];
          var n = t;
          var s = function () {
            var e = n;
            n = t.length ? r : t;
            i = true;
            a = false;
            while (e.length) {
              e.shift()()
            }
            i = false
          };
          var e = function (e, t) {
            if (i && !t) {
              e.apply(this, arguments)
            } else {
              n.push(e);
              if (!a) {
                a = true;
                (D.hidden ? I : U)(s)
              }
            }
          };
          e._lsFlush = s;
          return e
        }(),
        te = function (i, e) {
          return e ? function () {
            ee(i)
          } : function () {
            var e = this;
            var t = arguments;
            ee(function () {
              i.apply(e, t)
            })
          }
        },
        ie = function (e) {
          var i;
          var a = 0;
          var r = H.throttleDelay;
          var n = H.ricTimeout;
          var t = function () {
            i = false;
            a = f.now();
            e()
          };
          var s = l && n > 49 ? function () {
            l(t, {
              timeout: n
            });
            if (n !== H.ricTimeout) {
              n = H.ricTimeout
            }
          } : te(function () {
            I(t)
          }, true);
          return function (e) {
            var t;
            if (e = e === true) {
              n = 33
            }
            if (i) {
              return
            }
            i = true;
            t = r - (f.now() - a);
            if (t < 0) {
              t = 0
            }
            if (e || t < 9) {
              s()
            } else {
              I(s, t)
            }
          }
        },
        ae = function (e) {
          var t, i;
          var a = 99;
          var r = function () {
            t = null;
            e()
          };
          var n = function () {
            var e = f.now() - i;
            if (e < a) {
              I(n, a - e)
            } else {
              (l || r)(r)
            }
          };
          return function () {
            i = f.now();
            if (!t) {
              t = I(n, a)
            }
          }
        },
        e = function () {
          var v, m, c, h, e;
          var y, z, g, p, C, b, A;
          var n = /^img$/i;
          var d = /^iframe$/i;
          var E = "onscroll" in u && !/(gle|ing)bot/.test(navigator.userAgent);
          var _ = 0;
          var w = 0;
          var N = 0;
          var M = -1;
          var x = function (e) {
            N--;
            if (!e || N < 0 || !e.target) {
              N = 0
            }
          };
          var W = function (e) {
            if (A == null) {
              A = Z(D.body, "visibility") == "hidden"
            }
            return A || !(Z(e.parentNode, "visibility") == "hidden" && Z(e, "visibility") == "hidden")
          };
          var S = function (e, t) {
            var i;
            var a = e;
            var r = W(e);
            g -= t;
            b += t;
            p -= t;
            C += t;
            while (r && (a = a.offsetParent) && a != D.body && a != O) {
              r = (Z(a, "opacity") || 1) > 0;
              if (r && Z(a, "overflow") != "visible") {
                i = a.getBoundingClientRect();
                r = C > i.left && p < i.right && b > i.top - 1 && g < i.bottom + 1
              }
            }
            return r
          };
          var t = function () {
            var e, t, i, a, r, n, s, l, o, u, f, c;
            var d = k.elements;
            if ((h = H.loadMode) && N < 8 && (e = d.length)) {
              t = 0;
              M++;
              for (; t < e; t++) {
                if (!d[t] || d[t]._lazyRace) {
                  continue
                }
                if (!E || k.prematureUnveil && k.prematureUnveil(d[t])) {
                  R(d[t]);
                  continue
                }
                if (!(l = d[t][$]("data-expand")) || !(n = l * 1)) {
                  n = w
                }
                if (!u) {
                  u = !H.expand || H.expand < 1 ? O.clientHeight > 500 && O.clientWidth > 500 ? 500 : 370 : H.expand;
                  k._defEx = u;
                  f = u * H.expFactor;
                  c = H.hFac;
                  A = null;
                  if (w < f && N < 1 && M > 2 && h > 2 && !D.hidden) {
                    w = f;
                    M = 0
                  } else if (h > 1 && M > 1 && N < 6) {
                    w = u
                  } else {
                    w = _
                  }
                }
                if (o !== n) {
                  y = innerWidth + n * c;
                  z = innerHeight + n;
                  s = n * -1;
                  o = n
                }
                i = d[t].getBoundingClientRect();
                if ((b = i.bottom) >= s && (g = i.top) <= z && (C = i.right) >= s * c && (p = i.left) <= y && (b || C || p || g) && (H.loadHidden || W(d[t])) && (m && N < 3 && !l && (h < 3 || M < 4) || S(d[t], n))) {
                  R(d[t]);
                  r = true;
                  if (N > 9) {
                    break
                  }
                } else if (!r && m && !a && N < 4 && M < 4 && h > 2 && (v[0] || H.preloadAfterLoad) && (v[0] || !l && (b || C || p || g || d[t][$](H.sizesAttr) != "auto"))) {
                  a = v[0] || d[t]
                }
              }
              if (a && !r) {
                R(a)
              }
            }
          };
          var i = ie(t);
          var B = function (e) {
            var t = e.target;
            if (t._lazyCache) {
              delete t._lazyCache;
              return
            }
            x(e);
            K(t, H.loadedClass);
            Q(t, H.loadingClass);
            V(t, L);
            X(t, "lazyloaded")
          };
          var a = te(B);
          var L = function (e) {
            a({
              target: e.target
            })
          };
          var T = function (t, i) {
            try {
              t.contentWindow.location.replace(i)
            } catch (e) {
              t.src = i
            }
          };
          var F = function (e) {
            var t;
            var i = e[$](H.srcsetAttr);
            if (t = H.customMedia[e[$]("data-media") || e[$]("media")]) {
              e.setAttribute("media", t)
            }
            if (i) {
              e.setAttribute("srcset", i)
            }
          };
          var s = te(function (t, e, i, a, r) {
            var n, s, l, o, u, f;
            if (!(u = X(t, "lazybeforeunveil", e)).defaultPrevented) {
              if (a) {
                if (i) {
                  K(t, H.autosizesClass)
                } else {
                  t.setAttribute("sizes", a)
                }
              }
              s = t[$](H.srcsetAttr);
              n = t[$](H.srcAttr);
              if (r) {
                l = t.parentNode;
                o = l && j.test(l.nodeName || "")
              }
              f = e.firesLoad || "src" in t && (s || n || o);
              u = {
                target: t
              };
              K(t, H.loadingClass);
              if (f) {
                clearTimeout(c);
                c = I(x, 2500);
                V(t, L, true)
              }
              if (o) {
                G.call(l.getElementsByTagName("source"), F)
              }
              if (s) {
                t.setAttribute("srcset", s)
              } else if (n && !o) {
                if (d.test(t.nodeName)) {
                  T(t, n)
                } else {
                  t.src = n
                }
              }
              if (r && (s || o)) {
                Y(t, {
                  src: n
                })
              }
            }
            if (t._lazyRace) {
              delete t._lazyRace
            }
            Q(t, H.lazyClass);
            ee(function () {
              var e = t.complete && t.naturalWidth > 1;
              if (!f || e) {
                if (e) {
                  K(t, "ls-is-cached")
                }
                B(u);
                t._lazyCache = true;
                I(function () {
                  if ("_lazyCache" in t) {
                    delete t._lazyCache
                  }
                }, 9)
              }
              if (t.loading == "lazy") {
                N--
              }
            }, true)
          });
          var R = function (e) {
            if (e._lazyRace) {
              return
            }
            var t;
            var i = n.test(e.nodeName);
            var a = i && (e[$](H.sizesAttr) || e[$]("sizes"));
            var r = a == "auto";
            if ((r || !m) && i && (e[$]("src") || e.srcset) && !e.complete && !J(e, H.errorClass) && J(e, H.lazyClass)) {
              return
            }
            t = X(e, "lazyunveilread").detail;
            if (r) {
              re.updateElem(e, true, e.offsetWidth)
            }
            e._lazyRace = true;
            N++;
            s(e, t, r, a, i)
          };
          var r = ae(function () {
            H.loadMode = 3;
            i()
          });
          var l = function () {
            if (H.loadMode == 3) {
              H.loadMode = 2
            }
            r()
          };
          var o = function () {
            if (m) {
              return
            }
            if (f.now() - e < 999) {
              I(o, 999);
              return
            }
            m = true;
            H.loadMode = 3;
            i();
            q("scroll", l, true)
          };
          return {
            _: function () {
              e = f.now();
              k.elements = D.getElementsByClassName(H.lazyClass);
              v = D.getElementsByClassName(H.lazyClass + " " + H.preloadClass);
              q("scroll", i, true);
              q("resize", i, true);
              q("pageshow", function (e) {
                if (e.persisted) {
                  var t = D.querySelectorAll("." + H.loadingClass);
                  if (t.length && t.forEach) {
                    U(function () {
                      t.forEach(function (e) {
                        if (e.complete) {
                          R(e)
                        }
                      })
                    })
                  }
                }
              });
              if (u.MutationObserver) {
                new MutationObserver(i).observe(O, {
                  childList: true,
                  subtree: true,
                  attributes: true
                })
              } else {
                O[P]("DOMNodeInserted", i, true);
                O[P]("DOMAttrModified", i, true);
                setInterval(i, 999)
              }
              q("hashchange", i, true);
              ["focus", "mouseover", "click", "load", "transitionend", "animationend"].forEach(function (e) {
                D[P](e, i, true)
              });
              if (/d$|^c/.test(D.readyState)) {
                o()
              } else {
                q("load", o);
                D[P]("DOMContentLoaded", i);
                I(o, 2e4)
              }
              if (k.elements.length) {
                t();
                ee._lsFlush()
              } else {
                i()
              }
            },
            checkElems: i,
            unveil: R,
            _aLSL: l
          }
        }(),
        re = function () {
          var i;
          var n = te(function (e, t, i, a) {
            var r, n, s;
            e._lazysizesWidth = a;
            a += "px";
            e.setAttribute("sizes", a);
            if (j.test(t.nodeName || "")) {
              r = t.getElementsByTagName("source");
              for (n = 0, s = r.length; n < s; n++) {
                r[n].setAttribute("sizes", a)
              }
            }
            if (!i.detail.dataAttr) {
              Y(e, i.detail)
            }
          });
          var a = function (e, t, i) {
            var a;
            var r = e.parentNode;
            if (r) {
              i = s(e, r, i);
              a = X(e, "lazybeforesizes", {
                width: i,
                dataAttr: !!t
              });
              if (!a.defaultPrevented) {
                i = a.detail.width;
                if (i && i !== e._lazysizesWidth) {
                  n(e, r, a, i)
                }
              }
            }
          };
          var e = function () {
            var e;
            var t = i.length;
            if (t) {
              e = 0;
              for (; e < t; e++) {
                a(i[e])
              }
            }
          };
          var t = ae(e);
          return {
            _: function () {
              i = D.getElementsByClassName(H.autosizesClass);
              q("resize", t)
            },
            checkElems: t,
            updateElem: a
          }
        }(),
        t = function () {
          if (!t.i && D.getElementsByClassName) {
            t.i = true;
            re._();
            e._()
          }
        };
      return I(function () {
        H.init && t()
      }), k = {
        cfg: H,
        autoSizer: re,
        loader: e,
        init: t,
        uP: Y,
        aC: K,
        rC: Q,
        hC: J,
        fire: X,
        gW: s,
        rAF: ee
      }
    }(e, e.document, Date);
    e.lazySizes = t, "object" == typeof module && module.exports && (module.exports = t)
  }("undefined" != typeof window ? window : {});

})();
