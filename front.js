fs = require('fs');
sqlite = require('sqlite3');
remote = require('remote');
dialog = remote.require('dialog');
require('jquery-ui');
window.$ = window.jQuery = require('jquery');

window.onload = function init()
{
	out = $("#log");
};

function log(out, text)
{
	out.html(out.html() + text + "<br>");
	out.scrollTop(out.prop("scrollHeight")-out.height());
}

function createDB()
{
	$("#title").html("In progress")
	$("#contents").html("<p>Creating database...</p>");
	db = new sqlite.Database('db.sqlite3');
	if (db)
		$("#contents").append("<p>Database successfully created.</p>");
	else
		$("#contents").append("<p class='error'>Error creating database.</p>");
}

function listTables()
{
	$("#title").html("Listing tables");
	contents = "<table style=\"width:100%\"><tr><th>Table name</th><th>SQL</th><th>Actions</th></tr>";
	db.serialize(
		function ()
		{
			i = 0;
			db.each("select * from sqlite_master where type='table'",
			function (err, row)
			{
				i++;
				contents += "<tr><td>" + row.name + "</td><td>" + row.sql + "</td><td>" + 
				"<a href=\"javascript:displayTable('" + row.name + "')\">Display</a> " +
				"<a href=\"javascript:dropTable('" + row.name + "')\">Drop</a></td></tr>";
			},
			function()
			{
				if (i!=0)
					contents += "</table>";
				else
					contents = "Database is empty!";
				$("#contents").html(contents);
			});
		});
	$("#actions").html("<a href='javascript:createTable();'>New table</a>");
};

function displayResult(title,query,actions)
{
	$("#title").html(title);
	var iteration = 0;
	var contents;
	var processRow = function (err,row)
	{
		if (err)
			return;
		if (iteration==0)
		{
			contents = "<table style=\"width:100%\">";
			columnNames = Object.keys(row);
			for (index in columnNames)
				contents += "<th>" + columnNames[index] + "</th>";
			contents += "</tr>";
		}
		iteration++;
		contents += "<tr>";
		for (p in row)
			contents += "<td>" + row[p] + "</td>";
		contents += "</tr>";
	}
	
	var parseEnd = function()
	{
		if (iteration!=0)
			contents += "</table>";
		else
			contents = "Query returned null result!";
		
		contents += "<a href='javascript:listTables()'>View all tables</a>"
		$("#contents").html(contents);
	}
	
	
	db.each(query,processRow,parseEnd);
	
}

function displayTable(name)
{
	var query = "select * from " + name;
	displayResult("Showing table<br>" + name, query);
}

function dropTable(name)
{
	db.exec("drop table " + name);
	listTables();
}

function toggleConsole()
{
	var qtheight;
	if (typeof(qtheight) === "undefined")
		qtheight = $("#querytext").height() + "px";
	
	if ( $("#console-toggle-button").html() == "Hide")
	{
		$("#log").animate({height:"0px"},300);
		$("#console-toggle-button").html("Show");
		$("#querytext").hide("slide",{},300,function()
			{
				$("#querytext").hide();
				$("#log").hide();
			});
	}
	else
	{
		$("#querytext").show();
		$("#log").show();
		
		$("#log").animate({height:"20vh"},300);
		$("#console-toggle-button").html("Hide");
		$("#querytext").animate({height:qtheight},300);
	}
}

function executeQuery()
{
	var query = $("#querytext").val();
	log(out,"<b>" + query + "</b>");
		$("#title").html("Console query result");
	var iteration = 0;
	var contents;
	var ok = 0;
	var processRow = function (err,row)
	{
		if (iteration==0)
		{
			ok = 1;
			contents = "<table style=\"width:100%\">";
			columnNames = Object.keys(row);
			for (index in columnNames)
				contents += "<th>" + columnNames[index] + "</th>";
			contents += "</tr>";
		}
		iteration++;
		contents += "<tr>";
		for (p in row)
			contents += "<td>" + row[p] + "</td>";
		contents += "</tr>";
	}
	
	var parseEnd = function(err)
	{
		if (err)
			log(out,err);
		else
			log(out,"Query OK!");
		if (iteration!=0)
			contents += "</table>";
		else
			contents = "Query returned null result!";
		$("#contents").html(contents);
	}
	
	db.each(query,processRow,parseEnd);
}

function createTable()
{
	$("#title").html("Create table");
	$("#actions").html("<a href='javascript:listTables();'>View tables</a>");
	var contents = fs.readFileSync("newtable.html");
	$("#contents").html(contents.toString());
}

function openDialog()
{
	dialog.showOpenDialog(
		function(fileNames)
		{
			if (fileNames === undefined)
				return;
			openDB(fileNames[0]);
		});
}

function successMessage(message, timeout, endFunc)
{
	if (typeof timeout === 'undefined')
		timeout = 3000;
	var initialColor = $("#topbar").css("backgroundColor");
	$("#topbar-contents").animate({height:"0"},400);
	$("#topbar-popup").html(message);
	$("#topbar-popup").animate({height:"30px"},400);
	$("#topbar").animate({
		backgroundColor:"#0f0"
	},300);
	
	setTimeout(function(){
		if (typeof endFunc !== "undefined")
			endFunc();
		$("#topbar-contents").animate({height:"30px"},400);
		$("#topbar").animate({
		backgroundColor:initialColor
	},300);
		$("#topbar-popup").animate({height:"0px"},400);
	},timeout);
}

function openDB(fileName)
{
	if (typeof db !== 'undefined')
		db.close();
	db = new sqlite.Database(fileName);
	listTables();
	successMessage('Database opened successfully.',3000,function(){$("#dbname").html(fileName);});
}