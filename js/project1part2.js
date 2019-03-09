//*********************** DECLARE VARIABLES ***********************
var width = 1300,
    height = 520,
    margin = {top: 70,bottom: 100,left: 60,right: 10},
    margin2 = {top: height - 75,bottom: 35,left: 60,right: 10},
    figw = width - margin.left - margin.right,
    figh = height - margin.top - margin.bottom,
    figh2 = height - margin2.top - margin2.bottom,
    blues = d3.scaleSequential(d3.interpolateBlues),
    oranges = d3.scaleSequential(d3.interpolateOranges),
    xScale = d3.scaleTime().range([margin.left, figw]),
    yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]),
    xScale2 = d3.scaleTime().range([margin2.left, figw]),
    yScale2 = d3.scaleLinear().range([height - margin2.bottom, margin2.top]),
    xAxis = d3.axisBottom(xScale),
    yAxis = d3.axisLeft(yScale),
    xAxis2 = d3.axisBottom(xScale2),
    hoverWidth = 120,
    hoverHeight = 50;

var dateFormat = d3.timeParse("%m/%d/%y");

//*********************** GET DATA AND START PROCESSING ***********************
d3.csv("./data/fitbitdata.csv",
  function(d) {
    return {
      cal_date_raw: d.cal_date,
      cal_date: dateFormat(d.cal_date),
      steps_val: +d.steps_val,
      wfh_flg: d.wfh_flg,
    };
  },
  function(error, data) {
    if (error) throw error;

    //*********************** ADD OTHER PAGE ELEMENTS ***********************
    var svg = d3.select("#stepsLine").append("svg")
      .attr("width", width)
      .attr("height", height);

    svg.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", figw - margin.left)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + ",0)");

    var line = d3.line()
                .x(function(d) { return xScale(d.cal_date); })
                .y(function(d) { return yScale(d.steps_val); });

    var line2 = d3.line()
                .x(function(d) { return xScale2(d.cal_date); })
                .y(function(d) { return yScale2(d.steps_val); });

    var lineTarget = d3.line()
                .x(function(d) { return xScale(d.cal_date); })
                .y(function(d) { return yScale(10000); });

    var brush = d3.brushX()
                  .extent([[margin2.left, 0], [figw, figh2]])
                  .on("brush end", brushed);

    var zoom = d3.zoom()
                .scaleExtent([1, 140])
                .translateExtent([[0, 0], [figw, figh]])
                .extent([[0, 0], [figw, figh]])
                .on("zoom", zoomed);

    var focus = svg.append("g").attr("class", "focus");

    var context = svg.append("g").attr("class", "context");

    var legend = svg.append("g").attr("class", "legend");

    //domains for main(focus) chart
    xScale.domain(d3.extent(data.map(function(d) {
            return d.cal_date;
          }))).nice();

    yScale.domain([0,d3.max(data.map(function(d) {
            return d.steps_val;
          }))]);

    //domains for summary(context) chart
    xScale2.domain(xScale.domain());
    yScale2.domain(yScale.domain());

    focus.append("g")
        .attr("class", "x axis")
        .attr("transform","translate(0,"+ (height-margin.bottom)+")")
        .call(xAxis);

    focus.append("g")
        .attr("class", "y axis")
        .attr("transform","translate("+(margin.left)+",0)")
        .call(yAxis);

    //label for y-axis
    focus.append("text")
        .attr("class", "y axis")
        .attr("y", margin.left - 60)
        .attr("x", -height/2.5)
        .attr("dy", "0.75em")
        .attr("transform", "rotate(-90)")
        .text("Number of Steps");

    //draw line for target
    focus.append("line")
        .attr("class", "targetSteps")
        .attr("x1", margin.left)
        .attr("y1", yScale(10000))
        .attr("x2", figw)
        .attr("y2", yScale(10000));

    //text on the target line
    focus.append("text")
        .attr("x", figw - 55)
        .attr("y", yScale(10500))
        .attr("class", "targetText")
        .text("Daily Target");


    //draw main line chart
    focus.append("path").datum(data)
        .attr("d", line)
        .attr("class", "line");

    //draw circles for main chart
    var pt = focus.selectAll("circle")
                  .data(data)
                  .enter()
                  .append("circle")
                  .attr("cx", function(d) {
                    return xScale(d.cal_date);
                  })
                  .attr("cy", function(d) {
                    return yScale(d.steps_val);
                  })
                  .attr("r", 5)
                  .attr("class", "pt")
                  .attr("fill", function (d){
                    if (d.wfh_flg=="1") {
                      if (d.steps_val > 10000) { return blues(1);}
                      else {return blues(d.steps_val/10000);}
                    }else {
                      if (d.steps_val > 10000) { return oranges(1);}
                      else {return oranges(d.steps_val/10000);}
                    }
                  })
                  .attr("stroke", function(d) {
                    if (d.wfh_flg=="1") { return "#0059b3";}
                    else { return "#661400";}
                  })
                  //circle hover interactions
                  .on("mousemove",function(d) {
                    var that = this;
                    hoverGroup.attr("transform",function() {
                    return "translate("+(d3.mouse(that)[0] + 5)+","+(d3.mouse(that)[1]-5)+")";
                  });
                  })
                  .on("mouseover",function(d, i) {
                    d3.select(this)
                    .attr("r", 10);
                    hoverText.text("Date: " + d.cal_date_raw)
                    .append("tspan").attr("x", (hoverWidth/2 + 10)).attr("y", (hoverHeight/2 + 5)).text("# of Steps: " + d.steps_val);
                    hoverGroup.style("visibility","visible");
                  })
                  .on("mouseout",function(d, i) {
                    d3.select(this)
                    .attr("r", 5);
                    hoverGroup.style("visibility","hidden");
                  });

      //draw summary chart
      context.append("path").datum(data)
            .attr("d", line2)
            .attr("class", "line");

      context.append("g")
            .attr("class", "x axis")
            .attr("transform","translate(0,"+ (height-margin2.bottom+1)+")")
            .call(xAxis2);

      context.append("g")
            .attr("class", "brush")
            .attr("transform","translate(0,"+ (margin2.top)+")")
            .call(brush)
            .call(brush.move, xScale.range());

      //summary chart x-axis label
      context.append("text")
          .attr("class", "x axis")
          .attr("x", (width+margin2.left)/2)
          .attr("y", height-5)
          .text("Date");

      //hover config for main chart circles
      var hoverGroup = focus.append("g").style("visibility","hidden");

      hoverGroup.append("rect").data(data)
                .attr("x",10)
                .attr("y",-10)
                .attr("rx",5)
                .attr("ry",5)
                .attr("width",hoverWidth)
                .attr("height",hoverHeight)
                .attr("class", "tooltiprect");

      var hoverText = hoverGroup.append("text");

      hoverText.attr("x",(hoverWidth/2 + 10)).attr("y",(hoverHeight/2 - 15))
              .attr("text-anchor","middle")
              .attr("fill", "white");

      svg.call(zoom);

      //*********************** ADD LEGEND ***********************
      var domBlues = blues.domain([0, 10000]),
          domOranges = oranges.domain([0, 10000]);

      svg.append("g")
      .attr("class", "legendB")
      .attr("transform", "translate(" + (width - (4.5 * margin.left)) + ",20)");

      var legendBlues = d3.legendColor()
      .shapeWidth(20)
      .cells([0,1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000])
      .labels(["", "", "", "", "", "", "", "", "", "", ""])
      .labelWrap(30)
      .labelAlign("start")
      .orient('horizontal')
      .shapePadding(0)
      .scale(domBlues);

      svg.select(".legendB")
      .call(legendBlues);

      svg.append("g")
      .attr("class", "legendP")
      .attr("transform", "translate(" + (width - (4.5 * margin.left)) + ",40)");

      var legendOranges = d3.legendColor()
      .shapeWidth(20)
      .cells([0,1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000])
      .labels(["0", "", "", "", "", "5000", "", "", "", "", "10000+"])
      .labelWrap(30)
      .labelAlign("start")
      .orient('horizontal')
      .shapePadding(0)
      .scale(domOranges);

      svg.select(".legendP")
      .call(legendOranges);

      svg.append("text")
        .attr("class", "y axis")
        .attr("y", margin.top - 60)
        .attr("x", width - (2 * margin.left))
        .text("Number of Steps");

      svg.append("text")
        .attr("class", "y axis")
        .attr("y", margin.top - 40)
        .attr("x", width - (4.6* margin.left))
        .text("Days At Home");

      svg.append("text")
        .attr("class", "y axis")
        .attr("y", margin.top - 20)
        .attr("x", width - (4.6 * margin.left))
        .text("Days At Work");

      //*********************** DEFINE BRUSH BEHAVIOR ***********************
      function brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || xScale2.range();
        xScale.domain(s.map(xScale2.invert, xScale2));
        focus.select(".line").attr("d", line);
        focus.selectAll("circle")
        .attr("cx", function(d) {
          return xScale(d.cal_date);
        })
        .attr("cy", function(d) {
          return yScale(d.steps_val);
        })
        focus.select(".x.axis").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(figw / (s[1] - s[0]))
            .translate(-s[0], 0));
      }

      //*********************** DEFINE ZOOM BEHAVIOR ***********************
      function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        xScale.domain(t.rescaleX(xScale2).domain());
        focus.select(".line").attr("d", line);
        focus.selectAll("circle")
        .attr("cx", function(d) {
          return xScale(d.cal_date);
        })
        .attr("cy", function(d) {
          return yScale(d.steps_val);
        })
        focus.select(".x.axis").call(xAxis);
        context.select(".brush").call(brush.move, xScale.range().map(t.invertX, t));
      }

  });
