import { test, expect } from '@playwright/test';

// The dev server serves test/fixtures at root, so paths are relative to that directory
const FIXTURES = '';

/* ------------------------------------------------------------------ */
/* 1. BASIC RENDERING & OBJECT PROPERTY                                */
/* ------------------------------------------------------------------ */

test.describe('Basic Rendering & Object Property', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('renders all initial object properties', async ({ page }) => {
    // Wait for the component to render its list items
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(9);

    const keys = await labels.allTextContents();
    expect(keys).toContain('property1');
    expect(keys).toContain('property2');
    expect(keys).toContain('property3');
    expect(keys).toContain('property4');
    expect(keys).toContain('prop41');
    expect(keys).toContain('property5');
    expect(keys).toContain('property6');
    expect(keys).toContain('property7');
    expect(keys).toContain('property8');
  });

  test('displays correct string values', async ({ page }) => {
    const input1 = page.locator('#eo-property1-value');
    await expect(input1).toHaveValue('value1');

    const input2 = page.locator('#eo-property2-value');
    await expect(input2).toHaveValue('value2');
  });

  test('displays correct numeric values', async ({ page }) => {
    const input3 = page.locator('#eo-property3-value');
    await expect(input3).toHaveValue('3');

    const input4 = page.locator('#eo-property4-value');
    await expect(input4).toHaveValue('4.4');
  });

  test('displays correct null value', async ({ page }) => {
    const input5 = page.locator('#eo-property5-value');
    await expect(input5).toHaveValue('null');
  });

  test('displays correct boolean value', async ({ page }) => {
    const input6 = page.locator('#eo-property6-value');
    await expect(input6).toHaveValue('false');
  });

  test('displays array and object values as JSON strings', async ({ page }) => {
    const input7 = page.locator('#eo-property7-value');
    await expect(input7).toHaveValue('[1,2,3,4,5]');

    const input8 = page.locator('#eo-property8-value');
    // Objects are stringified with single quotes per the component's #_stringable method
    const value = await input8.inputValue();
    expect(value).toContain('property1');
    expect(value).toContain('value1');
  });

  test('object property returns the underlying object', async ({ page }) => {
    const obj = await page.evaluate(() => {
      return document.querySelector('#eo').object;
    });
    expect(obj.property1).toBe('value1');
    expect(obj.property3).toBe(3);
    expect(obj.property6).toBe(false);
  });

  test('setting object property replaces the entire object', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('#eo').object = { foo: 'bar', baz: 42 };
    });

    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(2);

    const keys = await labels.allTextContents();
    expect(keys).toContain('foo');
    expect(keys).toContain('baz');

    const inputFoo = page.locator('#eo-foo-value');
    await expect(inputFoo).toHaveValue('bar');
  });
});

/* ------------------------------------------------------------------ */
/* 2. ADD PROPERTY PLACEHOLDER                                         */
/* ------------------------------------------------------------------ */

test.describe('Add Property Placeholder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/add-property-placeholder.html`);
  });

  test('displays custom placeholder text', async ({ page }) => {
    const addInput = page.locator('.add-new-object-property-input');
    await expect(addInput).toHaveAttribute('placeholder', 'property-name: value');
  });

  test('placeholder can be changed via property', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('#eo').addPropertyPlaceholder = 'Enter key:value here';
    });

    const addInput = page.locator('.add-new-object-property-input');
    await expect(addInput).toHaveAttribute('placeholder', 'Enter key:value here');
  });
});

/* ------------------------------------------------------------------ */
/* 3. DISABLE EDIT MODE                                                */
/* ------------------------------------------------------------------ */

