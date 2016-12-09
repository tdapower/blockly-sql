/*******************************************************************************
 * Start point of the Blockly SQL Generator. The main() function will be	   *
 * executed on loading the body tag. Some Visual functions are inside here.    *
 * 																			   *
 * @author Kirsten Schwarz, SPE Systemhaus GmbH (2013-2014)					   *
 * @author Michael Kolodziejczyk, SPE Systemhaus GmbH (since 2016)			   *
 *******************************************************************************/
 
var dbStructure = {};   	// Global Database Structure
var editor = null;      	// Global SQL Code Editor variable
var selected = null; 		// Object of the element to be moved
var x_pos = 0, y_pos = 0; 	// Stores x & y coordinates of the mouse pointer
var x_elem = 0, y_elem = 0; // Stores top, left values (edge) of the element

/**
 * Starting point of the Application. Initializing the Windows and
 * loading the Database Structure. When the Database Structure is loaded
 * the Blockly workspace will be initialized.
 */
function main() {
	initCodeEditor();
	initHelp();
	initError();
	initAddDSN();

	getDataSourceNames();

	/* Move/Drag behaviour */
	document.onmousemove = _move_elem;
	document.onmouseup = _destroy;
}

function initAddDSN() {
	var addDSNDiv = document.getElementById ('addDSN');
	document.getElementById ('addDSNBar').onmousedown = function () {
		return _drag_init (addDSNDiv);
	};
}

function addDataSourceName() {
	var form = document.getElementById("addDSNForm");
	var xhr = new XMLHttpRequest();

	xhr.open("POST", "backend/addDataSourceName.php", true);
	xhr.responseType = "json";

	xhr.onload = function() {
        if (xhr.status == 200)
			getDataSourceNames();			
    };

    xhr.send(new FormData(form));
}

/**
 * Initializing Blockly.
 */
function initBlockly() {
	if (Blockly.mainWorkspace)		/* Cleaning Workspace, if already one existed */
		Blockly.mainWorkspace.clear();	

	var Toolbox = Blockly.Blocks.init();
	var blocklyDiv = document.getElementById('blocklyDiv');
	var workspace = Blockly.inject(
		blocklyDiv,
		{
			toolbox: Toolbox,
			trashcan: true,
			media: SQLBlockly.MEDIA_PATH,
			zoom: {
				controls: true,
				wheel: true,
				startScale: 1.0,
				maxScale: 3,
				minScale: 0.3,
				scaleSpeed: 1.2
			},
			scrollbars: true
		}
	);
}

/**
 * Init drag for a specific Element.
 * 
 * @param {DOMNode} elem Element that should be dragable.
 * @return {boolean} false
 */
function _drag_init (elem) {
	// Store the object of the element which needs to be moved
	selected = elem;
	x_elem = x_pos - selected.offsetLeft;
	y_elem = y_pos - selected.offsetTop;

	return false;
}

/** 
 * Will be called when user dragging an element 
 */
function _move_elem (e) {
	x_pos = document.all ? window.event.clientX : e.pageX;
	y_pos = document.all ? window.event.clientY : e.pageY;

	if (selected !== null) {
		selected.style.left = (x_pos - x_elem) + 'px';
		selected.style.top = (y_pos - y_elem) + 'px';
	}
}

/** 
 * Destroy the selected movable object when we are done.
 */
function _destroy () {
	selected = null;
}

/**
 * Init movable help container.
 */
function initHelp() {
	var helpDiv = document.getElementById ('help');
	helpDiv.style.height = "0px";
	
	document.getElementById("sqlHelpBar").onmousedown = function () {
		return _drag_init (helpDiv);
	};

	document.getElementById ("helpcontent").onmousedown = function () {
		return _drag_init (helpDiv);
	};
}

/**
 * Initializing movable error container.
 */
function initError() {
	var errorDiv = document.getElementById ('errorSQL');
	document.getElementById ('sqlErrorBar').onmousedown = function () {
		return _drag_init (errorDiv);
	};
}

/**
 * Initializing the ACE Code Editor and registering it to
 * the sqlStatement TextArea. Making this area movable.
 */
function initCodeEditor() {
	editor = ace.edit("sqlStatement");
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/sql");
	editor.setHighlightActiveLine(false);
	editor.getSession().setUseWrapMode(true);
	editor.$blockScrolling = Infinity;

	var sqlArea = document.getElementById("writeSQL")
	var sqlEditorBar = document.getElementById("sqlEditorBar");
	sqlEditorBar.onmousedown = function () {
		return _drag_init (sqlArea);
	};
}

/**
 * Start parsing SQL from text, with Jison Parser. If an error is thrown
 * the old workspace will be reloaded.
 */
