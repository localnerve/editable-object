# editable-object
[![npm version](https://badge.fury.io/js/%40localnerve%2Feditable-object.svg)](http://badge.fury.io/js/%40localnerve%2Feditable-object)

> A small, fast, no-dependency, editable object webcomponent.

## Summary

A native web component for an editable object that allows a user to edit it's values, add or remove key/value pairs. JSON values only.  
Non-browser module exports build helpers (for building CSP rules, etc).

Can be a convenient 'todo' app to test data update and mutation on the front end with the least additional ceremony.

## Web Details
  + ~11k full, ~3k gzip

## Events

This web component issues a 'changed' CustomEvent when an object property is added, edited, or removed. The format of the `event.detail` is as follows:

```
{
  action: 'add' | 'edit' | 'remove',
  key: '<the property key name>',
  previous: '<the previous value, null if action: 'add'>',
  new: '<the new value, null if action: 'remove'>'
}
```

## Attributes (and Properties)

* `object` - *Optional*. The initial object to edit - Must be a JSON stringified object. Can be added later without JSON stringification via the javascript property `object`.

> Property name is also `object`.

* `add-property-placeholder` - *Optional*. The text that prompts a user to add a new property to the object. Defaults to 'Add new property in key:value format'.

  > Property name is `addPropertyPlaceholder`.

* `disable-edit` - *Optional*. Disallow the editing functions. Makes this component a read-only view of the object.

  > Property name is `disableEdit`.

## Named Slots

* `"loading"` - *Optional*. A named slot you can use to bring in content to display during loading. Hidden after initial object parse or later when object is set.

## Javascript Public Properties and Methods

* `object` **Property** - Assign a javascript `Object` to set the component's internals for editing. Any existing object is replaced. JSON compatible properties only (string, number, boolean, array, object, null).

* `addPropertyPlaceholder` **Property** - Assign a prompt to show the user in the new property/value input box to override the default 'Add new property in key:value format'.

* `disableEdit` **Property** - Assign to true to make the control read-only and disallow any editing.

* `mergeObject(newObject)` **method** - Call to merge more properties into the underlying object under edit.

## Overridable CSS Variables

* `--eo-min-width` - The min-width for the component. Defaults to 300px.
* `--eo-bg-color` - The overall control background color. Defaults to #fafafa.
* `--eo-border-radius` - The border-radius of the control. Defaults to 4px.
* `--eo-border-focused-color` - The color of the control border when focused. Defaults to #444.
* `--eo-border-defocused-color` - The color of the control border when not focused. Defaults to #aaa.
* `--eo-item-selected-bg-color` - The background color of the property list item when selected. Defaults to #999.
* `--eo-item-selected-color` - The foreground text color of the property list item when selected. Defaults to #222.
* `--eo-item-selected-border-radius` - The border-radius of the item selection box. Defaults to 4px.
* `--eo-item-hover-border-width` - The hover border width. Defaults to 1px.
* `--eo-item-hover-border-color` - The hover border color. Defaults to #ddd.
* `--eo-item-hover-border-radius` - The border-radius of the item hover box. Defaults to 4px.
* `--eo-icon-color` - The color of the toolbar button icons. Defaults to #444.
* `--eo-add-new-icon-color` - The color of the 'add new property' toolbar button icon. Defaults to #444.
* `--eo-input-focus-outline-color` - The color of the focus ring on the input boxes. Defaults to #26b.
* `--eo-input-focus-outline-width`- The width of the focus ring on the input boxes. Defaults to 1px.
* `--eo-input-focus-outline-style` - The style of the focus ring on the input boxes. Defaults to 'auto'.
* `--eo-input-border-color` - The border color of 'add' and 'edit' input boxes. Defaults to #bbb.
* `--eo-input-bg-color` - The background color of input controls. Defaults to #444.
* `--eo-input-color` - The foreground text color of input controls. Defaults to #eee.
* `--eo-input-font-family` - The font family of input controls. Defaults to 'sans-serif'.
* `--eo-input-placeholder-color` - The foreground text color of input placeholder text. Defaults to #aaa.


## Usage Example

```html 
  <editable-object object="{'property1':'value1','property2':'value2'}" add-property-placeholder="Add property in key:value format"></editable-object>
```
See [The test reference](https://github.com/localnerve/editable-object/blob/master/test/fixtures/index.html) for another usage example, run/play with the test reference with `npm run test:server`.

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