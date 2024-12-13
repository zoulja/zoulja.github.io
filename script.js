document.addEventListener("DOMContentLoaded", () => {
    // Theme Toggle Logic
    const themeSwitch = document.getElementById('theme-switch');
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.classList.add('dark-theme');
        themeSwitch.checked = true;
    }
    
    themeSwitch.addEventListener('change', () => {
        document.documentElement.classList.toggle('dark-theme');
        localStorage.setItem('theme', 
            document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light'
        );
    });

    // Balanced Pairing Algorithm
    const pairHistory = new Map();
    const config = {
        minPlayers: 2,
        maxPlayers: 20,
        minRounds: 1,
        maxRounds: 10
    };

    const elements = {
        playerCountLabel: document.getElementById("playerCountLabel"),
        roundCountLabel: document.getElementById("roundCountLabel"),
        output: document.getElementById("output")
    };

    function initializePairHistory(players) {
        players.forEach(player => {
            pairHistory.set(player, new Set());
        });
    }

    function calculatePairScore(player1, player2) {
        return pairHistory.get(player1).has(player2) ? 1 : 0;
    }

    function findOptimalPair(availablePlayers) {
        let bestPair = null;
        let lowestScore = Infinity;

        for (let i = 0; i < availablePlayers.length; i++) {
            for (let j = i + 1; j < availablePlayers.length; j++) {
                const player1 = availablePlayers[i];
                const player2 = availablePlayers[j];
                const pairScore = calculatePairScore(player1, player2);

                if (pairScore < lowestScore) {
                    bestPair = [player1, player2];
                    lowestScore = pairScore;
                }
            }
        }

        return bestPair;
    }

    function generateBalancedPairs(players) {
        initializePairHistory(players);
        const rounds = [];
        const availablePlayers = [...players];

        const createRound = () => {
            const currentRoundPairs = [];
            const roundPlayers = [...availablePlayers];

            while (roundPlayers.length >= 2) {
                const [player1, player2] = findOptimalPair(roundPlayers);
                
                currentRoundPairs.push(`${player1}-${player2}`);
                
                // Update pair history
                pairHistory.get(player1).add(player2);
                pairHistory.get(player2).add(player1);

                // Remove paired players
                roundPlayers.splice(roundPlayers.indexOf(player1), 1);
                roundPlayers.splice(roundPlayers.indexOf(player2), 1);
            }

            // Handle odd player if exists
            if (roundPlayers.length === 1) {
                currentRoundPairs.push(`${roundPlayers[0]} (нет пары ☹️)`);
            }

            return currentRoundPairs;
        };

        // Rotate players after each round
        const rotatePlayers = () => {
            if (availablePlayers.length <= 2) return;
            const fixed = availablePlayers[0];
            const rotating = availablePlayers.slice(1);
            rotating.push(rotating.shift());
            availablePlayers.splice(0, availablePlayers.length, fixed, ...rotating);
        };

        // Generate rounds
        for (let i = 0; i < parseInt(elements.roundCountLabel.innerText); i++) {
            rounds.push(createRound());
            rotatePlayers();
        }

        return rounds;
    }

    const getStoredValue = (key, defaultValue) =>
        localStorage.getItem(key) ? parseInt(localStorage.getItem(key), 10) : defaultValue;

    elements.playerCountLabel.innerText = getStoredValue("playerCount", 10);
    elements.roundCountLabel.innerText = getStoredValue("roundCount", 3);

    const changeValue = (type, delta) => {
        const label = type === "playerCount" ? elements.playerCountLabel : elements.roundCountLabel;
        const currentValue = parseInt(label.innerText);
        const newValue = currentValue + delta;

        const { minPlayers, maxPlayers, minRounds, maxRounds } = config;
        const isValid = type === 'playerCount' 
            ? (newValue >= minPlayers && newValue <= maxPlayers)
            : (newValue >= minRounds && newValue <= maxRounds);

        if (isValid) {
            label.innerText = newValue;
            localStorage.setItem(type, newValue);
            updateRounds();
        } else {
            alert(`Допустимое количество ${type === 'playerCount' ? 'игроков' : 'кругов'}: ${type === 'playerCount' ? minPlayers : minRounds} - ${type === 'playerCount' ? maxPlayers : maxRounds}`);
        }
    };

    const renderRounds = (rounds) => {
        elements.output.innerHTML = "";
        const table = document.createElement("table");
        
        // Create header
        const header = document.createElement("tr");
        header.innerHTML = `
            <th>#</th>
            <th>Пары 🤼</th>
        `;
        table.appendChild(header);

        // Create rows for each round
        rounds.forEach((round, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${round.join(", ")}</td>
            `;
            table.appendChild(row);
        });

        elements.output.appendChild(table);
    };

    const updateRounds = () => {
        const playerCount = parseInt(elements.playerCountLabel.innerText);
        const players = Array.from({ length: playerCount }, (_, i) => i + 1);
        
        const rounds = generateBalancedPairs(players);
        renderRounds(rounds);
    };

    // Event listeners for buttons
    document.querySelectorAll("button").forEach(button => {
        const type = button.getAttribute("data-type");
        const delta = parseInt(button.getAttribute("data-delta"), 10);
        button.addEventListener("click", () => changeValue(type, delta));
    });

    // Initial rounds generation
    updateRounds();
});
