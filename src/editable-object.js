/**
 * A vanillajs editable-object web component.
 * 
 * Copyright (c) 2025 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */

class EditableObject extends HTMLElement {
  #object = null;
  
  // Element references and listeners for cleanup
  // [{ host, type, listener }, ...]
  #listeners = [];
  #objectListeners = [];
  #editListeners = [];
  
  // Observed attributes
  static #observedAttributes = ['object', 'add-property-placeholder'];
  static #observedAttributeDefaults = {
    object: {},
    addPropertyPlaceholder: 'Add new property in key:value format'
  };
  static get observedAttributes () {
    return this.#observedAttributes;
  }

  constructor () {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
  }

/**
   * Get the value for an observed attribute by name.
   * 
   * @param {String} attributeName - The attribute name for the property to get
   * @returns {String|Boolean} the value of the property
   */
  #observedAttributeValue (attributeName) {
    if (this.hasAttribute(attributeName)) {
      return this.getAttribute(attributeName);
    }
    return EditableObject.#observedAttributeDefaults[attributeName];
  }

  /**
   * Convert to string presentable representation.
   * 
   * @param {Object} obj - The value
   * @returns {String} A string presentable value
   */
  #_stringable (obj) {
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean' || obj === null) {
      return obj;
    }

    if (typeof obj === 'undefined' || typeof obj === 'function' || typeof obj === 'symbol') {
      return null;
    }

    if (typeof obj === 'bigint') {
      return `${obj}n`;
    }

    if (Object.prototype.toString.call(obj) === '[object RegExp]') {
      obj = {
        __pattern: obj.source,
        flags: obj.flags
      };
    }

    let result = JSON.stringify(obj);
    if (result[0] === '{') {
      result = result.replaceAll('"', '\'');
    }
    return result;
  }

  /**
   * Convert a stringable value back into js.
   * 
   * @param {String} val - The stringable value from the UI
   * @returns {Any} The js value of the string, or some garbage if its really screwed up
   */
  #_jsable (val) {
    const value = val.trim();
    
    let num = parseInt(value, 10);
    if (num) return num;
    num = parseFloat(value);
    if (num) return num;

    if (/\d+n$/.test(value)) {
      return BigInt(value.slice(0, -1));
    }

    if (value.toLowerCase() === 'false') return false;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'null') return null;

    let result;
    try {
      let input = value;
      if (input[0] === '{') {
        input = input.replaceAll('\'', '"');
      }
      const objOrArray = JSON.parse(input);
      if (Object.keys(objOrArray).includes('__pattern')) {
        result = new RegExp(objOrArray.__pattern, objOrArray.flags);
      } else {
        result = objOrArray;
      }
    } catch {
      result = value; // plain old string or real unparsable trash
    }

    return result;
  }

  /**
   * Generates the inner HTML of the li of each property
   *
   * @param {String} key - The property key
   * @param {String} value - The property value
   * @returns {String} The property's HTML code
   */
  #_propertyHTML (key, value) {
    return `
      <div class="property-wrapper">
        <label for="eo-${key}-value">${key}</label>
        <input readonly="true" id="eo-${key}-value" type="text" value="${value}" />
      </div>
      <div class="toolbar">
        <button class="editable-object-up-property icon" title="Move up">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
            <path d="m5 9 1.41 1.41L11 5.83V22h2V5.83l4.59 4.59L19 9l-7-7-7 7z"></path>
          </svg>
        </button>
        <button class="editable-object-down-property icon" title="Move down">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
            <path d="m19 15-1.41-1.41L13 18.17V2h-2v16.17l-4.59-4.59L5 15l7 7 7-7z"></path>
          </svg>
        </button>
        <button class="editable-object-remove-property icon" title="Remove">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Update the toolbar buttons of all editable object properties.
   */
  #_updateToolbars () {
    const ups = this.shadowRoot.querySelectorAll('.editable-object-up-property');
    const downs = this.shadowRoot.querySelectorAll('.editable-object-down-property');
    const len = ups.length;
    for (let i = 0; i < len; i++) {
      ups[i].style.visibility = (i == 0 ? 'hidden' : 'visible');
      downs[i].style.visibility = (i == len - 1 ? 'hidden' : 'visible');
    }
  }

  /**
   * Test for touchscreen.
   * 
   * @returns {Boolean} true if touch, false otherwise
   */
  #_isTouch () {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Get the containing li element from an element inside it.
   *
   * @param {HTMLElement} - Element an element inside the item li
   * @returns {HTMLElement} The item li
   */
  #_getLi (element) {
    while (element.tagName !== 'LI') element = element.parentNode;
    return element;
  }

  /**
   * Fires when an editable object property is selected.
   *
   * @param {Event} e - The caller event object
   */
  #_liSelected (e) {
    this.#_cleanSelection();
    const li = this.#_getLi(e.target);
    li.classList.toggle('selected', true);
    // set tabindex on child buttons
    [...li.querySelectorAll('button')].forEach(button => {
      button.tabIndex = 0;
    })
  }

  /**
   * Creates a change event for external scripts monitoring the component.
   *
   * @param {Object} data - Component change data
   * @returns {CustomEvent} - The CustomEvent for the change
   */
  #_changeEvent (data) {
    return new CustomEvent('change', {
      bubbles: true,
      cancelable: false,
      composed: true,
      detail: data
    });
  }

  /**
   * Handle enter, spacebar keypress in li elements as alternate selection.
   * 
   * @param {Event} e - The event object
   */
  #_propertyInputKeySelect (e) {
    if (e.target.nodeName === 'INPUT') {
      if (e.key === 'Enter' || e.key === ' ') {
        e.target.click();
      }
    }
  }

  /**
   * Start editing a property.
   *
   * @param {Event} e - The event object
   */
  #_propertyEditStart (e) {
    if (this._editing) return;
    this._editing = true;

    const li = this.#_getLi(e.target);
    const inp = li.querySelector('.property-wrapper > input');

    inp.readOnly = false;
    inp._value = inp.value;

    const blurHandler = this.#_propertyEditFinish.bind(this);
    const keypressHandler = this.#_propertyEditFinish.bind(this);

    inp.addEventListener('blur', blurHandler, false);
    this.#editListeners.push({
      host: inp,
      type: 'blur',
      listener: blurHandler
    });
    inp.addEventListener('keypress', keypressHandler, false);
    this.#editListeners.push({
      host: inp,
      type: 'keypress',
      listener: keypressHandler
    });

    inp.focus();
  }

  /**
   * Property editing finished.
   *
   * @param {Event} e - The event object
   */
  #_propertyEditFinish (e) {
    if (!this._editing) return;
    if ((e instanceof KeyboardEvent && e.key === 'Enter') || !(e instanceof KeyboardEvent)) {
      e.preventDefault();
      
      const li = this.#_getLi(e.target);
      const key = li.querySelector('.property-wrapper > label').innerText;
      const inp = li.querySelector('.property-wrapper > input');

      const previousValue = inp._value;
      const newValue = inp.value;

      this._editing = false;
      inp.readOnly = true;
      this.#object[key] = this.#_jsable(newValue);

      this.#editListeners.forEach(editListener => {
        editListener.host.removeEventListener(editListener.type, editListener.listener);
      });
      this.#editListeners.length = 0;

      this.dispatchEvent(this.#_changeEvent({
        action: 'edit',
        key,
        previous: this.#_jsable(previousValue),
        new: this.#_jsable(newValue)
      }));
    }
  }

  /**
   * Move a ListItem up.
   *
   * @param {HTMLElement} li - The item li to move
   * @returns {bool} true if succeeded, false otherwise
   */
  #_moveUpListItem (li) {
    const prev = li.previousElementSibling;
    if (!prev) return false;
    li.parentNode.insertBefore(li, prev);
    this.#_updateToolbars();
    li.querySelector('.editable-object-up-property').focus();
    return true;
  }

  /**
   * Move a ListItem down.
   *
   * @param {HTMLElement} li - The item li to move
   * @returns {bool} true if succeeded, false otherwise
   */
  #_moveDownListItem (li) {
    const next = li.nextElementSibling;
    if (!next) return false;
    li.parentNode.insertBefore(next, li);
    this.#_updateToolbars();
    li.querySelector('.editable-object-down-property').focus();
    return true;
  }

  /**
   * Removes a ListItem.
   *
   * @param {HTMLElement} li - The item li to remove
   */
  #_removeListItem (li) {
    li.remove();
    this.#_updateToolbars();
  }

  /**
   * Fires when a property is removed.
   *
   * @param {Event} e the caller event object
   */
  #_removeListItemHandler (e) {
    e.stopPropagation();
  
    const li = this.#_getLi(e.target);
    const key = li.querySelector('.property-wrapper > label').innerText.trim();
    const value = li.querySelector('.property-wrapper > input').value.trim();
    
    this.#_removeListItem(li);
    delete this.#object[key];
    
    this.dispatchEvent(this.#_changeEvent({
      action: 'remove',
      key,
      previous: this.#_jsable(value),
      new: null
    }));
  }
  
  /**
   * Fires when a property is moved up.
   *
   * @param {Event} e - The caller event object
   */
  #_moveUpListItemHandler (e) {
    e.stopPropagation();
    const li = this.#_getLi(e.target);
    this.#_moveUpListItem(li);
  }
  
  /**
   * Fires when a property is moved down.
   *
   * @param {Event} e - The caller event object
   */
  #_moveDownListItemHandler (e) {
    e.stopPropagation();
    const li = this.#_getLi(e.target);
    this.#_moveDownListItem(li);
  }

  /**
   * Create a double-tap handler.
   *
   * @returns {function} A double-tap handler
   */
  #_createDoubleTapHandler () {
    let lastTap = 0;
    let timeout;
    const detectDoubleTap = function(e) {
      const curTime = new Date().getTime();
      const tapLen = curTime - lastTap;
      if (tapLen < 500 && tapLen > 0) {
        e.preventDefault();
        this.#_propertyEditStart(e);
      }
      else {
        timeout = setTimeout(() => {
          clearTimeout(timeout);
        }, 500);
      }
      lastTap = curTime;
    };
    return detectDoubleTap.bind(this);
  }

  /**
   * Attaches click handlers to all properties.
   * ** ONLY CALL AT connectCallback, object set, mergeObject **
   *
   * @param {Array} lis - A list of li elements of the properties
   */
  #_handleLiListeners (lis) {
    const listener = this.#_liSelected.bind(this);
    lis.forEach(element => {
      element.addEventListener('click', listener, false);
      this.#objectListeners.push({
        host: element,
        type: 'click',
        listener
      });
    });
  }

  /**
   * Attaches event handlers to the elements of each item inside the li.
   *
   * @param {Array} items - A list of elements inside the item li
   * @param {Array} buttons - A list of buttons inside the item li
   */
  #_handleItemListeners (items, buttons) {
    const isTouch = this.#_isTouch();

    const doubleTapEditHandler = this.#_createDoubleTapHandler();
    const editHandler = this.#_propertyEditStart.bind(this);
    const keypressHandler = this.#_propertyInputKeySelect.bind(this);

    items.forEach(element => {
      element.addEventListener('keypress', keypressHandler, false);
      this.#objectListeners.push({
        host: element,
        type: 'keypress',
        listener: keypressHandler
      })
      element.addEventListener('dblclick', editHandler, false);
      this.#objectListeners.push({
        host: element,
        type: 'dblclick',
        listener: editHandler
      });
      if (isTouch) {
        element.addEventListener('touchend', doubleTapEditHandler);
        this.#objectListeners.push({
          host: element,
          type: 'touchend',
          listener: doubleTapEditHandler
        });
      }
    });

    const moveUpClickHandler = this.#_moveUpListItemHandler.bind(this);
    const moveDownClickHandler = this.#_moveDownListItemHandler.bind(this);
    const removeClickHandler = this.#_removeListItemHandler.bind(this);

    buttons.up.forEach(element => {
      element.addEventListener('click',  moveUpClickHandler, false);
      this.#objectListeners.push({
        host: element,
        type: 'click',
        listener: moveUpClickHandler
      });
    });
    buttons.down.forEach(element => {
      element.addEventListener('click', moveDownClickHandler, false);
      this.#objectListeners.push({
        host: element,
        type: 'click',
        listener: moveDownClickHandler
      });
    });
    buttons.remove.forEach(element => {
      element.addEventListener('click', removeClickHandler, false);
      this.#objectListeners.push({
        host: element,
        type: 'click',
        listener: removeClickHandler
      })
    });
  }

  /**
   * Handler that checks if the editable object control has lost focus.
   *
   * @param {PointerEvent} e - The event object
   */
  #_defocusEditableList (e) {
    if (!e.composedPath().includes(this)) {
      this.shadowRoot.querySelector('.editable-object').classList.add('defocused');
    }
  }

  /**
   * Handler that checks if the editable object control has gained focus.
   *
   * @param {PointerEvent} e - The event object
   */
  #_setFocus () {
    this.shadowRoot.querySelector('.editable-object').classList.remove('defocused');
  }

  #_keyExists (key) {
    return key in this.#object;
  }

  /**
   * Unselect all editable object properties.
   *
   * @param {Event} e - The caller event object
   */
  #_cleanSelection() {
    [...this.shadowRoot.querySelectorAll('li')].forEach(element => {
      element.classList.toggle('selected', false);
      // disable tabindex on all buttons
      [...element.querySelectorAll('button')].forEach(button => {
        button.tabIndex = -1;
      })
    });
  }

  /**
   * Handler to add property to the editable object.
   *
   * @param {Event} e - The event object
   */
  #_addNewProperty (e) {
    if ((e instanceof KeyboardEvent && e.key === 'Enter') || !(e instanceof KeyboardEvent)) {
      const textInput = this.shadowRoot.querySelector('.add-new-object-property-input');
      const rawInput = textInput.value.trim();
      
      if (rawInput !== '') {
        const re = /^\s*(?<property>[^\s:]+)\s*:\s*(?<value>[^$]+)$/;
        const captures = rawInput.match(re)?.groups;
        const [rawKey, rawValue] = captures ? Object.values(captures) : ['',''];
        const key = rawKey.trim();
        const value = rawValue.trim();

        if (!key || this.#_keyExists(key)) {
          // TODO: put out error message for duplicate or bad property key input here
          textInput.focus();
          return;
        }
        
        const newProperty = { [key]: value };
        this.mergeObject(newProperty);
        
        // Tell listeners of the mutation event
        this.dispatchEvent(this.#_changeEvent({
          action: 'add',
          key,
          previous: null,
          new: this.#_jsable(value)
        }));
        
        const objectProperties = this.shadowRoot.querySelector('.object-properties');
        objectProperties.lastChild.click();
        textInput.value = '';
      }
    }
  }

  /// ----------------------------------------------
  /// WebComponent public properties and methods
  /// ----------------------------------------------

  /**
   * Get the underlying object.
   * 
   * @returns {Object} The object being edited
   */
  get object () {
    return this.#object;
  }

  /**
   * Set the object to be edited, replacing any existing object.
   * 
   * @param {Object} obj - The new object to edit
   */
  set object (obj) {
    if (!obj) return;

    if (this.#object && Object.keys(this.#object).length > 0) {
      [this.#objectListeners, this.#editListeners].forEach(listeners => {
        listeners.forEach(listenerObj => {
          listenerObj.host.removeEventListener(listenerObj.type, listenerObj.listener);
        });
      });
    }
    
    const propContainer = this.shadowRoot.querySelector('.object-properties');
    propContainer.innerHTML = '';

    const lis = [];
    const items = [];
    const buttons = {
      up: [],
      down: [],
      remove: []
    };

    for (const [key, value] of Object.entries(obj)) {
      const li = document.createElement('li');
      li.innerHTML = this.#_propertyHTML(key, this.#_stringable(value));
      propContainer.appendChild(li);
      lis.push(li);
      items.push(li.querySelector('.property-wrapper'));
      buttons.up.push(li.querySelector('.editable-object-up-property'));
      buttons.down.push(li.querySelector('.editable-object-down-property'));
      buttons.remove.push(li.querySelector('.editable-object-remove-property'));
    }
    this.#_handleLiListeners(lis);
    this.#_handleItemListeners(items, buttons);
    this.#_updateToolbars();

    const firstInput = lis[0].querySelector('input');
    firstInput.click();

    this.#object = obj;
  }

  /**
   * Get the add-property-placeholder attribute value.
   * 
   * @returns {String} The add property placeholder prompt string
   */
  get addPropertyPlaceholder () {
    return this.#observedAttributeValue('add-property-placeholder');
  }

  /**
   * Set the add-property-placeholder attribute.
   * 
   * @param {String} value - The new add-property-placeholder prompt string
   */
  set addPropertyPlaceholder (value) {
    const attributeName = 'add-property-placeholder';
    if (value) {
      this.setAttribute(attributeName, value);
    } else {
      this.removeAttribute(attributeName);
    }
  }

  /**
   * Merge a new object into the existing object being edited, add 
   */
  mergeObject (newObj) {
    this.object = { ...this.#object, ...newObj };
  }

  /// ----------------------------------------------
  /// WebComponent lifecycle methods
  /// ----------------------------------------------

  connectedCallback () {
    const { shadowRoot } = this;
    
    shadowRoot.innerHTML = '__JS_REPLACEMENT__';

    const objAttr = this.getAttribute('object');
    this.object = JSON.parse(objAttr); // TODO: could throw on bad input, bad input show user error

    const container = shadowRoot.querySelector('.editable-object');
    const newPropertyWrapper = shadowRoot.querySelector('.new-object-property');
    const addElementInput = shadowRoot.querySelector('.add-new-object-property-input');
    const addElementButton = shadowRoot.querySelector('.editable-object-add-property');

    const isTouch = this.#_isTouch();
    const docClickListener = this.#_defocusEditableList.bind(this);
    const containerFocusListener = this.#_setFocus.bind(this);

    if (isTouch) {
      container.classList.add('touch');
    }

    document.addEventListener('click', docClickListener, false);
    this.#listeners.push({ host: document, type: 'click', listener: docClickListener });
    container.addEventListener('click', containerFocusListener, true);
    this.#listeners.push({ host: container, type: 'click', listener: containerFocusListener });

    const newPropClickListener = this.#_cleanSelection.bind(this);
    const addPropListener = this.#_addNewProperty.bind(this);
    newPropertyWrapper.addEventListener('click', newPropClickListener, true);
    this.#listeners.push({ host: newPropertyWrapper, type: 'click', listener: newPropClickListener });
    addElementInput.addEventListener('keypress', addPropListener, false);
    this.#listeners.push({ host: addElementInput, type: 'keypress', listener: addPropListener });
    addElementButton.addEventListener('click', addPropListener, false);
    this.#listeners.push({ host: addElementButton, type: 'click', listener: addPropListener });
  }

  disconnectedCallback () {
    [this.#listeners, this.#objectListeners, this.#editListeners].forEach(listenArr => {
      listenArr.forEach(listenObj => {
        listenObj.host.removeEventListener(listenObj.type, listenObj.listener);
      });
    });
  }

  attributeChangedCallback (attrName, oldValue, newValue) {
    if (newValue !== oldValue) {
      this[attrName] = this.getAttribute(attrName);
    }
  }
}

customElements.define('editable-object', EditableObject);