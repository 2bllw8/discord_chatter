const fs = require("fs");

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function loadSource(path) {
    try {
        return fs.readFileSync(path, "utf-8");
    } catch (ignored) {
        // Source not found, return empty object
        return ""
    }
}

function writeSource(path, content) {
    try {
        fs.writeFileSync(path, content, "utf-8");
    } catch (ignored) {
        // Could not write the file, ignore
    }
}

function buildModel(stateSize, source, toAdd) {
    const sourceWords = source.split("\n").map(message => message.split(" "));
    sourceWords.push(toAdd.split(" "));
    const model = {};

    for (let i = 0; i < sourceWords.length; i++) {
        const words = sourceWords[i];
        for (let j = stateSize; j < words.length; j++) {
            const current = words[j];
            const previous = words.slice(j - stateSize, j).join(" ");
            if (Object.prototype.hasOwnProperty.call(model, previous)) {
                model[previous].push(current);
            } else {
                model[previous] = [current];
            }
        }
    }

    return model;
}

function generateText(model, stateSize, minLength) {
    const words = Object.keys(model).length;

    const newStarter = () => {
        const initials = Object.keys(model).filter(it => it[0] === it[0].toUpperCase());
        return randomItem(initials);
    };

    const shouldBreak = (i, lastWord, breakProb) => {
        const lastChar = lastWord[lastWord.length - 1];

        return i > minLength
            && (lastChar === '.'
                || lastChar === '?'
                || lastChar === '!'
                || Math.random() > breakProb);
    }

    let text = [newStarter()];
    let i = stateSize;
    while (true) {
        if (i >= words) {
            break;
        }

        let key = text.splice(i - stateSize, i).join(" ");
        let next = "";
        let breakProb = 0.75;
        if (Object.prototype.hasOwnProperty.call(model, key)) {
            next = randomItem(model[key]);
            text.push(next);
            i++;
        } else {
            next = ". " + newStarter();
            text.push(next);
            breakProb = 0.9;
            i++;
        }

        if (shouldBreak(i, next, breakProb)) {
            break;
        }
    }

    return text.join(" ");
}

module.exports = function (sourcePath, stateSize, minLength) {
    let source = loadSource(sourcePath);
    let model = buildModel(stateSize, source, "");

    return {
        add: message => {
            model = buildModel(stateSize, source, message);
            source += "\n" + message;
            writeSource(sourcePath, source);
        },
        generate: () => generateText(model, stateSize, minLength),
        onDisconnect: () => writeSource(sourcePath, source),
    };
}