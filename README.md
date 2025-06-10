# editable-object
[![npm version](https://badge.fury.io/js/%40localnerve%2Feditable-object.svg)](http://badge.fury.io/js/%40localnerve%2Feditable-object)

> A small, fast, no-dependency, editable object webcomponent.

## Live example
  https://localnerve.github.io/editable-object/dist/editable-object.html

## Summary

A native web component for an editable object that allows a user to edit it's values and add new key/value pairs. JSON values only.  
Non-browser module exports build helpers (for building CSP rules, etc).  

## Web Details
  + ~13k full, ~4.4k gzip
  + Axe core 4.8.2 pass

## Attributes and Properties

* `object` - *Optional*. The initial object to edit - Must be a JSON stringified object. Can be added later without JSON stringification via the javascript property `object`.

> Property name is also `object`.

* `add-property-placeholder` - *Optional*. The text that prompts a user to add a new property to the object. Defaults to 'Add new property in key:value format'.

  > Property name is `addPropertyPlaceholder` (camel case).

## Overridable CSS Variables

* `--eo-min-width` - The min-width for the component. Defaults to 300px.
* `--eo-bg-color` - The overall control background color. Defaults to #fafafa.
* `--eo-border-radius` - The border-radius of the control. Defaults to 4px.
* `--eo-border-focused-color` - The color of the control border when focused. Defaults to #444.
* `--eo-border-defocused-color` - The color of the control border when not focused. Defaults to #aaa.
* `--eo-item-selected-color` - The background color of the property list item when selected. Defaults to #f8f8f8.
* `--eo-item-hover-color` - The background color of the propert list item when hovered. Defaults to #eee.
* `--eo-item-input-border-color` - The border color of 

## Javascript Properties and Methods

* `object` **Property** - Assign a javascript `Object` to set the component's internals for editing. Any existing object is replaced. JSON compatible properties only (string, number, boolean, array, object, null).

* `addPropertyPlaceholder` **Property** - Assign a prompt to show the user in the new property/value input box to override the default 'Add new property in key:value format'.

* `mergeObject(newObject)` **method** - Call to merge more properties into the underlying object under edit.

## Usage Example

```html 
  <editable-object object="{'property1':'value1','property2':'value2'}" add-property-placeholder="Add property in key:value format"></editable-object>
```
See [The reference implementation](https://github.com/localnerve/editable-object/blob/master/src/index.html) for more detailed usage example.

## Non-browser Exports

The non-browser version of the module exports methods to help with builds.

### {Promise} getEditableObjectCssText()

Asynchronously gets the raw shadow css text.  
Useful for computing the hash for a CSP style rule.  
Returns a Promise that resolves to the full utf8 string of css text.

## License

LocalNerve [BSD-3-Clause](https://github.com/localnerve/editable-object/blob/master/LICENSE.md) Licensed

## Contact

twitter: @localnerve
email: alex@localnerve.com