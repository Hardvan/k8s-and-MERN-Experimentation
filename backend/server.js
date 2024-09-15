const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow requests from any origin
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/api/items", (req, res) => {
  const items = JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "items.json"), "utf8")
  );
  res.json(items);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
