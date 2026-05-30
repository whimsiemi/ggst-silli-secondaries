// Imports
import axios from "axios";
import fs from "fs";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Testing variables
const player_char = await askQuestion(
  "Enter your character's short name (ie: SO for Sol): ",
);

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

// Prints the winrate of a given matchup based on the community standard ratio (out of 100, ie 50:50 for an even matchup)
function get_matchup_ratio(matchup, mult) {
  //console.log(
  //  "Matchup ratio: " +
  //    matchup.winrate * 100 +
  //    ":" +
  //    (100 - matchup.winrate * 100),
  //);
  return (((1 - matchup.winrate) * mult) / matchup.winrate) * 10;
}

// Parsing the latest matchup and character data from puddle-farm's API
// NOTE: Once this goes live on a server, this will be replaced with a batch script ran every 24 hours to store these into JSON files
const matchups_req = await axios.get("https://puddle.farm/api/matchups");
const matchups_all = process_matchup_winrates(matchups_req.data.data_all);
const matchups_vanq = process_matchup_winrates(matchups_req.data.data_vanq);
const chars_req = await axios.get("https://puddle.farm/api/characters");
const chars = chars_req.data;

// Returns matchup data for the player character in the matchup data by subsequently searching for the matchup data of the opponent character
// NOTE: We use the short, two-letter names for QoL, so remember to use those!
function search_char_matchup(player, opponent, json) {
  let character = 0;
  for (character in chars) {
    if (chars[character][0] == player) {
      break;
    }
  }
  for (let matchup in json[character]["matchups"]) {
    if (json[character]["matchups"][matchup].char_short == opponent) {
      //console.log(
      //  "Requested matchup: " +
      //    JSON.stringify(matchups_vanq[character]["matchups"][matchup]),
      //);
      return json[character]["matchups"][matchup];
    }
  }
}

// Necessary math for sorting used by the secondary picker
function compareThirdColumn(a, b) {
  if (a[1] === b[1]) {
    return 0;
  } else {
    return a[2] > b[2] ? -1 : 1;
  }
}

// Scores every character in the game relative to how well they do in the player character's worst matchups, sorting them from best to worst and printing the top 5 picks
function secondary_picker(player, json) {
  let character = 0;
  let secondaries = chars;
  for (let i in secondaries) {
    secondaries[i][2] = 0;
  }
  for (character in chars) {
    if (chars[character][0] == player) {
      break;
    }
  }
  for (let i in secondaries) {
    let cur_char = secondaries[i][0];

    for (let j in chars) {
      if (
        chars[j][0] != secondaries[i][0] &&
        search_char_matchup(player, chars[j][0], json).winrate <= 0.5
      ) {
        secondaries[i][2] += Math.floor(
          search_char_matchup(secondaries[i][0], chars[j][0], json).winrate *
            100 *
            get_matchup_ratio(
              search_char_matchup(player, chars[j][0], json),
              10,
            ),
        );
      }
    }
    if (cur_char == player) delete secondaries[i];
  }
  secondaries.sort(compareThirdColumn);
  console.log(secondaries);
  console.log(
    "Your best character pickups are " +
      secondaries[0][1] +
      ", " +
      secondaries[1][1] +
      ", " +
      secondaries[2][1] +
      ", " +
      secondaries[3][1] +
      " and " +
      secondaries[4][1] +
      "!",
  );
}

try {
  secondary_picker(player_char, matchups_vanq);
} catch (_err) {
  console.log(_err);
}