test.describe('Disable Edit Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/disable-edit.html`);
  });

  test('starts in disabled mode with remove buttons hidden', async ({ page }) => {
    // Remove buttons should have the 'hide' class when disableEdit is true
    const removeButtons = page.locator('.editable-object-remove-property.hide');
    await expect(removeButtons).toHaveCount(9);
  });

  test('add-new-property section is hidden when disabled', async ({ page }) => {
    const newPropertySection = page.locator('.new-object-property');
    // Check that it has the 'hide' class
    await expect(newPropertySection).toHaveClass(/hide/);
  });

  test('enabling edit shows remove buttons and add section', async ({ page }) => {
    // Click the "Enable Edit" radio button in the fixture
    await page.locator('#enable').click();

    const removeButtons = page.locator('.editable-object-remove-property:not(.hide)');
    await expect(removeButtons).toHaveCount(9);

    const newPropertySection = page.locator('.new-object-property');
    await expect(newPropertySection).not.toHaveClass(/hide/);
  });

  test('disableEdit property getter returns correct value', async ({ page }) => {
    // Starts disabled
    let isDisabled = await page.evaluate(() => document.querySelector('#eo').disableEdit);
    expect(isDisabled).toBe(true);

    // Enable it
    await page.evaluate(() => {
      document.querySelector('#eo').disableEdit = false;
    });
    isDisabled = await page.evaluate(() => document.querySelector('#eo').disableEdit);
    expect(isDisabled).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 4. CHANGE EVENTS                                                    */
/* ------------------------------------------------------------------ */

test.describe('Change Events', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('emits change event with action "edit" on property edit', async ({ page }) => {
    // Set up a listener in the page to capture the event detail
    await page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.lastChangeDetail = e.detail;
      });
    });

    // Select a property by clicking on its list item
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();

    // Double-click the input to start editing
    const input = page.locator('#eo-property1-value');
    await input.dblclick();

    // Clear and type new value, then press Enter
    await input.fill('edited_value');
    await input.press('Enter');

    // Wait for event to fire
    await page.waitForTimeout(300); // eslint-disable-line playwright/no-wait-for-timeout

    const detail = await page.evaluate(() => window.lastChangeDetail);
    expect(detail).not.toBeNull();
    expect(detail.action).toBe('edit');
  });

  test('emits change event with action "add" on property add', async ({ page }) => {
    // Set up a listener in the page to capture the event detail
    await page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.lastChangeDetail = e.detail;
      });
    });

    // Type a new property in the add input and press Enter
    const addInput = page.locator('.add-new-object-property-input');
    await addInput.fill('newProp: newValue');
    await addInput.press('Enter');

    // Wait for event to fire
    await page.waitForTimeout(300); // eslint-disable-line playwright/no-wait-for-timeout

    const detail = await page.evaluate(() => window.lastChangeDetail);
    expect(detail).not.toBeNull();
    expect(detail.action).toBe('add');
  });

  test('emits change event with action "remove" on property remove', async ({ page }) => {
    // Set up a listener in the page to capture the event detail
    await page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.lastChangeDetail = e.detail;
      });
    });

    // Select a property first
    const lastLi = page.locator('.object-properties li').last();
    await lastLi.click();

    // Click the remove button
    const removeBtn = lastLi.locator('.editable-object-remove-property');
    await removeBtn.click();

    // Wait for event to fire
    await page.waitForTimeout(300); // eslint-disable-line playwright/no-wait-for-timeout

    const detail = await page.evaluate(() => window.lastChangeDetail);
    expect(detail).not.toBeNull();
    expect(detail.action).toBe('remove');
  });

  test('change event detail contains correct fields for edit', async ({ page }) => {
    // Use page.evaluate to capture the event directly
    let capturedDetail = null;
    page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.capturedChangeDetail = e.detail;
        eo.removeEventListener('change', handler);
      });
    });

    // Select and edit a property
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('changed_value');
    await input.press('Enter');

    // Wait a tick for the event to fire and be captured
    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    capturedDetail = await page.evaluate(() => window.capturedChangeDetail);
    expect(capturedDetail).not.toBeNull();
    expect(capturedDetail.action).toBe('edit');
    expect(capturedDetail.key).toBe('property1');
    expect(capturedDetail.previous).toBe('value1');
    expect(capturedDetail.new).toBe('changed_value');
  });

  test('change event detail contains correct fields for add', async ({ page }) => {
    let capturedDetail = null;
    page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.capturedChangeDetail = e.detail;
        eo.removeEventListener('change', handler);
      });
    });

    const addInput = page.locator('.add-new-object-property-input');
    await addInput.fill('addedKey: addedValue');
    await addInput.press('Enter');

    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    capturedDetail = await page.evaluate(() => window.capturedChangeDetail);
    expect(capturedDetail).not.toBeNull();
    expect(capturedDetail.action).toBe('add');
    expect(capturedDetail.key).toBe('addedKey');
    expect(capturedDetail.previous).toBeNull();
    expect(capturedDetail.new).toBe('addedValue');
  });

  test('change event detail contains correct fields for remove', async ({ page }) => {
    let capturedDetail = null;
    page.evaluate(() => {
      const eo = document.querySelector('#eo');
      eo.addEventListener('change', function handler(e) {
        window.capturedChangeDetail = e.detail;
        eo.removeEventListener('change', handler);
      });
    });

    // Select and remove property6 (boolean false, simple value)
    const liForProperty6 = page.locator('#eo-property6-value').locator('..').locator('..');
    await liForProperty6.click();
    const removeBtn = liForProperty6.locator('.editable-object-remove-property');
    await removeBtn.click();

    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    capturedDetail = await page.evaluate(() => window.capturedChangeDetail);
    expect(capturedDetail).not.toBeNull();
    expect(capturedDetail.action).toBe('remove');
    expect(capturedDetail.key).toBe('property6');
    expect(capturedDetail.previous).toBe(false);
    expect(capturedDetail.new).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 5. VALIDATION HANDLERS (onEdit, onAdd, onRemove)                    */
/* ------------------------------------------------------------------ */

test.describe('Validation Handlers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/handlers.html`);
  });

  test('onEdit blocks edit when handler returns false', async ({ page }) => {
    // Checkboxes start unchecked in the fixture, so onEdit already returns false
    // No need to uncheck anything

    // Try to edit a property
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('blocked_value');
    await input.press('Enter');

    // The input should have the error class
    await expect(input).toHaveClass(/error/);

    // Value should not have changed in the object
    const value = await page.evaluate(() => document.querySelector('#eo').object.property1);
    expect(value).toBe('value1');
  });

  test('onEdit allows edit when handler returns true', async ({ page }) => {
    // Check the "Allow Edit" checkbox so onEdit returns true
    const allowEditCheckbox = page.locator('#edit');
    await allowEditCheckbox.check();

    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('allowed_value');
    await input.press('Enter');

    // No error class should be present
    await expect(input).not.toHaveClass(/error/);

    // Value should have changed
    const value = await page.evaluate(() => document.querySelector('#eo').object.property1);
    expect(value).toBe('allowed_value');
  });

  test('onAdd blocks add when handler returns false', async ({ page }) => {
    // Checkboxes start unchecked, so onAdd already returns false

    // Try to add a new property
    const addInput = page.locator('.add-new-object-property-input');
    await addInput.fill('blockedProp: blockedValue');
    await addInput.press('Enter');

    // The input should have the error class
    await expect(addInput).toHaveClass(/error/);

    // Property should not exist in the object
    const hasBlocked = await page.evaluate(() => 'blockedProp' in document.querySelector('#eo').object);
    expect(hasBlocked).toBe(false);
  });

  test('onAdd allows add when handler returns true', async ({ page }) => {
    // Check the "Allow Add" checkbox so onAdd returns true
    const allowAddCheckbox = page.locator('#add');
    await allowAddCheckbox.check();

    const addInput = page.locator('.add-new-object-property-input');
    await addInput.fill('allowedProp: allowedValue');
    await addInput.press('Enter');

    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    // Property should exist in the object
    const hasAllowed = await page.evaluate(() => 'allowedProp' in document.querySelector('#eo').object);
    expect(hasAllowed).toBe(true);
  });

  test('onRemove blocks remove when handler returns false', async ({ page }) => {
    // Checkboxes start unchecked, so onRemove already returns false

    // Try to remove a property
    const liForProperty6 = page.locator('#eo-property6-value').locator('..').locator('..');
    await liForProperty6.click();
    const removeBtn = liForProperty6.locator('.editable-object-remove-property');
    await removeBtn.click();

    // The input should have the error class
    const input = page.locator('#eo-property6-value');
    await expect(input).toHaveClass(/error/);

    // Property should still exist in the object
    const hasProperty6 = await page.evaluate(() => 'property6' in document.querySelector('#eo').object);
    expect(hasProperty6).toBe(true);
  });

  test('onRemove allows remove when handler returns true', async ({ page }) => {
    // Check the "Allow Remove" checkbox so onRemove returns true
    const allowRemoveCheckbox = page.locator('#remove');
    await allowRemoveCheckbox.check();

    const liForProperty6 = page.locator('#eo-property6-value').locator('..').locator('..');
    await liForProperty6.click();
    const removeBtn = liForProperty6.locator('.editable-object-remove-property');
    await removeBtn.click();

    // Property should no longer exist in the object
    const hasProperty6 = await page.evaluate(() => 'property6' in document.querySelector('#eo').object);
    expect(hasProperty6).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 6. REPEAT OBJECT ASSIGNMENT                                         */
/* ------------------------------------------------------------------ */

test.describe('Repeat Object Assignment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/repeat-assign.html`);
  });

  test('clicking update button increments property3 in the UI', async ({ page }) => {
    const input3 = page.locator('#eo-property3-value');
    await expect(input3).toHaveValue('3');

    // Click the "Increment Property 3" button
    await page.locator('#update-object').click();

    await expect(input3).toHaveValue('4');

    // Click again
    await page.locator('#update-object').click();
    await expect(input3).toHaveValue('5');
  });

  test('object property reflects updated value after reassignment', async ({ page }) => {
    await page.locator('#update-object').click();
    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    const value = await page.evaluate(() => document.querySelector('#eo').object.property3);
    expect(value).toBe(4);
  });
});

