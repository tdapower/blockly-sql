<?php

/**
 * PHP Page to establish the database 
 * connection an write the database 
 * in an XML File. 
 */

$dsn = null;            /* Data Source Name */
$username = "";         /* Username to login in database */
$password = "";         /* Password to login in database */
$tableResource = null;  /* Resource Identifier for fetching the tables over ODBC */
$result = [];           /* Associative Array to save the needed strucutre of the DB */

/* Getting POST DATA and sanitizing it */
if (isset($_POST["dsn"]))
    $dsn = filter_var($_POST["dsn"], FILTER_SANITIZE_STRING);

if (isset($_POST["username"]))
    $username = filter_var($_POST["username"], FILTER_SANITIZE_STRING);

if (isset($_POST["password"]))
    $password = filter_var($_POST["password"], FILTER_SANITIZE_STRING);

/* Connecting to database over ODBC Connection */
$connection = odbc_connect($dsn, $username, $password);
if (!$connection) {
    exit("Connection Failed: " . $connection);
}

/* Fetching tables over ODBC */
$tableResource = odbc_tables($connection);
if (!$tableResource) {
    exit("Error while getting Table Information over ODBC!");
}

/** 
 * Fetching tables, columns and column types and build an assoc array 
 * to encode it into JSON and save it on disk.
 */
while (odbc_fetch_row($tableResource)) {
    $tableName = odbc_result($tableResource, "TABLE_NAME"); /* Getting table name of resource */
    $columnInformation = [];                                /* To save the Column objects */

    /* Fetching column of the current table */
    $columnResource = odbc_columns($connection, "", "%", $tableName, "%");
    if (!$columnResource) {
        exit("Error while getting Column Information over ODBC!");
    }

    /* Traversing columns and adding it to the result array */
    while (odbc_fetch_row($columnResource)) {
        $columnObject = array(
            "name" => odbc_result($columnResource, "COLUMN_NAME"),
            "type" => odbc_result($columnResource, "TYPE_NAME")
        );

        array_push($columnInformation, $columnObject);
    }

    $result[$tableName] = $columnInformation;
}

odbc_close($connection);

/* Save result as JSON into a file in the databases folder */
if ($dsn) {
    $jfHandle = fopen("../databases/" . $dsn . ".json", "w");
    fwrite($jfHandle, json_encode($result)); 
    fclose($jfHandle);
}
?>