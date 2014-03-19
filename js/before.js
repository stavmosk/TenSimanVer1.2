/** active user variables */
var connected = false;
var uid;
var accessToken;
var fullName;
var userActiveGames = []; // current list of act
//
//
//ive games for this user.
var currentGameID = 0;


//*****************************************************************************
// Server functions
//*****************************************************************************

var ajaxcall = function(method, url, onready, body, showReload) {

    if (showReload == null) {
        $.mobile.showPageLoadingMsg("", "Get ready to ShowSomething!");
    }

    var request = false;
    request = new XMLHttpRequest();

    if (request) {

        request.open(method, url);
        request.onreadystatechange = function() {
            if (request.readyState == 4 &&
                    request.status == 200) {
                onready(request);
            }
        };
        request.send(body);
    }
};


//*****************************************************************************
// 
//*****************************************************************************

/**
 * Defines a game relative for this user.
 * 
 * @param {type} gameID - current game
 * @param {type} opponentID - user's opponent
 * @param {type} nextPlayer - 1 if you're the next player, else 0
 * @param {type} nextRole - the next state for this player (r - riddler, g - guesser)
 * @returns {Game}
 */
function Game(gameID, opponentID, nextPlayer, nextRole) {
    this._id = gameID;
    this.opponentID = opponentID;
    this.nextPlayer = nextPlayer;
    this.nextRole = nextRole;
}


//*****************************************************************************
// Facebook functions
//*****************************************************************************

function facebookStatusChange(response) {

    if (response.status === 'connected') {
        uid = response.authResponse.userID;
        accessToken = response.authResponse.accessToken;
         alert("2");
        facebookLoggedIn();
         alert("3");

    } else if (response.status === 'not_authorized') {
        // the user is logged in to Facebook, 
        // but has not authenticated your app
        connected = false;
        alert("You must authenticate the app on your Facebook account! Please login again.");
       // $.mobile.changePage("#pageLogin");
    } else {
        // the user isn't logged in to Facebook.
        connected = false;
       // $.mobile.changePage("#pageLogin");
    }
}

function loginFacebookUser() {
    FB.login(function(response) {
        if (response.authResponse) {
            facebookLoggedIn();
        } else {
            alert('User cancelled login or did not fully authorize.');
        }
    });
}

function logoutFacebookUser() {
    FB.logout(function(response) {
        alert("Your friends are waiting for you to ShowSomething! Come back soon... :)")
        $.mobile.changePage("#pageLogin");
    });
}

function facebookLoggedIn() {

    if (connected === true) {
        return;
    }
    connected = true;


    FB.api('/me', function(response) {
        ajaxcall("POST", "users/" + response.id, function() {
        }, "", true);
        fullName = response.name;
        $.mobile.changePage("#pageMainMenu?reload");
    });

    // trigger page create on the generated words page once the app is loaded
    $('#pageGeneratedWords').trigger('create');

}

function sendRequestViaMultiFriendSelector() {
    FB.ui({method: "apprequests", message: "I've just challanged you on ShowSomething!"}, requestCallback);
}

function requestCallback(response) {

    // register the friend
    opponentID = response.to[0];
    console.log("Opponent ID = " + opponentID);
    ajaxcall("POST", "users/" + opponentID, function() {

        // create a new game
        ajaxcall("POST", "games", function(response2) {
            game = JSON.parse(response2.responseText);
            currentGameID = game._id;
            yourTurnRiddler(game);
        }, '{"uid0": "' + uid + '", "uid1": "' + opponentID + '"}', true);

    }, "", true);

}

function setNameInHtml(opponentID) {
    FB.api("/" + opponentID, function(response) {
        $("." + opponentID + "Name").each(function() {
            $(this).html(response.name);
        });
    });
}


//*****************************************************************************
// Client-side functions
//*****************************************************************************

/**
 * Updates the current game state for the riddler and goes to the 
 * generated word page with the appropriate set of words,
 * if user has already chosen words, collects his choises from server and
 * updates the relevant page
 * @param {type} game
 * @returns {undefined}
 */
