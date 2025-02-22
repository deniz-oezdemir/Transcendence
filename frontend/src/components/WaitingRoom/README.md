# frontend waiting room restyling Idea

```
@workspace at the top of the waiting room i want tow buttons: on the left "create match" and on the right  "create tournament", the latter should create 4 player tournament

below these buttons i want each a table with the respective matches and tournaments currently existing, they should be displayed as buttons which when clicked the player joins the match or tournament

below all of this there should be three more buttons: "play local" (for a local 1 vs 1 match), "play bot" (for a local 1 vs ai match) "delete game" (a user can delete their created match/tournament)
```

Collecting workspace informationBased on your requirements and the codebase, I'll help modify the WaitingRoom component. Here's the solution:

```js
// Modify the WaitingRoom layout in frontend/src/components/WaitingRoom/WaitingRoom.js

// Add these button row functions
const topButtonRow = createComponent('div', {
  className: styles.buttonRow,
  children: [
    createComponent('button', {
      className: styles.createButton,
      content: 'Create Match',
      events: { click: createRegularMatch }
    }),
    createComponent('button', {
      className: styles.createButton,
      content: 'Create Tournament (4 Players)',
      events: { click: createFourTournament }
    })
  ]
});

// Create tables for matches and tournaments
const matchTable = createComponent('div', {
  className: styles.gameTable,
  children: [
    createComponent('h3', { content: 'Available Matches' }),
    createComponent('div', {
      className: styles.tableContent,
      children: matches().map(match =>
        createComponent('button', {
          className: styles.gameButton,
          content: `Match ${match.match_id}: ${match.player_1_name} vs ${match.player_2_name || 'Waiting...'}`,
          events: { click: () => {
            if (match.player_2_id === null) {
              joinGame(match.match_id);
            }
          }}
        })
      )
    })
  ]
});

const tournamentTable = createComponent('div', {
  className: styles.gameTable,
  children: [
    createComponent('h3', { content: 'Available Tournaments' }),
    createComponent('div', {
      className: styles.tableContent,
      children: tournaments().map(tournament =>
        createComponent('button', {
          className: styles.gameButton,
          content: `Tournament ${tournament.tournament_id}: ${tournament.players.length}/${tournament.max_players} Players`,
          events: { click: () => {
            if (tournament.players.length < tournament.max_players) {
              joinTournament(tournament.tournament_id);
            }
          }}
        })
      )
    })
  ]
});

// Bottom button row
const bottomButtonRow = createComponent('div', {
  className: styles.buttonRow,
  children: [
    createComponent('button', {
      className: styles.actionButton,
      content: 'Play Local',
      events: { click: createLocalMatch }
    }),
    createComponent('button', {
      className: styles.actionButton,
      content: 'Play Bot',
      events: { click: aiGame }
    }),
    createComponent('button', {
      className: styles.deleteButton,
      content: 'Delete Game',
      events: { click: deleteGames }
    })
  ]
});

// Add CSS styles
```

```css
/* Add to your CSS module */
.buttonRow {
  display: flex;
  justify-content: space-between;
  margin: 1rem 0;
  gap: 1rem;
}

.gameTable {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.tableContent {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.createButton {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.gameButton {
  padding: 0.5rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.actionButton {
  padding: 0.5rem;
  background-color: #607D8B;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.deleteButton {
  padding: 0.5rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

This will create a layout with:

1. Two buttons at the top for creating matches and tournaments
2. Two tables showing available matches and tournaments
3. Three action buttons at the bottom

The existing functions from your code are used:
- `createRegularMatch()` - For creating standard matches
- `createFourTournament()` - For creating 4-player tournaments
- `createLocalMatch()` - For local matches
- `aiGame()` - For bot matches
- `deleteGames()` - For deleting games
- `joinGame()` - For joining matches
- `joinTournament()` - For joining tournaments

The tables will update automatically when the `matches()` and `tournaments()` signals change.


# TODO
delete file
