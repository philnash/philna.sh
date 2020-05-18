(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.WebShareWrapper = factory());
}(this, (function () { 'use strict';

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  function _CustomElement() {
    return Reflect.construct(HTMLElement, [], this.__proto__.constructor);
  }
  Object.setPrototypeOf(_CustomElement.prototype, HTMLElement.prototype);
  Object.setPrototypeOf(_CustomElement, HTMLElement);

  var WebShareWrapper = function (_CustomElement2) {
    inherits(WebShareWrapper, _CustomElement2);

    function WebShareWrapper() {
      classCallCheck(this, WebShareWrapper);

      var _this = possibleConstructorReturn(this, (WebShareWrapper.__proto__ || Object.getPrototypeOf(WebShareWrapper)).call(this));

      _this.webShare = 'share' in navigator;
      if (_this.webShare) {
        var templateId = _this.getTemplateId();
        if (templateId !== null) {
          var template = document.getElementById(templateId);
          if (!template) {
            return possibleConstructorReturn(_this);
          }
          _this.removeChildren();
          var clone = document.importNode(template.content, true);
          _this.appendChild(clone);
        } else {
          _this.text = document.createTextNode(_this.getAttribute('text') || 'Share');
          _this.button = document.createElement('button');
          _this.button.appendChild(_this.text);
          _this.removeChildren();
          _this.appendChild(_this.button);
        }
        _this.share = _this.share.bind(_this);
      }
      return _this;
    }

    createClass(WebShareWrapper, [{
      key: 'share',
      value: function share(event) {
        var _this2 = this;

        event.preventDefault();
        var shareOptions = {
          title: this.getTitle(),
          text: this.getText(),
          url: this.getUrl()
        };
        navigator.share(shareOptions).then(function () {
          return _this2.successfulShare(shareOptions);
        }).catch(function (error) {
          return _this2.abortedShare(error, shareOptions);
        });
      }
    }, {
      key: 'connectedCallback',
      value: function connectedCallback() {
        if (this.webShare) {
          this.addEventListener('click', this.share);
        }
      }
    }, {
      key: 'disconnectedCallback',
      value: function disconnectedCallback() {
        if (this.webShare) {
          this.removeEventListener('click', this.share);
        }
      }
    }, {
      key: 'successfulShare',
      value: function successfulShare(options) {
        var event = new CustomEvent('share-success', options);
        this.dispatchEvent(event, {
          detail: options
        });
      }
    }, {
      key: 'abortedShare',
      value: function abortedShare(error, options) {
        options['error'] = error;
        var event = new CustomEvent('share-failure', {
          detail: options
        });
        this.dispatchEvent(event);
      }
    }, {
      key: 'getTitle',
      value: function getTitle() {
        return this.getAttribute('sharetitle');
      }
    }, {
      key: 'getText',
      value: function getText() {
        return this.getAttribute('sharetext') || document.querySelector('title').textContent;
      }
    }, {
      key: 'getUrl',
      value: function getUrl() {
        if (this.getAttribute('shareurl')) {
          return this.getAttribute('shareurl');
        }
        var canonicalElement = document.querySelector('link[rel=canonical]');
        if (canonicalElement !== null) {
          return canonicalElement.getAttribute('href');
        }
        return window.location.href;
      }
    }, {
      key: 'getTemplateId',
      value: function getTemplateId() {
        return this.getAttribute('template');
      }
    }, {
      key: 'removeChildren',
      value: function removeChildren() {
        while (this.firstChild) {
          this.removeChild(this.firstChild);
        }
      }
    }]);
    return WebShareWrapper;
  }(_CustomElement);

  if ('customElements' in window) {
    customElements.define('web-share-wrapper', WebShareWrapper);
  }

  return WebShareWrapper;

})));
