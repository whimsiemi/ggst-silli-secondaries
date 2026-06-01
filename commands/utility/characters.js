const {
  SlashCommandBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  MessageFlags,
} = require("discord.js");
const path = require("path");
const chars = require(path.join(process.cwd(), "/datasets/chars/chars.json"));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("characters")
    .setDescription(
      "Sends each character's short name, used by puddle-farm and this bot",
    ),
  async execute(interaction) {
    const charsHeaders = new TextDisplayBuilder().setContent(
      "**Here are the character shorts, used by puddle-farm and this bot:**",
    );

    const separator = new SeparatorBuilder()
      .setDivider(false) // No line displayed
      .setSpacing(SeparatorSpacingSize.Small);
    let charsList = "";
    for (let i in chars) {
      charsList +=
        "- " + chars[i][1] + ": " + chars[i][0] + "\n";
    }
    const charsListText = new TextDisplayBuilder().setContent(charsList);
    await interaction.reply({
      components: [charsHeaders, separator, charsListText],
      flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
    });
  },
};
