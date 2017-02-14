function axes(svg, xscale, yscale, margins){
	svg.append("g")
      .attr("transform", "translate(0," + (h - margins.bottom) + ")")
      .call(d3.axisBottom(xscale));
	
	svg.append("g")
	  .attr("transform", "translate(" + margins.left + ",0)")
      .call(d3.axisLeft(yscale));
      };
      
function buildErrorBars(svg, SummaryData, yscale){
	svg.append('defs')
		.append('marker')
			.attr('id', 'errorBarEnd')
			.attr('markerHeight', 5)
      		.attr('markerWidth', 5)
			.attr('markerUnits', 'strokeWidth')
			.attr('orient', 'auto')
			.attr('refX', 0)
			.attr('refY', 0)
			.attr('viewBox', '-1 -5 2 10')
			.append('path')
				.attr('d', 'M 0,0 m -1,-5 L 1,-5 L 1,5 L -1,5 Z')
				.attr('fill', 'black')
	
	errorbar =	svg.selectAll('errorBar')
					.data(SummaryData)
					.enter()
					.append('line')
						.attr('id', function(d){return 'group' + d.group + '_' + d.colour})
						.attr('class', 'errorBar')
						.attr('y2', function(d){return yscale(d.mean - d.error)})
						.attr('y1', function(d){return yscale(d.mean + d.error)})
						.style('stroke', 'black')
						.style('stroke-width', 2)
						.attr('marker-start', 'url(#errorBarEnd)')
						.attr('marker-end', 'url(#errorBarEnd)');

	return errorbar;
	};
      
function buildLegend(svg, keys, colourScale, margins){
 
 var width = 20;
 
 var legend = svg.append('g')
				.attr('font-size', 10)
				.attr('text-anchor', 'end')
				.selectAll('g')
				.data(keys)
				.enter()
				.append('g')
					.attr('transform', function(d, i){ return 'translate(0,' + (margins.top + i * (width + 0.1*width)) + ')'});
	
	legend.append('rect')
			.attr('x', w - 10 - width)
			.attr('width', width)
			.attr('height', width)
			.attr('fill', colourScale);
			
	legend.append('text')
			.attr('x', w - width - 15)
			.attr('y', 0.55*width)
			.attr('dy', "0.35em")
			.text(function(d){return d});
			
};

