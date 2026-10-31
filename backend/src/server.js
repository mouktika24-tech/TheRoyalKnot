require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`The Royal Knot API is listening on port ${port}`);
});
