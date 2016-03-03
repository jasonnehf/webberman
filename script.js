'use strict';

$(document).ready(init);

var yahooForecastQ;
var yahooCurrentQ;
var $currtemplate;
var $fctemplate;
var $searchbox;

function init(event)
{
	// initQueryStrings();
	$currtemplate=$("#currentobservation-template");
	$fctemplate=$("#forecast-template");
	$searchbox=$("#search-city");

	$("#btn-search").on('click',searchPressed);
	$searchbox.on('keyup',searchPressed);

	if(localStorage["recentLocations"]===undefined || getQueryVariable("reset"))
	{
		localStorage["recentLocations"]=JSON.stringify(["Alameda, CA"]);
	}

	reloadWeatherData("currentobservation");


}


function searchPressed(event)
{
	if(event.type==='keyup' && event.keyCode!==13)	return;

	event.stopPropagation();
	
	var newLocation=$searchbox.val();

	var recentLocations=JSON.parse(localStorage["recentLocations"]);


	if(recentLocations.indexOf(newLocation) !== -1) {
		recentLocations.splice(recentLocations.indexOf(newLocation),1);
	}
	recentLocations.unshift(newLocation);
	recentLocations.splice(6);

	localStorage["recentLocations"]=JSON.stringify(recentLocations);

	reloadWeatherData("currentobservation");

	// var geturl=yahooForecastQ.replace("LOCATION_HERE",$searchbox.val());
	// $.ajax({
	// 	method:'GET',
	// 	url:geturl,
	// 	success: function(data){
	// 		console.log(data);
	// 	},
	// 	error: function(err) {
	// 		console.log(err);
	// 	},
	// });
}



// "select * from wunderground.forecast where location='Alameda, CA';"
// "select * from wunderground.currentobservation where location='Alameda, CA';"

function j2s(j)
{
	return JSON.stringify(j);
}

function s2j(s)
{
	return JSON.parse(s);
}

function ls(key,val)
{
	if(val!==undefined)
		localStorage[key]=j2s(val);

	return s2j(localStorage[key]);
}


function reloadWeatherData(which) {
	var recentLocations=JSON.parse(localStorage["recentLocations"]);
	var querystr="";
	for(var i=0; i<recentLocations.length;i++)
	{
		querystr+=`location = '${recentLocations[i]}' OR `;
	}
	querystr=querystr.replace(/ OR $/,"");
	var fullquerystr=unescape(`https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20wunderground.${which}%20where%20${querystr}%3B&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`);

	
	$.ajax({
		method:'GET',
		url:fullquerystr,
		success: function(data){
			populateWeather(data, which);
		},
		error: function(err) {
			console.log(err);
		},
	});
}

function populateWeather(indata,which)
{
	var data = (which==="currentobservation") ? indata.query.results.current_observation : indata.query.results.forecast;
	if(data[0]===undefined)	data = [ (which==="currentobservation" ? indata.query.results.current_observation : indata.query.results.forecast)];

	$(".generated").remove();

	console.log(data);
	console.log(indata);
	console.log(data.length);
	for(var d=0; d<data.length; d++)
	{
		console.log(d);
		if(data[d].display_location===undefined)
		{
			var loc=JSON.parse(localStorage["recentLocations"]);
			loc.splice(d,1);
			localStorage["recentLocations"]=JSON.stringify(loc);
			continue;
		}

		var $template=(which==="currentobservation" ? $currtemplate :$fctemplate);
		var $newitem=$template.clone(true);
		$newitem.removeAttr("id").removeClass("hidden", "currentobservation-template","forecast-template").addClass("generated");
		$newitem.find(".citystate").text(data[d].display_location.full);
		$newitem.find(".temperature").text(data[d].temp_f);
		$newitem.find(".temperature").text(data[d].temp_f);
		$newitem.find(".info-left").eq(0).text("Wind");
		$newitem.find(".info-right").eq(0).text(data[d].wind_string.replace(/from the/i,""));
		$newitem.find(".info-left").eq(1).text("Humidity");
		$newitem.find(".info-right").eq(1).text(data[d].relative_humidity);
		var iconstr=`url("./icons/${data[d].icon}.png")`;
		console.log(iconstr);
		$newitem.find(".wi-icon").css("background-image",iconstr);
		$newitem.find(".wi-desc").text(data[d].weather);
		$template.parent().append($newitem);
	}




}

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}