function barChart(svg, groups, y, errortype, errorbars, colourIDs, gap, ylim, margins, title, xlab, ylab, colourScheme, legend){
	/*Create a bar chart. 
	
	svg ->			The svg on which to draw the barchart.
	
	groups ->   	The grouping variable. 
	
	y ->			The heights of the bars. If there is more than one datapoint per group, 
					then the mean of the group will be taken, and error bars will be plotted as well.
	 
	errortype -> 	dictates the type of error bars to be charted. 
	
	colourIDs -> 	variable that groups bars by colour.
	
	gap ->			distance between bars.
	
	ylim -> 		limits of the y axis. defaults to [0, max(y)]
	
	margins -> 		margins around the bars. Axes and title fall within the margins.
	
	title ->		title to put above the plot.
	
	colourScheme -> Dictates the colours to be used in plotting.
	
	legend ->		True/False. Dictates whether a legend for the colours should be added.
	*/
	
	//Define the gap between bars if not provided
	var gap = gap || 0.01;
	
	var errortype = errortype || "SE";
	
	var errorbars = errorbars || true;
	//define the colour scheme
	var colourIDs = colourIDs || y.map(function(d){return 1});
	
	//Define the limits of y if not provided
	var ylim = ylim || [0,d3.max(y)];
	
	//define the margins if not provided.
	var margins = margins || {top:0, bottom:20, left:30, right:0};
	
	// if no title, declare the variable to be false.
	var title = title || false;
	
	// if no xlab, declare the variable to be false.
	var xlab = xlab || false;
	
	// if no ylab, declare the variable to be false.
	var ylab = ylab || false;
	
	// if no colourScheme, set to default
	var colourScheme = colourScheme || d3.schemeCategory10;
	
	// if no legend, set to true
	var legend = legend || false;
	
	// add space for the legend if it's going to be drawn
	if(legend){margins.right = 30};
	
	
	// if colourScheme only defines one colour, make it an object so that it can be used with d3.scaleOrdinal()
	if(typeof colourScheme !== 'object'){
		colourScheme = [colourScheme];
		};
		
	//names of the groups to be averaged
	var groupnames = Array.from(new Set(groups));
	
	//names of the groups to be different colours
	var colourgroups = Array.from(new Set(colourIDs));
		
	//prepare the sheet if title was provided. This means adding the title, and leaving space for it at the top of the plot
	if(title){
		
		Title(svg, w/2, 0, title);
		
		margins.top = 30;
	}
	
	//prepare the sheet if title was provided. This means adding the title, and leaving space for it at the top of the plot
	if(xlab){
		
		Title(svg, w/2, h-20, xlab);
		
		margins.bottom = margins.bottom + 20;
	}
	
	//prepare the sheet if title was provided. This means adding the title, and leaving space for it at the top of the plot
	if(ylab){
		
		Title(svg, 0, (h - margins.top - margins.bottom)/2 + margins.top, ylab, 270);
		
		margins.left = margins.left + 10;
	}
	
	//make our x axis
	var Xgroups = d3.scaleBand()
				.range([margins.left,w - margins.right])
				.domain(groupnames)
				.padding(0.1)
				
	//make our colourScale
	var Xcolours = {col: d3.scaleOrdinal()
						.domain(colourgroups)
						.range(colourScheme),
						
					place: d3.scaleBand()
							.range([0,Xgroups.bandwidth()])
							.domain(colourgroups)
							.padding(0.05)};
	
	//make our y axis
	var Y = d3.scaleLinear()
				.domain(ylim)
				.range([h - margins.bottom, margins.top]);
	
	//plot the axes			
	axes(svg, Xgroups , Y, margins);
	
	//Data Source will be the variable from which the graph is built
	var DataSource = [];
	
	//This variable will be used to determine where to place the bars so that they are evenly spaced.
	var grouploc = [];
	
	//iterate through the groups and calculate means for each group. If there is only one instance of each group, the mean will be the inputed value. The advantage here is that if raw data is entered, we can automatically add error bars. 
	for(var i = 0; i<groupnames.length;i++){
		for(var j = 0; j < colourgroups.length;j++){
			mean = (d3.mean(y, function(d,idx){if(groupnames[i]==groups[idx] & colourgroups[j]==colourIDs[idx]){return d}}));
			
			//if the error type is SE (standard error) then compute the standard error as the error bar width
			if(errortype == 'SE'){
				error = (d3.deviation(y, function(d,idx){if(groupnames[i]==groups[idx] & colourgroups[j]==colourIDs[idx]){return d}})/Math.sqrt(d3.sum(y, function(d,idx){if(groupnames[i]==groups[idx] & colourgroups[j]==colourIDs[idx]){return 1}})));
			}
			
			//if the error type is SD (standard deviation) then compute the standard deviation as the error bar width
			else if(errortype == 'SD'){
				error = d3.deviation(y, function(d,idx){if(groupnames[i]==groups[idx] & colourgroups[j]==colourIDs[idx]){return d}});
			};
			
			DataSource.push({'mean': mean,
							  'error': error,
							  'group': groupnames[i],
							  'colour': colourgroups[j]})
		};					  
	};
	
	// create the individual bars.
	var bars = svg.selectAll(".bar")
					.data(DataSource)
					.enter()
					.append("rect")
						.attr('id', function(d){return "group_"+d.group + "_" + Xcolours.col(d.colour)}) //make it easier to ID bars in svg.
						.attr("class", 'bar') // set class to bar
						.attr("width",Xcolours.place.bandwidth()) //set width to the bandwidth of the inner scale (Xcolours.place)
						.attr("height",function(d){return h - margins.bottom - Y(d.mean)})
						.attr("x", function(d){return Xgroups(d.group) + Xcolours.place(d.colour)})
						.attr("y",function(d){return Y(d.mean)})
						.attr("fill",function(d){return Xcolours.col(d.colour)}); //set fill from Xcolours.col
    
    

	// if errorbars were requested, plot the error bars on the bars that aggregate more than 1 datapoint (ie, have a non-NaN error value).
    if(errorbars){
    
    	buildErrorBars(svg, DataSource.filter(function(d){return !isNaN(d.error)}) , Y)
    		.attr('x2', function(d){return Xgroups(d.group) + Xcolours.place(d.colour) + Xcolours.place.bandwidth()/2})
			.attr('x1', function(d){return Xgroups(d.group) + Xcolours.place(d.colour) + Xcolours.place.bandwidth()/2});
    
    	};
    
    // if  a legend was requested, add it now
    if(legend){
    	buildLegend(svg, colourgroups, Xcolours.col, margins);
    	};
    
    // return the variable that stored the final aggregated data, in case the data is useful in some way later.	
    return DataSource
};

