if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker зарегистрирован:', registration);
        })
        .catch((error) => {
          console.log('Ошибка регистрации Service Worker:', error);
        });
    });
  }

const debounce = (func, wait) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

document.addEventListener("DOMContentLoaded", () => {
    let rounds = [];
    const perRoundExclusions = {};
    const playerCountLabel = document.getElementById("playerCountLabel");
    const roundCountLabel = document.getElementById("roundCountLabel");

    const getStoredValue = (key, defaultValue) =>
        localStorage.getItem(key) ? parseInt(localStorage.getItem(key), 10) : defaultValue;

    playerCountLabel.innerText = getStoredValue("playerCount", 10);
    roundCountLabel.innerText = getStoredValue("roundCount", 3);

    const updateRounds = debounce(() => {
        const playerCount = parseInt(playerCountLabel.innerText);
        const roundCount = parseInt(roundCountLabel.innerText);

        if (isNaN(playerCount) || playerCount < 2 || isNaN(roundCount) || roundCount < 1) {
            alert("Введите корректные значения для количества участников и кругов.");
            return;
        }
    
        const players = Array.from({ length: playerCount }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    
        rounds = [];
        for (let round = 0; round < roundCount; round++) {
            const currentPlayers = players.filter(p => !(perRoundExclusions[round]?.includes(p)));
            const pairs = generatePairs(currentPlayers);
            rounds.push(pairs);
            rotatePlayers(players);
        }
    
        renderRounds();
    }, 300);
    
    const changeValue = (type, delta) => {
        const label = type === "playerCount" ? playerCountLabel : roundCountLabel;
        const currentValue = parseInt(label.innerText);
        const newValue = currentValue + delta;
    
        if ((type === "playerCount" && newValue >= 2) || (type === "roundCount" && newValue >= 1)) {
            label.innerText = newValue;
            localStorage.setItem(type, newValue);
            updateRounds();
        }
    };
    
    const generatePairs = players => {
        const pairs = [];
        const playerCount = players.length;
        const restingPlayer = playerCount % 2 !== 0 ? players.pop() : null;
    
        const half = Math.floor(players.length / 2);
        for (let i = 0; i < half; i++) {
            pairs.push(`${players[i]}-${players[players.length - 1 - i]}`);
        }
    
        if (restingPlayer !== null) {
            pairs.push(`<br>${restingPlayer} (нет пары ☹️)`);
        }
    
        return pairs;
    };
    
    const rotatePlayers = players => {
        if (players.length <= 2) return;
    
        const fixed = players[0];
        const rotating = players.slice(1);
        rotating.unshift(rotating.pop());
        players.splice(0, players.length, fixed, ...rotating);
    };
    
    const toggleExcludeForRound = (round, player) => {
        if (!perRoundExclusions[round]) {
            perRoundExclusions[round] = [];
        }
    
        const excluded = perRoundExclusions[round];
        if (excluded.includes(player)) {
            perRoundExclusions[round] = excluded.filter(p => p !== player);
        } else {
            excluded.push(player);
        }
    
        // Simply re-render the round without re-generating pairs
        renderRounds();
    };
    
    
    const updateRound = roundIndex => {
        const playerCount = parseInt(playerCountLabel.innerText);
        const players = Array.from({ length: playerCount }, (_, i) => i + 1);
        const currentPlayers = players.filter(p => !(perRoundExclusions[roundIndex]?.includes(p)));
    
        const newPairs = generatePairs(currentPlayers);
        rounds[roundIndex] = newPairs;
    
        renderRounds();
    };
    
    const renderRounds = () => {
        const output = document.getElementById("output");
        output.innerHTML = "";
    
        const table = document.createElement("table");
        const header = document.createElement("tr");
        header.innerHTML = `
            <th>#</th>
            <th>Пары 🤼</th>
            <th>Отдыхают 🏖️</th>
        `;
        table.appendChild(header);
    
        rounds.forEach((round, index) => {
            const row = document.createElement("tr");
            const excludedPlayers = perRoundExclusions[index] || [];
    
            // Process pairs and apply red styling to excluded players
            const styledPairs = round.map(pair => {
                return pair
                    .split("-") // Split pair into individual players
                    .map(player => {
                        const playerNumber = parseInt(player, 10);
                        return excludedPlayers.includes(playerNumber)
                            ? `<span style="color: red;">${player}</span>`
                            : player;
                    })
                    .join("-"); // Rejoin the pair with the separator
            });
    
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${styledPairs.join(", ")}</td>
            `;
    
            const excludeCell = document.createElement("td");
            const excludeControls = document.createElement("div");
            const playerCount = parseInt(playerCountLabel.innerText);
    
            for (let player = 1; player <= playerCount; player++) {
                const isExcluded = excludedPlayers.includes(player);
                const label = document.createElement("label");
                label.style.marginRight = "5px";
                label.innerHTML = `
                    <input 
                        type="checkbox" 
                        onchange="window.toggleExcludeForRound(${index}, ${player})" 
                        ${isExcluded ? "checked" : ""}
                    > ${player}
                `;
                excludeControls.appendChild(label);
            }
    
            excludeCell.appendChild(excludeControls);
            row.appendChild(excludeCell);
            table.appendChild(row);
        });
    
        output.appendChild(table);
    };
    

    document.querySelectorAll("button").forEach(button => {
        const type = button.getAttribute("data-type");
        const delta = parseInt(button.getAttribute("data-delta"), 10);
        button.addEventListener("click", () => changeValue(type, delta));
    });
    
    window.toggleExcludeForRound = toggleExcludeForRound; // Экспорт функции в глобальный контекст
    updateRounds();
});    
