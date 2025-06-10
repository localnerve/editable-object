/**
 * test server.
 * 
 * Copyright (c) 2025 Alex Grant (@localnerve), LocalNerve LLC
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import express from 'express';

const port = 3010;
const app = express();

app.use('/', express.static('test/fixtures'));

app.listen(port, err => {
  if (err) console.err(err);
  console.log(`Running on port ${port}`);
})