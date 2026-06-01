const axios = require("axios");
const fs = require("fs");
const matchups_all = require("./datasets/matchups/matchups_all.json");
const matchups_vanq = require("./datasets/matchups/matchups_vanq.json");
const chars = require("./datasets/chars/chars.json");

// Calculate the bonus multiplication to a character's matchup score, relative to how necessary a good matchup is for the player character
function get_matchup_bonus(matchup, mult) {
  return (((1 - matchup.winrate) * mult) / matchup.winrate) * 10;
}

// Prints the winrate of a given matchup based on the community standard ratio (out of 100, ie 50:50 for an even matchup)
function get_matchup_ratio(matchup) {
  console.log(
    "Matchup ratio: " +
      matchup.winrate * 100 +
      ":" +
      (100 - matchup.winrate * 100),
  );
}

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

// Scores every character in the game relative to how well they do in the player character's worst matchups, sorting them from best to worst and returning the full list
function secondary_picker(player, dataset) {
  let json = matchups_all;
  switch (dataset) {
    case 1:
      json = matchups_vanq;
      break;
    default:
      break;
  }
  let character = 0;
  let secondaries = [...chars];
  for (let i in secondaries) {
    secondaries[i][2] = 0;
  }
  for (let i in secondaries) {
    let cur_char = secondaries[i][0];

    for (let j in chars) {
      if (
        chars[j][0] != cur_char &&
        search_char_matchup(player, chars[j][0], json).winrate <= 0.5 &&
        search_char_matchup(secondaries[i][0], chars[j][0], json).winrate >= 0.5
      ) {
        secondaries[i][2] += Math.floor(
          search_char_matchup(secondaries[i][0], chars[j][0], json).winrate *
            100 *
            get_matchup_bonus(
              search_char_matchup(player, chars[j][0], json),
              10,
            ),
        );
      }
    }
    if (cur_char == player) delete secondaries[i];
    else {
      let overall_winrate = 0;
      //console.log(json[i]["matchups"]);
      for (let matchup in json[i]["matchups"]) {
        overall_winrate +=
          json[i]["matchups"][matchup].wins /
          json[i]["matchups"][matchup].total_games;
      }
      overall_winrate /= chars.length;
      secondaries[i][2] /= overall_winrate;
      secondaries[i][2] = Math.floor(secondaries[i][2]);
    }
  }
  secondaries.sort(compareThirdColumn);

  return secondaries;
}

module.exports = secondary_picker;
