const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDBObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
      SELECT
        *
      FROM 
        player_details;`;
  const playerArray = await db.all(getPlayerQuery);
  response.send(
    playerArray.map((eachArray) =>
      convertPlayerDBObjectToResponseObject(eachArray)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id=${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDBObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getPlayerQuery = `
    UPDATE
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;
  await db.run(getPlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id=${matchId};`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatchDBObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      *
    FROM 
      match_details NATURAL JOIN player_match_score
    WHERE 
      player_id=${playerId};`;
  const playerMatchArray = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchArray.map((eachMatch) =>
      convertMatchDBObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT 
      *
    FROM 
      player_details NATURAL JOIN player_match_score
    WHERE 
      match_id=${matchId};`;
  const playerMatchArray = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatchArray.map((eachPlayer) =>
      convertPlayerDBObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `
    SELECT 
      player_id,
      player_name,
      SUM(score),
      SUM(fours),
      SUM(sixes)
    FROM 
      player_details NATURAL JOIN player_match_score
    WHERE 
      player_id=${playerId};`;
  const playerStatistics = await db.get(getPlayerStatisticsQuery);
  response.send({
    playerId: playerStatistics.player_id,
    playerName: playerStatistics.player_name,
    totalScore: playerStatistics["SUM(score)"],
    totalFours: playerStatistics["SUM(fours)"],
    totalSixes: playerStatistics["SUM(sixes)"],
  });
});
module.exports = app;