/* ------------------------------------------------------------------ */
/* 7. LOADING SLOT                                                     */
/* ------------------------------------------------------------------ */

test.describe('Loading Slot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/spinner.html`);
  });

  test('loading slot content is visible before object is set', async ({ page }) => {
    // The spinner should be visible immediately (object is set after 6s delay)
    const spinner = page.locator('.spinner');
    await expect(spinner).toBeVisible();
  });

  test('loading slot content is hidden after object is assigned', async ({ page }) => {
    // Wait for the 6-second timeout in the fixture, then a bit more
    await page.waitForTimeout(7000); // eslint-disable-line playwright/no-wait-for-timeout

    const loadingSlot = page.locator('#loading');
    await expect(loadingSlot).toHaveClass(/hide/);
  });

  test('properties are rendered after loading completes', async ({ page }) => {
    // Wait for the 6-second timeout in the fixture, then a bit more
    await page.waitForTimeout(7000); // eslint-disable-line playwright/no-wait-for-timeout

    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(9);
  });
});

/* ------------------------------------------------------------------ */
/* 8. NO DATA / EMPTY OBJECT                                           */
/* ------------------------------------------------------------------ */

test.describe('No Data / Empty Object', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/no-data.html`);
  });

  test('renders with no properties when object is empty', async ({ page }) => {
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(0);
  });

  test('user can add a property to an empty object', async ({ page }) => {
    const addInput = page.locator('.add-new-object-property-input');
    await addInput.fill('firstKey: firstValue');
    await addInput.press('Enter');

    await page.waitForTimeout(200); // eslint-disable-line playwright/no-wait-for-timeout

    // Now there should be one property
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(1);
    await expect(labels.first()).toHaveText('firstKey');
  });
});

/* ------------------------------------------------------------------ */
/* 9. MERGE OBJECT METHOD                                              */
/* ------------------------------------------------------------------ */

test.describe('mergeObject Method', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('mergeObject adds new properties to the existing object', async ({ page }) => {
    const initialCount = await page.locator('.property-wrapper label').count();

    // Call mergeObject via evaluate
    await page.evaluate(() => {
      document.querySelector('#eo').mergeObject({ mergedKey: 'mergedValue' });
    });

    // Should have one more property now
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(initialCount + 1);

    const inputMerged = page.locator('#eo-mergedKey-value');
    await expect(inputMerged).toHaveValue('mergedValue');
  });

  test('mergeObject can update existing properties', async ({ page }) => {
    // Merge a property that already exists with a new value
    await page.evaluate(() => {
      document.querySelector('#eo').mergeObject({ property1: 'updated_via_merge' });
    });

    const input1 = page.locator('#eo-property1-value');
    await expect(input1).toHaveValue('updated_via_merge');

    // Count should stay the same (no new properties, just updated)
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(9);
  });
});

/* ------------------------------------------------------------------ */
/* 10. PROPERTY SELECTION & TOOLBAR                                    */
/* ------------------------------------------------------------------ */

test.describe('Property Selection & Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('clicking a property selects it and shows toolbar', async ({ page }) => {
    // Select the second item so both move-up and move-down buttons are visible
    const secondLi = page.locator('.object-properties li').nth(1);
    await secondLi.click();

    // The li should have the 'selected' class
    await expect(secondLi).toHaveClass(/selected/);

    // Toolbar buttons should be visible (not hidden by opacity) - check they exist and are enabled
    const toolbarButtons = secondLi.locator('.toolbar button');
    await expect(toolbarButtons.first()).toBeVisible();
  });

  test('move up button moves property up in the list', async ({ page }) => {
    // Select the second property
    const secondLi = page.locator('.object-properties li').nth(1);
    await secondLi.click();

    // Get the label of the first and second items before moving
    const firstLabelBefore = await page.locator('.object-properties li').first().locator('label').textContent();
    const secondLabelBefore = await secondLi.locator('label').textContent();

    // Click move up button on the second item
    const moveUpBtn = secondLi.locator('.editable-object-up-property');
    await moveUpBtn.click();

    // After moving, the first and second labels should be swapped
    await expect(page.locator('.object-properties li').first().locator('label')).toHaveText(secondLabelBefore);
  });

  test('move down button moves property down in the list', async ({ page }) => {
    // Select the first property
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();

    const firstLabelBefore = await firstLi.locator('label').textContent();
    const secondLabelBefore = await page.locator('.object-properties li').nth(1).locator('label').textContent();

    // Click move down button on the first item
    const moveDownBtn = firstLi.locator('.editable-object-down-property');
    await moveDownBtn.click();

    // After moving, labels should be swapped
    await expect(page.locator('.object-properties li').first().locator('label')).toHaveText(secondLabelBefore);
  });
});

/* ------------------------------------------------------------------ */
/* 11. EDITING WITH TYPE CONVERSION                                    */
/* ------------------------------------------------------------------ */

test.describe('Editing with Type Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('editing a string to a number converts the type in the object', async ({ page }) => {
    // Edit property1 (string "value1") to a number
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('42');
    await input.press('Enter');

    // Check the object property is now a number
    const value = await page.evaluate(() => {
      const obj = document.querySelector('#eo').object;
      return { val: obj.property1, type: typeof obj.property1 };
    });
    expect(value.val).toBe(42);
    expect(value.type).toBe('number');
  });

  test('editing a string to "true" converts to boolean', async ({ page }) => {
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('true');
    await input.press('Enter');

    const value = await page.evaluate(() => {
      const obj = document.querySelector('#eo').object;
      return { val: obj.property1, type: typeof obj.property1 };
    });
    expect(value.val).toBe(true);
    expect(value.type).toBe('boolean');
  });

  test('editing a string to "null" converts to null', async ({ page }) => {
    const firstLi = page.locator('.object-properties li').first();
    await firstLi.click();
    const input = page.locator('#eo-property1-value');
    await input.dblclick();
    await input.fill('null');
    await input.press('Enter');

    const value = await page.evaluate(() => document.querySelector('#eo').object.property1);
    expect(value).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* 12. ADD PROPERTY VALIDATION                                         */
/* ------------------------------------------------------------------ */

test.describe('Add Property Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FIXTURES}/index.html`);
  });

  test('adding a duplicate key shows error', async ({ page }) => {
    const addInput = page.locator('.add-new-object-property-input');
    // Try to add property1 which already exists
    await addInput.fill('property1: newValue');
    await addInput.press('Enter');

    // Should show error class on the input
    await expect(addInput).toHaveClass(/error/);

    // Count should not change (still 9)
    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(9);
  });

  test('adding with empty key shows error', async ({ page }) => {
    const addInput = page.locator('.add-new-object-property-input');
    // Try to add without a proper key:value format
    await addInput.fill(': valueOnly');
    await addInput.press('Enter');

    await expect(addInput).toHaveClass(/error/);
  });

  test('adding with empty input does nothing', async ({ page }) => {
    const initialCount = await page.locator('.property-wrapper label').count();

    const addInput = page.locator('.add-new-object-property-input');
    // Press Enter on empty input
    await addInput.press('Enter');

    const labels = page.locator('.property-wrapper label');
    await expect(labels).toHaveCount(initialCount);
  });
});