function scatterPlot(svg, x,y, colourIDs, xlim, ylim, margins, title, colourScheme, legend){
	/*Create a scatterPlot. 
	
	groups ->   	The grouping variable. 
	
	y ->			The heights of the bars. If there is more than one datapoint per group, 
					then the mean of the group will be taken, and error bars will be plotted as well.
	 
	errortype -> 	dictates the type of error bars to be charted. 
	
	colourIDs -> 	variable that groups bars by colour.
	
	gap ->			distance between bars.
	
	ylim -> 		limits of the y axis. defaults to [0, max(y)]
	
	margins -> 		margins around the bars. Axes and title fall within the margins.
	
	title ->		title to put above the plot.
	
	colourScheme -> Dictates the colours to be used in plotting.
	
	legend ->		True/False. Dictates whether a legend for the colours should be added.
	*/
	
	//Define the gap between bars if not provided
	var gap = gap || 0.01;
	
	var errortype = errortype || "SE";
	
	var errorbars = errorbars || true;
	//define the colour scheme
	var colourIDs = colourIDs || y.map(function(d){return 1});
	
	//Define the limits of y if not provided
	var ylim = ylim || [0,d3.max(y)];
	
	//define the margins if not provided.
	var margins = margins || {top:0, bottom:20, left:30, right:0};
	
	// if no title, declare the variable to be false.
	var title = title || false;
	
	// if no colourScheme, set to default
	var colourScheme = colourScheme || d3.schemeCategory10;
	
	// if no legend, set to true
	var legend = legend || false;
	
	// add space for the legend if it's going to be drawn
	if(legend){margins.right = 30};
	
	
	// if colourScheme only defines one colour, make it an object so that it can be used with d3.scaleOrdinal()
	if(typeof colourScheme !== 'object'){
		colourScheme = [colourScheme];
		};
	
	
	//prepare the sheet if title was provided. This means adding the title, and leaving space for it at the top of the plot
	if(title){
		svg.append('text')
		.attr('x',w/2 + margins.left/2)
		.attr('y',20)
		.attr('font-size', 20)
		.attr('text-anchor', 'middle')
		.text(title)
		
		margins.top = 30;
	}
		
	//names of the groups to be averaged
	var groupnames = Array.from(new Set(groups));
	
	//names of the groups to be different colours
	var colourgroups = Array.from(new Set(colourIDs));
	
	//make our x axis
	var Xgroups = d3.scaleBand()
				.range([margins.left,w - margins.right])
				.domain(groupnames)
				.padding(0.1)
				
	//make our colourScale
	var Xcolours = {col: d3.scaleOrdinal()
						.domain(colourgroups)
						.range(colourScheme),
						
					place: d3.scaleBand()
							.range([0,Xgroups.bandwidth()])
							.domain(colourgroups)
							.padding(0.05)};
	
	//make our y axis
	var Y = d3.scaleLinear()
				.domain(ylim)
				.range([h - margins.bottom, margins.top]);

};