function yourTurnRiddler(game) {

    currentGameID = game._id;

    ajaxcall("GET", "turn/r/" + currentGameID, function(res) {

        response = JSON.parse(res.responseText);

        // no previous game was found
        if (response == 0) {

            // let the user choose new words
            $.mobile.changePage("#pageSelectDifficulty");
        }

        // get the already chosen words from server
        else {

            // check if a word was already chosen
            chosenWord = response.chosenWord;
            if (chosenWord == -1) {

                // move to pageGeneratedWords with chosen words
                chosenWords = [];
                chosenWords.push(response.word0);
                chosenWords.push(response.word1);
                chosenWords.push(response.word2);
                chosenWords.push(response.word3);
                chosenWords.push(response.word4);
                updateChosenWords(chosenWords);

            }

            // user already chosen a word
            else {
                // move to pagePrePicture
                gotoPagePrePictureScreen(chosenWord);
            }
        }

    });

}

/**
 * updatess server after riddler has chosen his word difficulty
 * @returns {undefined}
 */
function transferChosenWord() {

    // finds out which word was checked
    chosenWord = $('#wordsPresented :checked').val();

    ajaxcall("PUT", "turn/r/" + currentGameID, function() {
        gotoPagePrePictureScreen(chosenWord);
    }, chosenWord);

}

/**
 * Generates words according to the level chosen by the riddler
 * @param {type} diff
 * @returns {undefined}
 */
function generateWords(diff) {

    ajaxcall("GET", "game/generate/" + currentGameID + "/" + diff, function(response) {
        words = JSON.parse(response.responseText);
        updateChosenWords(words);
    });

}

/**
 * Updates the gussing page with information sent by the riddler
 * @param {type} game
 * @returns {undefined}
 */
function yourTurnGuesser(game) {
    currentGameID = game._id;
    $("#riddleName").addClass(game.opponentID + 'Name');
    setNameInHtml(game.opponentID);

    document.getElementById('riddle-answer').reset(); // reset form

    var image = document.createElement('img');
    image.src = "img/loading.gif";
    $(image).addClass('fit-width');
    document.getElementById('riddleImageDiv').innerHTML = "";
    document.getElementById('riddleImageDiv').appendChild(image);


    ajaxcall("GET", "turn/g/" + game._id, function(res) {
        response = JSON.parse(res.responseText);

        $("#riddleAnswer").attr('maxlength', response.word);
        $("#riddleAnswer").attr('placeholder', 'word length is: ' + response.word);
        $("#riddleGameId").attr('value', game._id);

        $.mobile.changePage("#pageGuess");
    });

    $(document).bind('pagechange', function() {
        ajaxcall("GET", "turn/g/" + game._id + "/photo", function(res2) {
            var image = document.createElement('img');
            image.src = res2.responseText;
            $(image).addClass('fit-width');
            document.getElementById('riddleImageDiv').innerHTML = "";
            document.getElementById('riddleImageDiv').appendChild(image);
        }, "", true);
    });

}

/**
 * Validates the guess made by the guesser
 * @returns {Boolean}
 */
function validateGuess() {

    // gets the guess
    gameId = document.forms["riddle-answer"]["riddleGameId"].value;
    answer = document.forms["riddle-answer"]["riddleAnswer"].value;

    // validate the guess with info from the server

    ajaxcall("POST", "/turn/g/" + gameId, function(res) {

        response = res.responseText;

        if (response == "correct") {
            alert("Excellent! You're right! Now it's your time to ShowSomething!");
            $.mobile.changePage("#pageMainMenu?reload");
        } else { // response == number of tries left

            // more tries available
            if (response != 0) {
                alert("Oops! Wrong answer. you have " + response + " tries left! Do try again!");
            }

            // no more tries left
            else {

                // ends this game and moves to next state
                giveup();

            }

        }

    }, answer, true);

    // You must return false to prevent the default form behavior
    return false;
}

// let the server know that the user has given up
function giveup() {

    ajaxcall("get", "/turn/g/giveup/" + currentGameID, function(res) {

        response = JSON.parse(res.responseText);

        if (response == true) {
            alert("Nice Try! more luck next time! it's your turn to ShowSomething!");
            $.mobile.changePage("#pageMainMenu?reload");
        }

    });

}

/**
 * Creates a new game between the user and the chosen opponenet
 * @param {type} opponentID
 * @returns {undefined}
 */
