fs = require('fs');
sqlite = require('sqlite3');
remote = require('remote');
dialog = remote.require('dialog');
require('jquery-ui');
window.$ = window.jQuery = require('jquery');

window.onload = function init()
{
	out = $("#log");
	initialTopColor = $("#topbar").css("backgroundColor");
	ST = Object.create(SimpleTicker);
	var initialTopBar = `<a class="inline-link" href="javascript:newDialog();">New DB</a>
			<a class="inline-link" href="javascript:openDialog();">Open DB</a>
			<span id="dbname" style="float:right"></span>`;
	ST.init("#topbar",initialTopBar);
	
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
				"<a href=\"javascript:alterTable('" + row.name + "')\">Alter</a> " +
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
		{
			return;
		}
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
		
		contents += "<br><a href='javascript:listTables()'>View all tables</a>"
		$("#contents").html(contents);
	}
		
	db.each(query,processRow,parseEnd);
	
}

function displayTable(name)
{
	currentTable = name;
	executeQuery("SELECT * FROM " + name);
	$("#title").html('<span style="display:block; text-align:center; font-size:115%;">' + name + '</span></i>');
	actions = '<a href="javascript:insertIntoTable()">Insert into this table</a>' + 
				' <a href="javascript:focusIncrementalSearch()">Incremental search</a>' + 
				'<br><a href="javascript:listTables()">View all tables</a>' +
				'<br><a href="javascript:alterTable(\'' + name + '\')">Alter this table</a>' +
				'<br><a href="javascript:dropTable("' + name + '")">Drop this table</a> ';
	$("#actions").html(actions);
}

function dropTable(name)
{
	executeQuery("DROP TABLE " + name);
	listTables();
}

function toggleConsole()
{
	if (typeof(qtheight) === "undefined")
		qtheight = $("#querytext").height() + "px";
	if (typeof(qtwidth) === "undefined")
		qtwidth = $("#querytext").width() + "px";
	
	if ( $("#console-toggle-button").html() == "Hide")
	{
		$("#log").animate({height:"0px", width:"50px"},300);
		$("#console-toggle-button").html("Show");
		$("#querytext").animate({height: 0, width:"50px"},300,function()
			{
				$("#querytext").hide();
				$("#log").hide();
			});
	}
	else
	{
		$("#querytext").show();
		$("#log").show();
		
		$("#log").animate({height:"20vh", width: "80vw"},300);
		$("#console-toggle-button").html("Hide");
		$("#querytext").animate({height:qtheight, width: "80vw"},300);
	}
}

function focusIncrementalSearch()
{
	$("#incsearch").triggerHandler( "focus" );
}

function incrementalSearch()
{
	var searchval = $("#incsearch").val();
	for (var i=1;i<=queryRows;i++)
	{
		if ($("#row" + i).text().search(searchval) == -1)
			$("#row"+i).css("display","none");
		else
			$("#row"+i).css("display","table-row");
	}
}

function insertIntoTable()
{
	if ($("#insertRow").css("display")!="none")
	{
		ST.popdown();
		$("#insertRow").css("display","none");
		return;
	}
	ST.popup("<b>Inserting into table | </b> Complete the desired values and press Enter.","white");
	$("#insertRow").css("display","table-row");
	$("#addColumn0").focus();
	$("[id^=addColumn]").unbind();
	$("[id^=addColumn]").keyup(
	function (data)
	{
		var i = 0, l = columnNames.length;
		var dataArray = [];
		if (data.which==13)
		{
			var query = "INSERT INTO " + currentTable + " VALUES (";
			for (i=0;i<l-1;i++)
			{
				query += "?" + ", ";
				dataArray[i] = $("#addColumn"+i).val();
			}
			query += "?)";
			dataArray[i] = $("#addColumn"+i).val();
			console.log("addColumn"+i);
			db.run(query,dataArray,function(err){
				if (err)
				{
					ST.notify("Error adding new row: " + err, 5000, null, "red");
				}
				else
				{
					ST.notify("New row successfully added.");
					$("[id^=addColumn]").val('');
					$("[id=addColumn0]").focus();
					var newRow = "<tr>"
					for (i=0;i<l;i++)
						newRow += "<td>" + dataArray[i] + "</td>";
					newRow += "</tr>";
					$("[id=resultTable]").append(newRow);
				}
			});
		}
		
	})
	
}