function Textbox(parent, x, y, text, rotate, fontsize) {
	var text = text || "text",
		fontsize = fontsize || 12,
		x = x || 0,
		y = y ||  0,
		rotate = rotate || 0;
		width = 100,
		height = 20,
		stroke = d3.rgb(255,255,255),
		fill = d3.rgb(255,255,255);
	var textgroup = parent.append("g");

	var txt = textgroup.append("text")
		.attr("transform", "rotate(" + rotate + ")")
		.attr('text-anchor', 'middle')
		.text(text)
		.style("fill","black");
		
	var txt_width = txt.node().getComputedTextLength();
	txt.attr("x",.5*(width-txt_width));
	txt.attr("y",.5*(height+fontsize)-2);
		
	textgroup.attr("transform", "translate(" + (x + txt_width/3*Math.cos(rotate*Math.PI/180))  + "," + (y + txt_width/3*Math.sin(rotate*Math.PI/180)) + ")");
		
		
	var callback = function() {
		console.log("Text: "+txt.text());
		
		textgroup.attr("transform", "translate(" + (x + txt_width/3*Math.cos(rotate*Math.PI/180))  + "," + (y + txt_width/3*Math.sin(rotate*Math.PI/180)) + ")");
	}
			
	var aligntext = function() {
		txt.attr("x",.5*(width-txt_width));
		txt.attr("y",.5*(height+fontsize)-2);				
	};
		
	function textbox() {
  	}
		
	Object.defineProperty(textbox,"text",{
		get: function() {return text;},
		set: function(_) {
			text = _;
			txt.text(_);
			txt_width = txt.node().getComputedTextLength();
			aligntext();
		},
		enumerable: true,
		cofigurable: true
	});

	Object.defineProperty(textbox,"x",{
		get: function() {return x;},
		set: function(_) {
			x = _;
			textgroup.attr("transform", "translate(" + x + "," + y + ")");
		},
		enumerable: true,
		cofigurable: true
	});
		Object.defineProperty(textbox,"y",{
		get: function() {return y;},
		set: function(_) {
			y = _;
			textgroup.attr("transform", "translate(" + x + "," + y + ")");
		},
		enumerable: true,
		cofigurable: true
	});
		
	Object.defineProperty(textbox,"width",{
		get: function() {return width;},
		set: function(_) {
			width = _;
				rct.attr("width",_);
				cover.attr("width",_);
				aligntext();
			},
			enumerable: true,
			cofigurable: true
	});

	Object.defineProperty(textbox,"height",{
		get: function() {return height;},
		set: function(_) {
			height = _;
			rct.attr("height",_);
			cover.attr("height",_);
			aligntext();
		},
		enumerable: true,
		cofigurable: true
	});

    Object.defineProperty(textbox,"position",{
		get: function() {return [x, y, width, height];},
		set: function(_) {
			textbox.x = _[0]; 
			textbox.y = _[1];
			textbox.width = _[2];
			textbox.height = _[3];
		},
		enumerable: true,
		cofigurable: true
	})
				
	Object.defineProperty(textbox,"stroke",{
		get: function() {return stroke;},
		set: function(_) {
			stroke = _;
		},
		enumerable: true,
		cofigurable: true
	});
		
	Object.defineProperty(textbox,"cover",{
		get: function() {return cover;},
		enumerable: true,
		cofigurable: true
	});
		
	Object.defineProperty(textbox,"callback",{
		get: function() {return callback;},
		set: function(_) {
			callback = _;
		},
		enumerable: true,
		cofigurable: true
	});

	txt.on("click", function() {
		focused = textbox;
		d3.event.stopPropagation();
	});
    
	return textbox;
}

function Title(svg, x, y, text, rotate){
	
t = new Textbox(svg, x, y, text, rotate);

var focused = null;
d3.select("body")
	.on("keydown",keydown)
	.on("keypress",keypress)
	.on("click", function() {
		if (focused) {
			focused = null;
		}
	});

}

var keydown = function() {
	if (!focused) return;
	var text = focused.text;
	var code = d3.event.keyCode;
	if (code == 8) { // Backspace
		d3.event.preventDefault();
		text = text.substring(0,text.length-1);
	};
	//console.log("keydown: code: "+ code + ", text: "+text);
	focused.text = text;
	
	if (code == 13) { // Enter
		focused.stroke = d3.rgb(255,255,255);
		focused.callback();
		focused = null;
		
	};
}

var keypress = function() {
	if (!focused) return;
	var text = focused.text;
	var code = d3.event.keyCode;
	text = text+String.fromCharCode(code);
	//console.log("keypress: code: "+ code + ", text: "+text);
	focused.text = text;
}