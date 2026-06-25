// Necessary first-time installation script to fetch the required matchup data. In the future, I'll just make the index.js script do this script's job

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const axios = require("axios");
const fs = require("fs");

// Creates new variables in each matchup object that calculates the winrate (with 2 decimal places of accuracy) and returns the resulting JSON
function process_matchup_winrates(json) {
  for (let i in json) {
    // We have to index within each character's matchup objects, as well as indexing the characters in the json itself
    for (let j in json[i].matchups) {
      json[i].matchups[j].winrate = (
        json[i].matchups[j].wins / json[i].matchups[j].total_games
      ).toFixed(2);
    }
  }
  return json;
}

// Parsing the latest matchup and character data from puddle-farm's API
async function fetch_matchups() {
  if (!fs.existsSync("./datasets/matchups")) {
    fs.mkdirSync("./datasets");
    fs.mkdirSync("./datasets/matchups");
  }
  // NOTE: Once this goes live on a server, this will be replaced with a batch script ran every 24 hours to store these into JSON files
  let matchups_req = await axios.get("https://puddle.farm/api/matchups");
  let matchups_all = process_matchup_winrates(matchups_req.data.data_all);
  let matchups_vanq = process_matchup_winrates(matchups_req.data.data_vanq);
  fs.writeFile(
    "./datasets/matchups/matchups_all.json",
    JSON.stringify(matchups_all, null, "\t"),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log("File written successfully!");
    },
  );
  fs.writeFile(
    "./datasets/matchups/matchups_vanq.json",
    JSON.stringify(matchups_vanq, null, "\t"),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log("File written successfully!");
    },
  );
  return [matchups_all, matchups_vanq];
}

async function fetch_characters() {
  if (!fs.existsSync("./datasets/chars")) {
    fs.mkdirSync("./datasets");
    fs.mkdirSync("./datasets/chars");
  }
  let chars_req = await axios.get("https://puddle.farm/api/characters");
  let chars = chars_req.data;
  fs.writeFile(
    "./datasets/chars/chars.json",
    JSON.stringify(chars, null, "\t"),
    "utf8",
    (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return;
      }
      console.log("File written successfully!");
    },
  );
  return chars;
}

fetch_matchups();
fetch_characters();