function parsingSQL() {
  var currentWorkspace = Blockly.mainWorkspace;
  var sqlStatement = editor.getValue();
  var tmpWorkspace = Blockly.Xml.workspaceToDom(currentWorkspace);
  Blockly.mainWorkspace.clear();
  closeErrorBox();

  try {
    parser.parse(sqlStatement);
  } catch (e) {
	Blockly.Xml.domToWorkspace(tmpWorkspace, currentWorkspace);
	openErrorBox(e.message);
	console.error(e);
  }
}

/**
 * Show Error Box window.
 */
function openErrorBox(errorMessage) {
	document.getElementById("errorSQL").style.display = "block";
	document.getElementById("sqlErrorMessage").value = errorMessage;
}

/**
 * Closing Error Box window.
 */
function closeErrorBox() {
	document.getElementById("errorSQL").style.display = "none";
	document.getElementById("sqlErrorMessage").value = "";
}

/**
 * Showing the SQL-statement text
 */
function showStatement() {
	generateSQLCode();
	openCodeEditor();
}

/**
 * Generating SQL Statement from Blockly Workspace and write into
 * the Code Editor window.
 */
function generateSQLCode() {
	var code = BlocklyPlugins.SQLGen.workspaceToCode(Blockly.mainWorkspace);
	if (code.length === 1 && code === ";")
		code = "";

	editor.setValue(code);
}

/**
 * Open the Code Editor window.
 */
function openCodeEditor() {
	document.getElementById('writeSQL').style.display = 'block';
}

/**
 * Closing Code Editor window.
 */
function closeCodeEditor() {
	document.getElementById("writeSQL").style.display = "none";	
}

/**
 * Closing all Popup windows on the workspace.
 */
function closeAllPopups() {
	closeCodeEditor();
	closeHelp();
	closeTooltip();
	closeErrorBox();
}

/**
 * Closes the help div
 */
function closeHelp() {
	var help = document.getElementById('help');
	help.style.display = "none";
}

/**
 * Setting the textarea tooltip
 */
function setTooltip() {
	var a = document.getElementById('tooltip');
	a.innerHTML = SQLBlocks.Msg.User.TOOLTIP_SQL_BOX;
	a.style.display = 'block';
}

/**
 * Closing the textarea tooltip
 */
function closeTooltip() {
	var a = document.getElementById('tooltip');
	a.innerHTML = "";
	a.style.display = 'none';
}

function getDataSourceNames() {
	var xhr = new XMLHttpRequest();
	
	xhr.open("GET", "backend/getDataSourceNames.php", true);
	xhr.responseType = "json"; 
	xhr.onload = function() {
        if (xhr.status == 200)
			updateDataSourceNames(xhr.response);			
    };

    xhr.send();
}

function updateDataSourceNames(dataSourceNames) {
	var select = document.getElementById("dataSourceNames");
	var first = true;

	/* Clearing old entries */
	while(select.firstChild) {
		select.removeChild(select.firstChild);
	}
	
	for (var dsnKey in dataSourceNames) {
		var dsn = dataSourceNames[dsnKey];
		var option = document.createElement("option");
		option.value = dsn;
		option.innerHTML = dsn;
		
		select.appendChild(option);

		if (first) {
			SQLBlockly.DSN = dsn;
			first = false;
		}
	}

	getDBStructure();
}

/**
 * Loading database Structure into the Global Database Structure variable.
 * A JSON file will be read from the folder "databases", which was generated.
 * 
 * @param {String} dsn Data Source Name of the ODBC connection.
 */
function loadDatabaseStructure(select) {
	var load = true;
	if (Blockly.mainWorkspace)
		load = confirm(SQLBlocks.Msg.User.CONFIRM_LOAD_WORKSPACE);

	if (!load) {
		select.value = SQLBlockly.DSN;
		return false;
	}

	SQLBlockly.DSN = select.value;
	getDBStructure();
}

function getDBStructure() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "databases/" + SQLBlockly.DSN + ".json", true);
    xhr.responseType = "json";
    xhr.onload = function() {
        var status = xhr.status;
        if (status == 200) {
			dbStructure = xhr.response;
			initBlockly();
        }
    };

    xhr.send();
}

/**
 * Get all existing tables of the global Database Structure variable
 * as Array.
 * 
 * @return {Array} tables All tables that 
 */
function getTablesArrayFromStructure() {
    return Object.keys(dbStructure);
}

/**
 * Get all columns of the global Database Structure variable by
 * a given table name as Array.
 * 
 * @param {String} tableName Name of the table, that should return his columns.
 * @return {Array} columns All columns that are in the table.
 */
function getColumnsArrayFromStructure(tableName) {
    return dbStructure[tableName];
}