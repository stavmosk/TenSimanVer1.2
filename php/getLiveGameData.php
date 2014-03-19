<?php

// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
}

// Save the given LiveGame id
$liveGameId = $_POST['liveGameId'];
$matchupId = $_POST["matchUpId"];

//include db connect class
require_once __DIR__ . '/db_connect.php';

//connecting to db
$db = new DB_CONNECT();

// If given LiveGame id is 0 or not existing, create a new game
if (!isset($_POST["liveGameId"]) || $liveGameId == 0) {
    //TODO: what if the matchUpId doesn't exist? need to create the matchup itself

    // TODO: create a new Game and send it back
    if (isset($_POST["matchUpId"])) {
            // Need to get random 5 movie ids
        $result = mysql_query("INSERT INTO `LiveGame` (`MainGameId`, `MovieId`, `ScorePlayer1`, `ScorePlayer2`, `AnswerPlayer1`, `AnswerPlayer2`) VALUES( '$matchupId', 2, 0, 0, '', '')");    
    }
}
 else {
     // TODO: try to get the live game (might fail so need to handle error - wrond id or invalid id)
     $result = mysql_query("SELECT * FROM LiveGame WHERE id=$liveGameId");
}
 
//// check if row inserted or not
    if ($result) {
        $response["success"] = 1;
        $response["message"] = "User successfully updated.";
        echo json_encode($response);
    } else {
//error
        $response["success"] = 0;
        $response["message"] = "Error";

// echo no users JSON
        echo json_encode($response);
    }
?>