function executeQuery(query, funcEndSuccess, funcEndError)
{
	if (typeof db === "undefined")
	{
		ST.notify("Query not executed. No open database!",5000,null,"red");
		return;
	}
	if (typeof query === "undefined")
	{
		$("#title").html("Console query result");
		query = $("#querytext").val();
	}
	else
		$("#title").html("Query result");
	
	log(out,"<b>> " + query + "</b>");
	queryRows = 0;
	var contents;
	var ok = 0;
	
	$("#contents").html('Query is running...');
	
	var processRow = function (err,row)
	{
		if (queryRows==0)
		{
			ok = 1;
			contents = "<table style=\"width:100%\" id='resultTable'>";
			columnNames = Object.keys(row);
			addRow = "<tr id='insertRow'>";
			var i = 0;
			for (index in columnNames)
			{
				contents += "<th>" + columnNames[index] + "</th>";
				addRow += '<td><input id="addColumn' + i + '" style="width:100%"/></td>';
				i++;
			}
			addRow += "</tr>";
			contents += "</tr>";
			contents += addRow + "<tr><td colspan=\"50\"><input placeholder='Incremental search through all columns' style='width:99%' id='incsearch'/></td></tr>";
		}
		
		queryRows++;
		contents += "<tr id='row" + queryRows + "'>";
		
		for (p in row)
			contents += "<td>" + row[p] + "</td>";
		
		contents += "</tr>";
	}
	
	var parseEnd = function(err)
	{
		var success = true;
		if (err)
		{
			log(out,err);
			lastErr = err;
			success = false;
			
			if ($("#console-toggle-button").html()=="Show")
				toggleConsole();
		}
		else
			log(out,"Query OK!");
		
		if (queryRows!=0)
		{
			contents += "</table>";
			$("#contents").html(contents);
			$("#incsearch").unbind();
			$("#incsearch").keyup(incrementalSearch);
			$("#incsearch").focus(function(){
				$("#incsearch").css("display","block");
				$("#incsearch").focus();
			});
			$("#incsearch").focusout(function(){
				$("#incsearch").css("display","none");
			});
		}
		else
		{
			contents = "Query returned null result!";
			$("#contents").html(contents);
			$("#actions").html("<a href='javascript:listTables();'>Display all tables</a>");
		}
		
		if (success && typeof funcEndSuccess !== "undefined" && funcEndSuccess != null)
			funcEndSuccess();
		if (!success && typeof funcEndError !== "undefined" && funcEndError != null)
			funcEndError();
		
	}
	
	db.each(query,processRow,parseEnd);
}

function createTable()
{
	$("#title").html("Create table");
	$("#actions").html("<a href='javascript:listTables();'>View all tables</a>");
	var contents = fs.readFileSync("html/newtable.html");
	$("#contents").html(contents.toString());
}

function alterTable(table)
{
	currentTable = table;
	$("#title").html("Altering table <i>" + table + "</li>");
	$("#actions").html("<a href='javascript:displayTable(\"" + table + "\")'>Display this table</a><br>" +
					"<a href='javascript:listTables();'>View all tables</a>");
	var contents = fs.readFileSync("html/altertable.html");
	$("#contents").html(contents.toString());
	$("#tablename").val(table);
}

function openDialog()
{
	dialog.showOpenDialog(
		function(fileNames)
		{
			if (typeof fileNames === 'undefined')
				return;
			openDB(fileNames[0]);
		});
}

function newDialog()
{
	dialog.showSaveDialog(
		function(fileName)
		{
			if (typeof fileName === 'undefined')
				return;
			$("#title").html("In progress")
			$("#contents").html("<p>Creating database...</p>");
			db = new sqlite.Database(fileName);
			if (db)
			{
				shortDBName = fileName.substring(fileName.lastIndexOf('\\')+1);
				ST.notify("Database <b>" + shortDBName + "</b> successfully created." );
				listTables();
			}
			else
			{
				ST.notify("Error creating database!",3000,null,"red");
				$("#contents").append("<p class='error'>Error creating database.</p>");
			}
		});
}

function openDB(fileName)
{
	if (typeof db !== 'undefined')
		db.close();
	db = new sqlite.Database(fileName);
	shortDBName = fileName.substring(fileName.lastIndexOf('\\')+1);
	listTables();
	ST.notify('Database <b>' + shortDBName + '</b> opened successfully.',3000,function(){$("#dbname").html(shortDBName);});
}