const Discord = require("discord.js");
const MarkovChain = require("./markov_chain");
const Config = require("./config.json");

const mc = MarkovChain(
    Config.sourceText,
    Config.stateSize,
    Config.minLength
);

const client = new Discord.Client();
client.on("message", (msg) => {
    if (msg.author.bot) return;
    const content = msg.content;
    mc.add(content);

    const message = mc.generate();
    if (!message || message.length === 0) {
        return;
    }

    console.log(`> ${message}`);
    if (Math.random() < Config.replyProbability) {
        msg.channel.send(message)
            .then(() => console.log("  --> Sent!"));
    }
});
client.on("disconnect", () => {
    mc.onDisconnect();
})

client.login(Config.token)
    .then(() => console.log("Authenticated"));
