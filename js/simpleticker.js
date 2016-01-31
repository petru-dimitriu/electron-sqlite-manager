/*

	SimpleTicker - simple ticker widget
	version 0.0.1

*/

SimpleTicker = {
	init : function (container, initialContent)
	{
		if (typeof initialContent === 'undefined')
			initialContent = "";
		
		var inner = `<div id = "ticker-contents"> ` + initialContent + `</div><div id = "ticker-contents2"></div>`;
		$(container).html(inner);
		$(container).css("overflow","hidden");
		
		this.container = $(container);
		this.contents = this.container.children("#ticker-contents");
		this.contents2 = this.container.children("#ticker-contents2");
		this.timeout = 3000;
		this.initialBgColor = this.container.css("backgroundColor");
		this.speed = 400;
		this.lastTimeOut = 0;
	},
	
	popup : function (message, color)
	{
		my = this;
		if (typeof my.container === 'undefined')
			throw new Error("Ticker not initialized");
		
		my.contents.animate({height:"0"},my.speed);
		my.contents2.html(message);
		my.contents2.animate({height:"30px"},my.speed);
		
		my.container.animate({ backgroundColor:typeof color === "undefined" ? "#0f0" : color },my.speed);
	},
	
	popdown : function (endFunc)
	{
		if (typeof endFunc !== "undefined" && endFunc != null)
			endFunc();
		my.contents.animate({height:"30px"},my.speed);
		my.container.animate({backgroundColor:my.initialBgColor },my.speed);
		my.contents2.animate({height:"0px"},my.speed);
		my.lastTimeOut = 0;
	},
	
	notify : function(message, timeout, endFunc, color)
	{
		my = this;
		
		if (typeof my.container === 'undefined')
			throw new Error("Ticker not initialized");
		
		if (typeof timeout === 'undefined')
			timeout = my.timeout;
		
		my.contents.animate({height:"0"},my.speed);
		my.contents2.html(message);
		my.contents2.animate({height:"30px"},my.speed);
		
		my.container.animate({ backgroundColor:typeof color === "undefined" ? "#0f0" : color },my.speed);
		
		if (my.lastTimeOut != 0)
			clearTimeout(my.lastTimeOut);
		
		my.lastTimeOut = setTimeout(function(){my.popdown(endFunc);},timeout);
	},
	
	getMainContents : function()
	{
		return this.container.html();
	},
	
	setMainContents : function(contents)
	{
		this.container.html(contents);
	},
	
	setSpeed: function (newSpeed)
	{
		this.speed = newSpeed;
	},
	
	getSpeed: function ()
	{
		return this.speed;
	}
}