// we'll load this data set from an external location
$(function() {
  var width = 1200;
  var height = 400;

  var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height),
  margin = {"top": 10,"bottom": 40,"left": 80,"right": 90  }
  // g = svg.append("g").attr("transform", "translate("+margin.left+","+margin.top+")")
  ;

  var figw = width - margin.left - margin.right,
      figh = height - margin.top - margin.bottom;

  var x = d3.scaleTime()
    .range([margin.left, figw]),
    // .range([margin.left, width]),
  y = d3.scaleLinear()
    .range([height - margin.bottom, margin.top]);
    // .range([height - margin.bottom - margin.top, 0]);

  var dateFormat = d3.timeParse("%m/%d/%Y");

  var line = d3.line()
    .x(function(d) {
      return x(d.cal_date);
    })
    .y(function(d) {
      return y(d.steps_val);
    })

  d3.csv("./data/fitbitdata30.csv",function(d) {
      return {
        cal_date_raw: d.cal_date,
        cal_date: dateFormat(d.cal_date),
        steps_val: +d.steps_val,
      };
    },
    function(error, data) {
      x.domain(d3.extent(data.map(function(d) {
        return d.cal_date;
      }))).nice().clamp(true);

      y.domain([0,d3.max(data.map(function(d) {
        return d.steps_val;
      }))]);

      var xAxis = d3.axisBottom(x);
      var yAxis = d3.axisLeft(y);

      svg.append("g")
        .attr("class", "axisText")
        .attr("transform","translate(0,"+ (height-margin.bottom)+")")
        // .attr("transform",function(d) { return "translate(0,"+ (height-margin.bottom)+")"; })
        .call(xAxis);

      svg.append("text")
        .attr("class", "axisText")
        .attr("x", (width+margin.left)/2)
        .attr("y", height - 3)
        .text("Date");

      svg.append("g")
        .attr("class", "axisText")
        .attr("transform","translate("+(margin.left)+",0)")
        // .attr("transform",function(d) { return "translate("+(margin.left)+",0)"; })
        .call(yAxis);

      svg.append("text")
        .attr("class", "axisText")
        .attr("y", margin.left - 60)
        .attr("x", -height/4)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Number of Steps");

      svg.append("path").datum(data)
        .attr("d", line)
        .attr("class", "line");

      var pt = svg
        .selectAll("path.pt")
        .data(data)
        .enter()
        .append("path")
        .attr("class", "pt")
        .attr("d", d3.symbol().type(d3.symbolCircle))
        .attr("transform", function(d) {
          return "translate(" + x(d.cal_date) + "," + y(d.steps_val) + ")";
        })
        .on("mousemove",function(d) {
        var that = this;
        hoverGroup.attr("transform",function() {
          return "translate("+(x(d.cal_date)+d3.mouse(that)[0] + 5)+","+(y(d.steps_val)+d3.mouse(that)[1]-5)+")";
        });
        })
        .on("mouseout",function(d, i) {
        hoverGroup.style("visibility","hidden");
        })
        .on("mouseover",function(d, i) {
        hoverText.text("Date: " + d.cal_date_raw)
        .append("tspan").attr("x", 60).attr("y", 40).text("# of Steps: " + d.steps_val);
        hoverGroup.style("visibility","visible");
        })

        var hoverGroup = svg.append("g").style("visibility","hidden");

        hoverGroup.append("rect").data(data)
        .attr("x",0)
        .attr("y",0)
        .attr("rx",5)
        .attr("ry",5)
        .attr("width",120)
        .attr("height",50)
        .attr("class", "tooltiprect");

        var hoverText = hoverGroup.append("text")
        .attr("x",60).attr("y",20)
        .attr("text-anchor","middle")
        .attr("fill", "white");
    });
    });
