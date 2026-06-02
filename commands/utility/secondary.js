// /secondary [main] [dataset] [size] ("Outputs the best picks for a secondary character, based on the provided matchup datasets!")

const {
  SlashCommandBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const path = require("path");
const chars = require(path.join(process.cwd(), "/datasets/chars/chars.json"));
const emojis = require(path.join(process.cwd(), "/datasets/emojis.json"));
const secondary_picker = require(path.join(process.cwd(), "/strive-math.js"));

let char_choices = [];

for (let i in chars) {
  char_choices.push(chars[i][0]);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("secondary")
    .setDescription(
      "Outputs the best picks for a secondary character, based on the provided matchup datasets!",
    )
    .addStringOption((option) =>
      option
        .setName("main")
        .setDescription(
          "Your main character! Use the two letter short name used by puddle-farm (ie: SO for Sol)",
        )
        .setRequired(true)
        .setMaxLength(2),
    )
    .addIntegerOption((option) =>
      option
        .setName("dataset")
        .setDescription("The dataset you want to compare against")
        .setRequired(true)
        .addChoices(
          {
            name: "All Matches (puddle-farm)",
            value: 0,
          },
          { name: "Vanquisher Matches (puddle-farm)", value: 1 },
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName("size")
        .setDescription(
          "How long you want the list to be (max is the full character roster",
        )
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(chars.length - 1),
    ),
  async execute(interaction) {
    try {
      let player_main = "";
      let valid_char = false;
      for (let i in chars) {
        if (
          chars[i][0] == interaction.options.getString("main").toUpperCase()
        ) {
          player_main = chars[i][1];
          valid_char = true;
          break;
        }
      }
      if (!valid_char) {
        await interaction.reply({
          content: "Oops! That wasn't a valid character!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      let char_secs = secondary_picker(
        interaction.options.getString("main").toUpperCase(),
        interaction.options.getInteger("dataset"),
      );
      for (let i in char_secs) {
        for (let j in emojis) {
          if (emojis[j][0] == char_secs[i][0]) {
            char_secs[i][3] = emojis[j][1];
            break;
          }
        }
      }
      let dataset_name = "";
      switch (interaction.options.getInteger("dataset")) {
        case 0:
          "**All Matches (puddle-farm)**";
        case 1:
          "**Vanquisher Matches (puddle-farm)**";
        default:
          "**chosen**";
      }
      const secsHeaders = new TextDisplayBuilder().setContent(
        "**Here are the " +
          interaction.options.getInteger("size") +
          " best secondaries for **" +
          player_main +
          "**, based on the " +
          dataset_name +
          " dataset:**",
      );

      const separator = new SeparatorBuilder()
        .setDivider(false) // No line displayed
        .setSpacing(SeparatorSpacingSize.Small);
      let secsList = "";
      for (let i in char_secs) {
        if (i >= interaction.options.getInteger("size")) break;
        secsList +=
          i +
          1 +
          ". <:GG_" +
          char_secs[i][0] +
          ":" +
          char_secs[i][3] +
          "> " +
          char_secs[i][1] +
          " (" +
          char_secs[i][2] +
          " points)\n";
      }
      const secsListText = new TextDisplayBuilder().setContent(secsList);
      await interaction.reply({
        components: [secsHeaders, separator, secsListText],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (_err) {
      await interaction.reply({
        content: "Oops! There was an error!",
        flags: MessageFlags.Ephemeral,
      });
      console.log(_err);
    }
  },
};
