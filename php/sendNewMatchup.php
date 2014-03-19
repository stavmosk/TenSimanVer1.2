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
$name = $_POST['value'];
//
//$url = 'http://en.wikipedia.org/wiki/Steve_Jobs';
//document . url . get_content;

//include db connect class
require_once __DIR__ . '/db_connect.php';

//connecting to db
$db = new DB_CONNECT();

if (isset($_REQUEST["myUserId"]) && isset($_REQUEST["playerUserId"])) {

    //array for JSON response 
    $response = array();
    $myUserId = $_REQUEST['myUserId'];
    $rivalId = $_REQUEST['playerUserId'];
    

$sql = "INSERT INTO `Matchups` (`player1`, `player2`, `scoreP1`, `scoreP2`, `lastUpdate`, `currGameId`, `lastGameId`) VALUES ('$myUserId', '$rivalId', '0', '0', '2013-01-01 01:00:00', NULL, NULL)";    
$resultMatchup = mysql_query($sql);
$idMatchup = mysql_insert_id();



//// check if row inserted or not
    if ($resultMatchup) {
        $response["success"] = 1; 
        $response["data"] = $idMatchup;
        echo json_encode($response);
    } else {
//error
        $response["success"] = 0;
        $response["message"] = "Error in matchup!";

// echo no users JSON
        echo json_encode($response);
    }
} else {
    //error
    $response["success"] = 0;
    $response["message"] = "Error in matchup...";

//    echo no users JSON;
    echo json_encode($response);
}
?>