//function createNewGame(opponentID) {
//    ajaxcall("POST", "games", function(response) {
//        game = JSON.parse(response.responseText);
//        currentGameID = game._id;
//        yourTurnRiddler(game);
//    }, '{"uid0": "' + uid + '", "uid1": "' + opponentID + '"}', true);
//}

/**
 * Checks if a game between this user and the given opponenets id is an active game
 * @param {type} userID
 * @returns {Boolean}
 */
function isInActiveGames(userID) {
    for (activeGameIndex = 0; activeGameIndex < userActiveGames.length; ++activeGameIndex) {
        if (userActiveGames[activeGameIndex].opponentID == userID) {
            return true;
        }
    }
    return false;
}

function deleteGame(gameID) {

    ajaxcall("DELETE", "/game/" + gameID, function() {

        // removes the game from the list view
        $('#' + gameID + 'li').remove();
        $('#testlist').trigger('create');

        // removes the game from the active games list
        findAndRemove(userActiveGames, '_id', gameID);

        alert("The game has been deleted.");

    }, "", true);
}

//*****************************************************************************
// Page constructing helper functions
//*****************************************************************************

/**
 * Builds the list of words to be chosen from
 * @param {type} chosenWords
 * @returns {undefined}
 */
function updateChosenWords(chosenWords) {

    for (i = 0; i < 5; i++) {
        $('#for-choice-' + i).trigger('create');
    }

    // updates the currect buttons
    for (i = 0; i < 5; i++) {

        // sets the value for this button
        button = document.getElementById('choice-' + i + '');
        button.setAttribute('value', chosenWords[i]);

        label = document.getElementById('for-choice-' + i);
        label.innerHTML = '<span class="ui-btn-inner"><span class="ui-btn-text">' + chosenWords[i] + '</span><span class="ui-icon ui-icon-radio-off ui-icon-shadow">&nbsp;</span></span>';
    }

    // gets to the actual page
    $.mobile.changePage("#pageGeneratedWords");
}

/**
 * transfers the user to the pre picture screen with his chosen word to depict
 * @param {type} chosenWord
 * @returns {undefined}
 */
function gotoPagePrePictureScreen(chosenWord) {
    document.getElementById("sendPicture").reset(); // resets the uplaod form
    $('#picturePreview').attr('src', 'img/pre_upload.png');
    label = document.getElementById('chosenWord');
    label.innerHTML = chosenWord;
    $.mobile.changePage("#pagePrePicture");
}

/**
 * Shows the picture uploaded by the user
 * @param {type} files
 * @returns {undefined}
 */
function showPicture(files) {
    file = files[0];
    fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = function(event) {
        imageBlob = event.target.result;
        console.log("image size before = " + imageBlob.length);
        imageBlobFileName = files[0].name; //Should be 'picture.jpg'
        $('#picturePreview').attr('src', imageBlob);
    };
}

function filePreview() {
    $('#fileToUpload').click();
}

/**
 * Uploads the picture to the server - not implemented yet
 * @returns {undefined}
 */
function fileUpload() {
    alert("The picture is now being sent to your friend! Please wait a moment.");
    $.mobile.showPageLoadingMsg("", "Get ready to ShowSomething!");
    var reducedImage = reduceImage(document.getElementById('picturePreview'));
    ajaxcall("POST", "/turn/r", function() {
        $.mobile.changePage("#pageMainMenu?reload");
    }, JSON.stringify({gameID: currentGameID, word: chosenWord, photo: reducedImage, triesLeft: 5}));
}

function reduceImage(img) {
    var canvas = document.getElementById("imageCanvas");
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    var MAX_WIDTH = 800;
    var MAX_HEIGHT = 600;
    var width = img.width;
    var height = img.height;
    if (width > height) {
        if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
        }
    } else {
        if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
        }
    }
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    
    var reducedImage = canvas.toDataURL("image/png")
    console.log("image size after = " + reducedImage.length);
    
    return reducedImage;
}

/**
 * reusable sort function, sort by any field
 * @param {type} field
 * @param {type} reverse
 * @param {type} primer
 * @returns {unresolved}
 */
var sort_by = function(field, reverse, primer) {

    var key = function(x) {
        return primer ? primer(x[field]) : x[field]
    };

    return function(a, b) {
        var A = key(a), B = key(b);
        return ((((A < B) ? -1 : (A > B) ? +1 : 0)) * [-1, 1][+!!reverse]);
    };
};

