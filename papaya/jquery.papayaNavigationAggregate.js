/**
* papaya Navigation Aggregate, creates a navigation by collection references from the
* current document.
*
* Triggered an configured using the data-navigation-aggregate attribute. The value
* of this attribute can be the selector for the link elements, and list of selectors or
* an json object with options.
*/
(function($) {

  var navigation = {

    options : {
      /*
       * link select, make sure to match a elements with href,
       * elements without href will be ignored.
       */
      selectors : ['body ul li a[href]'],
      /*
       * group selector, used to define which ancestor element is used to group the
       * navigation items.
       */
      group : 'ul',
      /*
       * text content selector, used to limit the elements used to compile a caption for
       * the navigation items.
       */
      caption : 'span:not(.accessibilitySeparator),small,i,b',
      /*
       * html template for the created navigation control, needs to contain a <select>.
       */
      template : '<div><select class="navigation-aggregate"/></div>',
      /*
       * Ignore href starting with #
       */
      ignoreLocal : 'yes'
    },

    element : null,
    control : null,

    groups : [],

    setUp : function (element, options) {
      this.element = element;
      this.options = $.extend(this.options, options);
      var that = this;
      for (var i in this.options.selectors) {
        var items = $(this.options.selectors[i]);
        if (items.length > 0) {
          items.each($.proxy(this.appendItem, this));
        }
        if (this.control) {
          this.control.appendTo(this.element);
          this.control.on(
            'change',
            function() {
              location.href = $(this).val();
            }
          );
        }
      }
    },

    /**
     * Add an navigaiton item for a link element
     *
     * @param index
     * @param element
     */
    appendItem : function(index, element) {
      var item = $(element);
      var caption = this.getTextFrom(item.find(this.options.caption));
      var href = item.attr('href');
      var ignoreLocal = this.options.ignoreLocal == 'yes' || this.options.ignoreLocal == true;
      if (href && !(ignoreLocal && href.match(/^!?#/))) {
        if (caption == undefined || caption == '') {
          caption = item.find('img').attr('alt');
        }
        if (caption == undefined || caption == '') {
          caption = item.text();
        }
        if (caption != undefined && caption != '') {
          var control = $(
            '<option/>',
            {
              'class' : item.prop('class'),
              'selected' : item.hasClass( 'active' ),
              'value' : item.attr('href'),
              'text' : caption
            }
          );
          control.appendTo(this.getGroup(item));
        }
      }
    },

    /**
     * Get the option group for an link element, the function looks for the fartest ancestor that
     * matches the selector in this.options.group
     *
     * If here is already an ancestor for that group, its opgroup element is returned otherwise
     * a new optgroup is created.
     *
     * @param item
     * @returns {jQuery}
     */
    getGroup : function(item) {
      var element = item.parents(this.options.group).last().get(0);
      var group = null;
      for (var i = this.groups.length - 1; i >= 0; i--) {
        if (this.groups[i].element == element) {
          group = this.groups[i];
          break;
        }
      }
      if (null == group) {
        this.groups.push(
          group = {
            element : element,
            control : this.createGroup(element)
          }
        );
      }
      return group.control;
    },

    /**
     * Creates a new optgroup for the given element
     *
     * @param element
     * @returns {jQuery}
     */
    createGroup : function(element) {
      var control = $('<optgroup/>');
      if ($(element).has('[title]')) {
        control.attr('label', $(element).attr('title'));
      }
      control.appendTo(this.getControl());
      return control;
    },

    /**
     * Get the select control for the navigation, create it if this is the first time.
     *
     * @returns {jQuery}
     */
    getControl : function() {
      if (null == this.control) {
        this.control = this.createControl();
      }
      return this.control;
    },

    /**
     * Create the main control for the navigation using this.options.template and return
     * the created select element.
     *
     * @returns {jQuery}
     */
    createControl : function () {
      var control = $(this.options.template);
      if (!control.is('select')) {
        control = control.find('select');
      }
      return control;
    },

    /**
     * Fetch the text from matches elements, joinded by the given separator.
     *
     * @param elements
     * @param separator
     * @returns {String}
     */
    getTextFrom : function (elements, separator) {
      if (typeof separator == 'undefined') {
        separator = ' / ';
      }
      var text = '';
      var textNodes = elements
        .contents()
        .filter(
          function() {
            return this.nodeType === 3 && $(this).text() != '';
          }
        );
      if (textNodes.length > 0) {
        text = $.map(
          textNodes,
          function (value, key) {
            return  $(value).text();
          }
        ).join(separator);
      }
      return text;
    }
  };

  $.fn.papayaNavigationAggregate = function(options) {
    var setUp =  function() {
      var attribute = $(this).data('navigationAggregate');
      var data = {};
      if ($.isArray(attribute)) {
        data.selectors = attribute;
      } else if (typeof attribute == 'object') {
        data = attribute;
      } else if (attribute != '') {
        data.selectors = [attribute];
      }
      var instance = $.extend(true, {}, navigation);
      instance.setUp($(this), $.extend({}, options, data));
    };
    return this.each(setUp);
  };
})(jQuery);

jQuery(document).ready(
  function() {
    jQuery('[data-navigation-aggregate]').papayaNavigationAggregate();
  }
);