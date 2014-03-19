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

if (isset($_REQUEST["matchId"])) {

    //array for JSON response 
    $response = array();
    $matchId = $_REQUEST['matchId'];
    
  // Todo: make it random.
    $sections = array();
    $videoIdArray = array();
    for ($x=1; $x<=5; $x++) {
    
    $sql ="SELECT * FROM `Movies` WHERE id ='$x'";
    $result = mysql_query($sql);
       
      if (mysql_num_rows($result) > 0) {
        $row = mysql_fetch_array($result);
        $videos = array();
        $videos["id"] = $row["id"];
        $videos["moviePath"] = $row["moviePath"];
        $videos["rightAnswer"] = $row["rightAnswer"];
        $videos["wrongOptions"] = $row["wrongOptions"];
        $sections[$x - 1] = $videos;
        $videoIdArray[$x - 1] = $row["id"];
       }
    }
    
    $response["sections"] = $sections;
    
$sectionIdArray = array("1","1","1","1","1");
for ($x=0; $x<=4; $x++)
  {
    $videoId = $videoIdArray[$x];
    $sql ="INSERT INTO `GameSections` (`gameId`, `videoId`, `scoreP1`, `scoreP2`, `answerP1`, `answerP2`) VALUES ('', '$videoId',0, 0, '', '')";
    $resultMatchup = mysql_query($sql);
    $id = mysql_insert_id();
    $sectionIdArray[$x] = $id;
  }

$result = mysql_query("INSERT INTO `Games_new` (`matchupId`, `status`, `section1`, `section2`, `section3`, `section4`, `section5`, `dateCreated`) VALUES ('$matchId', 1, '$sectionIdArray[0]',  '$sectionIdArray[1]',  '$sectionIdArray[2]',  '$sectionIdArray[3]',  '$sectionIdArray[4]', '2013-01-01 01:00:00')");    
$idCurGame = mysql_insert_id();


$sql ="SELECT * FROM `Matchups` WHERE id ='$matchId'";
$result = mysql_query($sql);
$lastGameId = NULL;
if (mysql_num_rows($result) > 0) {
    $row = mysql_fetch_array($result);
    $lastGameId = $row["currGameId"];
}

$sql = "UPDATE `Matchups` SET `currGameId`='$idCurGame', `lastGameId`='$lastGameId' WHERE id = '$matchId'";
$result = mysql_query($sql);

  
//// check if row inserted or not
    if ($result) {
        $response["success"] = 1; 
        $response["data"] = $idCurGame; 

        echo json_encode($response);
    } else {
//error
        $response["success"] = 0;
        $response["message"] = "Error in matchup";

// echo no users JSON
        echo json_encode($response);
    }
} else {
    //error
    $response["success"] = 0;
    $response["message"] = "Error in matchup";

//    echo no users JSON;
    echo json_encode($response);
}
?>