function findAndRemove(array, property, value) {
    $.each(array, function(index, result) {
        if (result[property] == value) {
            //Remove from array
            array.splice(index, 1);
        }
    });
}


//*****************************************************************************
// Dynamic pages loading
//*****************************************************************************

/**
 * used for dinamically injecting a page - pageMainManu and pageNewGAme
 * @param {type} pageSelector
 * @param {type} callback
 * @returns {undefined}
 */
function reloadPage(pageSelector, callback) {

    $(pageSelector).remove(); // removes the current page
    pageID = pageSelector.replace(/#/, "");

    // bulids similar parts for both pages
    $("body").append('<section data-role="page" id="' + pageID + '" data-theme="a"></section>');
    $(pageSelector).append('<div data-role="content" id="' + pageID + 'Content"></div>');
    $(pageSelector).append('<footer data-role="footer" id="' + pageID + 'Footer" data-position="fixed"></footer>');

    // choses which page to build now
    if (pageSelector === "#pageMainMenu") {
        reloadPageMainMenu(pageSelector, callback);
    } else if (pageSelector === "#pageNewGame") {
        reloadPageNewGame(pageSelector, callback);
    }

}

/**
 * Injecting the main manu page
 * @param {type} pageSelector
 * @param {type} callback
 * @returns {undefined}
 */
function reloadPageMainMenu(pageSelector, callback) {

    popupString = '<div data-role="popup" id="popupSettings"> <ul data-role="listview" data-inset="true" style="min-width:210px;"> <li data-role="divider" data-theme="b">Options</li><li><a href="#pageHelp">Help</a></li> <li><a href="#pageAbout">About</a></li> <li><a href="javascript: logoutFacebookUser();">Logout from Facebook</a></li> </ul> </div>';

    $(pageSelector).append('<header data-role="header" data-position="fixed"><h1><a href="http://showsomething.aws.af.cm/" target="_self"><img src="img/logo_trans.png" alt="ShowSomething"></a></h1><a href="#popupSettings" data-rel="popup" data-role="button" data-inline="true" data-transition="slideup" data-icon="gear" class="ui-btn-right">&zwnj;</a>' + popupString + '</header>');
    $(pageSelector + 'Footer').append('<h3>See If You Know What You See!</h3>');

    // displays a welcome message to the user
    $(pageSelector + 'Content').append('<div id="welcomeUser"></div>');

    FB.api('/me', function(response) {
        $("#welcomeUser").html("Welcome " + response.name + "!");
    });

    $(pageSelector + 'Content').append('<div><a href="#pageNewGame?reload" data-role="button" data-transition="flip">Create New Game</a></div>');

    $(pageSelector + 'Content').append('<ul data-role="listview" id="testlist" data-inset="true" data-split-icon="delete"></ul>');

    userActiveGames = [];


    ajaxcall("GET", "games/" + uid, function(response) {

        userActiveGames = JSON.parse(response.responseText);
        console.log("Got active games: " + JSON.stringify(userActiveGames));
        if (userActiveGames != null)
        {
            if (userActiveGames.length == 0) {
                $(pageSelector + 'Content').append("<h3>You have no active games. Isn't it about time to create a new one?</h3>")
            }

            for (i = 0; i < userActiveGames.length; ++i) {
                gameId = userActiveGames[i]._id;
                opponentID = userActiveGames[i].opponentID;
                setNameInHtml(opponentID);
                photo = 'http://graph.facebook.com/' + opponentID + '/picture?width=80&height=80';
                nextPlayer = userActiveGames[i].nextPlayer;
                nextRole = userActiveGames[i].nextRole;
                actionMessage = "";
                link = "";
                if (nextPlayer == 0) {
                    actionMessage = 'Waiting for <span class="' + opponentID + 'Name"></span> to move.';
                    link = '';
                } else if (nextRole == "r") {
                    actionMessage = "Your Move!";
                    link = 'href="javascript: yourTurnRiddler(userActiveGames[' + i + ']);"';
                } else { // nextRole == "g"
                    actionMessage = "Your Move!";
                    link = 'href="javascript: yourTurnGuesser(userActiveGames[' + i + ']);"';
                }
                gameItem = '<li id="' + gameId + 'li"><a ' + link + ' ><img src="' + photo + '"><h2 class="' + opponentID + 'Name"></h2><p>' + actionMessage + '</p></a><a href="javascript: deleteGame(\'' + gameId + '\');" class="fix-border"></a></li>';
                $("#testlist").append(gameItem);
            }

            $page = $(pageSelector);
            $content = $page.children(":jqmData(role=content)");

            // Pages are lazily enhanced. We call page() on the page
            // element to make sure it is always enhanced before we
            // attempt to enhance the listview markup we just injected.
            // Subsequent calls to page() are ignored since a page/widget
            // can only be enhanced once.
            $page.page();

            // Enhance the listview we just injected.
            $content.find(":jqmData(role=listview)").listview();

            // We don't want the data-url of the page we just modified
            // to be the url that shows up in the browser's location field,
            // so set the dataUrl option to the URL for the category
            // we just loaded.
            //    options.dataUrl = u.href;

            callback();
        }

    });

}

/**
 * Injects page newGame
 * @param {type} pageSelector
 * @param {type} callback
 * @returns {undefined}
 */
function reloadPageNewGame(pageSelector, callback) {

    $(pageSelector + 'Footer').append('<div><a href=#pageMainMenu?reload data-role="button" data-min="true">Cancel</a></div>');

    $(pageSelector + 'Content').append('<div><a href="javascript: sendRequestViaMultiFriendSelector();" data-role="button">Invite a friend!</a></div>');

    $(pageSelector + 'Content').append('<strong>Or, choose from existing:</strong><br><br><div><ul data-role="listview" data-filter="true" data-filter-placeholder="Type a name..." id="friendsList"></ul></div>');

    // in the end
    $page = $(pageSelector);
    $content = $page.children(":jqmData(role=content)");


    ajaxcall("GET", "users", function(response) {

        registeredUsersDB = JSON.parse(response.responseText);
        registeredUsers = [];

        console.log("Got registered users: " + JSON.stringify(registeredUsersDB));

        // creates an array of only user id's
        for (i = 0; i < registeredUsersDB.length; ++i) {
            registeredUsers.push(registeredUsersDB[i].uid);
        }

        FB.api('/me/friends', function(response) {

            // sorts the response array by the users' names
            response.data.sort(sort_by('name', true, function(a) {
                return a.toUpperCase();
            }));

            for (i = 0; i < response.data.length; i++) {
                if ($.inArray(response.data[i].id, registeredUsers) > -1) {
                    if (!isInActiveGames(response.data[i].id)) {
                        id = response.data[i].id;
                        name = response.data[i].name;
                        actionMessage = "Start a new game with " + name + "!";
                        photo = 'http://graph.facebook.com/' + id + '/picture?width=80&height=80';
                        link = 'href="javascript: createNewGame(' + id + ');"';
                        friendItem = '<li><a ' + link + ' ><img src="' + photo + '"><h2>' + name + '</h2><p>' + actionMessage + '</p></a></li>';
                        $("#friendsList").append(friendItem);
                    }
                }
            }

            // if the list is empty
            if ($("#friendsList").children().length == 0) {
                $(pageSelector).prepend('<header data-role="header" data-position="fixed"><h1><a href="#pageMainMenu?reload"><img src="img/logo_trans.png" alt="ShowSomething"></a></h1></header>');
                $(pageSelector + 'Content').empty();
                $(pageSelector + 'Content').append('<br><br><h3>None of your friends is playing ShowSomething</h3>');
				$(pageSelector + 'Content').append('<div><a href="javascript: sendRequestViaMultiFriendSelector();" data-role="button">Invite a friend!</a></div>');
            }

            $page = $(pageSelector);
            $content = $page.children(":jqmData(role=content)");

            // Pages are lazily enhanced. We call page() on the page
            // element to make sure it is always enhanced before we
            // attempt to enhance the listview markup we just injected.
            // Subsequent calls to page() are ignored since a page/widget
            // can only be enhanced once.
            $page.page();

            // Enhance the listview we just injected.
            $content.find(":jqmData(role=listview)").listview();

            // We don't want the data-url of the page we just modified
            // to be the url that shows up in the browser's location field,
            // so set the dataUrl option to the URL for the category
            // we just loaded.
            //    options.dataUrl = u.href;

            callback();

        });

    });

}